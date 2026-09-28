/**
 * İş akışlarını üretir: src/data/generated/workflows.json
 * Aynı üretici kod uygulamada da (akış üreticisi sayfası) kullanılır; tek kaynak.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAll } from '../src/lib/workflows/index';
import type { Claim, Edge, Meta, Tool, Topic } from '../src/data/types';

const GEN = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'generated');
const read = <T,>(n: string): T => JSON.parse(readFileSync(join(GEN, n), 'utf8')) as T;

const input = { tools: read<Tool[]>('tools.json'), meta: read<Meta>('meta.json'), topics: read<Topic[]>('topics.json'), claims: read<Claim[]>('claims.json') };
const out = generateAll(input, read<Edge[]>('edges.json'));
writeFileSync(join(GEN, 'workflows.json'), JSON.stringify(out));
console.log(`İş akışı: ${out.workflows.length} · aile: ${out.families.length}`);
for (const f of out.families) console.log(`  ${String(f.count).padStart(4)}  ${f.name}`);
