/**
 * Aile 15 — akıllı (koşullu) küme eylem akışları; Aile 16 — koşullu kova şeması akışları.
 * Üyeler üretim anındaki veriden kurala göre hesaplanır: veri değişirse akış da değişir.
 */
import type { Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { BUCKET_SCHEMES, SMART_CLUSTERS, type BucketScheme, type SmartCluster } from '../presets';
import { bucketize } from '../grouping';
import { describeRule, filterTools } from '../rules';
import { Recorder, styled, wf, type GenInput } from './common';

const THEME_ACTION: Record<string, [string, string]> = {
  karar: ['Yol haritasına yerleştir', 'Kapı sırasına göre planla ve sahibini ata'],
  risk: ['Risk azaltma spike’ı', 'Sürüm sabitle, lisansı incele, çıkış yolunu yaz'],
  yetenek: ['Yetenek boşluğunu kapat', 'Kümeden tek ana araç seç, kalanı yedek tut'],
  kanıt: ['Kanıtı güçlendir', 'Birincil kaynak ve küçük deneyle doğrula'],
  mimari: ['Katman sözleşmesini yaz', 'Adaptör sınırını ve sahipliği belirle'],
};

export type ClusterSpec = Pick<SmartCluster, 'id' | 'name' | 'why' | 'theme' | 'rule'>;

export function clusterWorkflow(c: ClusterSpec, input: GenInput): Workflow {
  {
    const members = filterTools(input.tools, c.rule).sort((a, b) => b.composite - a.composite);
    const f = new Flow('TD');
    const r = new Recorder();
    const s = f.node(`${c.name}\nAkıllı küme`, 'stadium', 'start');
    const rule = f.node(`Koşul: ${describeRule(c.rule)}`, 'para', 'data');
    f.edge(s, rule);
    r.add('Koşulu uygula', describeRule(c.rule));
    const cnt = f.node(`${members.length} üye (canlı hesap)`, 'decision', 'decide');
    f.edge(rule, cnt);
    r.add('Üyeleri hesapla', `${members.length} varlık şu an koşulu sağlıyor.`);
    const top = members.slice(0, 6);
    const ids: string[] = [];
    f.subgraph('Öne çıkan üyeler (bileşik puana göre)', (g) => top.forEach((t) => ids.push(g.node(`${t.name}\n${t.ring} · risk ${t.riskTier}`, 'rect', 'tool'))));
    ids.forEach((i) => f.edge(cnt, i));
    r.add('Öne çıkanları incele', top.map((t) => t.name).join(', '));
    if (!members.length) r.add('Boş sonuç', 'Koşulu gevşet: hiçbir varlık şu an eşleşmiyor.', 'Üye yok');
    const [act, detail] = THEME_ACTION[c.theme];
    const a = f.node(act, 'sub', 'gate');
    (ids.length ? ids : [cnt]).forEach((i) => f.edge(i, a));
    r.add(act, detail);
    const e = f.node(detail, 'stadium', 'end');
    f.edge(a, e);
    if (members.length > 12) {
      const narrow = f.node('Çok geniş: ek koşulla daralt', 'flag', 'warn');
      f.edge(cnt, narrow, 'fazla', 'dotted');
      r.add('Daralt', 'Üye sayısı 12’yi aştığı için ek koşul önerilir.', 'Geniş küme');
    }
    styled(f, ['start', 'end', 'decide', 'warn', 'data', 'gate', 'tool']);
    return wf({
      id: `kume-${c.id}`, title: `Akıllı küme · ${c.name}`, family: 'kume-eylem', diagram: 'flowchart',
      summary: `${c.why} Şu an ${members.length} üye.`, mermaid: f.toString(), steps: r.steps,
      conditions: [`Kural: ${describeRule(c.rule)}`, members.length > 12 ? 'Geniş küme: daraltma dalı eklendi' : 'Odaklı küme'],
      tools: top.map((t) => t.id), topics: Array.from(new Set(top.flatMap((t) => t.rTopics))).slice(0, 5), tags: ['akıllı-küme', c.theme],
    }, input);
  }
}

export function smartClusterFamily(input: GenInput): Workflow[] {
  return SMART_CLUSTERS.map((c) => clusterWorkflow(c, input));
}

export function bucketWorkflow(sc: BucketScheme, input: GenInput): Workflow {
  {
    const groups = bucketize(input.tools, sc.buckets, sc.restLabel);
    const f = new Flow('LR');
    const r = new Recorder();
    const s = f.node(`${sc.name}\nKoşullu gruplama`, 'stadium', 'start');
    let prev = s;
    sc.buckets.forEach((b, i) => {
      const q = f.node(describeRule(b.rule), 'decision', 'decide');
      f.edge(prev, q, i === 0 ? undefined : 'hayır');
      const g = groups.find((x) => x.key === b.id)!;
      const out = f.node(`${b.label}\n${g.items.length} varlık`, 'rect', 'tool');
      f.edge(q, out, 'evet');
      r.add(`${i + 1}. kova: ${b.label}`, `${describeRule(b.rule)} → ${g.items.length} varlık`);
      prev = q;
    });
    const rest = groups.find((x) => x.key === '__rest');
    const rn = f.node(`${sc.restLabel}\n${rest?.items.length ?? 0} varlık`, 'rect', 'muted');
    f.edge(prev, rn, 'hayır');
    r.add(`Yedek kova: ${sc.restLabel}`, `${rest?.items.length ?? 0} varlık`);
    styled(f, ['start', 'decide', 'tool', 'muted']);
    return wf({
      id: `kova-${sc.id}`, title: `Koşullu gruplama · ${sc.name}`, family: 'kova', diagram: 'flowchart',
      summary: `${sc.why} İlk eşleşen kova kazanır.`, mermaid: f.toString(), steps: r.steps,
      conditions: ['CASE WHEN mantığı: sıralama sonucu değiştirir'], tools: [], tags: ['koşullu-gruplama'],
    }, input);
  }
}

export function bucketSchemeFamily(input: GenInput): Workflow[] {
  return BUCKET_SCHEMES.map((sc) => bucketWorkflow(sc, input));
}
