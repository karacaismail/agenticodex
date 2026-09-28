// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { loadParsers } from '../../../scripts/lib/mermaid-multi.mjs';
import { Flow, Seq, StateD, Gantt, safeLabel, safeEdgeLabel, safeText, safeId } from './builder';

const NASTY = [
  'Basit etiket',
  'Tırnak "içinde" ve \'tek\'',
  'Köşeli [parantez] (yuvarlak) {süslü}',
  'Noktalı virgül; iki nokta: diyez #1 ve C#',
  'Küçük < büyük > ve & işareti',
  'Ters `tırnak` ve | dikey çizgi',
  'Türkçe: çğıöşü ÇĞİÖŞÜ — uzun tire … üç nokta',
  'Satır\nsonu',
  'end',
  'graph TD',
  '%% yorum gibi',
  'Yüzde %40 ve +/- işaretleri',
  '-->|ok| kaçış denemesi',
  'x'.repeat(300),
  '',
];

let parsers: Record<string, (c: string) => Promise<string | null>>;
beforeAll(async () => {
  parsers = await loadParsers();
}, 120000);

async function expectValidEverywhere(code: string) {
  for (const [v, parse] of Object.entries(parsers)) {
    const err = await parse(code);
    expect(err, `mermaid ${v} ayrıştıramadı:\n${code}`).toBeNull();
  }
}

describe('doğrulayıcı koşum (negatif kontrol)', () => {
  it('üç sürüm de gerçekten yüklendi', () => {
    expect(Object.keys(parsers).sort()).toEqual(['v10', 'v11', 'v12']);
  });
  it('bozuk diyagramı her sürüm reddeder', async () => {
    const bad = ['flowchart TD\n  a[Başla (x)] --> b', 'sequenceDiagram\n  A->>B: x; y\n  end end', 'flowchart TD\n  a["kapanmamış] --> b'];
    for (const code of bad) {
      for (const [v, parse] of Object.entries(parsers)) {
        expect(await parse(code), `${v} bozuk kodu kabul etti: ${code}`).not.toBeNull();
      }
    }
  });
});

