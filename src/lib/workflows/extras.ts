/**
 * Aile 9 (tehdit), 10 (yığın entegrasyonu), 11 (yol haritası — Gantt), 12 (iddia doğrulama).
 */
import type { Workflow } from '@/data/types';
import { Flow, Gantt } from '../mermaid/builder';
import { Recorder, styled, wf, toolName, type GenInput } from './common';

/* ---------------------------------------------------------------- tehditler */
const THREATS = [
  { id: 'istem-enjeksiyonu', name: 'İstem enjeksiyonu (LLM01)', src: 'Belge veya web içeriğine gömülü talimat', path: 'Model izinsiz eylem önerir', controls: ['Eylem yetkisi sunucuda', 'Araç izin listesi', 'Onay kartı'], tools: ['owasp-llm'] },
  { id: 'guvensiz-cikti', name: 'Güvensiz çıktı işleme (LLM05)', src: 'Model çıktısı doğrudan HTML/JS', path: 'XSS veya komut enjeksiyonu', controls: ['Bildirimsel katalog', 'DOMPurify', 'Trusted Types'], tools: ['owasp-llm', 'dompurify', 'trusted-types'] },
  { id: 'tarif-xss', name: 'Tarif üzerinden XSS', src: 'Bileşen özelliğinde script veya javascript: URL', path: 'Renderer özelliği güvenmeden yazar', controls: ['Özellik şeması', 'URL izin listesi', 'CSP'], tools: ['csp', 'zod'] },
  { id: 'yetki-yukseltme', name: 'Eylem yetki yükseltme', src: 'AI geniş kapsamlı eylem önerir', path: 'Kullanıcı farkında olmadan onaylar', controls: ['Yüzey bazlı politika', 'Tutar/nesne kontrolü', 'İkinci onay'], tools: ['owasp-llm'] },
  { id: 'zararli-dosya', name: 'Zararlı dosya', src: 'Uzantısı değiştirilmiş dosya', path: 'Okuyucu açığı', controls: ['İçerik türü denetimi sunucuda', 'Yalnız test edilmiş okuyucular', 'Yalıtılmış işleme'], tools: ['uppy', 'tus'] },
  { id: 'grafik-sizinti', name: 'Grafik tarifiyle veri sızıntısı', src: 'Tarifte dış veri URL’si', path: 'Tarayıcı dış kaynağa veri gönderir', controls: ['Dış veri kaynaklarını kapat', 'Veri referansı yalnız iç API', 'CSP connect-src'], tools: ['vega-lite', 'csp'] },
  { id: 'iframe-kacis', name: 'iframe yalıtımından kaçış', src: 'Üretilmiş HTML', path: 'allow-same-origin ile ebeveyne erişim', controls: ['sandbox özniteliği dar', 'Ayrı köken', 'postMessage şeması'], tools: ['iframe-sandbox', 'mcp-apps'] },
  { id: 'gunluk-sizinti', name: 'Günlükte hassas veri', src: 'İz ve istem kayıtları', path: 'Belirteç veya kişisel veri günlüğe düşer', controls: ['Maskeleme', 'Alan izin listesi', 'Saklama süresi'], tools: ['opentelemetry'] },
  { id: 'kurum-karismasi', name: 'Önbellekte kurum karışması', src: 'Aynı tarayıcıda kurum değişimi', path: 'Eski kurum verisi görünür', controls: ['Kurum kimliği sorgu anahtarında', 'Değişimde temizlik', 'Sunucuda yetki'], tools: ['tanstack-query'] },
  { id: 'olay-tekrari', name: 'Olay yeniden oynatma saldırısı', src: 'Yakalanmış olay veya istek', path: 'Aynı işlem iki kez', controls: ['Idempotency anahtarı', 'Olay kimliği ve süre', 'İmzalı eylem belirteci'], tools: ['last-event-id'] },
  { id: 'akis-dos', name: 'Aşırı büyük akış (DoS)', src: 'Sınırsız model çıktısı', path: 'Tarayıcı bellek ve ana iş parçacığı dolar', controls: ['Mesaj boyutu sınırı', 'Güncelleme biriktirme', 'Sanallaştırma'], tools: ['tanstack-virtual', 'inp'] },
  { id: 'tedarik-zinciri', name: 'Bağımlılık tedarik zinciri', src: 'Bakımsız veya ele geçirilmiş paket', path: 'Kötü kod üretim paketine girer', controls: ['Sürüm sabitleme', 'Lisans ve bakım taraması', 'Gizli ağ hedefi incelemesi'], tools: ['fetch-event-source', 'tambo'] },
];

