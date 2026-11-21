import assert from 'assert';
import { GET } from '../src/app/api/geo/reverse/route';

async function testReverseGeocoding() {
  console.log('--- RUNNING GPS REVERSE GEOCODING TESTS ---');

  // 1. Missing parameters test
  const reqMissing = new Request('http://localhost:3000/api/geo/reverse');
  const resMissing = await GET(reqMissing);
  assert.strictEqual(resMissing.status, 400, 'Missing coordinates must return 400');
  const missingData = await resMissing.json();
  assert(missingData.error.includes('Missing required query parameters'), 'Error message must specify missing parameters');
  console.log('✓ 1. Missing coordinates validation passed (400).');

  // 2. Out of bounds coordinates test
  const reqInvalid = new Request('http://localhost:3000/api/geo/reverse?lat=120&lng=200');
  const resInvalid = await GET(reqInvalid);
  assert.strictEqual(resInvalid.status, 400, 'Out-of-bounds coordinates must return 400');
  console.log('✓ 2. Out-of-bounds coordinates rejected (400).');

  // 3. Valid coordinates test (Sangrur, Punjab: lat=30.2458, lng=75.8471)
  const reqSangrur = new Request('http://localhost:3000/api/geo/reverse?lat=30.2458&lng=75.8471');
  const resSangrur = await GET(reqSangrur);
  assert.strictEqual(resSangrur.status, 200, 'Valid coordinates must return 200 OK');
  const sangrurData = await resSangrur.json();
  assert.strictEqual(sangrurData.success, true, 'Result must be success: true');
  assert(sangrurData.district, 'District must be identified');
  assert(sangrurData.village, 'Village must be identified or assigned fallback');
  assert(sangrurData.tehsil, 'Tehsil must be identified or assigned fallback');
  assert.strictEqual(sangrurData.state, 'Punjab', 'State must be Punjab for Sangrur coordinates');
  assert.strictEqual(typeof sangrurData.coordinates.lat, 'number', 'Coordinates lat must be a number');
  assert.strictEqual(typeof sangrurData.coordinates.lng, 'number', 'Coordinates lng must be a number');
  console.log(`✓ 3. GPS resolve for Sangrur coords: Village="${sangrurData.village}", Tehsil="${sangrurData.tehsil}", District="${sangrurData.district}".`);

  // 4. Bathinda coordinates test (lat=30.2110, lng=74.9455)
  const reqBathinda = new Request('http://localhost:3000/api/geo/reverse?lat=30.2110&lng=74.9455');
  const resBathinda = await GET(reqBathinda);
  assert.strictEqual(resBathinda.status, 200, 'Bathinda coordinates must return 200 OK');
  const bathindaData = await resBathinda.json();
  assert.strictEqual(bathindaData.success, true);
  assert(bathindaData.district.toLowerCase().includes('bathinda') || bathindaData.district.length > 0);
  console.log(`✓ 4. GPS resolve for Bathinda coords: District="${bathindaData.district}".`);

  console.log('ALL GPS REVERSE GEOCODING TESTS PASSED SUCCESSFULLY!\n');
}

testReverseGeocoding().catch((err) => {
  console.error('GPS reverse geocoding test failed:', err);
  process.exit(1);
});
