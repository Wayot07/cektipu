// Unit test for buildResultShareText (src/lib/share.ts).
// Run from the repo root:
//   npx tsc src/lib/share.ts --ignoreConfig --outDir /tmp/share-test-out --module commonjs --target es2022 --skipLibCheck
//   node scripts/test-share-text.cjs
const { buildResultShareText } = require('/tmp/share-test-out/lib/share.js');

const make = (verdict, score, nFlags, source) => ({
  verdict: {
    verdict,
    score,
    summary: 'Ringkasan uji. / Test summary.',
    redFlags: Array.from({ length: nFlags }, (_, i) => ({
      quote: `kutipan ${i + 1}`,
      reason: 'alasan',
    })),
    suggestedReply: 'Balasan aman.',
  },
  inferenceSource: source,
  privacyMode: false,
});

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL: ${name}`);
  }
}

for (const lang of ['id', 'en']) {
  const scam = buildResultShareText(make('scam', 87, 3, 'on_device'), lang);
  check(`${lang} scam: label`, lang === 'id' ? scam.includes('PENIPUAN') : scam.includes('SCAM'));
  check(`${lang} scam: score`, scam.includes('87/100'));
  check(`${lang} scam: summary`, scam.includes('Ringkasan uji.'));
  check(`${lang} scam: flags=3`, lang === 'id' ? scam.includes('3 ditemukan') : scam.includes('3 found'));
  check(`${lang} scam: source on-device`, /on-device \(Gemini Nano\)/i.test(scam));
  check(`${lang} scam: 4 lines`, scam.split('\n').length === 4);

  const safe = buildResultShareText(make('likely-safe', 12, 0, 'in_cloud'), lang);
  check(`${lang} safe: label`, lang === 'id' ? safe.includes('KEMUNGKINAN AMAN') : safe.includes('LIKELY SAFE'));
  check(`${lang} safe: flags=0`, lang === 'id' ? safe.includes('0 ditemukan') : safe.includes('0 found'));
  check(`${lang} safe: source cloud`, /cloud \(Gemini Flash-Lite\)/i.test(safe));

  const susp = buildResultShareText(make('suspicious', 55, 1, 'in_cloud'), lang);
  check(`${lang} suspicious: label`, lang === 'id' ? susp.includes('MENCURIGAKAN') : susp.includes('SUSPICIOUS'));
  check(`${lang} suspicious: score 55`, susp.includes('55/100'));
}

console.log(`share-text test: ${pass} passed, ${fail} failed`);
console.log('--- sample (id, scam, on-device) ---');
console.log(buildResultShareText(make('scam', 87, 3, 'on_device'), 'id'));
process.exit(fail ? 1 : 0);
