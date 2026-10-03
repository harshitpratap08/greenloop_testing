import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, appendFileSync, statSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createActions } from './actions.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const empty = () => ({ projects: [], materials: [], receivers: [], slots: [], allocations: [], bookings: [], verifications: [], demands: [], offers: [], events: [], supportRequests: [] });
const materialTypes = ['concrete', 'brick', 'steel', 'timber', 'plasterboard', 'glass'];
const hash = value => createHash('sha256').update(value).digest('hex');
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const requireThat = (condition, message, status = 400) => { if (!condition) throw new ApiError(status, message); };
const text = (value, name, max = 500, optional = false) => {
  requireThat(typeof value === 'string' && value.length <= max && (optional || value.trim().length > 0), `Invalid ${name}.`);
  return value.trim();
};
const number = (value, name, zero = false) => { requireThat(typeof value === 'number' && Number.isFinite(value) && value >= (zero ? 0 : 0.1) && value <= 1000000, `Invalid ${name}.`); return value; };
const choice = (value, choices, name) => { requireThat(choices.includes(value), `Invalid ${name}.`); return value; };
const date = value => { requireThat(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Invalid date.'); return value; };
const geo = value => { if (value === undefined) return undefined; requireThat(value && typeof value === 'object' && !Array.isArray(value) && typeof value.lat === 'number' && Number.isFinite(value.lat) && value.lat >= -90 && value.lat <= 90 && typeof value.lng === 'number' && Number.isFinite(value.lng) && value.lng >= -180 && value.lng <= 180, 'Invalid location coordinates.'); return { lat: value.lat, lng: value.lng }; };
const emailAddress = value => { const email = text(value, 'email', 254).toLowerCase(); requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email address.'); return email; };
const passwordHash = password => { text(password, 'password', 256); requireThat(password.length >= 8, 'Use a password of at least 8 characters.'); const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const passwordMatches = (password, stored) => { if (typeof password !== 'string' || password.length > 256 || !stored) return false; const [salt, key] = stored.split(':'); return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(password, salt, 64)); };

export function createBackend(options = {}) {
  const production = process.env.NODE_ENV === 'production';
  if (production) requireThat(process.env.PUBLIC_ORIGIN?.startsWith('https://'), 'Set an HTTPS PUBLIC_ORIGIN for production.', 500);
  const dataDir = options.dataDir ?? resolve(root, 'server/data');
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(resolve(dataDir, 'greenloop.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, profile TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS resets (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS owners (entity_id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, content BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS google_identities (subject TEXT PRIMARY KEY, user_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS oauth_states (state TEXT PRIMARY KEY, verifier TEXT NOT NULL, expires INTEGER NOT NULL);
  `);
  db.prepare('INSERT OR IGNORE INTO state VALUES (1, ?)').run(JSON.stringify(empty()));
  const load = () => {
    const dataset = JSON.parse(db.prepare('SELECT document FROM state WHERE id=1').get().document);
    // Preserve historical events while repairing duplicate IDs deterministically.
    // Reads do not write the database; the next business transaction persists repairs.
    let nextId = dataset.events.reduce((highest, event) => Math.max(highest, Number(/^EV-(\d+)$/.exec(event.id)?.[1] ?? 0)), 0) + 1;
    const seen = new Set();
    dataset.events = dataset.events.map(event => {
      const repaired = seen.has(event.id) ? { ...event, id: `EV-${String(nextId++).padStart(3, '0')}` } : event;
      seen.add(repaired.id);
      return repaired;
    });
    return dataset;
  };
  const save = dataset => db.prepare('UPDATE state SET document=? WHERE id=1').run(JSON.stringify(dataset));
  const owner = id => db.prepare('SELECT user_id FROM owners WHERE entity_id=?').get(id)?.user_id;
  const own = (id, user) => { text(id, 'record ID', 250); requireThat(owner(id) === user.id, 'You do not have permission to change this record.', 403); };
  const assign = (id, user) => db.prepare('INSERT INTO owners VALUES (?, ?)').run(id, user.id);
  const transaction = operation => { db.exec('BEGIN IMMEDIATE'); try { const result = operation(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } };
  const profile = row => ({ id: row.id, email: row.email, ...JSON.parse(row.profile) });
  const writeProfile = user => { const { id, email, ...fields } = user; db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify(fields), id); };
  const allowedOrigins = new Set(options.origins ?? (production ? [process.env.PUBLIC_ORIGIN] : [process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173', 'http://localhost:3001', 'http://localhost:4173']));
  const limits = new Map();
  const cookie = (res, token, remember = false, clear = false) => res.setHeader('Set-Cookie', `gl_session=${token}; HttpOnly; SameSite=Lax; Path=/${production ? '; Secure' : ''}${clear ? '; Max-Age=0' : remember ? '; Max-Age=2592000' : ''}`);
  const session = (res, user, remember = false) => {
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(hash(token), user.id, Date.now() + (remember ? 30 : 1) * 86400000);
    cookie(res, token, remember); return user;
  };
  const authenticated = req => {
    const token = /(?:^|;\s*)gl_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1];
    const row = token && db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token), Date.now());
    requireThat(row, 'Please sign in to continue.', 401); return profile(row);
  };
  const visible = (dataset, user) => {
    const mine = id => owner(id) === user.id;
    const receiving = user.activeWorkspace === 'receiver';
    const bookings = dataset.bookings.filter(b => receiving ? mine(b.receiverId) : mine(b.materialId));
    const offers = (dataset.offers ?? []).filter(o => receiving ? mine(dataset.demands.find(d => d.id === o.demandId)?.receiverId) : o.providerId === user.email);
    const materials = dataset.materials.filter(m => (!receiving && mine(m.id)) || bookings.some(b => b.materialId === m.id) || offers.some(o => o.passportId === m.id));
    const subjects = new Set([...materials, ...bookings, ...offers, ...dataset.projects.filter(p => mine(p.id)), ...dataset.receivers.filter(r => mine(r.id)), ...dataset.demands.filter(d => mine(d.receiverId))].map(x => x.id));
    // Public ledger quantities allow matching without exposing other providers' bookings.
    const slots = dataset.slots.filter(s => receiving || s.date >= new Date().toISOString().slice(0, 10) || bookings.some(b => b.slotId === s.id)).map(s => ({ ...s, reservedT: dataset.bookings.filter(b => b.slotId === s.id && b.status === 'confirmed' && !bookings.some(ownBooking => ownBooking.id === b.id)).reduce((total, b) => total + b.tonnesT, 0) }));
    const transactionContacts = bookings.filter(booking => booking.receiverAcceptedAt && booking.status !== 'cancelled').flatMap(booking => {
      const contactUserId = owner(receiving ? booking.materialId : booking.receiverId);
      const account = contactUserId && db.prepare('SELECT email, profile FROM users WHERE id=?').get(contactUserId);
      if (!account) return [];
      const contact = JSON.parse(account.profile);
      return [{ materialId: booking.materialId, receiverId: booking.receiverId, name: contact.name || contact.organization || 'Workspace contact', organization: contact.organization || contact.name || 'Organization', email: account.email, ...(contact.phone ? { phone: contact.phone } : {}) }];
    });
    const providerListings = receiving ? dataset.materials.flatMap(material => {
      const providerUserId = owner(material.id);
      const account = providerUserId && db.prepare('SELECT email, profile FROM users WHERE id=?').get(providerUserId);
      const project = dataset.projects.find(item => item.id === material.projectId);
      if (!account || !project || material.archivedAt) return [];
      const profile = JSON.parse(account.profile);
      const committedT = dataset.bookings.filter(booking => booking.materialId === material.id && booking.status !== 'cancelled').reduce((total, booking) => total + booking.tonnesT, 0);
      const availableT = Math.max(0, material.quantityT - committedT);
      if (availableT <= 0) return [];
      return [{ materialId: material.id, providerName: profile.name || profile.organization || 'Provider', organization: profile.organization || profile.name || 'Provider', location: profile.location || project.location, projectId: project.id, projectName: project.name, projectLocation: project.location, materialType: material.type, quantityT: material.quantityT, availableT, condition: material.condition, grade: material.grade, ...(material.pricePerT !== undefined ? { pricePerT: material.pricePerT } : {}), ...(material.availableFrom ? { availableFrom: material.availableFrom } : {}), ...(material.geo || project.geo ? { geo: material.geo ?? project.geo } : {}) }];
    }) : [];
    return { ...dataset, providerListings, transactionContacts, projects: dataset.projects.filter(p => mine(p.id) || materials.some(m => m.projectId === p.id)), materials, slots, bookings,
      allocations: dataset.allocations.filter(a => bookings.some(b => b.allocationId === a.id)), offers,
      verifications: dataset.verifications.filter(v => bookings.some(b => b.id === v.bookingId)),
      events: dataset.events.filter(e => e.subjectIds.some(id => subjects.has(id))),
      demands: dataset.demands.map(d => ({ ...d, coveredT: dataset.bookings.filter(b => b.demandId === d.id && b.status === 'confirmed').reduce((sum, b) => sum + b.tonnesT, 0) })),
      supportRequests: (dataset.supportRequests ?? []).filter(s => mine(s.id)) };
  };
  const evidence = (items, user) => {
    requireThat(Array.isArray(items) && items.length <= 20, 'Invalid evidence list.');
    return items.map(item => {
      requireThat(item && typeof item === 'object' && !Array.isArray(item), 'Invalid evidence item.');
      const result = { kind: choice(item.kind, ['survey-sheet', 'site-photo', 'lab-report', 'weighbridge-ticket'], 'evidence type'), label: text(item.label, 'evidence label', 250), recordedAt: new Date().toISOString() };
      if (item.ref) {
        text(item.ref, 'evidence reference', 250);
        const id = /^\/api\/uploads\/([\w-]+)$/.exec(item.ref)?.[1];
        requireThat(id && db.prepare('SELECT user_id FROM uploads WHERE id=?').get(id)?.user_id === user.id, 'Upload evidence before attaching it.');
        result.ref = item.ref;
      }
      return result;
    });
  };
  const execute = (user, action, args) => transaction(() => {
    requireThat(typeof action === 'string' && args.length > 0, 'Invalid operation.');
    const objectActions = ['addProjectAction', 'addMaterialAction', 'addDemandAction', 'addCapacityAction', 'requestCapacityAction', 'cancelBookingAction', 'dispatchAction', 'addOfferAction', 'verifyAction', 'addSupportRequestAction'];
    if (objectActions.includes(action)) requireThat(args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]), 'Invalid operation input.');
    const dataset = load();
    const role = expected => requireThat(user.workspaces.includes(expected), `Enable your ${expected} workspace first.`, 403);
    const booking = id => { const item = dataset.bookings.find(b => b.id === id); requireThat(item, 'Booking not found.', 404); return item; };
    const receiverBooking = id => { role('receiver'); const item = booking(id); own(item.receiverId, user); return item; };
    const providerBooking = id => { role('provider'); const item = booking(id); own(item.materialId, user); return item; };
    const offer = id => { role('receiver'); const item = dataset.offers.find(o => o.id === id); requireThat(item, 'Offer not found.', 404); own(dataset.demands.find(d => d.id === item.demandId)?.receiverId, user); requireThat(item.status === 'pending', 'This offer has already been decided.', 409); return item; };
    const receiverActions = ['addDemandAction', 'addCapacityAction', 'updateCapacityAction', 'acceptOfferAction', 'declineOfferAction', 'acceptRequestAction', 'rejectRequestAction', 'rescheduleRequestAction', 'receiveLoadAction', 'verifyLoadAction', 'verifyAction'];
    if (action === 'counterOfferAction' && user.activeWorkspace === 'receiver') receiverActions.push(action);
    if (action === 'cancelDemandAction') receiverActions.push(action);
    const engine = createActions(dataset, { kind: receiverActions.includes(action) ? 'receiver' : 'contractor', name: user.name || user.email });
    let result;
    switch (action) {
      case 'addProjectAction': {
        role('provider'); const p = args[0]; result = engine.addProjectAction({ name: text(p.name, 'project name', 250), location: text(p.location, 'location', 250), status: choice(p.status, ['active', 'demolition', 'complete'], 'project status'), geo: geo(p.geo) }); assign(result.id, user); break;
      }
      case 'addMaterialAction': {
        role('provider'); const m = args[0]; own(m.projectId, user); number(m.quantityT, 'quantity'); requireThat(Array.isArray(m.quantityRangeT) && m.quantityRangeT.length === 2, 'Invalid quantity range.');
        number(m.quantityRangeT[0], 'minimum quantity', true); number(m.quantityRangeT[1], 'maximum quantity'); requireThat(m.quantityRangeT[0] <= m.quantityT && m.quantityRangeT[1] >= m.quantityT, 'Quantity must fit its estimate range.');
        number(m.confidence, 'confidence', true); requireThat(m.confidence <= 1, 'Confidence must be between zero and one.');
        result = engine.addMaterialAction({ projectId: m.projectId, type: choice(m.type, materialTypes, 'material type'), quantityT: m.quantityT, quantityRangeT: m.quantityRangeT, condition: choice(m.condition, ['good', 'fair', 'poor'], 'condition'), grade: choice(m.grade, ['A', 'B', 'C'], 'grade'), confidence: m.confidence, surveyNotes: text(m.surveyNotes ?? '', 'notes', 5000, true), evidence: evidence(m.evidence, user, dataset), pricePerT: m.pricePerT === undefined ? undefined : number(m.pricePerT, 'price', true), availableFrom: m.availableFrom === undefined ? undefined : date(m.availableFrom), geo: geo(m.geo) }); assign(result.id, user); break;
      }
      case 'addDemandAction': {
        role('receiver'); const d = args[0]; own(user.receiverId, user); date(d.period); requireThat(d.period >= new Date().toISOString().slice(0, 10), 'The needed-by date is in the past.'); result = engine.addDemandAction({ receiverId: user.receiverId, materialType: choice(d.materialType, materialTypes, 'material type'), requiredT: number(d.requiredT, 'required quantity'), period: d.period, location: text(d.location, 'location', 250), notes: text(d.notes ?? '', 'notes', 5000, true), budgetPerT: d.budgetPerT === undefined ? undefined : number(d.budgetPerT, 'budget per tonne', true), geo: geo(d.geo) }); assign(result.id, user); break;
      }
      case 'addCapacityAction': {
        role('receiver'); const s = args[0]; own(s.receiverId, user); date(s.date); requireThat(s.date >= new Date().toISOString().slice(0, 10), 'This receiving slot is in the past.'); choice(s.materialType, materialTypes, 'material type');
        requireThat(!dataset.slots.some(x => x.receiverId === s.receiverId && x.date === s.date && x.materialType === s.materialType), 'A slot already exists for this material and date.', 409);
        result = engine.addCapacityAction({ receiverId: s.receiverId, date: s.date, materialType: s.materialType, capacityT: number(s.capacityT, 'capacity') }); break;
      }
      case 'updateCapacityAction': {
        role('receiver'); const slot = dataset.slots.find(s => s.id === args[0]); requireThat(slot, 'Slot not found.', 404); own(slot.receiverId, user); number(args[1], 'capacity'); result = engine.updateCapacityAction(...args); requireThat(result, 'Capacity cannot be reduced below reserved tonnes.', 409); break;
      }
      case 'requestCapacityAction': {
        role('provider'); const input = args[0]; own(input.materialId, user); number(input.tonnesT, 'requested quantity');
        const slot = dataset.slots.find(s => s.id === input.slotId); const material = dataset.materials.find(m => m.id === input.materialId);
        requireThat(slot && material && slot.receiverId === input.receiverId && slot.materialType === material.type, 'Choose a compatible receiver slot.');
        requireThat(slot.date >= new Date().toISOString().slice(0, 10), 'This receiving slot is in the past.');
        result = engine.requestCapacityAction({ materialId: input.materialId, receiverId: input.receiverId, slotId: input.slotId, tonnesT: input.tonnesT }); break;
      }
      case 'cancelBookingAction': {
        const b = providerBooking(args[0].bookingId); requireThat(!b.loadRef && !b.receiverAcceptedAt && b.status !== 'cancelled', 'Accepted, dispatched, or cancelled bookings cannot be cancelled.', 409);
        result = engine.cancelBookingAction({ bookingId: b.id, reason: text(args[0].reason ?? '', 'reason', 1000, true) }); break;
      }
      case 'dispatchAction': {
        const b = providerBooking(args[0].bookingId); requireThat(b.status === 'confirmed' && b.receiverAcceptedAt && !b.loadRef, 'The receiver must accept this booking before dispatch.', 409); result = engine.dispatchAction({ bookingId: b.id }); break;
      }
      case 'addOfferAction': {
        role('provider'); const o = args[0]; own(o.passportId, user); const m = dataset.materials.find(m => m.id === o.passportId); const d = dataset.demands.find(d => d.id === o.demandId);
        requireThat(d && m && ['OPEN', 'PARTIALLY_COVERED'].includes(d.status) && d.materialType === m.type, 'This request cannot accept that material.', 409);
        number(o.offeredQuantityT, 'offer quantity'); const committed = dataset.bookings.filter(b => b.materialId === m.id && b.status !== 'cancelled').reduce((sum, b) => sum + b.tonnesT, 0);
        requireThat(o.offeredQuantityT <= m.quantityT - committed, 'Offer exceeds available material.', 409);
        result = engine.addOfferAction({ demandId: d.id, passportId: m.id, offeredQuantityT: o.offeredQuantityT, providerId: user.email, ...(o.pricePerT === undefined ? {} : { pricePerT: number(o.pricePerT, 'price per tonne', true) }) }); break;
      }
      case 'acceptOfferAction': offer(args[0]); result = engine.acceptOfferAction(args[0]); break;
      case 'declineOfferAction': offer(args[0]); result = engine.declineOfferAction(args[0]); break;
      case 'counterOfferAction': {
        const offerId = text(args[0], 'offer ID', 250);
        const item = dataset.offers.find(candidate => candidate.id === offerId);
        requireThat(item && item.status === 'pending', 'This offer is no longer open for negotiation.', 409);
        const actor = user.activeWorkspace === 'receiver' ? 'receiver' : 'provider';
        role(actor);
        if (actor === 'receiver') own(dataset.demands.find(demand => demand.id === item.demandId)?.receiverId, user);
        else own(item.passportId, user);
        result = engine.counterOfferAction(offerId, actor, number(args[1], 'counter price per tonne', true));
        requireThat(result, 'This offer is no longer open for negotiation.', 409);
        break;
      }
      case 'cancelDemandAction': {
        role('receiver');
        const demand = dataset.demands.find(item => item.id === text(args[0], 'request ID', 250));
        requireThat(demand, 'Request not found.', 404); own(demand.receiverId, user);
        requireThat(['OPEN', 'PARTIALLY_COVERED'].includes(demand.status), 'Only an open request can be cancelled.', 409);
        requireThat(!dataset.bookings.some(item => item.demandId === demand.id && item.status !== 'cancelled'), 'A request with active bookings cannot be cancelled.', 409);
        result = engine.cancelDemandAction(demand.id);
        break;
      }
      case 'withdrawOfferAction': {
        role('provider');
        const offerId = text(args[0], 'offer ID', 250);
        const item = dataset.offers.find(candidate => candidate.id === offerId);
        requireThat(item && item.status === 'pending', 'Only a pending offer can be withdrawn.', 409);
        own(item.passportId, user);
        result = engine.withdrawOfferAction(offerId);
        break;
      }
      case 'archiveBookingAction': {
        const actor = user.activeWorkspace === 'receiver' ? 'receiver' : 'provider';
        if (actor === 'receiver') receiverBooking(args[0]); else providerBooking(args[0]);
        const item = booking(text(args[0], 'booking ID', 250));
        requireThat(dataset.verifications.some(record => record.bookingId === item.id && record.status === 'verified'), 'Only a verified completed booking can be archived.', 409);
        requireThat(!item.archivedAt, 'This booking is already archived.', 409);
        result = engine.archiveBookingAction(item.id, actor);
        break;
      }
      case 'acceptRequestAction': { const b = receiverBooking(args[0]); requireThat(!b.loadRef, 'This load has already dispatched.', 409); if (args[1] !== null && args[1] !== undefined) number(args[1], 'accepted quantity'); result = engine.acceptRequestAction(b.id, args[1] ?? undefined); break; }
      case 'rejectRequestAction': { const b = receiverBooking(args[0]); requireThat(!b.loadRef, 'Dispatched loads must be verified instead.', 409); result = engine.rejectRequestAction(b.id); break; }
      case 'rescheduleRequestAction': { const b = receiverBooking(args[0]); const target = dataset.slots.find(s => s.id === args[1]); requireThat(target && target.date >= new Date().toISOString().slice(0, 10), 'Choose a current receiving slot.'); result = engine.rescheduleRequestAction(b.id, text(args[1], 'slot ID')); break; }
      case 'receiveLoadAction': { const b = receiverBooking(args[0]); result = engine.receiveLoadAction(b.id, number(args[1], 'received quantity', true), evidence(args[2], user, dataset)); break; }
      case 'verifyLoadAction': {
        role('receiver'); const v = dataset.verifications.find(v => v.id === args[0]); requireThat(v, 'Receipt not found.', 404); own(v.receiverId, user);
        number(args[1], 'accepted quantity', true); number(args[2], 'rejected quantity', true); requireThat(Math.abs(args[1] + args[2] - v.actualT) < 0.001, 'Accepted and rejected quantities must equal the received weight.');
        if (args[2] > 0) text(args[3], 'rejection reason', 1000); result = engine.verifyLoadAction(v.id, args[1], args[2], args[3]); break;
      }
      case 'verifyAction': { const b = receiverBooking(args[0].bookingId); requireThat(b.loadRef && !dataset.verifications.some(v => v.bookingId === b.id), 'Receive and verify each dispatched load only once.', 409); const p = args[0]; number(p.actualT, 'received quantity', true); number(p.acceptedT, 'accepted quantity', true); requireThat(p.acceptedT <= p.actualT, 'Accepted quantity exceeds received weight.'); const rejectReason = text(p.rejectReason ?? '', 'rejection reason', 1000, p.acceptedT === p.actualT); result = engine.verifyAction({ bookingId: b.id, actualT: p.actualT, acceptedT: p.acceptedT, rejectReason, evidence: evidence(p.evidence ?? [], user, dataset) }); break; }
      case 'addSupportRequestAction': { const s = args[0]; result = engine.addSupportRequestAction({ email: user.email, subject: text(s.subject, 'subject', 250), message: text(s.message, 'message', 5000) }); assign(result.id, user); break; }
      default: throw new ApiError(404, 'Unknown operation.');
    }
    const next = engine.getDataset();
    requireThat(next !== dataset, 'This operation is no longer available. Refresh and check material, demand, and capacity limits.', 409);
    next.projects = next.projects.map(project => {
      const materialIds = new Set(next.materials.filter(material => material.projectId === project.id).map(material => material.id));
      const event = next.events.findLast(event => event.subjectIds.some(id => id === project.id || materialIds.has(id)));
      return event ? { ...project, lastActivityAt: event.at } : project;
    });
    next.receivers = next.receivers.map(r => ({ ...r,
      dailyIntakeT: Math.max(0, ...next.slots.filter(s => s.receiverId === r.id).map(s => next.slots.filter(x => x.receiverId === r.id && x.date === s.date).reduce((sum, x) => sum + x.capacityT, 0))),
      currentStockT: next.verifications.filter(v => v.receiverId === r.id && v.status === 'verified').reduce((sum, v) => sum + v.acceptedT, 0),
    }));
    save(next); return { dataset: visible(next, user), result: result ?? true };
  });
  const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
  const body = async req => { let size = 0; const chunks = []; for await (const chunk of req) { size += chunk.length; requireThat(size <= 6 * 1024 * 1024, 'Request exceeds 6 MB.', 413); chunks.push(chunk); } try { const value = JSON.parse(Buffer.concat(chunks).toString() || '{}'); requireThat(value && typeof value === 'object' && !Array.isArray(value), 'Invalid request.'); return value; } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'Invalid JSON.'); } };
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
    try {
      const url = new URL(req.url, 'http://localhost'); const path = url.pathname;
      if (!['GET', 'HEAD'].includes(req.method)) {
        requireThat(req.headers['x-greenloop-client'] === 'web', 'Missing request verification header.', 403);
        if (req.headers.origin) requireThat(allowedOrigins.has(req.headers.origin), 'Origin is not allowed.', 403);
        requireThat((req.headers['content-type'] ?? '').startsWith('application/json'), 'Send JSON requests.', 415);
      }
      if (path.startsWith('/api/auth/')) {
        const key = req.socket.remoteAddress; const now = Date.now(); const count = limits.get(key);
        if (count && now - count.start < 60000) { requireThat(count.total < 60, 'Too many authentication attempts. Try again in a minute.', 429); count.total++; }
        else limits.set(key, { start: now, total: 1 });
        if (limits.size > 10000) for (const [key, item] of limits) if (now - item.start > 60000) limits.delete(key);
      }
      if (path === '/api/health' && req.method === 'GET') return json(res, 200, { status: 'ok' });
      if (path === '/api/config' && req.method === 'GET') return json(res, 200, { googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), developmentMail: !production && !process.env.EMAIL_WEBHOOK_URL });
      if (path === '/api/auth/google' && req.method === 'GET') {
        requireThat(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET, 'Google sign-in is not configured. Please use email and password.', 503);
        const state = randomBytes(32).toString('hex'); const verifier = randomBytes(32).toString('base64url');
        db.prepare('DELETE FROM oauth_states WHERE expires<?').run(Date.now());
        db.prepare('INSERT INTO oauth_states VALUES (?, ?, ?)').run(hash(state), verifier, Date.now() + 600000);
        res.setHeader('Set-Cookie', `gl_oauth=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${production ? '; Secure' : ''}`);
        const query = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: `${process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173'}/api/auth/google/callback`, response_type: 'code', scope: 'openid email profile', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
        res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${query}` }); return res.end();
      }
      if (path === '/api/auth/google/callback' && req.method === 'GET') {
        try {
          const state = url.searchParams.get('state'); const cookieState = /(?:^|;\s*)gl_oauth=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1];
          requireThat(state && cookieState && state === cookieState, 'Google sign-in session is invalid. Please try again.', 400);
          const request = db.prepare('SELECT * FROM oauth_states WHERE state=? AND expires>?').get(hash(state), Date.now()); requireThat(request, 'Google sign-in session expired.', 400);
          db.prepare('DELETE FROM oauth_states WHERE state=?').run(hash(state));
          requireThat(url.searchParams.get('code'), 'Google sign-in was cancelled.', 400);
          const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173'}/api/auth/google/callback`, grant_type: 'authorization_code', code_verifier: request.verifier }), signal: AbortSignal.timeout(10000) });
          requireThat(response.ok, 'Google sign-in could not be completed.', 400); const tokens = await response.json();
          const info = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(10000) });
          requireThat(info.ok, 'Could not retrieve your Google account.', 400); const account = await info.json(); requireThat(account.email_verified === true && account.sub, 'Use a verified Google account.', 400);
          const user = transaction(() => {
            const identity = db.prepare('SELECT users.* FROM google_identities JOIN users ON users.id=google_identities.user_id WHERE subject=?').get(account.sub);
            if (identity) return profile(identity);
            const email = emailAddress(account.email); requireThat(!db.prepare('SELECT id FROM users WHERE email=?').get(email), 'This email already has a password account. Please sign in with your password.', 409);
            const id = randomUUID(); const fields = { name: text(account.name ?? '', 'name', 250, true), workspaces: [] };
            db.prepare('INSERT INTO users VALUES (?, ?, NULL, ?)').run(id, email, JSON.stringify(fields)); db.prepare('INSERT INTO google_identities VALUES (?, ?)').run(account.sub, id);
            return { id, email, ...fields };
          });
          session(res, user, true); res.writeHead(302, { Location: user.workspaces.length ? '/app' : '/onboarding' }); return res.end();
        } catch (error) { res.writeHead(302, { Location: `/sign-in?error=${encodeURIComponent(error.status ? error.message : 'Google sign-in is unavailable. Please try again.')}` }); return res.end(); }
      }
      if (path === '/api/auth/me' && req.method === 'GET') { let user = null; try { user = authenticated(req); } catch { /* No active session. */ } return json(res, 200, { user }); }
      if (path === '/api/auth/register' && req.method === 'POST') {
        const p = await body(req); const email = emailAddress(p.email); const password = passwordHash(p.password);
        requireThat(!db.prepare('SELECT id FROM users WHERE email=?').get(email), 'An account already exists with this email.', 409);
        const user = { id: randomUUID(), email, name: text(p.name ?? '', 'name', 250, true), organization: text(p.organization ?? '', 'organization', 250, true), workspaces: [] };
        const { id, email: ignored, ...fields } = user; db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(id, email, password, JSON.stringify(fields));
        return json(res, 201, { user: session(res, user) });
      }
      if (path === '/api/auth/login' && req.method === 'POST') {
        const p = await body(req); const email = emailAddress(p.email); const row = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        requireThat(passwordMatches(p.password, row?.password ?? `00000000000000000000000000000000:${'0'.repeat(128)}`) && row, 'Email or password is incorrect.', 401);
        return json(res, 200, { user: session(res, profile(row), p.remember === true) });
      }
      if (path === '/api/auth/logout' && req.method === 'POST') {
        const token = /gl_session=([a-f0-9]{64})/.exec(req.headers.cookie ?? '')?.[1]; if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token)); cookie(res, '', false, true); return json(res, 200, { ok: true });
      }
      if (path === '/api/auth/forgot-password' && req.method === 'POST') {
        const p = await body(req); const email = emailAddress(p.email); const row = db.prepare('SELECT id FROM users WHERE email=?').get(email);
        requireThat(!production || process.env.EMAIL_WEBHOOK_URL, 'Password recovery email is not configured.', 503);
        if (row) {
          const token = randomBytes(32).toString('hex'); const link = `${process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173'}/forgot-password?token=${token}`;
          db.prepare('DELETE FROM resets WHERE user_id=?').run(row.id); db.prepare('INSERT INTO resets VALUES (?, ?, ?)').run(hash(token), row.id, Date.now() + 1800000);
          const message = { to: email, subject: 'Reset your GreenLoop password', text: `Open this link within 30 minutes: ${link}` };
          if (process.env.EMAIL_WEBHOOK_URL) { const response = await fetch(process.env.EMAIL_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify(message), signal: AbortSignal.timeout(10000) }); requireThat(response.ok, 'Could not send recovery email. Try again later.', 503); }
          else appendFileSync(resolve(dataDir, 'mail-outbox.jsonl'), JSON.stringify(message) + '\n');
        }
        return json(res, 200, { ok: true });
      }
      if (path === '/api/auth/reset-password' && req.method === 'POST') {
        const p = await body(req); text(p.token, 'reset token', 128); const password = passwordHash(p.password);
        transaction(() => { const reset = db.prepare('SELECT * FROM resets WHERE token=? AND expires>?').get(hash(p.token), Date.now()); requireThat(reset, 'This reset link is invalid or expired.', 400); db.prepare('UPDATE users SET password=? WHERE id=?').run(password, reset.user_id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id); db.prepare('DELETE FROM resets WHERE user_id=?').run(reset.user_id); }); return json(res, 200, { ok: true });
      }
      if (path.startsWith('/api/')) {
        const user = authenticated(req);
        if (path === '/api/profile' && req.method === 'PATCH') {
          const p = await body(req); const updated = transaction(() => {
            const current = profile(db.prepare('SELECT * FROM users WHERE id=?').get(user.id));
            for (const key of ['name', 'organization', 'location', 'vat', 'phone']) if (p[key] !== undefined) current[key] = text(p[key], key, 250, true);
            if (p.workspaces) { requireThat(Array.isArray(p.workspaces) && p.workspaces.length <= 2, 'Invalid workspaces.'); current.workspaces = [...new Set([...current.workspaces, ...p.workspaces.map(r => choice(r, ['provider', 'receiver'], 'workspace'))])]; }
            if (p.activeWorkspace) { requireThat(current.workspaces.includes(p.activeWorkspace), 'Enable this workspace first.', 403); current.activeWorkspace = p.activeWorkspace; }
            current.activeWorkspace ??= current.workspaces[0];
            const dataset = load();
            if (current.workspaces.includes('receiver') && !current.receiverId) { current.receiverId = `R-${randomUUID()}`; dataset.receivers.push({ id: current.receiverId, name: current.organization || current.name || current.email, location: current.location || '', dailyIntakeT: 0, currentStockT: 0, acceptedTypes: [], distanceKm: 0, distanceKnown: false }); assign(current.receiverId, current); }
            if (current.receiverId) dataset.receivers = dataset.receivers.map(r => r.id === current.receiverId ? { ...r, name: current.organization || current.name || current.email, location: current.location || r.location } : r);
            save(dataset); writeProfile(current); return current;
          }); return json(res, 200, { user: updated });
        }
        if (path === '/api/dataset' && req.method === 'GET') return json(res, 200, { dataset: visible(load(), user) });
        if (path === '/api/actions' && req.method === 'POST') { const p = await body(req); requireThat(Array.isArray(p.args) && p.args.length <= 4, 'Invalid arguments.'); return json(res, 200, execute(user, p.action, p.args)); }
        if (path === '/api/uploads' && req.method === 'POST') {
          const p = await body(req); const name = text(p.name, 'filename', 250); const match = /^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(p.data ?? ''); requireThat(match, 'Upload a PNG, JPEG, WebP, or PDF.');
          const content = Buffer.from(match[2], 'base64'); requireThat(content.length > 0 && content.length <= 4 * 1024 * 1024, 'Files must be no larger than 4 MB.');
          const mime = match[1]; const valid = mime === 'application/pdf' ? content.subarray(0, 5).toString() === '%PDF-' : mime === 'image/png' ? content.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : mime === 'image/jpeg' ? content[0] === 255 && content[1] === 216 && content[2] === 255 : content.subarray(0, 4).toString() === 'RIFF' && content.subarray(8, 12).toString() === 'WEBP';
          requireThat(valid, 'The file content does not match its type.');
          const total = db.prepare('SELECT coalesce(sum(length(content)),0) AS total FROM uploads WHERE user_id=?').get(user.id).total; requireThat(total + content.length <= 100 * 1024 * 1024, 'Account upload limit reached.', 413);
          const id = randomUUID(); db.prepare('INSERT INTO uploads VALUES (?, ?, ?, ?, ?)').run(id, user.id, name, mime, content); return json(res, 201, { ref: `/api/uploads/${id}` });
        }
        if (path.startsWith('/api/uploads/') && req.method === 'GET') {
          const upload = db.prepare('SELECT * FROM uploads WHERE id=?').get(path.slice('/api/uploads/'.length)); requireThat(upload, 'File not found.', 404);
          const dataset = visible(load(), user); const ref = `/api/uploads/${upload.id}`;
          requireThat(upload.user_id === user.id || [...dataset.materials, ...dataset.verifications].some(x => x.evidence.some(e => e.ref === ref)), 'You do not have access to this file.', 403);
          res.writeHead(200, { 'Content-Type': upload.mime, 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(upload.name)}`, 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; sandbox" }); return res.end(Buffer.from(upload.content));
        }
        throw new ApiError(404, 'API endpoint not found.');
      }
      requireThat(['GET', 'HEAD'].includes(req.method), 'Method not allowed.', 405);
      const dist = resolve(root, 'dist'); const requested = resolve(dist, `.${decodeURIComponent(path)}`);
      requireThat(requested.startsWith(dist + '/') || requested.startsWith(dist + '\\') || requested === dist, 'Invalid path.', 400);
      const staticFile = Boolean(extname(requested));
      if (staticFile) requireThat(existsSync(requested) && statSync(requested).isFile(), 'File not found.', 404);
      const file = staticFile ? requested : resolve(dist, 'index.html');
      requireThat(existsSync(file), 'Build the frontend with npm run build, or run npm run dev.', 404);
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }[extname(file)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' }); res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
    } catch (error) { if (!res.headersSent) json(res, error.status ?? 500, { error: error.status ? error.message : 'An unexpected server error occurred.' }); else res.end(); if (!error.status) console.error(error); }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createBackend(); server.listen(Number(process.env.PORT ?? 3001), process.env.HOST ?? '127.0.0.1', () => console.log(`GreenLoop backend: http://localhost:${process.env.PORT ?? 3001}`));
}
