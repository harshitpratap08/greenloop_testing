// Request-local model facade lets the existing synchronous business engine run
// unchanged inside a real PostgreSQL transaction. No process-wide data cache.
export function createSnapshotModels(context) {
  const state = () => {
    const current = context.getStore();
    if (!current) throw new Error('Database model used outside a transaction.');
    return current;
  };
  const rows = table => state().snapshot[table];
  const find = (table, field, value) => rows(table).find(row => row[field] === value);
  const remove = (table, predicate) => { state().snapshot[table] = rows(table).filter(row => !predicate(row)); };
  const toProfile = row => row && ({ id: row.id, email: row.email, ...JSON.parse(row.profile) });
  const userModel = {
    toProfile,
    findById: id => find('users', 'id', id),
    findByEmail: email => find('users', 'email', email),
    findProfileById: id => toProfile(find('users', 'id', id)),
    findProfileByEmail: email => toProfile(find('users', 'email', email)),
    hasEmail: email => Boolean(find('users', 'email', email)),
    create({ id, email, password, profile }) { rows('users').push({ id, email, password, profile: JSON.stringify(profile) }); },
    createGoogleIdentity(subject, input) { this.create({ ...input, password: null }); rows('google_identities').push({ subject, user_id: input.id }); },
    findByGoogleSubject: subject => find('users', 'id', find('google_identities', 'subject', subject)?.user_id),
    updateProfile(user) { const { id, email, ...fields } = user; find('users', 'id', id).profile = JSON.stringify(fields); },
    updatePassword(id, password) { find('users', 'id', id).password = password; },
    publicContact(id) { const row = find('users', 'id', id); return row && { email: row.email, profile: JSON.parse(row.profile) }; },
  };
  const sessionModel = {
    removeExpired: now => remove('sessions', row => row.expires < now),
    create: (token, user_id, expires) => rows('sessions').push({ token, user_id, expires }),
    findUser(token, now) { const session = find('sessions', 'token', token); return session?.expires > now ? find('users', 'id', session.user_id) : undefined; },
    delete: token => remove('sessions', row => row.token === token),
    deleteForUser: id => remove('sessions', row => row.user_id === id),
    createReset(token, user_id, expires) { this.deleteResetsForUser(user_id); rows('resets').push({ token, user_id, expires }); },
    findReset(token, now) { const row = find('resets', 'token', token); return row?.expires > now ? row : undefined; },
    deleteResetsForUser: id => remove('resets', row => row.user_id === id),
    createOAuthState(stateHash, verifier, expires) { remove('oauth_states', row => row.expires < Date.now()); rows('oauth_states').push({ state: stateHash, verifier, expires }); },
    findOAuthState(hash, now) { const row = find('oauth_states', 'state', hash); return row?.expires > now ? row : undefined; },
    deleteOAuthState: hash => remove('oauth_states', row => row.state === hash),
  };
  const datasetModel = {
    initialize() {},
    load: () => structuredClone(state().snapshot.dataset),
    save: dataset => { state().snapshot.dataset = structuredClone(dataset); },
    ownerId: id => state().snapshot.owners[id],
    assignOwner: (id, userId) => { state().snapshot.owners[id] = userId; },
    deleteOwner: id => { delete state().snapshot.owners[id]; },
    transaction(operation) {
      const current = state();
      const savepoint = structuredClone(current.snapshot);
      try { return operation(); } catch (error) { current.snapshot = savepoint; throw error; }
    },
  };
  const uploadModel = {
    ownerId: id => find('uploads', 'id', id)?.user_id,
    totalBytesForUser: id => rows('uploads').filter(row => row.user_id === id).reduce((sum, row) => sum + row.size_bytes, 0),
    create({ id, userId, name, mime, content }) {
      rows('uploads').push({ id, user_id: userId, name, mime, size_bytes: content.length, storage_path: `${userId}/${id}`, content });
    },
    findById: id => find('uploads', 'id', id),
  };
  return { datasetModel, userModel, sessionModel, uploadModel };
}
