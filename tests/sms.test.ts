import assert from 'assert';
import {
  normalizeIndianPhone,
  sendFast2Sms,
  sendFarmerListingCreatedSms,
  sendFarmerNewOfferSms,
  sendBuyerOfferAcceptedSms,
  sendBuyerOfferDeclinedSms,
  sendResidueCollectedSms,
} from '../src/lib/services/smsService';

console.log('--- RUNNING FAST2SMS NOTIFICATION PIPELINE TESTS ---');

async function testSmsPipeline() {
  // 1. Phone Normalization tests
  assert.strictEqual(normalizeIndianPhone('9876543210'), '9876543210');
  assert.strictEqual(normalizeIndianPhone('+919876543210'), '9876543210');
  assert.strictEqual(normalizeIndianPhone('919876543210'), '9876543210');
  assert.strictEqual(normalizeIndianPhone('09876543210'), '9876543210');
  assert.strictEqual(normalizeIndianPhone('98765-43210'), '9876543210');
  assert.strictEqual(normalizeIndianPhone(' 98765 43210 '), '9876543210');
  assert.strictEqual(normalizeIndianPhone('12345'), null);
  assert.strictEqual(normalizeIndianPhone('abcdefghij'), null);
  assert.strictEqual(normalizeIndianPhone('1234567890'), null, 'Must start with 6-9');
  console.log('✓ 1. Phone number normalization and Indian mobile regex passed.');

  // 2. Mock mode execution (safe fallback when FAST2SMS_API_KEY is unset)
  const savedKey = process.env.FAST2SMS_API_KEY;
  delete process.env.FAST2SMS_API_KEY;

  const mockRes = await sendFast2Sms('9876543210', 'Test message');
  assert.strictEqual(mockRes.success, true);
  assert.strictEqual(mockRes.isMock, true);
  console.log('✓ 2. Safe mock fallback operates without throwing errors when key is unset.');

  // 3. Event 1: Farmer Listing Created (contains private recovery dashboard link)
  const listSms = await sendFarmerListingCreatedSms({
    phone: '9876543210',
    listingId: 'list_123',
    village: 'Cheema',
    quantityQuintals: 250,
    editToken: 'token_abc_123',
  });
  assert.strictEqual(listSms.success, true);
  console.log('✓ 3. Event 1 (Listing Created -> Farmer Recovery SMS) verified.');

  // 4. Event 2: New Offer Received (contains offer rate & direct dashboard link)
  const offerSms = await sendFarmerNewOfferSms({
    farmerPhone: '9876543210',
    listingId: 'list_123',
    village: 'Cheema',
    buyerName: 'Malwa Green Energy',
    pricePerQuintal: 215,
    quantityQuintals: 250,
    editToken: 'token_abc_123',
  });
  assert.strictEqual(offerSms.success, true);
  console.log('✓ 4. Event 2 (New Offer Received -> Farmer Alert SMS) verified.');

  // 5. Event 3: Offer Accepted (contains farmer contact for buyer)
  const acceptSms = await sendBuyerOfferAcceptedSms({
    buyerPhone: '9811100001',
    listingId: 'list_123',
    village: 'Cheema',
    pricePerQuintal: 215,
    farmerPhone: '9876543210',
  });
  assert.strictEqual(acceptSms.success, true);
  console.log('✓ 5. Event 3 (Offer Accepted -> Buyer Pickup SMS) verified.');

  // 6. Event 4: Offer Declined (polite notification to buyer)
  const declineSms = await sendBuyerOfferDeclinedSms({
    buyerPhone: '9811100001',
    listingId: 'list_123',
    village: 'Cheema',
    pricePerQuintal: 215,
  });
  assert.strictEqual(declineSms.success, true);
  console.log('✓ 6. Event 4 (Offer Declined -> Buyer SMS) verified.');

  // 7. Event 5: Residue Collected / Order Confirmed (both Farmer & Buyer)
  const collectedSms = await sendResidueCollectedSms({
    farmerPhone: '9876543210',
    buyerPhone: '9811100001',
    listingId: 'list_123',
    village: 'Cheema',
    quantityQuintals: 250,
  });
  assert.strictEqual(collectedSms.farmerResult?.success, true);
  assert.strictEqual(collectedSms.buyerResult?.success, true);
  console.log('✓ 7. Event 5 (Residue Collected -> Both Farmer & Buyer SMS) verified.');

  // Restore environment variable
  if (savedKey) process.env.FAST2SMS_API_KEY = savedKey;

  console.log('ALL FAST2SMS PIPELINE TESTS PASSED SUCCESSFULLY!');
}

testSmsPipeline().catch((err) => {
  console.error('Fast2SMS test failed:', err);
  process.exit(1);
});