export function threatFamily(input: GenInput): Workflow[] {
  return THREATS.map((t) => {
    const f = new Flow('LR');
    const r = new Recorder();
    const s = f.node(t.name, 'stadium', 'risk');
    const src = f.node(`Kaynak: ${t.src}`, 'rect', 'warn');
    const path = f.node(`Saldırı yolu: ${t.path}`, 'rect', 'warn');
    f.edge(s, src).edge(src, path);
    r.add('Tehdit kaynağı', t.src);
    r.add('Saldırı yolu', t.path);
    const ctrl: string[] = [];
    f.subgraph('Kontroller (derinlemesine savunma)', (g) => t.controls.forEach((c) => ctrl.push(g.node(c, 'rect', 'end'))));
    ctrl.forEach((c) => f.edge(path, c, 'engelle'));
    t.controls.forEach((c) => r.add(`Kontrol: ${c}`));
    const det = f.node('Algılama: iz + uyarı', 'rect', 'data');
    const test = f.node('Saldırı testi regresyona', 'sub', 'gate');
    ctrl.forEach((c) => f.edge(c, det));
    f.edge(det, test);
    r.add('Algılama'); r.add('Saldırı testi');
    styled(f, ['end', 'risk', 'warn', 'data', 'gate']);
    return wf({
      id: `tehdit-${t.id}`, title: `Tehdit · ${t.name}`, family: 'tehdit', diagram: 'flowchart',
      summary: `${t.src} kaynaklı; ${t.path.toLocaleLowerCase('tr')}. ${t.controls.length} katmanlı kontrol ve algılama.`,
      mermaid: f.toString(), steps: r.steps, conditions: ['Güzel görünen yanlış işlem en tehlikeli hatalardan biridir (sentez §8)'],
      tools: t.tools, topics: ['R23', 'R02'], tags: ['güvenlik', 'tehdit'],
    }, input);
  });
}

/* ---------------------------------------------------------------- yığın entegrasyonu */
const UIS = [
  { id: 'mantine', name: 'Mantine', note: 'Zengin form/tablo; Mantine Charts', react: true },
  { id: 'ant-design', name: 'Ant Design', note: 'Kurumsal; Ant Design X ile AI bileşenleri', react: true },
  { id: 'shadcn-ui', name: 'shadcn/ui', note: 'Kaynak sahipliği; AI Elements uyumu', react: true },
  { id: 'daisyui', name: 'daisyUI', note: 'CSS sınıfları; Astro uyumu; karmaşık davranış için headless ek', react: false },
];
const RENDERERS = [
  { id: 'json-render', name: 'json-render', tools: ['json-render', 'specstream', 'zod'], proto: 'SpecStream JSONL', note: 'Katalog Zod ile; yamalar RFC 6902' },
  { id: 'a2ui-react', name: 'A2UI React', tools: ['a2ui', 'a2ui-react'], proto: 'A2UI mesajları', note: 'Sürüm sabitle; olgunluk etiketleri farklı' },
  { id: 'copilotkit', name: 'CopilotKit', tools: ['copilotkit', 'ag-ui'], proto: 'AG-UI olayları', note: 'Kendi runtime istemcisi var' },
  { id: 'tambo', name: 'Tambo', tools: ['tambo', 'zod'], proto: 'Tambo ileti akışı', note: 'Bulut veya self-host; API anahtarı' },
  { id: 'openui', name: 'OpenUI', tools: ['openui', 'openui-lang'], proto: 'OpenUI Lang', note: 'Kendi inference yolu tanımlı' },
  { id: 'ozel', name: 'Özel renderer', tools: ['json-schema', 'zod'], proto: 'Kendi sözleşmen', note: 'Bütün davranışı sahiplenirsin' },
];
const TRANSPORTS = [
  { id: 'eventsource', name: 'EventSource', tools: ['eventsource', 'last-event-id'], note: 'GET + çerez; otomatik yeniden bağlanma' },
  { id: 'fetch-event-source', name: 'fetch-event-source', tools: ['fetch-event-source'], note: 'POST + Authorization; bakım riski' },
  { id: 'websocket', name: 'WebSocket', tools: ['websocket'], note: 'Çift yönlü; nabız ve sürdürme belirteci' },
];