describe('safe* kaçış yardımcıları', () => {
  it('safeLabel çift tırnağı ve tehlikeli karakterleri nötrler', () => {
    const s = safeLabel('a "b" <c> #d & `e`');
    expect(s).not.toContain('"');
    expect(s).not.toContain('<c>');
    expect(s).not.toContain('`');
    expect(s.length).toBeGreaterThan(0);
  });
  it('safeLabel uzun metni keser ve boşu yer tutucuya çevirir', () => {
    expect(safeLabel('x'.repeat(500), 40).length).toBeLessThanOrEqual(48);
    expect(safeLabel('')).toBe('—');
  });
  it('safeEdgeLabel yalnız güvenli karakter bırakır', () => {
    expect(safeEdgeLabel('evet | hayır [x] "y"')).toMatch(/^[\p{L}\p{N} .,'/%+\-]+$/u);
  });
  it('safeText noktalı virgül ve diyezi temizler', () => {
    const t = safeText('a; b # c');
    expect(t).not.toContain(';');
    expect(t).not.toContain('#');
  });
  it('safeId ayrılmış sözcük ve özel karakter üretmez', () => {
    for (const raw of ['end', 'graph', 'a-b c', '1abc', 'çağ', '']) {
      expect(safeId(raw)).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*$/);
      expect(['end', 'graph', 'subgraph', 'style', 'class']).not.toContain(safeId(raw));
    }
  });
});

describe('Flow (flowchart) oluşturucu', () => {
  it('bütün şekiller + tuzaklı etiketler üç sürümde geçerli', async () => {
    const f = new Flow('TD');
    const shapes = ['rect', 'round', 'stadium', 'decision', 'db', 'sub', 'circle', 'hex', 'flag'] as const;
    let prev: string | null = null;
    NASTY.forEach((label, i) => {
      const id = f.node(label, shapes[i % shapes.length], i % 2 ? 'warn' : 'ok');
      if (prev) f.edge(prev, id, NASTY[(i + 3) % NASTY.length], i % 3 === 0 ? 'dotted' : i % 3 === 1 ? 'thick' : 'solid');
      prev = id;
    });
    f.subgraph('Alt "grup" [x]; #1', (g) => {
      const a = g.node('İç düğüm');
      const b = g.node('İkinci <iç>');
      g.edge(a, b);
    });
    f.classDef('ok', { fill: '#12b886', stroke: '#0ca678', color: '#fff' });
    f.classDef('warn', { fill: '#fab005', stroke: '#f59f00', color: '#000' });
    await expectValidEverywhere(f.toString());
  });

  it('düğüm kimlikleri benzersiz ve toString kararlı', () => {
    const f = new Flow('LR');
    const ids = Array.from({ length: 50 }, (_, i) => f.node(`n ${i}`));
    expect(new Set(ids).size).toBe(50);
    expect(f.toString()).toBe(f.toString());
    expect(f.toString().startsWith('flowchart LR')).toBe(true);
  });

  it('yalnız eski sürümlerde de desteklenen sözdizimi kullanır', () => {
    const f = new Flow('TD');
    const a = f.node('A', 'hex');
    const b = f.node('B', 'flag');
    f.edge(a, b, 'etiket');
    const code = f.toString();
    expect(code).not.toMatch(/@\{/); // v11.3+ yeni şekil sözdizimi yok
    expect(code).not.toMatch(/^---/m); // frontmatter yok
    expect(code).not.toMatch(/direction /); // alt grafik yönü yok
  });
});

describe('Seq (sequenceDiagram) oluşturucu', () => {
  it('katılımcı, mesaj, alt/opt/loop/par ve notlar üç sürümde geçerli', async () => {
    const s = new Seq();
    const u = s.participant('Kullanıcı; "web" #1', true);
    const a = s.participant('end');
    const b = s.participant('Sunucu <api>');
    NASTY.slice(0, 8).forEach((m, i) => s.msg(i % 2 ? u : a, i % 2 ? a : b, m, (['sync', 'reply', 'async'] as const)[i % 3]));
    s.alt([
      { label: 'başarılı; 200', body: (x) => x.msg(b, u, 'Sonuç "tamam"', 'reply') },
      { label: 'hata #403', body: (x) => x.msg(b, u, 'Reddedildi <yetki>', 'reply') },
    ]);
    s.opt('isteğe bağlı: iptal', (x) => x.msg(u, b, 'AbortController.abort()', 'async'));
    s.loop('her 15 sn', (x) => x.note([a, b], 'nabız: yorum satırı'));
    s.par([
      { label: 'dosya A', body: (x) => x.msg(u, b, 'PATCH Upload-Offset', 'sync') },
      { label: 'dosya B', body: (x) => x.msg(u, b, 'HEAD', 'sync') },
    ]);
    s.note([u], 'Tek katılımcı notu');
    await expectValidEverywhere(s.toString());
  });
});

describe('StateD (stateDiagram-v2) oluşturucu', () => {
  it('durum, geçiş, bileşik durum, seçim ve not üç sürümde geçerli', async () => {
    const d = new StateD();
    const s1 = d.state('Bekliyor "boşta"');
    const s2 = d.state('Aktarılıyor: %40');
    const s3 = d.state('end');
    d.start(s1);
    d.trans(s1, s2, 'dosya seçildi; doğrulandı');
    d.trans(s2, s3, 'tamam {ok} #1');
    const c = d.choice();
    d.trans(s3, c);
    d.trans(c, s1, 'yeniden dene');
    d.composite('Analiz <AI>', (x) => {
      const a = x.state('Çıkarım');
      const b = x.state('Doğrulama');
      x.start(a);
      x.trans(a, b, 'bitti');
      x.end(b);
    });
    d.note(s2, 'Bayt ilerlemesi gerçek; analiz yüzdesi değil');
    d.end(s3);
    await expectValidEverywhere(d.toString());
  });
});

describe('Gantt oluşturucu', () => {
  it('bölüm, görev, bağımlılık ve durum etiketleri üç sürümde geçerli', async () => {
    const g = new Gantt('Yol: haritası; #1', '2026-10-05');
    g.section('A — Temel sözleşme: iş durumları');
    const t1 = g.task('Katalog: şema; #v1', 10, { status: 'done' });
    const t2 = g.task('Olay sözleşmesi', 7, { after: t1, status: 'active' });
    g.section('B — Sabit akış');
    g.task('Kritik test', 5, { after: t2, status: 'crit' });
    g.milestone('Kapı B', { after: t2 });
    await expectValidEverywhere(g.toString());
  });
});
