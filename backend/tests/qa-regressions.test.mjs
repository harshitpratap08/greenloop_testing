import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createBackend } from '../src/app.mjs';
import { createMockPaymentProvider } from '../src/services/payment-provider.mock.mjs';

test('auction award lets the winning receiver propose destination and slot before bilateral booking approval', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'greenloop-auction-terms-'));
  const server = createBackend({ dataDir: directory, paymentProvider: createMockPaymentProvider({ delayMs: 250 }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    return async (path, method = 'GET', data, expected = 200) => {
      const response = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-GreenLoop-Client': 'web', Cookie: cookie }, body: data === undefined ? undefined : JSON.stringify(data) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const body = await response.json(); assert.equal(response.status, expected, JSON.stringify(body)); return body;
    };
  };
  const provider = client(), receiver = client();
  const action = (request, name, ...args) => request('/actions', 'POST', { action: name, args });
  const waitFor = async (read, predicate) => {
    for (let count = 0; count < 100; count++) { const value = await read(); if (predicate(value)) return value; await new Promise(resolve => setTimeout(resolve, 10)); }
    assert.fail('Timed out waiting for mock payment verification.');
  };
  try {
    await provider('/auth/register', 'POST', { email: 'auction-provider@example.com', password: 'password123', organization: 'Auction Provider' }, 201);
    await provider('/profile', 'PATCH', { workspaces: ['provider'], activeWorkspace: 'provider' });
    const project = (await action(provider, 'addProjectAction', { name: 'Auction site', location: 'Pune', status: 'active' })).result;
    const material = (await action(provider, 'addMaterialAction', { projectId: project.id, type: 'concrete', quantityT: 10, quantityRangeT: [10, 10], condition: 'good', grade: 'A', confidence: 1, pricePerT: 800, evidence: [] })).result;
    await receiver('/auth/register', 'POST', { email: 'auction-receiver@example.com', password: 'password123', organization: 'Receiver Yard' }, 201);
    const receiverId = (await receiver('/profile', 'PATCH', { workspaces: ['receiver'], activeWorkspace: 'receiver', location: 'Pune' })).user.receiverId;
    const slotDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const slot = (await action(receiver, 'addCapacityAction', { receiverId, date: slotDate, materialType: 'concrete', capacityT: 10 })).result;
    const startsAt = new Date(Date.now() + 1500).toISOString();
    const endsAt = new Date(Date.now() + 300000).toISOString();
    const created = await provider('/auctions', 'POST', { materialId: material.id, quantityT: 5, startsAt, endsAt, minimumIncrement: 100, reservePrice: null }, 201);
    const auctionId = created.auction.id;
    await waitFor(() => provider('/monetization/me'), value => value.attempts.some(item => item.targetId === auctionId && item.status === 'paid'));
    await waitFor(() => receiver('/auctions'), value => value.auctions.some(item => item.id === auctionId && item.status === 'open'));
    await receiver(`/auctions/${auctionId}/join`, 'POST', {});
    await waitFor(() => receiver('/monetization/me'), value => value.attempts.some(item => item.productType === 'auction_participation' && item.targetId === auctionId && item.status === 'paid'));
    const bid = await receiver(`/auctions/${auctionId}/bids`, 'POST', { amount: 500 });
    assert.equal(bid.bid.amount, 500);
    const db = new DatabaseSync(join(directory, 'greenloop.sqlite'));
    try { db.prepare('UPDATE auctions SET ends_at=? WHERE id=?').run(new Date(Date.now() - 1000).toISOString(), auctionId); } finally { db.close(); }
    const awarded = (await receiver('/auctions')).auctions.find(item => item.id === auctionId);
    assert.equal(awarded.status, 'awarded');
    const offer = (await receiver('/dataset')).dataset.offers.find(item => item.auctionId === auctionId);
    assert.ok(offer);
    const proposed = (await action(receiver, 'proposeFinalTermsAction', offer.id, { quantityT: 4, pricePerT: 500, destination: 'Pune Receiver Yard, Gate 3', slotId: slot.id })).result;
    assert.equal(proposed.destination, 'Pune Receiver Yard, Gate 3');
    assert.equal((await receiver('/dataset')).dataset.bookings.some(item => item.offerId === offer.id), false);
    const confirmation = await action(provider, 'approveFinalTermsAction', offer.id, proposed.id);
    assert.equal(confirmation.result.status, 'confirmed', JSON.stringify(confirmation.result));
    const finalDataset = (await receiver('/dataset')).dataset;
    const booking = finalDataset.bookings.find(item => item.offerId === offer.id);
    assert.equal(booking.agreementVersionId, proposed.id);
    assert.equal(finalDataset.negotiations.find(item => item.offerId === offer.id).proposals.at(-1).destination, 'Pune Receiver Yard, Gate 3');
    assert.equal((await provider(`/auctions/${auctionId}`)).auction.status, 'completed');
    const sponsorable = (await action(provider, 'addMaterialAction', { projectId: project.id, type: 'brick', quantityT: 2, quantityRangeT: [2, 2], condition: 'good', grade: 'B', confidence: 1, evidence: [] })).result;
    await provider('/monetization/sponsorship', 'POST', { materialId: sponsorable.id, days: 7 }, 201);
    await action(provider, 'deleteMaterialAction', sponsorable.id);
    const refundRequired = await waitFor(() => provider('/monetization/me'), value => value.attempts.some(item => item.productType === 'sponsored_listing' && item.targetId?.startsWith(`${sponsorable.id}:`) && item.status === 'refunded'));
    assert.ok(refundRequired.attempts.some(item => item.productType === 'sponsored_listing' && item.targetId?.startsWith(`${sponsorable.id}:`) && ['refund_pending', 'refunded'].includes(item.status)));
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
});
