import assert from 'assert';
import { marketRepo } from '../src/lib/repo/marketRepo';
import { POST as postReportRoute, GET as getReportsRoute } from '../src/app/api/market/reports/route';

console.log('--- RUNNING TWO-WAY REPORTING & ANTI-SPAM TESTS ---');

async function testReportingSystem() {
  await marketRepo.clear();

  // Create a sample test listing
  const sampleListing = await marketRepo.createListing({
    id: 'test_listing_rep_1',
    village: 'Dhuri',
    district: 'Sangrur',
    state: 'Punjab',
    quantityQuintals: 200,
    form: 'baled',
    availability: { startDate: '2026-11-20', endDate: '2026-11-28' },
    askingPricePerQuintal: 210,
    phone: '9876543210',
    editTokenHash: 'dummy_hash',
    status: 'listed',
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 1. Buyer reports Farmer Listing
  const rep1 = await marketRepo.createReport({
    reporterType: 'buyer',
    reporterId: 'buyer_abc',
    targetType: 'farmer',
    targetId: sampleListing.id,
    targetName: 'Dhuri Listing',
    reason: 'fake_listing_or_bid',
    notes: 'Called farmer and number was unreachable',
  });

  assert.strictEqual(rep1.duplicate, false);
  assert.strictEqual(rep1.flagged, false);
  assert.strictEqual(rep1.report.reporterId, 'buyer_abc');
  assert.strictEqual(rep1.report.targetId, sampleListing.id);
  console.log('✓ 1. Valid report created: Buyer -> Farmer Listing.');

  // 2. Duplicate Report from same buyer is rejected
  const repDuplicate = await marketRepo.createReport({
    reporterType: 'buyer',
    reporterId: 'buyer_abc',
    targetType: 'farmer',
    targetId: sampleListing.id,
    reason: 'fake_listing_or_bid',
  });
  assert.strictEqual(repDuplicate.duplicate, true);
  console.log('✓ 2. Anti-spam: Duplicate report from same reporter blocked.');

  // 3. Farmer reports Buyer
  const repBuyer = await marketRepo.createReport({
    reporterType: 'farmer',
    reporterId: sampleListing.id,
    targetType: 'buyer',
    targetId: 'buyer_xyz',
    targetName: 'XYZ Aggregators',
    reason: 'no_show_pickup',
    notes: 'Buyer did not send trailer at agreed pickup date',
  });
  assert.strictEqual(repBuyer.duplicate, false);
  assert.strictEqual(repBuyer.report.targetId, 'buyer_xyz');
  console.log('✓ 3. Valid report created: Farmer -> Buyer.');

  // 4. Threshold auto-flagging: 3 reports does not flag yet, 4th report (> 3) triggers auto-flag
  const rep2 = await marketRepo.createReport({
    reporterType: 'buyer',
    reporterId: 'buyer_2',
    targetType: 'farmer',
    targetId: sampleListing.id,
    reason: 'incorrect_quantity_quality',
  });
  assert.strictEqual(rep2.flagged, false);

  const rep3 = await marketRepo.createReport({
    reporterType: 'buyer',
    reporterId: 'buyer_3',
    targetType: 'farmer',
    targetId: sampleListing.id,
    reason: 'unresponsive_contact',
  });
  assert.strictEqual(rep3.flagged, false);

  // 4th report from distinct reporter -> threshold exceeded (> 3)
  const rep4 = await marketRepo.createReport({
    reporterType: 'buyer',
    reporterId: 'buyer_4',
    targetType: 'farmer',
    targetId: sampleListing.id,
    reason: 'fake_listing_or_bid',
  });
  assert.strictEqual(rep4.flagged, true);
  console.log('✓ 4. Auto-flagging triggered on 4th report (> 3 threshold).');

  // Verify listing in repo is now flagged
  const updatedListing = await marketRepo.getListingById(sampleListing.id);
  assert.strictEqual(updatedListing?.isFlagged, true);
  assert.strictEqual(updatedListing?.reportCount, 4);
  console.log('✓ 5. Listing record updated with isFlagged: true and reportCount: 4.');

  // 6. Test API Route: POST /api/market/reports
  const apiReq = new Request('http://localhost:3000/api/market/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.99' },
    body: JSON.stringify({
      reporterType: 'buyer',
      reporterId: 'buyer_api_test',
      targetType: 'farmer',
      targetId: 'test_listing_api',
      reason: 'inappropriate_behavior',
      notes: 'Rude interaction',
    }),
  });
  const apiRes = await postReportRoute(apiReq);
  assert.strictEqual(apiRes.status, 201);
  const apiData = await apiRes.json();
  assert.strictEqual(apiData.success, true);
  console.log('✓ 6. API Route POST /api/market/reports returned 201 Created.');

  // Duplicate via API Route -> 409
  const dupApiReq = new Request('http://localhost:3000/api/market/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.99' },
    body: JSON.stringify({
      reporterType: 'buyer',
      reporterId: 'buyer_api_test',
      targetType: 'farmer',
      targetId: 'test_listing_api',
      reason: 'inappropriate_behavior',
    }),
  });
  const dupApiRes = await postReportRoute(dupApiReq);
  assert.strictEqual(dupApiRes.status, 409);
  console.log('✓ 7. Duplicate submission via API Route returned 409 Conflict.');

  // Invalid reason -> 400
  const invalidReasonReq = new Request('http://localhost:3000/api/market/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.99' },
    body: JSON.stringify({
      reporterType: 'buyer',
      reporterId: 'buyer_api_test_2',
      targetType: 'farmer',
      targetId: 'test_listing_api',
      reason: 'not_a_valid_reason',
    }),
  });
  const invalidRes = await postReportRoute(invalidReasonReq);
  assert.strictEqual(invalidRes.status, 400);
  console.log('✓ 8. Invalid reason rejected with 400 Bad Request.');

  // GET reports by targetId
  const getReq = new Request(`http://localhost:3000/api/market/reports?targetId=${sampleListing.id}`);
  const getRes = await getReportsRoute(getReq);
  assert.strictEqual(getRes.status, 200);
  const getData = await getRes.json();
  assert.strictEqual(getData.count, 4);
  assert.strictEqual(getData.isFlagged, true);
  console.log('✓ 9. GET /api/market/reports returned 4 reports and isFlagged: true.');

  console.log('ALL TWO-WAY REPORTING SYSTEM TESTS PASSED SUCCESSFULLY!');
}

testReportingSystem().catch((err) => {
  console.error('Reporting test failed:', err);
  process.exit(1);
});
