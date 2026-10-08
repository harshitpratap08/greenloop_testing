import { createActions } from '../actions.ts';
import { ApiError, choice, date, geo, number, requireThat, text } from '../validation.mjs';
import { availableT, requestCapacity, slotMatchesDemandPeriod } from '../../../shared/domain/capacity.ts';

const materialType = value => {
  requireThat(typeof value === 'string', 'Invalid material type.');
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  requireThat(normalized.length >= 2 && normalized.length <= 40, 'Invalid material type.');
  return normalized;
};

export function createActionService({ datasetModel, datasetService, userModel, uploadModel, negotiationModel, paymentService, supportModel, auctionService }) {
  const own = (id, user) => {
    text(id, 'record ID', 250);
    requireThat(datasetModel.ownerId(id) === user.id, 'You do not have permission to change this record.', 403);
  };
  const assign = (id, user) => datasetModel.assignOwner(id, user.id);
  const evidence = (items, user) => {
    requireThat(Array.isArray(items) && items.length <= 20, 'Invalid evidence list.');
    return items.map(item => {
      requireThat(item && typeof item === 'object' && !Array.isArray(item), 'Invalid evidence item.');
      const result = { kind: choice(item.kind, ['survey-sheet', 'site-photo', 'lab-report', 'weighbridge-ticket'], 'evidence type'), label: text(item.label, 'evidence label', 250), recordedAt: new Date().toISOString() };
      if (item.ref) {
        text(item.ref, 'evidence reference', 250);
        const id = /^\/api\/uploads\/([\w-]+)$/.exec(item.ref)?.[1];
        requireThat(id && uploadModel.ownerId(id) === user.id, 'Upload evidence before attaching it.');
        result.ref = item.ref;
      }
      return result;
    });
  };

  return {
    execute(user, action, args) {
      if (['sendNegotiationMessageAction','proposeFinalTermsAction','approveFinalTermsAction'].includes(action)) auctionService?.ensureOfferActive(args[0]);
      return datasetModel.transaction(() => {
        requireThat(typeof action === 'string' && args.length > 0, 'Invalid operation.');
        const objectActions = ['addProjectAction', 'addMaterialAction', 'addDemandAction', 'saveDemandDraftAction', 'addCapacityAction', 'requestCapacityAction', 'cancelBookingAction', 'dispatchAction', 'addOfferAction', 'saveOfferDraftAction', 'verifyAction', 'addSupportRequestAction', 'createPaymentAttemptAction', 'disputePaymentAction'];
        if (objectActions.includes(action)) requireThat(args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]), 'Invalid operation input.');
        const dataset = datasetModel.load();
        if (action === 'markNotificationsReadAction') {
          const ids = args[0];
          requireThat(Array.isArray(ids) && ids.length <= 1000, 'Invalid notifications.');
          const available = new Set(datasetService.visible(dataset, user).events.map(event => event.id));
          for (const id of ids) { text(id, 'notification ID', 250); requireThat(available.has(id), 'Notification not found.', 404); }
          const readEventIds = new Set(user.readEventIds ?? []);
          for (const id of ids) readEventIds.add(id);
          user.readEventIds = [...readEventIds];
          userModel.updateProfile(user);
          return { dataset: { ...datasetService.visible(dataset, user), readEventIds: user.readEventIds }, result: user.readEventIds };
        }
        const demandTarget = (input, existingDemandId) => {
          if (!input.targetMaterialId) return {};
          const id = text(input.targetMaterialId, 'target material ID', 100);
          const material = dataset.materials.find(item => item.id === id && !item.archivedAt);
          const account = userModel.publicContact(datasetModel.ownerId(id) ?? '');
          requireThat(material && account, 'This provider material is no longer available.', 409);
          const committed = dataset.bookings.filter(item => item.materialId === id && item.status !== 'cancelled' && (!existingDemandId || item.demandId !== existingDemandId)).reduce((sum, item) => sum + item.tonnesT, 0);
          requireThat(number(input.requiredT, 'required quantity') <= material.quantityT - committed - (auctionService?.reservedT(id) ?? 0), 'Request exceeds this listing’s available material.', 409);
          requireThat(material.type === input.materialType, 'The request must use the selected material type.', 409);
          requireThat(!material.availableFrom || input.period >= material.availableFrom, 'The selected material is not available by that date.', 409);
          const provider = account.profile;
          return { targetMaterialId: id, targetProviderId: account.email, targetProviderName: provider.organization || provider.name || 'Provider' };
        };
        const role = expected => requireThat(user.workspaces.includes(expected) && user.activeWorkspace === expected, `Switch to your ${expected} workspace to continue.`, 403);
        const booking = id => { const item = dataset.bookings.find(b => b.id === id); requireThat(item, 'Booking not found.', 404); return item; };
        const receiverBooking = id => { role('receiver'); const item = booking(id); own(item.receiverId, user); return item; };
        const providerBooking = id => { role('provider'); const item = booking(id); own(item.materialId, user); return item; };
        const offer = id => { role('receiver'); const item = dataset.offers.find(o => o.id === id); requireThat(item, 'Offer not found.', 404); own(dataset.demands.find(d => d.id === item.demandId)?.receiverId, user); requireThat(item.status === 'pending', 'This offer has already been decided.', 409); return item; };
        const receiverActions = ['updateDemandAction', 'deleteDemandAction', 'addDemandAction', 'saveDemandDraftAction', 'deleteDemandDraftAction', 'addCapacityAction', 'updateCapacityAction', 'acceptOfferAction', 'declineOfferAction', 'acceptRequestAction', 'rejectRequestAction', 'rescheduleRequestAction', 'receiveLoadAction', 'verifyLoadAction', 'verifyAction'];
        if (action === 'counterOfferAction' && user.activeWorkspace === 'receiver') receiverActions.push(action);
        if (action === 'cancelDemandAction' || (action === 'archiveBookingAction' && user.activeWorkspace === 'receiver')) receiverActions.push(action);
        const engine = createActions(dataset, { kind: receiverActions.includes(action) ? 'receiver' : 'contractor', name: user.name || user.email });
        let result;
        let nextOverride;
        const appendEvent = (state, event) => {
          const highest = state.events.reduce((max, item) => Math.max(max, Number(/^EV-(\d+)$/.exec(item.id)?.[1] ?? 0)), 0);
          return { ...event, id: `EV-${String(highest + 1).padStart(3, '0')}` };
        };
        const negotiationContext = offerId => {
          const item = dataset.offers.find(candidate => candidate.id === text(offerId, 'offer ID', 250));
          requireThat(item, 'Offer not found.', 404);
          auctionService?.assertOfferDeadline(item.id);
          const demand = dataset.demands.find(candidate => candidate.id === item.demandId);
          const material = dataset.materials.find(candidate => candidate.id === item.passportId);
          requireThat(demand && material, 'The offer is no longer available.', 409);
          const providerUserId = datasetModel.ownerId(item.passportId);
          const receiverUserId = datasetModel.ownerId(demand.receiverId);
          requireThat(providerUserId && receiverUserId && providerUserId !== receiverUserId, 'This offer does not have two eligible participants.', 409);
          const participantRole = providerUserId === user.id ? 'provider' : receiverUserId === user.id ? 'receiver' : null;
          requireThat(participantRole, 'You are not a participant in this negotiation.', 403);
          role(participantRole);
          negotiationModel.ensure(item.id, providerUserId, receiverUserId, item.createdAt);
          return { offer: item, demand, material, participantRole };
        };
        switch (action) {
          case 'updateMaterialAction': {
            role('provider'); own(args[0], user);
            requireThat(!auctionService?.hasActive(args[0]), 'Material terms are locked while an auction is active.', 409);
            const record = dataset.materials.find(item => item.id === args[0] && !item.archivedAt);
            requireThat(record, 'Passport not found.', 404);
            requireThat(!dataset.bookings.some(item => item.materialId === record.id), 'Passports linked to orders cannot be edited. Create a new passport for additional material.', 409);
            const p = args[1]; requireThat(p && typeof p === 'object' && !Array.isArray(p), 'Invalid passport input.');
            result = engine.updateMaterialAction(record.id, { type: materialType(p.type), quantityT: number(p.quantityT, 'quantity'), condition: choice(p.condition, ['good', 'fair', 'poor'], 'condition'), grade: choice(p.grade, ['A', 'B', 'C'], 'grade'), surveyNotes: text(p.surveyNotes ?? '', 'notes', 5000, true), pricePerT: p.pricePerT == null ? null : number(p.pricePerT, 'price', true), availableFrom: p.availableFrom == null ? null : date(p.availableFrom) });
            requireThat(result, 'Material type, grade and condition cannot change while offers are pending.', 409); break;
          }
          case 'deleteMaterialAction': {
            role('provider'); own(args[0], user);
            requireThat(!auctionService?.hasActive(args[0]), 'Material cannot be removed while an auction is active.', 409);
            requireThat(dataset.materials.some(item => item.id === args[0] && !item.archivedAt), 'Passport not found.', 404);
            result = engine.deleteMaterialAction(args[0]); requireThat(result, 'Passports linked to orders or delivery proof cannot be deleted.', 409); break;
          }
          case 'updateDemandAction': {
            role('receiver'); const record = dataset.demands.find(item => item.id === args[0] && !item.archivedAt); requireThat(record, 'Request not found.', 404); own(record.receiverId, user);
            const p = args[1]; requireThat(p && typeof p === 'object' && !Array.isArray(p), 'Invalid request input.');
            const period = date(p.period); requireThat(period >= new Date().toISOString().slice(0, 10), 'Choose a future needed-by date.');
            if (record.targetMaterialId) demandTarget({ ...p, period, targetMaterialId: record.targetMaterialId }, record.id);
            result = engine.updateDemandAction(record.id, { materialType: materialType(p.materialType), requiredT: number(p.requiredT, 'required quantity'), period, location: text(p.location, 'location', 250), notes: text(p.notes ?? '', 'notes', 5000, true), budgetPerT: p.budgetPerT == null ? null : number(p.budgetPerT, 'budget', true) });
            requireThat(result, 'Keep the existing material and delivery location for linked orders. Quantity and deadline must cover existing commitments; cancelled requests cannot be edited.', 409); break;
          }
          case 'deleteDemandAction': {
            role('receiver'); const record = dataset.demands.find(item => item.id === args[0] && !item.archivedAt); requireThat(record, 'Request not found.', 404); own(record.receiverId, user);
            result = engine.deleteDemandAction(record.id); requireThat(result, 'Requests linked to orders cannot be deleted.', 409); break;
          }
          case 'addProjectAction': {
            role('provider'); const p = args[0]; result = engine.addProjectAction({ name: text(p.name, 'project name', 250), location: text(p.location, 'location', 250), status: choice(p.status, ['active', 'demolition', 'complete'], 'project status'), geo: geo(p.geo) }); assign(result.id, user); break;
          }
          case 'addMaterialAction': {
            role('provider'); const m = args[0]; own(m.projectId, user); number(m.quantityT, 'quantity'); requireThat(Array.isArray(m.quantityRangeT) && m.quantityRangeT.length === 2, 'Invalid quantity range.');
            number(m.quantityRangeT[0], 'minimum quantity', true); number(m.quantityRangeT[1], 'maximum quantity'); requireThat(m.quantityRangeT[0] <= m.quantityT && m.quantityRangeT[1] >= m.quantityT, 'Quantity must fit its estimate range.');
            number(m.confidence, 'confidence', true); requireThat(m.confidence <= 1, 'Confidence must be between zero and one.');
            result = engine.addMaterialAction({ projectId: m.projectId, type: materialType(m.type), quantityT: m.quantityT, originalUnit: m.originalUnit, originalQuantity: m.originalQuantity, conversionFactor: m.conversionFactor, quantityRangeT: m.quantityRangeT, condition: choice(m.condition, ['good', 'fair', 'poor'], 'condition'), grade: choice(m.grade, ['A', 'B', 'C'], 'grade'), confidence: m.confidence, surveyNotes: text(m.surveyNotes ?? '', 'notes', 5000, true), evidence: evidence(m.evidence, user), pricePerT: m.pricePerT === undefined ? undefined : number(m.pricePerT, 'price', true), availableFrom: m.availableFrom === undefined ? undefined : date(m.availableFrom), geo: geo(m.geo) }); assign(result.id, user); break;
          }
          case 'addDemandAction':
          case 'saveDemandDraftAction': {
            role('receiver'); const d = args[0]; own(user.receiverId, user); date(d.period); requireThat(d.period >= new Date().toISOString().slice(0, 10), 'The needed-by date is in the past.');
            const target = demandTarget(d);
            const input = { receiverId: user.receiverId, materialType: materialType(d.materialType), requiredT: number(d.requiredT, 'required quantity'), period: d.period, location: text(d.location, 'location', 250), notes: text(d.notes ?? '', 'notes', 5000, true), budgetPerT: d.budgetPerT === undefined ? undefined : number(d.budgetPerT, 'budget per tonne', true), geo: geo(d.geo), ...target };
            result = action === 'addDemandAction' ? engine.addDemandAction(input) : engine.saveDemandDraftAction(input); assign(result.id, user); break;
          }
          case 'deleteDemandDraftAction': {
            role('receiver'); const demandId = text(args[0], 'request ID', 250); const demand = dataset.demands.find(item => item.id === demandId);
            requireThat(demand && demand.status === 'DRAFT', 'Only a saved draft request can be deleted.', 409); own(demand.receiverId, user);
            result = engine.deleteDemandDraftAction(demandId); requireThat(result, 'This draft request no longer exists.', 409); datasetModel.deleteOwner(demandId); break;
          }
          case 'addCapacityAction': {
            role('receiver'); const s = args[0]; own(s.receiverId, user); date(s.date); requireThat(s.date >= new Date().toISOString().slice(0, 10), 'This receiving slot is in the past.'); const slotType = materialType(s.materialType);
            requireThat(!dataset.slots.some(x => x.receiverId === s.receiverId && x.date === s.date && x.materialType === slotType), 'A slot already exists for this material and date.', 409);
            result = engine.addCapacityAction({ receiverId: s.receiverId, date: s.date, materialType: slotType, capacityT: number(s.capacityT, 'capacity') }); break;
          }
          case 'updateCapacityAction': {
            role('receiver'); const slot = dataset.slots.find(s => s.id === args[0]); requireThat(slot, 'Slot not found.', 404); own(slot.receiverId, user); number(args[1], 'capacity'); result = engine.updateCapacityAction(...args); requireThat(result, 'Capacity cannot be reduced below reserved tonnes.', 409); break;
          }
          case 'requestCapacityAction': {
            role('provider'); const input = args[0]; own(input.materialId, user); number(input.tonnesT, 'requested quantity');
            const slot = dataset.slots.find(s => s.id === input.slotId); const material = dataset.materials.find(m => m.id === input.materialId);
            requireThat(slot && material && !material.archivedAt && slot.receiverId === input.receiverId && slot.materialType === material.type, 'Choose a compatible receiver slot.');
            const committed=dataset.bookings.filter(item=>item.materialId===material.id&&item.status!=='cancelled').reduce((sum,item)=>sum+item.tonnesT,0);
            requireThat(input.tonnesT<=material.quantityT-committed-(auctionService?.reservedT(material.id)??0),'Requested quantity includes material reserved for an auction.',409);
            requireThat(slot.date >= new Date().toISOString().slice(0, 10), 'This receiving slot is in the past.');
            result = engine.requestCapacityAction({ materialId: input.materialId, receiverId: input.receiverId, slotId: input.slotId, tonnesT: input.tonnesT }); break;
          }
          case 'cancelBookingAction': {
            const b = providerBooking(args[0].bookingId); requireThat(!b.loadRef && !b.receiverAcceptedAt && b.status !== 'cancelled', 'Accepted, dispatched, or cancelled bookings cannot be cancelled.', 409);
            result = engine.cancelBookingAction({ bookingId: b.id, reason: text(args[0].reason ?? '', 'reason', 1000, true) }); break;
          }
          case 'updateDeliveryAction': {
            const b = providerBooking(args[0]); const stage = choice(args[1], ['ready', 'picked-up', 'arrived'], 'delivery stage'); result = engine.updateDeliveryAction(b.id, stage); break;
          }
          case 'dispatchAction': {
            const b = providerBooking(args[0].bookingId); requireThat(b.status === 'confirmed' && b.receiverAcceptedAt && !b.loadRef, 'The receiver must accept this booking before dispatch.', 409);
            requireThat(paymentService.canDispatch(b.id), 'Payment must be confirmed before dispatch.', 409);
            const stages = dataset.events.filter(event => event.subjectIds.includes(b.id));
            requireThat(!stages.some(event => event.kind === 'delivery.ready') || stages.some(event => event.kind === 'delivery.picked-up'), 'Record pickup before dispatching this load.', 409);
            result = engine.dispatchAction({ bookingId: b.id }); break;
          }
          case 'createPaymentAttemptAction': {
            const b = receiverBooking(text(args[0].bookingId, 'booking ID', 250));
            result = paymentService.createAttempt({ booking: b, dataset, user });
            const event = appendEvent(dataset, { at: new Date().toISOString(), kind: 'payment.attempt-created', actor: { kind: 'receiver', name: user.name || user.email }, summary: 'Order payment started', detail: `Payment attempt ${result.attemptId} for ${result.amountMinor} minor units.`, subjectIds: [b.id] });
            nextOverride = { ...dataset, events: [...dataset.events, event] };
            break;
          }
          case 'disputePaymentAction': {
            const b = receiverBooking(text(args[0].bookingId, 'booking ID', 250));
            result = paymentService.dispute({ bookingId: b.id, userId: user.id, reason: text(args[0].reason ?? '', 'reason', 1000, true), booking: b });
            const event = appendEvent(dataset, { at: new Date().toISOString(), kind: 'payment.disputed', actor: { kind: 'receiver', name: user.name || user.email }, summary: 'Delivery payment disputed', detail: result.disputeReason, subjectIds: [b.id] });
            nextOverride = { ...dataset, events: [...dataset.events, event] };
            break;
          }
          case 'addOfferAction':
          case 'saveOfferDraftAction': {
            role('provider'); const o = args[0]; own(o.passportId, user); const m = dataset.materials.find(item => item.id === o.passportId); const d = dataset.demands.find(item => item.id === o.demandId);
            requireThat(d && m && !d.archivedAt && !m.archivedAt && ['OPEN', 'PARTIALLY_COVERED'].includes(d.status) && d.materialType === m.type, 'This request cannot accept that material.', 409);
            requireThat(!d.targetProviderId || (d.targetProviderId === user.email && d.targetMaterialId === m.id), 'This request is addressed to a different provider or material.', 403);
            number(o.offeredQuantityT, 'offer quantity'); const committed = dataset.bookings.filter(b => b.materialId === m.id && b.status !== 'cancelled').reduce((sum, b) => sum + b.tonnesT, 0);
            requireThat(o.offeredQuantityT <= m.quantityT - committed, 'Offer exceeds available material.', 409);
            const offerInput = { demandId: d.id, passportId: m.id, offeredQuantityT: o.offeredQuantityT, providerId: user.email, ...(o.pricePerT === undefined ? {} : { pricePerT: number(o.pricePerT, 'price per tonne', true) }) };
            result = action === 'addOfferAction' ? engine.addOfferAction(offerInput) : engine.saveOfferDraftAction(offerInput);
            if (action === 'addOfferAction') {
              const providerUserId = datasetModel.ownerId(m.id);
              const receiverUserId = datasetModel.ownerId(d.receiverId);
              requireThat(providerUserId && receiverUserId && providerUserId !== receiverUserId, 'You cannot negotiate an offer with your own workspace.', 409);
              negotiationModel.ensure(result.id, providerUserId, receiverUserId, result.createdAt);
            }
            break;
          }
          case 'deleteOfferDraftAction': {
            role('provider'); const offerId = text(args[0], 'offer ID', 250); const item = dataset.offers.find(candidate => candidate.id === offerId);
            requireThat(item && item.status === 'draft', 'Only a saved draft offer can be deleted.', 409); own(item.passportId, user);
            result = engine.deleteOfferDraftAction(offerId); requireThat(result, 'This draft offer no longer exists.', 409); break;
          }
          case 'acceptOfferAction': throw new ApiError(409, 'Offers can only become bookings after both parties approve Final Terms.');
          case 'declineOfferAction': { const item=offer(args[0]); requireThat(!item.auctionId,'Auction awards cannot be declined through the offer action.',409); result = engine.declineOfferAction(args[0]); break; }
          case 'counterOfferAction': {
            throw new ApiError(409, 'Use Final Terms to propose a price, quantity, and receiving slot together.');
          }
          case 'sendNegotiationMessageAction': {
            const { offer, demand, material, participantRole } = negotiationContext(args[0]);
            requireThat(offer.status === 'pending', 'This negotiation is closed.', 409);
            const body = text(args[1], 'message', 4000);
            const at = new Date().toISOString();
            const senderName = user.name || user.organization || user.email;
            result = negotiationModel.addMessage({ offerId: offer.id, senderUserId: user.id, senderRole: participantRole, senderName, body, createdAt: at });
            const event = appendEvent(dataset, { at, kind: 'negotiation.message_sent', actor: { kind: participantRole === 'receiver' ? 'receiver' : 'contractor', name: senderName }, summary: `${participantRole === 'receiver' ? 'Receiver' : 'Provider'} sent a negotiation message`, subjectIds: [offer.id, demand.id, material.id] });
            nextOverride = { ...dataset, events: [...dataset.events, event] };
            break;
          }
          case 'proposeFinalTermsAction': {
            const { offer, demand, material, participantRole } = negotiationContext(args[0]);
            requireThat(offer.status === 'pending', 'This negotiation is closed.', 409);
            const terms = args[1];
            const quantityT = number(terms.quantityT, 'quantity');
            const pricePerT = number(terms.pricePerT, 'price per tonne', true);
            requireThat(pricePerT > 0, 'Final Terms require a price greater than zero.');
            const destination = text(terms.destination, 'destination', 250);
            const slotId = text(terms.slotId, 'receiving slot ID', 250);
            const slot = dataset.slots.find(candidate => candidate.id === slotId);
            if (!offer.auctionId) requireThat(destination === demand.location, 'The final destination must match the receiver request.', 409);
            requireThat(slot && slot.receiverId === demand.receiverId && slot.materialType === material.type, 'Choose a compatible receiver slot.', 409);
            requireThat(slot.date >= new Date().toISOString().slice(0, 10) && slotMatchesDemandPeriod(slot, demand.period), 'Choose a receiving date within the receiver request period.', 409);
            requireThat(!material.availableFrom || slot.date >= material.availableFrom, 'The material is not available by this receiving date.', 409);
            const committedMaterialT = dataset.bookings.filter(booking => booking.materialId === material.id && booking.status !== 'cancelled').reduce((sum, booking) => sum + booking.tonnesT, 0) + (auctionService?.reservedT(material.id,offer.auctionId) ?? 0);
            const committedDemandT = dataset.bookings.filter(booking => booking.demandId === demand.id && booking.status !== 'cancelled').reduce((sum, booking) => sum + booking.tonnesT, 0);
            requireThat(quantityT <= material.quantityT - committedMaterialT && quantityT <= demand.requiredT - committedDemandT, 'The proposed quantity exceeds available material or remaining demand.', 409);
            const at = new Date().toISOString();
            result = negotiationModel.createProposal({ offerId: offer.id, proposedBy: participantRole, quantityT, pricePerT, destination, slotId, createdAt: at });
            const event = appendEvent(dataset, { at, kind: 'final_terms.proposed', actor: { kind: participantRole === 'receiver' ? 'receiver' : 'contractor', name: user.name || user.email }, summary: `${participantRole === 'receiver' ? 'Receiver' : 'Provider'} proposed Final Terms version ${result.version}`, subjectIds: [offer.id, demand.id, material.id] });
            nextOverride = { ...dataset, events: [...dataset.events, event] };
            break;
          }
          case 'approveFinalTermsAction': {
            const { offer, demand, material, participantRole } = negotiationContext(args[0]);
            requireThat(offer.status === 'pending', 'This negotiation is closed.', 409);
            const proposalId = text(args[1], 'proposal ID', 250);
            const proposal = negotiationModel.currentProposal(offer.id);
            requireThat(proposal && proposal.id === proposalId, 'Only the latest Final Terms version can be approved.', 409);
            const at = new Date().toISOString();
            requireThat(negotiationModel.approveProposal(offer.id, proposal.id, participantRole, at), 'This version is not awaiting your approval.', 409);
            const providerApprovedAt = participantRole === 'provider' ? at : proposal.providerApprovedAt;
            const receiverApprovedAt = participantRole === 'receiver' ? at : proposal.receiverApprovedAt;
            const bothApproved = Boolean(providerApprovedAt && receiverApprovedAt);
            if (bothApproved) negotiationModel.setProposalStatus(proposal.id, 'approved');
            let currentDataset = dataset;
            let booking;
            let capacityIssue;
            if (bothApproved) {
              const slot = dataset.slots.find(candidate => candidate.id === proposal.slotId);
              const materialAvailableT = material.quantityT - dataset.bookings.filter(item => item.materialId === material.id && item.status !== 'cancelled').reduce((sum, item) => sum + item.tonnesT, 0) - (auctionService?.reservedT(material.id,offer.auctionId) ?? 0);
              const demandRemainingT = demand.requiredT - dataset.bookings.filter(item => item.demandId === demand.id && item.status !== 'cancelled').reduce((sum, item) => sum + item.tonnesT, 0);
              const capacityAvailableT = slot ? availableT(slot, dataset.bookings) : 0;
              if (!slot || slot.receiverId !== demand.receiverId || slot.materialType !== material.type || slot.date < new Date().toISOString().slice(0, 10) || !slotMatchesDemandPeriod(slot, demand.period)) capacityIssue = 'The approved receiving slot is no longer valid. Propose a new Final Terms version.';
               else if (!offer.auctionId && proposal.destination !== demand.location) capacityIssue = 'The receiver destination changed. Propose a new Final Terms version.';
              else if (proposal.quantityT > materialAvailableT || proposal.quantityT > demandRemainingT) capacityIssue = 'Material or demand quantity changed. Propose a new Final Terms version.';
              else if (proposal.quantityT > capacityAvailableT) capacityIssue = 'The approved receiving slot no longer has enough capacity. Propose a new Final Terms version.';
              else {
                const reservation = requestCapacity(dataset, { materialId: material.id, receiverId: demand.receiverId, slotId: slot.id, tonnesT: proposal.quantityT, actor: { kind: 'system', name: 'GreenLoop' }, at });
                if (reservation.output.outcome !== 'confirmed') capacityIssue = 'Capacity changed while confirming. Propose a new Final Terms version.';
                else {
                  const newBooking = reservation.output.booking;
                  booking = { ...newBooking, demandId: demand.id, receiverAcceptedAt: at, agreedPricePerT: proposal.pricePerT, offerId: offer.id, agreementVersionId: proposal.id };
                  const offerAccepted = { ...offer, status: 'accepted', agreedPricePerT: proposal.pricePerT };
                  currentDataset = {
                    ...reservation.dataset,
                    bookings: reservation.dataset.bookings.map(item => item.id === newBooking.id ? booking : item),
                    offers: (reservation.dataset.offers ?? []).map(item => item.id === offer.id ? offerAccepted : item),
                    events: reservation.dataset.events.map(event => event.subjectIds.includes(newBooking.allocationId) ? { ...event, subjectIds: [...new Set([...event.subjectIds, offer.id, demand.id, proposal.id, newBooking.id])] } : event),
                  };
                  negotiationModel.setProposalStatus(proposal.id, 'confirmed', booking.id);
                  const acceptedEvent = appendEvent(currentDataset, { at, kind: 'final_terms.confirmed', actor: { kind: 'system', name: 'GreenLoop' }, summary: `Final Terms version ${proposal.version} confirmed as booking ${booking.id}`, subjectIds: [offer.id, demand.id, material.id, proposal.id, slot.id, booking.id] });
                  currentDataset = { ...currentDataset, events: [...currentDataset.events, acceptedEvent] };
                  const coveredT = currentDataset.bookings.filter(item => item.demandId === demand.id && item.status === 'confirmed').reduce((sum, item) => sum + item.tonnesT, 0);
                  currentDataset.demands = currentDataset.demands.map(item => item.id !== demand.id || ['PAUSED', 'CANCELLED', 'DRAFT'].includes(item.status) ? item : { ...item, coveredT, status: coveredT >= item.requiredT ? 'COVERED' : coveredT > 0 ? 'PARTIALLY_COVERED' : 'OPEN' });
                }
              }
            }
            const approvalEvent = appendEvent(currentDataset, { at, kind: 'final_terms.approved', actor: { kind: participantRole === 'receiver' ? 'receiver' : 'contractor', name: user.name || user.email }, summary: `${participantRole === 'receiver' ? 'Receiver' : 'Provider'} approved Final Terms version ${proposal.version}`, subjectIds: [offer.id, demand.id, material.id, proposal.id, ...(booking ? [booking.id] : [])] });
            nextOverride = { ...currentDataset, events: [...currentDataset.events, approvalEvent] };
            result = { status: booking ? 'confirmed' : bothApproved ? 'approved' : proposal.status, ...(booking ? { bookingId: booking.id } : {}), ...(capacityIssue ? { capacityIssue } : {}) };
            break;
          }
          case 'cancelDemandAction': {
            role('receiver'); const demand = dataset.demands.find(item => item.id === text(args[0], 'request ID', 250));
            requireThat(demand, 'Request not found.', 404); own(demand.receiverId, user);
            requireThat(['OPEN', 'PARTIALLY_COVERED'].includes(demand.status), 'Only an open request can be cancelled.', 409);
            requireThat(!dataset.bookings.some(item => item.demandId === demand.id && item.status !== 'cancelled'), 'A request with active bookings cannot be cancelled.', 409);
            result = engine.cancelDemandAction(demand.id); break;
          }
          case 'withdrawOfferAction': {
            role('provider'); const offerId = text(args[0], 'offer ID', 250); const item = dataset.offers.find(candidate => candidate.id === offerId);
            requireThat(item && item.status === 'pending', 'Only a pending offer can be withdrawn.', 409); own(item.passportId, user);
            requireThat(!item.auctionId,'Auction awards cannot be withdrawn through the offer action.',409);
            result = engine.withdrawOfferAction(offerId); break;
          }
          case 'archiveBookingAction': {
            const actor = user.activeWorkspace === 'receiver' ? 'receiver' : 'provider';
            if (actor === 'receiver') receiverBooking(args[0]); else providerBooking(args[0]);
            const item = booking(text(args[0], 'booking ID', 250));
            requireThat(dataset.verifications.some(record => record.bookingId === item.id && record.status === 'verified'), 'Only a verified completed booking can be archived.', 409);
            requireThat(!item.archivedAt, 'This booking is already archived.', 409);
            result = engine.archiveBookingAction(item.id, actor); break;
          }
          case 'acceptRequestAction': { const b = receiverBooking(args[0]); requireThat(!b.loadRef, 'This load has already dispatched.', 409); if (args[1] !== null && args[1] !== undefined) number(args[1], 'accepted quantity'); result = engine.acceptRequestAction(b.id, args[1] ?? undefined); break; }
          case 'rejectRequestAction': { const b = receiverBooking(args[0]); requireThat(!b.loadRef, 'Dispatched loads must be verified instead.', 409); result = engine.rejectRequestAction(b.id); break; }
          case 'rescheduleRequestAction': { const b = receiverBooking(args[0]); const target = dataset.slots.find(s => s.id === args[1]); requireThat(target && target.date >= new Date().toISOString().slice(0, 10), 'Choose a current receiving slot.'); result = engine.rescheduleRequestAction(b.id, text(args[1], 'slot ID')); break; }
          case 'receiveLoadAction': { const b = receiverBooking(args[0]); result = engine.receiveLoadAction(b.id, number(args[1], 'received quantity', true), evidence(args[2], user)); break; }
          case 'verifyLoadAction': {
            role('receiver'); const v = dataset.verifications.find(v => v.id === args[0]); requireThat(v, 'Receipt not found.', 404); own(v.receiverId, user);
            number(args[1], 'accepted quantity', true); number(args[2], 'rejected quantity', true); requireThat(Math.abs(args[1] + args[2] - v.actualT) < 0.001, 'Accepted and rejected quantities must equal the received weight.');
            if (args[2] > 0) text(args[3], 'rejection reason', 1000); result = engine.verifyLoadAction(v.id, args[1], args[2], args[3]); break;
          }
          case 'verifyAction': {
            const b = receiverBooking(args[0].bookingId); requireThat(b.loadRef && !dataset.verifications.some(v => v.bookingId === b.id), 'Receive and verify each dispatched load only once.', 409);
            const p = args[0]; number(p.actualT, 'received quantity', true); number(p.acceptedT, 'accepted quantity', true); requireThat(p.acceptedT <= p.actualT, 'Accepted quantity exceeds received weight.');
            const rejectReason = text(p.rejectReason ?? '', 'rejection reason', 1000, p.acceptedT === p.actualT);
            result = engine.verifyAction({ bookingId: b.id, actualT: p.actualT, acceptedT: p.acceptedT, rejectReason, evidence: evidence(p.evidence ?? [], user) }); break;
          }
          case 'addSupportRequestAction': { const s = args[0]; result = engine.addSupportRequestAction({ email: user.email, subject: text(s.subject, 'subject', 250), message: text(s.message, 'message', 5000) }); assign(result.id, user); supportModel.ensureRequest(result); break; }
          default: throw new ApiError(404, 'Unknown operation.');
        }
        const next = nextOverride ?? engine.getDataset();
        requireThat(next !== dataset, 'This operation is no longer available. Refresh and check material, demand, and capacity limits.', 409);
        if (action === 'verifyAction') paymentService.afterVerification(next, args[0].bookingId);
        if (action === 'verifyLoadAction') {
          const verified = next.verifications.find(item => item.id === args[0]);
          if (verified) paymentService.afterVerification(next, verified.bookingId);
        }
        next.projects = next.projects.map(project => {
          const materialIds = new Set(next.materials.filter(material => material.projectId === project.id).map(material => material.id));
          const event = next.events.findLast(event => event.subjectIds.some(id => id === project.id || materialIds.has(id)));
          return event ? { ...project, lastActivityAt: event.at } : project;
        });
        next.receivers = next.receivers.map(r => ({ ...r,
          dailyIntakeT: Math.max(0, ...next.slots.filter(s => s.receiverId === r.id).map(s => next.slots.filter(x => x.receiverId === r.id && x.date === s.date).reduce((sum, x) => sum + x.capacityT, 0))),
          currentStockT: next.verifications.filter(v => v.receiverId === r.id && v.status === 'verified').reduce((sum, v) => sum + v.acceptedT, 0),
        }));
        datasetModel.save(next);
        if (action === 'approveFinalTermsAction' && result?.status === 'confirmed' && result.bookingId) auctionService?.completeForOffer(args[0], result.bookingId, new Date().toISOString());
        return { dataset: datasetService.visible(next, user), result: result ?? true };
      });
    },
  };
}
