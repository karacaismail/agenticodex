/**
 * Akış üretici: kullanıcının seçimlerinden çalışma anında koşullu iş akışı üretir.
 * Aynı sürüm-güvenli oluşturucu kullanılır; bütün temel birleşimler testte üç Mermaid sürümüyle doğrulanır.
 */
import type { Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { Recorder, styled, wf, type GenInput } from './common';

export type Level = 'sabit' | 'kontrollu' | 'bildirimsel';
export type Need = 'dosya' | 'grafik' | 'onay' | 'form' | 'coklu-sekme' | 'yerellestirme';

export interface BuilderChoice {
  profile: 'kucuk-ekip' | 'kurumsal' | 'coklu-platform' | 'veri-yogun';
  ui: 'mantine' | 'ant-design' | 'shadcn-ui' | 'daisyui';
  renderer: 'json-render' | 'a2ui-react' | 'copilotkit' | 'tambo' | 'openui' | 'ozel';
  transport: 'eventsource' | 'fetch-event-source' | 'websocket';
  level: Level;
  needs: Need[];
}

export const BUILDER_OPTIONS = {
  profile: [
    { value: 'kucuk-ekip', label: 'Küçük ekip · hızlı prototip', desc: 'Düşük bakım kapasitesi' },
    { value: 'kurumsal', label: 'Kurumsal · uyumluluk', desc: 'Lisans, erişilebilirlik, denetim' },
    { value: 'coklu-platform', label: 'Çok platform', desc: 'Framework bağımsızlığı' },
    { value: 'veri-yogun', label: 'Veri yoğun analitik', desc: 'Performans bütçesi' },
  ],
  ui: [
    { value: 'mantine', label: 'Mantine', desc: 'Zengin form/tablo + grafik' },
    { value: 'ant-design', label: 'Ant Design', desc: 'Kurumsal; Ant Design X' },
    { value: 'shadcn-ui', label: 'shadcn/ui', desc: 'Kaynak sahipliği' },
    { value: 'daisyui', label: 'daisyUI', desc: 'CSS sınıfları; Astro' },
  ],
  renderer: [
    { value: 'json-render', label: 'json-render', desc: 'Katalog + SpecStream' },
    { value: 'a2ui-react', label: 'A2UI React', desc: 'Bildirimsel tarif' },
    { value: 'copilotkit', label: 'CopilotKit', desc: 'AG-UI yerel' },
    { value: 'tambo', label: 'Tambo', desc: 'React SDK + bulut/self-host' },
    { value: 'openui', label: 'OpenUI', desc: 'OpenUI Lang' },
    { value: 'ozel', label: 'Özel renderer', desc: 'Bütün davranış sende' },
  ],
  transport: [
    { value: 'eventsource', label: 'EventSource', desc: 'GET + çerez' },
    { value: 'fetch-event-source', label: 'fetch-event-source', desc: 'POST + başlık' },
    { value: 'websocket', label: 'WebSocket', desc: 'Çift yönlü' },
  ],
  level: [
    { value: 'sabit', label: 'Sabit panel', short: 'Sabit', desc: 'Temel çizgi' },
    { value: 'kontrollu', label: 'Kontrollü seçim', short: 'Kontrollü', desc: 'AI izinli parçayı seçer' },
    { value: 'bildirimsel', label: 'Bildirimsel düzen', short: 'Bildirimsel', desc: 'AI izinli parçalarla düzen kurar' },
  ],
  needs: [
    { value: 'dosya', label: 'Dosya yükleme' },
    { value: 'grafik', label: 'Grafik / analitik' },
    { value: 'onay', label: 'Etkili işlem onayı' },
    { value: 'form', label: 'AI destekli form' },
    { value: 'coklu-sekme', label: 'Çoklu sekme / uzun iş' },
    { value: 'yerellestirme', label: 'Yerelleştirme / RTL' },
  ],
} as const satisfies Record<string, readonly { value: string; label: string; desc?: string; short?: string }[]>;

const RENDERER_TOOLS: Record<BuilderChoice['renderer'], string[]> = {
  'json-render': ['json-render', 'specstream', 'zod'],
  'a2ui-react': ['a2ui', 'a2ui-react'],
  copilotkit: ['copilotkit', 'ag-ui'],
  tambo: ['tambo', 'zod'],
  openui: ['openui', 'openui-lang'],
  ozel: ['json-schema', 'zod'],
};
const TRANSPORT_TOOLS: Record<BuilderChoice['transport'], string[]> = {
  eventsource: ['eventsource', 'last-event-id'],
  'fetch-event-source': ['fetch-event-source', 'abortcontroller'],
  websocket: ['websocket'],
};

const label = <K extends keyof typeof BUILDER_OPTIONS>(k: K, v: string) => (BUILDER_OPTIONS[k] as readonly { value: string; label: string }[]).find((o) => o.value === v)?.label ?? v;

export interface BuilderResult {
  workflow: Workflow;
  recommended: string[];
  related: string[];
  gates: string[];
}

export function buildCustomWorkflow(c: BuilderChoice, input: GenInput): BuilderResult {
  const f = new Flow('TD');
  const r = new Recorder();
  const conditions: string[] = [];
  const rec: string[] = [c.ui];
  const has = (n: Need) => c.needs.includes(n);

  const start = f.node(`Ürün: ${label('profile', c.profile)}\nDüzey: ${label('level', c.level)}`, 'stadium', 'start');
  r.add('Bağlamı sabitle', `${label('profile', c.profile)} · ${label('level', c.level)}`);

  const shell = f.node(`Sabit kabuk: ${label('ui', c.ui)}\nmenü · hesap · kurum seçimi`, 'rect', 'tool');
  f.edge(start, shell);
  r.add('Sabit uygulama kabuğu', `${label('ui', c.ui)} ile menü, hesap ve kurum seçimi sabit kalır.`);
  if (c.ui === 'daisyui' && c.renderer !== 'ozel' && c.level !== 'sabit') {
    const n = f.node('Etkileşimli alan: tek React istemci uygulaması (Astro adası)', 'flag', 'warn');
    f.edge(shell, n, undefined, 'dotted');
    conditions.push('daisyUI CSS’tir; React renderer için etkileşimli alan sınırı çizildi');
    rec.push('astro');
  }

  let work = shell;
  if (c.level === 'sabit') {
    const fixed = f.node('Sabit panel: önceden tasarlanmış ekranlar\nkarşılaştırmanın temel çizgisi', 'sub', 'gate');
    f.edge(shell, fixed, 'çalışma alanı');
    work = fixed;
    r.add('Sabit panel', 'Üretken alan yok; sonraki düzeylerle karşılaştırma için ölçüm alınır.', 'Sabit düzey');
    conditions.push('Sabit düzey: renderer ve katalog adımları atlandı');
  } else {
    rec.push(...RENDERER_TOOLS[c.renderer]);
    const cat = f.node('Bileşen kataloğu: tek kaynak şema\n10 anlamlı iş bileşeni', 'db', 'data');
    const sub = f.node('Katalog alt kümesi: amaç, veri türü, alan, risk', 'rect', 'data');
    const ai = f.node(c.level === 'kontrollu' ? `AI izinli bileşeni seçer\n${label('renderer', c.renderer)}` : `AI izinli parçalarla düzen kurar\n${label('renderer', c.renderer)}`, 'rect', 'ai');
    const val = f.node('Doğrula: biçim · katalog · veri referansı · eylem', 'decision', 'decide');
    const fb = f.node('Güvenli yedek: tablo veya metin; son geçerli görünüm', 'rect', 'warn');
    f.edge(shell, cat, 'çalışma alanı').edge(cat, sub).edge(sub, ai).edge(ai, val).edge(val, fb, 'geçersiz');
    r.add('Katalog', 'Modelin gördüğü tanım ile uygulamanın doğruladığı şema aynı sürümlü kaynaktan.');
    r.add('Katalog alt kümesi', 'Modele bütün katalog değil, bağlama göre seçilmiş parçalar verilir.');
    r.add(c.level === 'kontrollu' ? 'Bileşen seçimi' : 'Düzen kompozisyonu', label('renderer', c.renderer));
    r.add('Doğrulama', 'Geçersizse güvenli yedek; ilk harf geldi diye eylem etkinleşmez.');
    work = val;
    if (c.level === 'bildirimsel') {
      const keep = f.node('Kullanıcı taslağı, odak ve seçim korunur\nAI değişikliği öneri olarak bekler', 'rect', 'user');
      f.edge(val, keep, 'geçerli');
      work = keep;
      r.add('Kullanıcı durumunu koru', 'Bileşen kimliği sabit; kirli alan varsa değişiklik öneri olarak bekletilir.', 'Bildirimsel düzey');
      conditions.push('Bildirimsel düzey: odak ve taslak koruma adımı eklendi');
    }
    if (c.renderer === 'a2ui-react') conditions.push('A2UI sürümü sabitlenmeli: olgunluk etiketleri belgeler arasında farklı');
    if (c.renderer === 'tambo') conditions.push('Tambo: bulut/self-host ve veri akışı incelemesi');
    if (c.renderer === 'openui') conditions.push('OpenUI: token tasarrufu iddiası ayrıca ölçülmeli');
  }

  // taşıma
  rec.push(...TRANSPORT_TOOLS[c.transport]);
  const tp = f.node(`Taşıma: ${label('transport', c.transport)}`, 'hex', 'gate');
  f.edge(work, tp, c.level === 'kontrollu' ? 'geçerli' : undefined);
  r.add('Taşıma', label('transport', c.transport));
  let last = tp;
  const needsPostStart = c.renderer === 'copilotkit' || c.renderer === 'a2ui-react' || c.renderer === 'tambo';
  if (c.transport === 'eventsource' && needsPostStart && c.level !== 'sabit') {
    const br = f.node('Köprü: POST ile çalıştırmayı başlat, GET ile olayları izle', 'rect', 'warn');
    f.edge(tp, br);
    last = br;
    r.add('Başlatma köprüsü', 'EventSource yalnız GET yapar; başlatma ayrı bir POST ile yapılır.', 'EventSource + POST gerektiren renderer');
    conditions.push('EventSource POST yapamadığı için başlatma köprüsü eklendi');
  }
  if (c.transport === 'websocket') {
    const hb = f.node('Nabız + sürdürme belirteci + seq ile sıra', 'rect', 'warn');
    f.edge(last, hb);
    last = hb;
    r.add('Nabız ve sürdürme', 'WebSocket yeniden bağlanmayı kendisi yapmaz.', 'WebSocket');
    conditions.push('WebSocket: nabız ve sürdürme belirteci eklendi');
  } else {
    const re = f.node('Kopmada Last-Event-ID ile yeniden oynat; tekrarları ele', 'rect');
    f.edge(last, re);
    last = re;
    r.add('Yeniden bağlanma', 'Olay kimliğiyle tekrarlar elenir.');
  }
  if (c.transport === 'fetch-event-source') conditions.push('fetch-event-source son sürümü eski: bakım riski izlenmeli');

  // ihtiyaçlar
  const needNodes: string[] = [];
  f.subgraph('İhtiyaca göre eklenen yetenekler', (g) => {
    if (has('dosya')) {
      const resume = c.profile !== 'kucuk-ekip';
      needNodes.push(g.node(resume ? 'Dosya: Uppy + Tus, sürdürülebilir aktarım\nseçildi → aktarıldı → çıkarıldı → analiz' : 'Dosya: react-dropzone + kendi yükleyicin\naktarım ile analiz ayrı durum', 'rect', 'tool'));
      rec.push(...(resume ? ['uppy', 'tus'] : ['react-dropzone']));
      r.add('Dosya hattı', resume ? 'Uppy + Tus ile kaldığı yerden sürdürme.' : 'react-dropzone seçim yapar; aktarım ayrı kurulur.', 'Dosya ihtiyacı');
      conditions.push(resume ? 'Profil sürdürülebilir yükleme gerektiriyor: Uppy + Tus' : 'Küçük ekip: react-dropzone + basit yükleyici');
    }
    if (has('grafik')) {
      const ec = c.profile === 'veri-yogun';
      needNodes.push(g.node(ec ? 'Grafik: ECharts + dar grafik şeması\nsayılar sunucuda hesaplanır' : 'Grafik: Vega-Lite dar şema\ntabloya güvenli yedek', 'rect', 'tool'));
      rec.push(ec ? 'echarts' : 'vega-lite');
      r.add('Grafik', ec ? 'Büyük veri için ECharts; toplama sunucuda.' : 'Vega-Lite dar şema; eksen ve birim doğrulanır.', 'Grafik ihtiyacı');
    }
    if (has('onay')) {
      needNodes.push(g.node('Onay kartı: hedef, etki, süre\nsunucuda yetki + Idempotency-Key', 'rect', 'risk'));
      rec.push('ai-elements');
      r.add('Etkili işlem onayı', 'Sunucu yetkiyi ve tutarı yeniden denetler; tekrar gönderim tek işlem olur.', 'Onay ihtiyacı');
    }
    if (has('form')) {
      needNodes.push(g.node('AI form taslağı: JSON Schema + kirli alan koruması', 'rect', 'user'));
      rec.push('json-schema', 'react-activity');
      r.add('AI destekli form', 'Taslak alanlar düzenlenebilir; AI güncellemesi yazılanı silmez.', 'Form ihtiyacı');
    }
    if (has('coklu-sekme')) {
      needNodes.push(g.node('Çoklu sekme: lider sekme bağlantıyı tutar\niş arka planda sürer, bildirimle döner', 'rect', 'data'));
      rec.push('service-worker');
      r.add('Çoklu sekme', 'Tek bağlantı, çok izleyici; lider kapanınca devralma.', 'Çoklu sekme ihtiyacı');
    }
    if (has('yerellestirme')) {
      needNodes.push(g.node('Yerelleştirme: Intl sayı/tarih + RTL testi', 'rect', 'data'));
      rec.push('intl');
      r.add('Yerelleştirme', 'Intl biçimleri; sağdan sola ve Latin dışı rakam testi.', 'Yerelleştirme ihtiyacı');
    }
    if (!needNodes.length) needNodes.push(g.node('Ek yetenek seçilmedi', 'rect', 'muted'));
  });
  needNodes.forEach((n) => f.edge(last, n));

  // kalite
  const q: string[] = [];
  f.subgraph('Kalite kapısı', (g) => {
    q.push(g.node('Kayıtlı olaylarla yeniden oynatma (MSW)', 'rect', 'tool'));
    q.push(g.node('Bozuk · tekrar · kopma · iptal testleri (Playwright)', 'rect', 'tool'));
    q.push(g.node('Uçtan uca iz kimliği (OpenTelemetry)', 'rect', 'tool'));
    if (c.profile === 'kurumsal') {
      q.push(g.node('OWASP LLM tehdit testleri + axe erişilebilirlik', 'rect', 'risk'));
      rec.push('owasp-llm', 'axe');
    }
    if (c.profile === 'veri-yogun') {
      q.push(g.node('INP ve düşük güçlü cihaz yük testi', 'rect', 'warn'));
      rec.push('inp', 'tanstack-virtual');
    }
  });
  rec.push('msw', 'playwright', 'opentelemetry');
  needNodes.forEach((n) => q.forEach((x) => f.edge(n, x)));
  r.add('Kalite kapısı', c.profile === 'kurumsal' ? 'Ek olarak OWASP LLM ve axe erişilebilirlik testleri.' : c.profile === 'veri-yogun' ? 'Ek olarak INP ve yük testi.' : 'Yeniden oynatma, arıza ve iz testleri.');
  if (c.profile === 'kurumsal') conditions.push('Kurumsal profil: güvenlik ve erişilebilirlik testleri eklendi');
  if (c.profile === 'veri-yogun') conditions.push('Veri yoğun profil: performans bütçesi testi eklendi');

  const gates = c.level === 'sabit' ? ['A', 'B', 'E'] : c.level === 'kontrollu' ? ['A', 'B', 'C', 'E'] : ['A', 'B', 'C', 'D', 'E'];
  const gate = f.node(`Geçiş kapıları: ${gates.join(' → ')}`, 'sub', 'gate');
  q.forEach((x) => f.edge(x, gate));
  const end = f.node('Ölç: görev başarısı, kritik hata, düzeltme süresi\nsabit panele göre', 'stadium', 'end');
  f.edge(gate, end);
  r.add('Geçiş kapıları', gates.join(' → '));
  r.add('Ölç ve karar ver', 'Sabit ekran kazanırsa kapsam daraltılır; gereksiz maliyet önlenmiş olur.');

  styled(f, ['start', 'end', 'decide', 'risk', 'warn', 'data', 'ai', 'user', 'gate', 'tool', 'muted']);
  const known = new Set(input.tools.map((t) => t.id));
  const recommended = Array.from(new Set(rec)).filter((t) => known.has(t));
  const related = [
    `yigin-${c.ui}-${c.renderer}-${c.transport}`,
    `karar-renderer-${c.profile}`,
    `karar-tasima-${c.profile}`,
    `yol-${c.profile}`,
    ...(has('dosya') ? ['yd-dosya-tek', `karar-dosya-yukleyici-${c.profile}`] : []),
    ...(has('grafik') ? ['sr-grafik-dar-sema', `karar-grafik-${c.profile}`] : []),
    ...(has('onay') ? ['yd-onay-karti', 'sr-onay-yetki'] : []),
    ...(has('form') ? ['yd-form-taslak', 'sr-form-koruma'] : []),
    ...(has('coklu-sekme') ? ['yd-coklu-sekme', 'sr-coklu-sekme'] : []),
  ];
  const workflow = wf({
    id: 'ozel-akis',
    title: `${label('ui', c.ui)} + ${c.level === 'sabit' ? 'sabit panel' : label('renderer', c.renderer)} + ${label('transport', c.transport)}`,
    family: 'ozel',
    diagram: 'flowchart',
    summary: `${label('profile', c.profile)} için ${label('level', c.level).toLocaleLowerCase('tr')} düzeyinde, ${c.needs.length} ek ihtiyaçlı özel akış. ${conditions.length} koşul dalı.`,
    mermaid: f.toString(),
    steps: r.steps,
    conditions,
    tools: recommended,
    topics: ['R01', 'R09', 'R14', 'R28'],
    tags: ['özel', c.profile, c.level],
  }, input);
  return { workflow, recommended, related, gates };
}
