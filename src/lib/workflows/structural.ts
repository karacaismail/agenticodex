/**
 * Aile 2 (konu kararı), 3 (altın küme hattı), 13 (topluluk hattı), 15 (geçiş kapısı).
 */
import type { Tool, Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { BUCKET_SCHEMES } from '../presets';
import { evaluate } from '../rules';
import { Recorder, styled, wf, toolName, layerName, type GenInput } from './common';

const STATUS_TR: Record<string, string> = { supported: 'destekli', unverified: 'doğrulanmamış', disputed: 'itirazlı', rejected: 'reddedilmiş' };

/* ---------------------------------------------------------------- konu kararı (R01–R28) */
export function topicFamily(input: GenInput): Workflow[] {
  return input.topics.map((tp) => {
    const f = new Flow('LR');
    const r = new Recorder();
    const seg = input.meta.segments.find((s) => s.id === tp.segment);
    const s = f.node(`${tp.id} · ${tp.short}\nSegment ${tp.segment}`, 'stadium', 'start');
    const q = f.node(tp.question, 'rect', 'data');
    r.add('Ana soru', tp.question);
    f.edge(s, q);
    const inputs = input.meta.tracks.filter((t) => t.topics.includes(tp.id));
    const deps = Array.from(new Set(inputs.flatMap((t) => t.topics))).filter((x) => x !== tp.id).slice(0, 5);
    if (deps.length) {
      const d = f.node(`Birlikte ele alınacak: ${deps.join(', ')}`, 'rect', 'muted');
      f.edge(d, q, 'girdi', 'dotted');
      r.add('Bağımlı konular', deps.join(', '), 'Aynı araştırma hattında yer alıyor');
    }
    const subIds: string[] = [];
    f.subgraph('Alt sorular', (g) => {
      tp.subQuestions.forEach((sq, i) => subIds.push(g.node(`${i + 1}. ${sq}`, 'rect')));
    });
    subIds.forEach((id) => f.edge(q, id));
    tp.subQuestions.forEach((sq, i) => r.add(`Alt soru ${i + 1}`, sq));
    const st = tp.claimStatus;
    const ev = f.node(`Kanıt: ${tp.claimCount} iddia\n${Object.entries(st).map(([k, v]) => `${STATUS_TR[k] ?? k} ${v}`).join(' · ') || 'eşleşen iddia yok'}`, 'db', 'data');
    subIds.forEach((id) => f.edge(id, ev));
    r.add('Kanıtı topla', `${tp.claimCount} iddia bu konuya eşlendi.`);
    const cand = tp.tools.slice(0, 5);
    let toolsNode: string | null = null;
    if (cand.length) {
      toolsNode = f.node(`Aday araçlar: ${cand.map((c) => toolName(input, c)).join(', ')}`, 'rect', 'tool');
      f.edge(ev, toolsNode);
      r.add('Adayları karşılaştır', cand.map((c) => toolName(input, c)).join(', '));
    }
    const open = f.node(tp.openCheck ? `Açık doğrulama: ${tp.openCheck}` : 'Açık doğrulamayı tanımla', 'rect', 'warn');
    f.edge(toolsNode ?? ev, open);
    r.add('Açık doğrulama', tp.openCheck || 'Kanıt eksiğini somut bir deneye çevir.');
    const out = f.node(`Beklenen çıktı: ${tp.expected}`, 'sub', 'gate');
    f.edge(open, out);
    r.add('Beklenen çıktıyı üret', tp.expected);
    const dec = f.node('Kanıt kararı değiştirecek kadar güçlü mü?', 'decision', 'decide');
    const end = f.node(`Karar özeti → ${inputs.map((t) => t.name).join(', ') || 'program'}`, 'stadium', 'end');
    const again = f.node('Koşullu karar + yeniden değerlendirme tetikleyicisi', 'rect', 'warn');
    f.edge(out, dec).edge(dec, end, 'evet').edge(dec, again, 'hayır').edge(again, end);
    r.add('Karar özeti', 'Hangi kanıt gelirse kararın değişeceğini yaz (brief §7).');
    styled(f, ['start', 'end', 'decide', 'warn', 'data', 'gate', 'tool', 'muted']);
    return wf({
      id: `konu-${tp.id.toLowerCase()}`,
      title: `${tp.id} · ${tp.title}`,
      family: 'konu-karar',
      diagram: 'flowchart',
      summary: `Segment ${tp.segment}${seg ? ` (${seg.title})` : ''}. Ana soru → dört alt soru → ${tp.claimCount} iddialık kanıt → aday araçlar → açık doğrulama → beklenen çıktı → koşullu karar.`,
      mermaid: f.toString(),
      steps: r.steps,
      conditions: [deps.length ? `Aynı hatta ${deps.length} bağımlı konu var` : 'Bağımsız konu', tp.claimCount ? `${tp.claimCount} iddia eşlendi` : 'Eşleşen iddia yok: kanıt boşluğu'],
      tools: cand,
      topics: [tp.id, ...deps],
      tags: ['araştırma', `segment-${tp.segment.toLowerCase()}`],
    }, input);
  });
}

/* ---------------------------------------------------------------- altın küme hattı */
export function goldenFamily(input: GenInput): Workflow[] {
  const byId = new Map(input.tools.map((t) => [t.id, t]));
  return input.meta.golden.map((g) => {
    const members = g.members.map((m) => byId.get(m)!).filter(Boolean);
    const core = members.filter((t) => t.stance === 'Çekirdek aday' || t.stance === 'Prototip adayı').slice(0, 6);
    const optional = members.filter((t) => t.stance === 'Seçimli').slice(0, 5);
    const ref = members.filter((t) => t.stance === 'Referans' || t.stance === 'Ertele/Kaçın').slice(0, 4);
    const f = new Flow('LR');
    const r = new Recorder();
    const s = f.node(`${g.id} · ${g.name}`, 'stadium', 'start');
    const job = f.node(g.job, 'rect', 'data');
    f.edge(s, job);
    r.add('İşi tanımla', g.job);
    const coreIds: string[] = [];
    if (core.length) {
      f.subgraph('Çekirdek ve prototip adayları', (sg) => core.forEach((t) => coreIds.push(sg.node(`${t.name}\n${t.ring} · kanıt ${t.evidence ?? '—'}`, 'rect', 'tool'))));
      coreIds.forEach((id) => f.edge(job, id));
      r.add('Çekirdek adayları karşılaştır', core.map((t) => t.name).join(', '));
    }
    const pick = f.node('Tek ana seçim yap; diğerlerini yedek tut', 'decision', 'decide');
    (coreIds.length ? coreIds : [job]).forEach((id) => f.edge(id, pick));
    r.add('Tek ana seçim', 'Aynı katmanda iki aracı birlikte çalıştırma; birini yedek bırak.');
    if (optional.length) {
      const optIds: string[] = [];
      f.subgraph('Seçimli / tamamlayıcı', (sg) => optional.forEach((t) => optIds.push(sg.node(t.name, 'rect', 'muted'))));
      optIds.forEach((id) => f.edge(pick, id, 'gerekirse', 'dotted'));
      r.add('Gerekirse tamamlayıcı ekle', optional.map((t) => t.name).join(', '), 'Ölçülen ihtiyaç varsa');
    }
    if (ref.length) {
      const refN = f.node(`Referans / ertelenen: ${ref.map((t) => t.name).join(', ')}`, 'rect', 'muted');
      f.edge(job, refN, 'bilgi', 'dotted');
      r.add('Referansları oku', ref.map((t) => t.name).join(', '));
    }
    const test = f.node('Kümenin kabul testleri: aynı senaryo, aynı veri', 'sub', 'gate');
    const done = f.node('Yetenek ürüne bağlandı', 'stadium', 'end');
    f.edge(pick, test).edge(test, done);
    r.add('Kabul testleri', 'Aynı senaryo ve veriyle; demo görüntüsüyle değil.');
    styled(f, ['start', 'end', 'decide', 'data', 'gate', 'tool', 'muted']);
    return wf({
      id: `altin-${g.id.toLowerCase()}`,
      title: `${g.name} · Altın küme hattı`,
      family: 'altin-hat',
      diagram: 'flowchart',
      summary: `${g.ring === 'core' ? 'Çekirdek' : 'Destek'} küme: ${members.length} üye. ${core.length} çekirdek/prototip adayı arasından tek ana seçim, ${optional.length} tamamlayıcı ve ${ref.length} referans.`,
      mermaid: f.toString(),
      steps: r.steps,
      conditions: [core.length ? 'Çekirdek aday bulunduğu için karşılaştırma alt grafiği eklendi' : 'Çekirdek aday yok: doğrudan iş tanımından seçim'],
      tools: [...core, ...optional, ...ref].map((t) => t.id),
      golden: [g.id],
      topics: Array.from(new Set(members.flatMap((t) => t.rTopics))).slice(0, 6),
      tags: ['altın-küme', g.ring],
    }, input);
  });
}

/* ---------------------------------------------------------------- birlikte anılma topluluğu */
export function communityFamily(input: GenInput, edges: { a: string; b: string; w: number; c: number }[]): Workflow[] {
  const byId = new Map(input.tools.map((t) => [t.id, t]));
  const layerOrder = input.meta.layers.map((l) => l.id);
  return input.meta.communities.map((c) => {
    const members = c.members.map((m) => byId.get(m)!).filter(Boolean).slice(0, 18);
    const ids = new Set(members.map((m) => m.id));
    const f = new Flow('LR');
    const r = new Recorder();
    const nodeOf = new Map<string, string>();
    const layers = layerOrder.filter((l) => members.some((m) => m.layer === l));
    layers.forEach((l) => {
      f.subgraph(layerName(input, l), (g) => {
        members.filter((m) => m.layer === l).forEach((m) => nodeOf.set(m.id, g.node(m.name, 'rect', 'tool')));
      });
      r.add(`Katman: ${layerName(input, l)}`, members.filter((m) => m.layer === l).map((m) => m.name).join(', '));
    });
    const inner = edges.filter((e) => ids.has(e.a) && ids.has(e.b)).sort((a, b) => b.w - a.w).slice(0, 22);
    inner.forEach((e) => {
      const [a, b] = layerOrder.indexOf(byId.get(e.a)!.layer) <= layerOrder.indexOf(byId.get(e.b)!.layer) ? [e.a, e.b] : [e.b, e.a];
      f.edge(nodeOf.get(a)!, nodeOf.get(b)!, `${e.c} paragraf`, e.w > 0.25 ? 'thick' : 'solid');
    });
    r.add('En güçlü bağlar', inner.length ? inner.slice(0, 5).map((e) => `${toolName(input, e.a)} ↔ ${toolName(input, e.b)} (${e.c})`).join('; ') : 'Kenar verisi verilmedi');
    r.add('Altın kümeyle karşılaştır', `Baskın altın küme: ${input.meta.golden.find((g) => g.id === c.dominantGolden)?.name ?? c.dominantGolden}. Farklı kümeden gelen üyeler gizli bağımlılık işaretidir.`);
    styled(f, ['tool']);
    return wf({
      id: `topluluk-${c.id.toLowerCase()}`,
      title: `${c.id} · ${c.name} · Birlikte çalışma hattı`,
      family: 'topluluk',
      diagram: 'flowchart',
      summary: `Raporlarda aynı paragrafta geçen ${c.members.length} varlıktan oluşan veri güdümlü topluluk; katmanlar yukarıdan aşağı sıralandı, kenarlar birlikte anılma sayısını gösterir (yoğunluk ${c.density}).`,
      mermaid: f.toString(),
      steps: r.steps,
      conditions: [`Kenar eşiği: en az 3 ortak paragraf; kalın çizgi kosinüs ağırlığı > 0,25`],
      tools: members.map((m) => m.id),
      golden: [c.dominantGolden],
      tags: ['topluluk', 'veri-güdümlü'],
    }, input);
  });
}

/* ---------------------------------------------------------------- geçiş kapıları A–F */
export function gateFamily(input: GenInput): Workflow[] {
  const scheme = BUCKET_SCHEMES.find((s) => s.id === 'gecis-kapilari')!;
  const gates = input.meta.synthesis.gates;
  return gates.map((g, i) => {
    const bucket = scheme.buckets.find((b) => b.id === g.id);
    const members: Tool[] = bucket ? input.tools.filter((t) => evaluate(bucket.rule, t) && (t.stance === 'Çekirdek aday' || t.stance === 'Prototip adayı')).slice(0, 6) : [];
    const f = new Flow('TD');
    const r = new Recorder();
    const s = f.node(`Kapı ${g.id} — ${g.name}`, 'stadium', 'gate');
    const prevN = i > 0 ? f.node(`Önceki kapı ${gates[i - 1].id} geçildi`, 'rect', 'muted') : null;
    if (prevN) f.edge(prevN, s);
    const out = f.node(`Üretilecek çıktı: ${g.output}`, 'rect', 'data');
    f.edge(s, out);
    r.add('Somut çıktı', g.output);
    let last = out;
    if (members.length) {
      const toolsN = f.node(`Kullanılacak adaylar: ${members.map((t) => t.name).join(', ')}`, 'rect', 'tool');
      f.edge(out, toolsN);
      last = toolsN;
      r.add('Adaylar', members.map((t) => t.name).join(', '));
    }
    const exp = f.node('Aynı iş, veri ve yetkiyle ölç', 'rect');
    f.edge(last, exp);
    r.add('Ölç', 'Sabit panel ile karşılaştırmalı; sıra etkisi dengelenmiş.');
    const d = f.node(`Geçiş koşulu: ${g.exit}`, 'decision', 'decide');
    f.edge(exp, d);
    const next = f.node(i < gates.length - 1 ? `Kapı ${gates[i + 1].id} — ${gates[i + 1].name}` : 'Ürünleşmiş kapsam', 'stadium', 'end');
    const shrink = f.node('Kapsamı küçült; sabit ekran kazanırsa gereksiz maliyet önlenmiş olur', 'rect', 'warn');
    f.edge(d, next, 'geçti').edge(d, shrink, 'kalmadı').edge(shrink, exp, 'tekrar', 'dotted');
    r.add('Geçiş koşulu', g.exit);
    r.add('Kalırsa kapsamı küçült', 'Sentez §12.3: sabit ekran kazanırsa araştırma başarısız sayılmaz.');
    styled(f, ['end', 'decide', 'warn', 'data', 'gate', 'tool', 'muted']);
    return wf({
      id: `kapi-${g.id.toLowerCase()}`,
      title: `Kapı ${g.id} · ${g.name}`,
      family: 'kapi',
      diagram: 'flowchart',
      summary: `Sentezdeki aşamalı ürünleştirme kapısı ${g.id}: “${g.output}” üretilir; “${g.exit}” sağlanınca sonraki kapıya geçilir.`,
      mermaid: f.toString(),
      steps: r.steps,
      conditions: [prevN ? `Önceki kapı (${gates[i - 1].id}) ön koşul` : 'İlk kapı', `Adaylar “geçiş kapıları” kova şemasından koşulla seçildi`],
      tools: members.map((t) => t.id),
      topics: ['R28'],
      tags: ['kapı', 'yol-haritası'],
    }, input);
  });
}
