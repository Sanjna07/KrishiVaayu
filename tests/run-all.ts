import { execSync } from 'child_process';

const testFiles = [
  'tests/domain.test.ts',
  'tests/weather.test.ts',
  'tests/alternatives.test.ts',
  'tests/resilience.test.ts',
  'tests/market.test.ts',
  'tests/repo.test.ts',
  'tests/api-matrix.test.ts',
  'tests/lifecycle.test.ts',
  'tests/whatsapp-integration.test.ts',
  'tests/demand-signal.test.ts',
  'tests/csv.test.ts',
  'tests/reports.test.ts',
  'tests/sms.test.ts',
  'tests/geo-reverse.test.ts',
  'tests/sarvam-voice.test.ts',
];

console.log(`Starting KrishiVayu test suite (${testFiles.length} suites)...`);

for (const file of testFiles) {
  try {
    execSync(`npx tsx ${file}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Test failed: ${file}`);
    process.exit(1);
  }
}

console.log('\n========================================');
console.log('🎉 ALL 15 TEST SUITES PASSED SUCCESSFULLY!');
console.log('========================================\n');