export function stackFamily(input: GenInput): Workflow[] {
  const out: Workflow[] = [];
  for (const ui of UIS) {
    for (const rd of RENDERERS) {
      for (const tr of TRANSPORTS) {
        const f = new Flow('LR');
        const r = new Recorder();
        const conditions: string[] = [];
        const shell = f.subgraph('Uygulama kabuğu', (g) => {
          const a = g.node(`${ui.name}\n${ui.note}`, 'rect', 'tool');
          const b = g.node('Sabit menü, hesap, kurum seçimi', 'rect', 'muted');
          g.edge(b, a);
        });
        const rend = f.node(`${rd.name}\n${rd.note}`, 'rect', 'ai');
        const cat = f.node('Bileşen kataloğu (tek kaynak şema)', 'db', 'data');
        const ad = f.node(`Adaptör: ${rd.proto}`, 'hex', 'gate');
        const tp = f.node(`${tr.name}\n${tr.note}`, 'rect', 'tool');
        const sv = f.node('Ajan sunucusu + veri/yetki servisleri', 'rect', 'data');
        f.edge(shell, rend, 'çalışma alanı').edge(cat, rend, 'izinli parçalar').edge(rend, ad).edge(ad, tp).edge(tp, sv);
        r.add('Kabuk', `${ui.name}: ${ui.note}`); r.add('Renderer', `${rd.name}: ${rd.note}`); r.add('Katalog'); r.add('Adaptör', rd.proto); r.add('Taşıma', `${tr.name}: ${tr.note}`);
        const flag = (label: string, detail: string) => {
          const n = f.node(label, 'flag', 'warn');
          f.edge(n, rend, undefined, 'dotted');
          r.add(label, detail, 'Birleşime özgü koşul');
          conditions.push(label);
        };
        if (!ui.react && rd.id !== 'ozel') flag('Astro adası / React istemci sınırı', 'daisyUI CSS’tir; React renderer tek bir iyi tanımlı istemci uygulamasında çalışmalı');
        if (rd.id === 'copilotkit' && tr.id !== 'fetch-event-source') flag('CopilotKit runtime istemcisiyle taşıma uyumu', 'Seçilen taşıma için adaptör veya runtime istemcisi');
        if (rd.id === 'tambo') flag('Bulut bağımlılığı ve veri akışı incelemesi', 'Gizli hizmet bağımlılığı riski (sentez risk 7)');
        if (rd.id === 'a2ui-react') flag('A2UI sürümünü sabitle', 'README ile resmî sayfalar farklı olgunluk bildiriyor');
        if (rd.id === 'openui') flag('Token tasarrufu iddiasını ölç', 'Satıcı iddiası; bağımsız doğrulama yok');
        if (tr.id === 'eventsource' && (rd.id === 'copilotkit' || rd.id === 'a2ui-react')) flag('POST gerektiren başlatma için köprü', 'EventSource yalnız GET yapar');
        if (tr.id === 'websocket') flag('Olay sırası seq ile uygulama katmanında', 'WebSocket yeniden bağlanmayı kendisi yapmaz');
        if (ui.id === 'ant-design' && rd.id !== 'ozel') flag('Ant Design X bileşenleriyle çakışmayı sına', 'Tema ve klavye davranışı tek sistemde kalmalı');
        if (ui.id === 'shadcn-ui') flag('Kopyalanan bileşen güncellemelerini birleştir', 'Kaynak sahipliğinin bakım maliyeti');
        const test = f.node('Aynı 10 bileşen + bozuk/tekrar/kopma testleri', 'sub', 'gate');
        f.edge(sv, test);
        r.add('Kabul testleri', 'Bozuk mesaj, bilinmeyen bileşen, tekrar olay ve bağlantı kesilmesi');
        styled(f, ['warn', 'data', 'ai', 'gate', 'tool', 'muted']);
        out.push(wf({
          id: `yigin-${ui.id}-${rd.id}-${tr.id}`,
          title: `${ui.name} + ${rd.name} + ${tr.name}`,
          family: 'yigin',
          diagram: 'flowchart',
          summary: `Kabuk ${ui.name}, renderer ${rd.name}, taşıma ${tr.name}. ${conditions.length ? `${conditions.length} birleşime özgü koşul.` : 'Birleşime özgü ek koşul yok.'}`,
          mermaid: f.toString(),
          steps: r.steps,
          conditions: conditions.length ? conditions : ['Birleşim doğrudan uyumlu görünüyor; yine de aynı senaryoyla ölç'],
          tools: [ui.id, ...rd.tools, ...tr.tools],
          topics: ['R04', 'R09', 'R14'],
          tags: ['yığın', ui.id, rd.id, tr.id],
        }, input));
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------- yol haritaları */
export function roadmapFamily(input: GenInput): Workflow[] {
  const gates = input.meta.synthesis.gates;
  const profiles = [
    { id: 'kucuk-ekip', name: 'Küçük ekip', scale: 0.8 },
    { id: 'kurumsal', name: 'Kurumsal', scale: 1.4 },
    { id: 'coklu-platform', name: 'Çok platform', scale: 1.25 },
    { id: 'veri-yogun', name: 'Veri yoğun', scale: 1.15 },
  ];
  const base = [10, 15, 15, 20, 20, 25];
  const out: Workflow[] = [];
  for (const p of profiles) {
    const g = new Gantt(`${p.name} · örnek yol haritası`);
    const r = new Recorder();
    let prev: string | undefined;
    gates.forEach((gt, i) => {
      g.section(`${gt.id} — ${gt.name}`);
      const days = Math.round(base[i] * p.scale);
      const a = g.task(gt.output, Math.round(days * 0.6), { after: prev, status: i === 0 ? 'active' : undefined });
      const b = g.task(`Geçiş ölçümü ${gt.id}`, Math.round(days * 0.4), { after: a, status: i >= 4 ? undefined : 'crit' });
      g.milestone(`Kapı ${gt.id}`, { after: b });
      prev = b;
      r.add(`Kapı ${gt.id} — ${gt.name}`, `${gt.output} · geçiş: ${gt.exit}`);
    });
    out.push(wf({
      id: `yol-${p.id}`, title: `Yol haritası · ${p.name}`, family: 'yol-haritasi', diagram: 'gantt',
      summary: `Sentezin A–F geçiş kapılarının ${p.name.toLocaleLowerCase('tr')} profiline göre ölçeklenmiş örnek sırası. Süreler varsayımdır; sentez kesin takvim vermez.`,
      mermaid: g.toString(), steps: r.steps, conditions: [`Süre çarpanı ×${p.scale} (profil varsayımı)`, 'Sentez: gün sayısı uydurulmaz; önce B adımı tahminlenir'],
      topics: ['R28'], tags: ['yol-haritası', p.id],
    }, input));
  }
  gates.forEach((gt, i) => {
    const g = new Gantt(`Kapı ${gt.id} ayrıntısı`);
    const r = new Recorder();
    g.section('Hazırlık');
    const a = g.task('Sözleşme ve kapsam', 3, { status: 'done' });
    const b = g.task(gt.output, 6 + i, { after: a, status: 'active' });
    g.section('Doğrulama');
    const c = g.task('Arıza senaryoları', 3, { after: b, status: 'crit' });
    const d = g.task('Kullanıcı ölçümü', 4, { after: c });
    g.milestone(`Geçiş koşulu ${gt.id}`, { after: d });
    ['Sözleşme ve kapsam', gt.output, 'Arıza senaryoları', 'Kullanıcı ölçümü', `Geçiş: ${gt.exit}`].forEach((x) => r.add(x));
    out.push(wf({
      id: `yol-kapi-${gt.id.toLowerCase()}`, title: `Kapı ${gt.id} · ${gt.name} · iş planı`, family: 'yol-haritasi', diagram: 'gantt',
      summary: `Kapı ${gt.id} için hazırlık ve doğrulama sırası. Çıktı: ${gt.output}. Süreler örnektir.`,
      mermaid: g.toString(), steps: r.steps, conditions: ['Süreler örnektir; ekip ve mevcut kod bilinmeden kesinleşmez'], topics: ['R28'], tags: ['yol-haritası', 'kapı'],
    }, input));
  });
  return out;
}

/* ---------------------------------------------------------------- itirazlı iddia doğrulama */
const STATUS_TR: Record<string, string> = { supported: 'destekli', unverified: 'doğrulanmamış', disputed: 'itirazlı', rejected: 'reddedilmiş' };

export function claimFamily(input: GenInput): Workflow[] {
  const target = input.claims.filter((c) => c.status === 'disputed' || c.status === 'rejected');
  return target.map((c) => {
    const f = new Flow('TD');
    const r = new Recorder();
    const s = f.node(`İddia ${c.id}`, 'stadium', c.status === 'rejected' ? 'risk' : 'warn');
    const st = f.node(c.statement, 'rect');
    f.edge(s, st);
    r.add('İddia', c.statement);
    const hist = f.node(`Durum geçmişi: ${c.assessments.map((a) => `${a.stage.replace(/_/g, ' ')} ${STATUS_TR[a.status]}`).join(' → ')}`, 'rect', 'data');
    f.edge(st, hist);
    r.add('Durum geçmişi', c.assessments.map((a) => `${a.stage}: ${STATUS_TR[a.status]}`).join(' → '));
    const last = c.assessments[c.assessments.length - 1];
    let prev = hist;
    if (last?.counter) {
      const ce = f.node(`Karşı kanıt: ${last.counter}`, 'rect', 'risk');
      f.edge(prev, ce);
      prev = ce;
      r.add('Karşı kanıt', last.counter);
    }
    const domains = Array.from(new Set(c.sources.map((u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return u; } }))).slice(0, 3);
    const open = f.node(`Birincil kaynağı aç: ${domains.join(', ') || 'kaynak yok'}`, 'rect');
    f.edge(prev, open);
    r.add('Birincil kaynağı aç', domains.join(', '));
    const q = f.node('Pasaj iddiayı aynı kapsamda destekliyor mu?', 'decision', 'decide');
    const yes = f.node('Kapsamı daraltarak destekle; sınırı yaz', 'rect', 'end');
    const no = f.node('Reddet; etkilenen kararı yeniden aç', 'rect', 'risk');
    f.edge(open, q).edge(q, yes, 'evet').edge(q, no, 'hayır');
    r.add('Pasaj kontrolü'); r.add('Sonuç', 'Destekle (dar kapsam) ya da reddet');
    const impacted = f.node(c.tools.length ? `Etkilenen: ${c.tools.slice(0, 4).map((t) => toolName(input, t)).join(', ')}` : `Etkilenen konu: ${c.topics.join(', ') || '—'}`, 'rect', 'tool');
    f.edge(yes, impacted).edge(no, impacted);
    r.add('Etkiyi yay', c.tools.length ? c.tools.map((t) => toolName(input, t)).join(', ') : c.topics.join(', '));
    styled(f, ['end', 'decide', 'risk', 'warn', 'data', 'tool']);
    return wf({
      id: `iddia-${c.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: `İddia doğrulama · ${c.id}`,
      family: 'iddia-dogrulama',
      diagram: 'flowchart',
      summary: `${STATUS_TR[c.status]} iddia: ${c.statement.slice(0, 160)}${c.statement.length > 160 ? '…' : ''}`,
      mermaid: f.toString(),
      steps: r.steps,
      conditions: [`Son durum “${STATUS_TR[c.status]}” olduğu için doğrulama akışı üretildi`, c.contested ? 'Aşamalar arasında görüş ayrılığı var' : 'Aşamalar aynı durumda'],
      tools: c.tools,
      topics: c.topics,
      tags: ['kanıt', c.status],
    }, input);
  });
}
