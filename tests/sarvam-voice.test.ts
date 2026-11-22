import assert from 'assert';
import { extractEntitiesFromTranscript } from '../src/lib/sarvamEntityExtractor';
import { POST } from '../src/app/api/ai/sarvam/voice-fill/route';

async function testSarvamVoicePipeline() {
  console.log('--- RUNNING SARVAM AI VOICE EXTRACTION TESTS ---');

  // 1. Test Hindi transcript entity extraction (Standard Farmer Voice)
  const transcript1 =
    'मेरे पास 250 क्विंटल पराली की गांठें हैं। गांव लड्डा, तहसील धूरी, जिला संगरूर में। रेट 210 रुपये प्रति क्विंटल है और पराली सूखी है।';
  const ext1 = extractEntitiesFromTranscript(transcript1);

  assert.strictEqual(ext1.quantityQuintals, 250, 'Quantity should be 250 quintals');
  assert.strictEqual(ext1.form, 'baled', 'Form should be baled (गांठें)');
  assert.strictEqual(ext1.district, 'Sangrur', 'District should be Sangrur');
  assert.strictEqual(ext1.tehsil, 'Dhuri', 'Tehsil should be Dhuri');
  assert.strictEqual(ext1.village, 'Ladda', 'Village should be Ladda');
  assert.strictEqual(ext1.askingPricePerQuintal, 210, 'Asking price should be 210');
  console.log('✓ 1. Standard Hindi transcript extraction verified (250 Qtl, baled, Ladda/Dhuri/Sangrur, ₹210/Qtl).');

  // 2. Test Loose straw + Punjabi/Hindi mix + Acreage
  const transcript2 =
    'ਸਾਡੇ ਕੋਲ 10 एकड़ खुली धान पराली है, गांव चीमा, जिला बठिंडा। भाव दो सौ रुपये।';
  const ext2 = extractEntitiesFromTranscript(transcript2);

  assert.strictEqual(ext2.form, 'loose', 'Form should be loose (खुली)');
  assert.strictEqual(ext2.district, 'Bathinda', 'District should be Bathinda (बਠਿੰਡਾ)');
  assert.strictEqual(ext2.village, 'Cheema', 'Village should be Cheema (चीमा)');
  assert.strictEqual(ext2.quantityQuintals, 250, '10 acres * 25 should calculate 250 quintals');
  assert.strictEqual(ext2.askingPricePerQuintal, 200, 'Price should be 200 from दो सौ');
  console.log('✓ 2. Loose straw & acreage conversion verified (10 acres -> 250 Qtl, Bathinda).');

  // 3. Test API Route POST /api/ai/sarvam/voice-fill with JSON transcript
  const reqJson = new Request('http://localhost:3000/api/ai/sarvam/voice-fill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: transcript1 }),
  });
  const resJson = await POST(reqJson);
  assert.strictEqual(resJson.status, 200, 'POST with valid JSON must return 200 OK');
  const resData = await resJson.json();
  assert.strictEqual(resData.success, true, 'Result must be success: true');
  assert.strictEqual(resData.extracted.quantityQuintals, 250, 'API response must contain extracted quantity');
  assert.strictEqual(resData.extracted.district, 'Sangrur', 'API response must contain extracted district');
  console.log('✓ 3. API Route POST /api/ai/sarvam/voice-fill verified with 200 OK.');

  // 4. Test Resilient Fallback without API key
  const reqDefault = new Request('http://localhost:3000/api/ai/sarvam/voice-fill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const resDefault = await POST(reqDefault);
  assert.strictEqual(resDefault.status, 200, 'Default fallback must return 200 OK');
  const defaultData = await resDefault.json();
  assert.strictEqual(defaultData.success, true);
  assert(defaultData.transcript.length > 0, 'Must provide default simulated transcript');
  console.log('✓ 4. Resilient fallback verified when no audio/transcript is provided.');

  // 5. Test Targeted / Missing Field Only Extraction
  const qtyOnly = extractEntitiesFromTranscript('मात्रा 400 क्विंटल');
  assert(qtyOnly.detectedFields.includes('quantity'), 'Must detect quantity field');
  assert.strictEqual(qtyOnly.quantityQuintals, 400, 'Quantity must be 400');
  assert(!qtyOnly.detectedFields.includes('price'), 'Should not detect price when not spoken');

  const priceOnly = extractEntitiesFromTranscript('रेट 220 रुपये प्रति क्विंटल');
  assert(priceOnly.detectedFields.includes('price'), 'Must detect price field');
  assert.strictEqual(priceOnly.askingPricePerQuintal, 220, 'Price must be 220');

  const villageOnly = extractEntitiesFromTranscript('गांव चीमा');
  assert(villageOnly.detectedFields.includes('village'), 'Must detect village field');
  assert.strictEqual(villageOnly.village, 'Cheema', 'Village must be Cheema');
  console.log('✓ 5. Targeted single-field incremental extraction verified (quantity-only, price-only, village-only).');

  // 6. Test Hinglish user transcript from live Sarvam AI
  const liveTranscript =
    'Dhaan 250 quintal kaanthe bani hui, gaon mera Ludhiana hai, jila Dhuri aur main rate 200 prati quintal sukhi parali ke hisab se bechna chahungi.';
  const extLive = extractEntitiesFromTranscript(liveTranscript);
  assert.strictEqual(extLive.quantityQuintals, 250, 'Live quantity must be 250');
  assert.strictEqual(extLive.form, 'baled', 'Form should be baled from "kaanthe"');
  assert.strictEqual(extLive.askingPricePerQuintal, 200, 'Asking price must be 200 from "rate 200 prati quintal"');
  assert.strictEqual(extLive.village, 'Ludhiana', 'Village should be Ludhiana from "gaon mera Ludhiana"');
  assert.strictEqual(extLive.tehsil, 'Dhuri', 'Tehsil should be Dhuri');
  assert(extLive.detectedFields.includes('price'), 'Must detect price');
  assert(extLive.detectedFields.includes('form'), 'Must detect form');
  assert(extLive.detectedFields.includes('village'), 'Must detect village');
  console.log('✓ 6. Live Hinglish transcript verified (rate 200, 250 Qtl, kaanthe/baled, gaon Ludhiana, tehsil Dhuri).');

  console.log('ALL SARVAM AI VOICE PIPELINE TESTS PASSED SUCCESSFULLY!\n');
}

testSarvamVoicePipeline().catch((err) => {
  console.error('Sarvam voice test failed:', err);
  process.exit(1);
});
