/**
 * Aile 6 — bağlama göre koşullu karar ağaçları (14 karar × 4 profil).
 */
import type { Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { Recorder, styled, wf, toolName, type GenInput } from './common';

export type ProfileId = 'kucuk-ekip' | 'kurumsal' | 'coklu-platform' | 'veri-yogun';
export const PROFILES: { id: ProfileId; name: string; desc: string }[] = [
  { id: 'kucuk-ekip', name: 'Küçük ekip · hızlı prototip', desc: 'Az kişi, düşük bakım kapasitesi; entegrasyon yükü öncelikli.' },
  { id: 'kurumsal', name: 'Kurumsal · uyumluluk', desc: 'Lisans, erişilebilirlik, denetim ve güvenlik önce gelir.' },
  { id: 'coklu-platform', name: 'Çok platform', desc: 'Web dışında mobil/farklı istemciler; framework bağımsızlığı kritik.' },
  { id: 'veri-yogun', name: 'Veri yoğun analitik', desc: 'Büyük tablolar, çok grafik, yoğun akış; performans bütçesi kritik.' },
];

interface Outcome {
  key: string;
  label: string;
  tools: string[];
}
interface Question {
  q: string;
  yes: string; // outcome key ya da 'next'
  no: string;
  only?: ProfileId[];
  first?: ProfileId[];
}
interface Decision {
  id: string;
  title: string;
  topics: string[];
  questions: Question[];
  outcomes: Outcome[];
  fallback: string;
  notes: Partial<Record<ProfileId, string>>;
}

const D: Decision[] = [
  {
    id: 'ui-temeli', title: 'UI temeli seçimi', topics: ['R04'],
    questions: [
      { q: 'Kaynak kodunu sahiplenmek ister misin?', yes: 'shadcn', no: 'next' },
      { q: 'Yoğun kurumsal form/tablo gerekiyor mu?', yes: 'antd', no: 'next', first: ['kurumsal', 'veri-yogun'] },
      { q: 'Lisans ve erişilebilirlik denetimi zorunlu mu?', yes: 'aria', no: 'next', only: ['kurumsal'] },
      { q: 'React dışı istemci de olacak mı?', yes: 'daisy', no: 'next', only: ['coklu-platform'] },
      { q: 'Tek paketle zengin bileşen + grafik yeterli mi?', yes: 'mantine', no: 'next' },
    ],
    outcomes: [
      { key: 'shadcn', label: 'shadcn/ui + Radix', tools: ['shadcn-ui', 'radix'] },
      { key: 'antd', label: 'Ant Design + ProComponents', tools: ['ant-design', 'procomponents'] },
      { key: 'aria', label: 'React Aria temelinde kendi sistemin', tools: ['react-aria'] },
      { key: 'daisy', label: 'daisyUI (CSS) + headless ek', tools: ['daisyui', 'tailwind'] },
      { key: 'mantine', label: 'Mantine', tools: ['mantine'] },
      { key: 'mui', label: 'MUI + MUI X', tools: ['mui', 'mui-x'] },
    ],
    fallback: 'mui',
    notes: { 'kucuk-ekip': 'Bakım yükü: tek ana görsel sistem seç', kurumsal: 'MUI X Pro/Premium lisansını hesapla', 'coklu-platform': 'CSS sınıfları framework değişiminde taşınır', 'veri-yogun': 'Sanallaştırma ve tablo düzenleme deneyi şart' },
  },
  {
    id: 'hareket-motoru', title: 'Animasyon motoru seçimi', topics: ['R06'],
    questions: [
      { q: 'CSS geçişi / @starting-style yetiyor mu?', yes: 'css', no: 'next' },
      { q: 'Sayfa veya görünüm geçişi mi?', yes: 'vt', no: 'next' },
      { q: 'Liste ekle/çıkar yeterli mi?', yes: 'auto', no: 'next', first: ['kucuk-ekip'] },
      { q: 'React içinde yerleşim (layout) geçişi mi?', yes: 'motion', no: 'next', only: ['kucuk-ekip', 'veri-yogun', 'kurumsal'] },
      { q: 'Framework bağımsız zaman çizelgesi mi?', yes: 'gsap', no: 'next', first: ['coklu-platform'] },
      { q: 'Tasarımcı varlık animasyonu mu?', yes: 'rive', no: 'next' },
    ],
    outcomes: [
      { key: 'css', label: 'CSS + @starting-style + interpolate-size', tools: ['starting-style', 'interpolate-size'] },
      { key: 'vt', label: 'View Transitions (+ yedek davranış)', tools: ['view-transitions', 'react-viewtransition'] },
      { key: 'auto', label: 'AutoAnimate', tools: ['autoanimate'] },
      { key: 'motion', label: 'Motion', tools: ['motion'] },
      { key: 'gsap', label: 'GSAP (+ Flip)', tools: ['gsap', 'gsap-flip'] },
      { key: 'rive', label: 'Rive / dotLottie', tools: ['rive', 'dotlottie'] },
      { key: 'waapi', label: 'Web Animations API', tools: ['waapi'] },
    ],
    fallback: 'waapi',
    notes: { 'kucuk-ekip': 'Önce CSS; ölçülmeden JS motoru ekleme', kurumsal: 'GSAP lisansı Webflow kısıtını içerir', 'coklu-platform': 'Tarayıcı yerel yetenekler en taşınabilir', 'veri-yogun': 'Eşzamanlı hareket sayısını sınırla; INP ölç' },
  },
  {
    id: 'dosya-yukleyici', title: 'Dosya yükleyici seçimi', topics: ['R07'],
    questions: [
      { q: 'Kaldığı yerden sürdürme gerekli mi?', yes: 'next', no: 'dz' },
      { q: 'Sunucu Tus uç noktası kurabilir mi?', yes: 'uppy', no: 'next' },
      { q: 'Önizleme ve sunucu işleme/geri alma önemli mi?', yes: 'fp', no: 'next' },
      { q: 'Dosyalar saklama politikası ve virüs taraması gerektiriyor mu?', yes: 'uppy', no: 'next', only: ['kurumsal'] },
    ],
    outcomes: [
      { key: 'dz', label: 'react-dropzone + kendi yükleyicin', tools: ['react-dropzone'] },
      { key: 'uppy', label: 'Uppy + Tus', tools: ['uppy', 'tus'] },
      { key: 'fp', label: 'FilePond', tools: ['filepond'] },
    ],
    fallback: 'dz',
    notes: { 'kucuk-ekip': 'Uzantı kabulü içerik desteği değildir', kurumsal: 'Tür denetimi sunucuda; saklama süresi yazılı', 'coklu-platform': 'Tus istemcileri birçok platformda var', 'veri-yogun': 'Toplam ilerleme bayt ağırlıklı anlatılır' },
  },
  {
    id: 'tasima', title: 'Akış taşıması seçimi', topics: ['R14'],
    questions: [
      { q: 'İstemciden sunucuya sürekli veri gerekiyor mu?', yes: 'ws', no: 'next' },
      { q: 'Authorization başlığı veya POST gövdesi gerekiyor mu?', yes: 'fes', no: 'next' },
      { q: 'Çerezle oturum yeterli mi?', yes: 'es', no: 'next' },
      { q: 'Çok sekme aynı işi izleyecek mi?', yes: 'es', no: 'next', first: ['veri-yogun'] },
    ],
    outcomes: [
      { key: 'ws', label: 'WebSocket + nabız + sürdürme belirteci', tools: ['websocket'] },
      { key: 'fes', label: 'fetch-event-source (POST + başlık)', tools: ['fetch-event-source', 'sse'] },
      { key: 'es', label: 'EventSource (GET + Last-Event-ID)', tools: ['eventsource', 'last-event-id'] },
      { key: 'fetch', label: 'fetch + ReadableStream (kendi ayrıştırıcın)', tools: ['sse'] },
    ],
    fallback: 'fetch',
    notes: { 'kucuk-ekip': 'Taşıma seçimi protokolden ayrı tutulur', kurumsal: 'Belirteç kopyalanmasın; vekil zaman aşımı test edilir', 'coklu-platform': 'Protokol mesajları taşımadan bağımsız kalmalı', 'veri-yogun': 'HTTP/2 çoklama ve vekil tamponlaması ölçülür' },
  },
  {
    id: 'renderer', title: 'GenUI renderer seçimi', topics: ['R09', 'R08'],
    questions: [
      { q: 'Birden fazla istemci platformu mu?', yes: 'a2ui', no: 'next', first: ['coklu-platform'] },
      { q: 'Kendi bileşenlerin ve backend’in denetimde mi kalmalı?', yes: 'jr', no: 'next' },
      { q: 'AG-UI ile ajan entegrasyonu hazır mı olmalı?', yes: 'ck', no: 'next' },
      { q: 'Barındırılan ajan hizmeti kabul edilebilir mi?', yes: 'tambo', no: 'next', only: ['kucuk-ekip', 'veri-yogun'] },
      { q: 'Hazır adaylar somut ihtiyacı karşılıyor mu?', yes: 'jr', no: 'custom' },
    ],
    outcomes: [
      { key: 'a2ui', label: 'A2UI + uygun renderer', tools: ['a2ui', 'a2ui-react', 'a2ui-lit'] },
      { key: 'jr', label: 'json-render + uygulama kataloğu', tools: ['json-render'] },
      { key: 'ck', label: 'CopilotKit', tools: ['copilotkit', 'ag-ui'] },
      { key: 'tambo', label: 'Tambo', tools: ['tambo'] },
      { key: 'custom', label: 'Tamamen özel renderer', tools: ['zod', 'json-schema'] },
    ],
    fallback: 'custom',
    notes: { 'kucuk-ekip': 'Aynı 10 bileşenle iki küçük prototip kur', kurumsal: 'Bulut bağımlılığı ve veri akışı hedeflerini denetle', 'coklu-platform': 'A2UI renderer olgunluğu platformlar arasında farklı', 'veri-yogun': 'Büyük tabloyu model çıktısından geçirme; veri referansı kullan' },
  },
  {
    id: 'durum', title: 'Durum yönetimi yaklaşımı', topics: ['R13', 'R15'],
    questions: [
      { q: 'Sunucu verisi mi (önbellek, yeniden getirme)?', yes: 'tq', no: 'next' },
      { q: 'Paralel iş, iptal, zaman aşımı ve onay geçişleri var mı?', yes: 'xs', no: 'next' },
      { q: 'Tek ekranlık basit durum mu?', yes: 'reducer', no: 'next' },
      { q: 'Görünüm URL’de paylaşılmalı mı?', yes: 'router', no: 'reducer', first: ['kurumsal'] },
    ],
    outcomes: [
      { key: 'tq', label: 'TanStack Query (sunucu durumu)', tools: ['tanstack-query'] },
      { key: 'xs', label: 'XState (yaşam döngüsü)', tools: ['xstate'] },
      { key: 'reducer', label: 'useReducer / basit reducer', tools: ['react'] },
      { key: 'router', label: 'TanStack Router (URL durumu)', tools: ['tanstack-router'] },
    ],
    fallback: 'reducer',
    notes: { 'kucuk-ekip': 'XState ancak geçiş sayısı gerektirince', kurumsal: 'Kurum kimliği sorgu anahtarında', 'coklu-platform': 'Durum makinesi framework bağımsızdır', 'veri-yogun': 'AG-UI StateDelta ile önbellek çakışmasını ayır' },
  },
  {
    id: 'ayristirma', title: 'Akışlı tarif ayrıştırma stratejisi', topics: ['R12'],
    questions: [
      { q: 'Güncellemeler artımlı mı (aynı ağacı değiştiren)?', yes: 'patch', no: 'next' },
      { q: 'Her kayıt bağımsız mı?', yes: 'jsonl', no: 'next' },
      { q: 'Tek büyük nesne yavaş mı geliyor?', yes: 'partial', no: 'atomic' },
    ],
    outcomes: [
      { key: 'patch', label: 'JSON Patch (RFC 6902) / SpecStream', tools: ['json-patch', 'specstream'] },
      { key: 'jsonl', label: 'JSONL satırları', tools: ['jsonl'] },
      { key: 'partial', label: 'Kısmi JSON + alan tamamlanma kuralları', tools: ['zod'] },
      { key: 'atomic', label: 'Atomik mesaj (tamamı gelince uygula)', tools: ['json-schema'] },
    ],
    fallback: 'atomic',
    notes: { 'kucuk-ekip': 'Bozuk/tekrar/sırasız yama testleri baştan', kurumsal: 'Eylem parametresi tam doğrulanmadan etkin değil', 'coklu-platform': 'Biçim, istemciler arasında ortak sözleşme', 'veri-yogun': 'Güncellemeleri biriktir; çizimi önceliklendir' },
  },
  {
    id: 'grafik', title: 'Grafik motoru seçimi', topics: ['R19'],
    questions: [
      { q: 'Açık uçlu keşif soruları mı?', yes: 'vl', no: 'next' },
      { q: 'Çok büyük veri / canvas performansı gerekli mi?', yes: 'ec', no: 'next', first: ['veri-yogun'] },
      { q: 'Tasarım sistemiyle birebir React grafiği yeterli mi?', yes: 'rc', no: 'ec' },
    ],
    outcomes: [
      { key: 'vl', label: 'Vega-Lite (dar şema)', tools: ['vega-lite'] },
      { key: 'ec', label: 'Apache ECharts', tools: ['echarts'] },
      { key: 'rc', label: 'Recharts / Mantine Charts', tools: ['recharts'] },
    ],
    fallback: 'ec',
    notes: { 'kucuk-ekip': 'Tek motor yeterli; ikinci motor gerekçe ister', kurumsal: 'Dış veri kaynaklı ifadeleri kapat', 'coklu-platform': 'Bildirimsel spesifikasyon taşınabilir', 'veri-yogun': 'Toplama sunucuda; grafik–tablo aynı veri' },
  },
  {
    id: 'token', title: 'Token ve tema hattı', topics: ['R20'],
    questions: [
      { q: 'Tasarım kaynağı Figma mı?', yes: 'figma', no: 'next' },
      { q: 'Birden çok platforma tema üretilecek mi?', yes: 'sd', no: 'next', first: ['coklu-platform'] },
      { q: 'AI’a görsel ton seçimi açılacak mı?', yes: 'semantic', no: 'css' },
    ],
    outcomes: [
      { key: 'figma', label: 'Figma → DTCG → Style Dictionary', tools: ['figma', 'design-tokens', 'style-dictionary'] },
      { key: 'sd', label: 'DTCG + Style Dictionary', tools: ['design-tokens', 'style-dictionary'] },
      { key: 'semantic', label: 'Yalnız semantik token sözlüğü', tools: ['design-tokens'] },
      { key: 'css', label: 'CSS değişkenleri', tools: ['tailwind'] },
    ],
    fallback: 'css',
    notes: { 'kucuk-ekip': 'Kayıpsız dönüşüm kanıtlanmadı: küçük başla', kurumsal: 'Kontrast testi sürüm geçişinde zorunlu', 'coklu-platform': 'Tek kaynak, çok çıktı', 'veri-yogun': 'Durum renkleri gerçek sonuçtan gelir, AI’dan değil' },
  },
  {
    id: 'test', title: 'Test stratejisi', topics: ['R24'],
    questions: [
      { q: 'Akış kesintisi ve bozuk olay tekrar üretilmeli mi?', yes: 'msw', no: 'next' },
      { q: 'Uçtan uca kullanıcı akışı mı?', yes: 'pw', no: 'next' },
      { q: 'Bileşen durumları kataloglanmalı mı?', yes: 'sb', no: 'vt', first: ['kurumsal'] },
    ],
    outcomes: [
      { key: 'msw', label: 'MSW ile kayıtlı olay yeniden oynatma', tools: ['msw'] },
      { key: 'pw', label: 'Playwright + axe', tools: ['playwright', 'axe'] },
      { key: 'sb', label: 'Storybook durum kataloğu', tools: ['storybook'] },
      { key: 'vt', label: 'Vitest + Testing Library', tools: ['vitest', 'testing-library'] },
    ],
    fallback: 'vt',
    notes: { 'kucuk-ekip': 'Gerçek arızalardan regresyon seti', kurumsal: 'Erişilebilirlik otomasyonu manuel testin yerini tutmaz', 'coklu-platform': 'Sözleşme testleri platform başına', 'veri-yogun': 'Düşük güçlü cihazda yük testi' },
  },
  {
    id: 'gozlem', title: 'Gözlemlenebilirlik yaklaşımı', topics: ['R25'],
    questions: [
      { q: 'Gecikmenin kaynağı (model/ağ/vekil/çizim) ayrılmalı mı?', yes: 'otel', no: 'next' },
      { q: 'Etkileşim yanıt süresi izlenecek mi?', yes: 'inp', no: 'otel' },
    ],
    outcomes: [
      { key: 'otel', label: 'OpenTelemetry uçtan uca iz', tools: ['opentelemetry'] },
      { key: 'inp', label: 'INP ve uzun görev ölçümü', tools: ['inp'] },
    ],
    fallback: 'otel',
    notes: { 'kucuk-ekip': 'Tek iz kimliği bile büyük kazanç', kurumsal: 'Hassas veri maskelenmeden günlüğe yazılmaz', 'coklu-platform': 'İz bağlamı her istemcide yayılmalı', 'veri-yogun': 'Çizim span’ları ayrı ölçülür' },
  },
  {
    id: 'izolasyon', title: 'Üretilen içerik için güvenlik sınırı', topics: ['R23', 'R02'],
    questions: [
      { q: 'Çıktı yalnız katalog bileşenlerinden mi oluşuyor?', yes: 'decl', no: 'next' },
      { q: 'Serbest HTML/JS gerçekten gerekli mi?', yes: 'iframe', no: 'text' },
      { q: 'Kullanıcı içeriği HTML olarak gösterilecek mi?', yes: 'purify', no: 'next', only: ['kurumsal'] },
    ],
    outcomes: [
      { key: 'decl', label: 'Bildirimsel katalog + sunucuda eylem yetkisi', tools: ['json-render', 'owasp-llm'] },
      { key: 'iframe', label: 'Sandbox iframe + CSP', tools: ['iframe-sandbox', 'csp'] },
      { key: 'purify', label: 'DOMPurify + Trusted Types', tools: ['dompurify', 'trusted-types'] },
      { key: 'text', label: 'Düz metne / dar temsile dön', tools: ['owasp-llm'] },
    ],
    fallback: 'text',
    notes: { 'kucuk-ekip': 'JSON yazdırmak yetkiyi daraltmaz', kurumsal: 'LLM05: güvensiz çıktı işleme testleri', 'coklu-platform': 'Her istemci aynı politika', 'veri-yogun': 'Grafik tarifindeki dış URL’leri kapat' },
  },
  {
    id: 'bekleme', title: 'Bekleme göstergesi seçimi', topics: ['R05'],
    questions: [
      { q: 'İlerleme ölçülebilir mi (bayt, adım)?', yes: 'pct', no: 'next' },
      { q: 'Aşamalar biliniyor mu?', yes: 'stages', no: 'next' },
      { q: 'Kısmi sonuç erken gösterilebilir mi?', yes: 'partial', no: 'next' },
      { q: 'Yerleşim önceden biliniyor mu?', yes: 'skel', no: 'spin' },
    ],
    outcomes: [
      { key: 'pct', label: 'Gerçek yüzde', tools: ['numberflow'] },
      { key: 'stages', label: 'Aşama listesi', tools: ['thoughtchain'] },
      { key: 'partial', label: 'Kısmi sonuç + kalan iş', tools: ['react-suspense'] },
      { key: 'skel', label: 'İskelet (gecikmeli, en az görünürlükle)', tools: ['semrush-intergalactic'] },
      { key: 'spin', label: 'Gecikmeli spinner', tools: ['kolibri'] },
    ],
    fallback: 'spin',
    notes: { 'kucuk-ekip': 'Sahte yüzde yok', kurumsal: 'Azaltılmış harekette anlam korunur', 'coklu-platform': 'Metin açıklaması her platformda', 'veri-yogun': 'Eşzamanlı gösterge sayısını sınırla' },
  },
  {
    id: 'gorunum', title: 'Kayıtlı görünüm modeli', topics: ['R17'],
    questions: [
      { q: 'Kullanıcı güncel veriyi mi bekliyor?', yes: 'live', no: 'next' },
      { q: 'Denetim veya karar kaydı mı?', yes: 'snap', no: 'next', first: ['kurumsal'] },
      { q: 'Başkasıyla paylaşılacak mı?', yes: 'both', no: 'live' },
    ],
    outcomes: [
      { key: 'live', label: 'Canlı görünüm (sorgu + tarif)', tools: ['tanstack-query'] },
      { key: 'snap', label: 'Anlık görüntü (değişmez veri sürümü)', tools: ['indexeddb'] },
      { key: 'both', label: 'Canlı + tarihli anlık görüntü + yeniden yetkilendirme', tools: ['tanstack-router'] },
    ],
    fallback: 'live',
    notes: { 'kucuk-ekip': 'URL filtreyi taşır; kalıcı kayıt sunucuda', kurumsal: 'Paylaşımda erişim yeniden değerlendirilir', 'coklu-platform': 'Görünüm kimliği platformdan bağımsız', 'veri-yogun': 'Yeniden açılış yeni model çağrısı gerektirmemeli' },
  },
];

const isTerminal = (q: Question) => q.yes !== 'next' && q.no !== 'next';

/** Profile göre soru sırası: öne alınanlar, sonra diğerleri; iki dalı da sonuca giden soru en sona. */
export function questionsFor(d: Decision, p: ProfileId): Question[] {
  const qs = d.questions.filter((q) => !q.only || q.only.includes(p));
  const open = qs.filter((q) => !isTerminal(q));
  const first = open.filter((q) => q.first?.includes(p));
  const rest = open.filter((q) => !q.first?.includes(p));
  const terminal = qs.filter(isTerminal).slice(0, 1);
  return [...first, ...rest, ...terminal];
}

export function decisionFamily(input: GenInput): Workflow[] {
  const out: Workflow[] = [];
  for (const d of D) {
    for (const p of PROFILES) {
      const f = new Flow('TD');
      const r = new Recorder();
      const conditions: string[] = [p.desc];
      const s = f.node(`${d.title}\nProfil: ${p.name}`, 'stadium', 'start');
      const qs = questionsFor(d, p.id);
      const outNodes = new Map<string, string>();
      const outNode = (key: string) => {
        if (!outNodes.has(key)) {
          const o = d.outcomes.find((x) => x.key === key)!;
          outNodes.set(key, f.node(`${o.label}\n${o.tools.map((t) => toolName(input, t)).join(', ')}`, 'stadium', 'end'));
        }
        return outNodes.get(key)!;
      };
      let prev = s;
      let prevLabel: string | undefined;
      qs.forEach((q, i) => {
        const qn = f.node(q.q, 'decision', 'decide');
        f.edge(prev, qn, prevLabel);
        r.add(`Soru ${i + 1}`, q.q, q.only ? `Yalnız bu profilde sorulur` : q.first?.includes(p.id) ? 'Bu profilde öne alındı' : undefined);
        if (q.only) conditions.push(`“${q.q}” sorusu yalnız ${p.name} profilinde soruluyor`);
        if (q.first?.includes(p.id)) conditions.push(`“${q.q}” bu profilde öne alındı`);
        const yesNext = q.yes === 'next';
        const noNext = q.no === 'next';
        if (!yesNext) f.edge(qn, outNode(q.yes), 'evet');
        if (!noNext) f.edge(qn, outNode(q.no), 'hayır');
        prev = qn;
        prevLabel = yesNext ? 'evet' : 'hayır';
        if (yesNext && noNext) prevLabel = undefined;
      });
      if (!qs.length || !isTerminal(qs[qs.length - 1])) f.edge(prev, outNode(d.fallback), prevLabel);
      const note = d.notes[p.id];
      if (note) {
        const nn = f.node(`Profil notu: ${note}`, 'flag', 'warn');
        outNodes.forEach((id) => f.edge(id, nn, undefined, 'dotted'));
        r.add('Profil notu', note);
      }
      d.outcomes.filter((o) => outNodes.has(o.key)).forEach((o) => r.add(`Sonuç: ${o.label}`, o.tools.map((t) => toolName(input, t)).join(', ')));
      styled(f, ['start', 'end', 'decide', 'warn']);
      const tools = d.outcomes.filter((o) => outNodes.has(o.key)).flatMap((o) => o.tools);
      out.push(wf({
        id: `karar-${d.id}-${p.id}`,
        title: `${d.title} · ${p.name}`,
        family: 'karar-agaci',
        diagram: 'flowchart',
        summary: `${qs.length} soruluk karar ağacı; ${outNodes.size} olası sonuç. ${p.desc}`,
        mermaid: f.toString(),
        steps: r.steps,
        conditions,
        tools,
        topics: d.topics,
        tags: ['karar', p.id],
      }, input));
    }
  }
  return out;
}
