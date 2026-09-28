// Derleme kapısı: her iş akışı Mermaid 10.9, 11.17 ve 12.0 ile ayrıştırılmalı.
// Hata varsa süreç 1 ile çıkar; rapor src/data/generated/mermaid-report.json dosyasına yazılır.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadParsers, MERMAID_TARGETS } from './lib/mermaid-multi.mjs';

const GEN = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'generated');
const require = createRequire(import.meta.url);
const { workflows } = JSON.parse(readFileSync(join(GEN, 'workflows.json'), 'utf8'));
const parsers = await loadParsers();
const versions = {};
for (const [k, v] of Object.entries(MERMAID_TARGETS)) {
  versions[k] = { label: v.label, exact: require(`${v.pkg}/package.json`).version, ok: 0, fail: 0 };
}
const failures = [];
const byType = {};
const t0 = Date.now();
for (const w of workflows) {
  byType[w.diagram] = (byType[w.diagram] ?? 0) + 1;
  for (const [v, parse] of Object.entries(parsers)) {
    const err = await parse(w.mermaid);
    if (err) { versions[v].fail++; failures.push({ id: w.id, version: v, error: err }); } else versions[v].ok++;
  }
}
const report = { checkedAt: new Date().toISOString(), durationMs: Date.now() - t0, total: workflows.length, byType, versions, failures };
writeFileSync(join(GEN, 'mermaid-report.json'), JSON.stringify(report, null, 2));
for (const [k, v] of Object.entries(versions)) console.log(`  mermaid ${v.exact.padEnd(8)} ✓ ${v.ok}  ✗ ${v.fail}`);
if (failures.length) {
  console.error(`\n${failures.length} ayrıştırma hatası:`);
  failures.slice(0, 20).forEach((f) => console.error(`  ${f.id} @${f.version}: ${f.error}`));
  process.exit(1);
}
console.log(`Bütün ${workflows.length} diyagram üç ana sürümde geçerli (${report.durationMs} ms).`);
