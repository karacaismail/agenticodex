/**
 * Aile 5 — protokol ve etkileşim sıraları (sequenceDiagram).
 */
import type { Workflow } from '@/data/types';
import { Seq } from '../mermaid/builder';
import { Recorder, wf, type GenInput } from './common';

interface SeqDef {
  id: string;
  title: string;
  summary: string;
  tools: string[];
  topics: string[];
  tags: string[];
  conditions?: string[];
  build: (s: Seq, r: Recorder) => void;
}

const BASE: SeqDef[] = [
  {
    id: 'sr-agui-calistirma', title: 'AG-UI çalıştırması: HttpAgent ile olay akışı', tools: ['ag-ui', 'httpagent', 'sse'], topics: ['R08', 'R13', 'R14'], tags: ['protokol', 'ajan'],
    summary: 'HttpAgent POST ile çalıştırmayı başlatır; metin, araç ve durum olayları akar; interrupt onay ister; RunFinished akışın bittiğini söyler, sonucun doğrulandığını değil.',
    build: (s, r) => {
      const u = s.participant('Kullanıcı', true); const ui = s.participant('Panel (renderer)'); const ag = s.participant('HttpAgent'); const be = s.participant('Ajan sunucusu');
      s.msg(u, ui, 'Soru yazar'); s.msg(ui, ag, 'runAgent(threadId, runId)'); s.msg(ag, be, 'POST /run (Accept text/event-stream)');
      s.msg(be, ag, 'RUN_STARTED', 'reply'); s.msg(be, ag, 'TEXT_MESSAGE_CONTENT (parça)', 'reply'); s.msg(ag, ui, 'Metin akışı');
      s.msg(be, ag, 'TOOL_CALL_START / ARGS / END', 'reply'); s.msg(ag, ui, 'Araç durum kartı');
      s.msg(be, ag, 'STATE_DELTA (JSON Patch)', 'reply'); s.msg(ag, ui, 'Görünüm durumu güncellendi');
      s.alt([
        { label: 'onay gerekli', body: (x) => { x.msg(be, ag, 'interrupt', 'reply'); x.msg(ui, u, 'Onay kartı'); x.msg(u, ui, 'Onayla'); x.msg(ui, be, 'resume(runId)'); } },
        { label: 'onay gerekmiyor', body: (x) => x.msg(be, ag, 'RUN_FINISHED', 'reply') },
      ]);
      s.note([ui, be], 'Akış bitti ≠ sonuç doğrulandı');
      r.add('Başlat', 'runAgent + POST'); r.add('Olayları işle', 'Metin, araç, durum deltası'); r.add('Onay kesmesi', 'interrupt → resume', 'Etkili işlem varsa'); r.add('Bitiş', 'RUN_FINISHED ayrı doğrulanır');
    },
  },
  {
    id: 'sr-a2ui-yuzey', title: 'A2UI yüzey yaşamı: ajan → istemci tarifi', tools: ['a2ui', 'a2ui-react'], topics: ['R08', 'R09', 'R10'], tags: ['protokol', 'renderer'],
    summary: 'Ajan yüzey ve bileşen ağacını, ardından veri modelini gönderir; istemci kendi kataloğuyla çizer; kullanıcı eylemi ajana geri döner.',
    build: (s, r) => {
      const ag = s.participant('Ajan'); const c = s.participant('A2UI istemcisi'); const cat = s.participant('Bileşen kataloğu'); const u = s.participant('Kullanıcı', true);
      s.msg(ag, c, 'surfaceUpdate (bileşen ağacı)'); s.msg(c, cat, 'Bileşen adlarını çöz'); s.msg(cat, c, 'Bilinmeyen bileşen yok', 'reply');
      s.msg(ag, c, 'dataModelUpdate'); s.msg(ag, c, 'beginRendering'); s.msg(c, u, 'Yüzey görünür');
      s.msg(u, c, 'Düğmeye bastı'); s.msg(c, ag, 'userAction (bağlam + veri yolu)');
      s.opt('katalog dışı bileşen', (x) => x.msg(cat, c, 'Reddet, yedek metin göster', 'reply'));
      r.add('Tarif', 'surfaceUpdate'); r.add('Veri', 'dataModelUpdate'); r.add('Çizim', 'beginRendering'); r.add('Eylem', 'userAction ajana döner');
    },
  },
  {
    id: 'sr-json-render-specstream', title: 'json-render: SpecStream JSONL yamaları', tools: ['json-render', 'specstream', 'json-patch', 'jsonl', 'zod'], topics: ['R12', 'R09'], tags: ['akış', 'renderer'],
    summary: 'Model satır satır JSON Patch üretir; istemci tam satırı ayrıştırır, yamayı uygular, Zod kataloğuyla doğrular; bozuk satır son geçerli görünümü bozmaz.',
    build: (s, r) => {
      const m = s.participant('Model'); const sv = s.participant('Sunucu'); const p = s.participant('SpecStream ayrıştırıcı'); const v = s.participant('Katalog doğrulayıcı (Zod)'); const ui = s.participant('Görünüm');
      s.msg(m, sv, 'JSONL satırları'); s.msg(sv, p, 'Akış parçaları');
      s.loop('her tam satır', (x) => { x.msg(p, p, 'JSON.parse'); x.msg(p, v, 'op add/replace (RFC 6902)'); x.msg(v, ui, 'Geçerli tarif uygula', 'reply'); });
      s.alt([{ label: 'bozuk satır', body: (x) => x.msg(p, ui, 'Atla, son geçerli görünüm kalır', 'reply') }, { label: 'bilinmeyen bileşen', body: (x) => x.msg(v, ui, 'Reddet ve günlüğe yaz', 'reply') }]);
      r.add('Satırı tamamla'); r.add('Yamayı uygula', 'RFC 6902'); r.add('Kataloğa karşı doğrula', 'Zod'); r.add('Bozukta son geçerli görünüm');
    },
  },
  {
    id: 'sr-mcp-apps-iframe', title: 'MCP Apps: yalıtılmış iframe arayüzü', tools: ['mcp-apps', 'mcp', 'iframe-sandbox', 'csp'], topics: ['R08', 'R23'], tags: ['protokol', 'güvenlik'],
    summary: 'Araç ui:// kaynağı döndürür; host bunu sandbox iframe’de çizer; iframe yalnız postMessage ile host üzerinden araç çağırabilir.',
    conditions: ['Raporlar MCP Apps’i panel çekirdeğinde ertelemeyi öneriyor: yalıtım ve CSP zorunlu'],
    build: (s, r) => {
      const h = s.participant('Host (panel)'); const sv = s.participant('MCP sunucusu'); const f = s.participant('Sandbox iframe');
      s.msg(h, sv, 'tools/call'); s.msg(sv, h, 'Sonuç + ui:// kaynağı', 'reply'); s.msg(h, sv, 'resources/read ui://'); s.msg(sv, h, 'HTML (CSP ile)', 'reply');
      s.msg(h, f, 'srcdoc + sandbox'); s.msg(f, h, 'postMessage: araç isteği', 'async');
      s.alt([{ label: 'izinli', body: (x) => x.msg(h, sv, 'tools/call (host denetimi)') }, { label: 'izinsiz', body: (x) => x.msg(h, f, 'Reddedildi', 'reply') }]);
      r.add('Araç çağrısı'); r.add('UI kaynağını oku'); r.add('Yalıtılmış çiz', 'sandbox + CSP'); r.add('Host üzerinden eylem');
    },
  },
  {
    id: 'sr-tus-surdurme', title: 'Tus: kesintiden sonra kaldığı yerden sürdürme', tools: ['tus', 'uppy'], topics: ['R07', 'R14'], tags: ['dosya', 'dayanıklılık'],
    summary: 'POST ile yükleme oluşturulur, PATCH ile parçalar gider; bağlantı koparsa HEAD ile Upload-Offset sorgulanır ve kalan kısım gönderilir.',
    build: (s, r) => {
      const c = s.participant('İstemci (Uppy)'); const t = s.participant('Tus sunucusu');
      s.msg(c, t, 'POST Upload-Length'); s.msg(t, c, '201 Location', 'reply'); s.msg(c, t, 'PATCH Upload-Offset 0'); s.msg(t, c, '204 Upload-Offset N', 'reply');
      s.msg(c, t, 'PATCH (parça)', 'lost'); s.note([c, t], 'Ağ kesildi');
      s.msg(c, t, 'HEAD'); s.msg(t, c, 'Upload-Offset N', 'reply'); s.msg(c, t, 'PATCH Upload-Offset N'); s.msg(t, c, '204 tamam', 'reply');
      r.add('Oluştur', 'POST'); r.add('Gönder', 'PATCH'); r.add('Ofseti sor', 'HEAD', 'Bağlantı koparsa'); r.add('Sürdür', 'PATCH kalan');
    },
  },
  {
    id: 'sr-sse-last-event-id', title: 'SSE yeniden bağlanma ve olay yeniden oynatma', tools: ['sse', 'eventsource', 'last-event-id'], topics: ['R14'], tags: ['akış', 'dayanıklılık'],
    summary: 'Tarayıcı son olay kimliğini Last-Event-ID başlığıyla gönderir; sunucu kaçan olayları yeniden oynatır; istemci tekrarları kimliğe göre eler.',
    build: (s, r) => {
      const b = s.participant('Tarayıcı'); const sv = s.participant('Sunucu'); const log = s.participant('Olay günlüğü');
      s.msg(b, sv, 'GET /events'); s.msg(sv, b, 'id 41 … id 57', 'reply'); s.msg(sv, b, 'bağlantı koptu', 'lost');
      s.msg(b, sv, 'GET /events + Last-Event-ID 57'); s.msg(sv, log, '57 sonrası olaylar'); s.msg(log, sv, '58 … 63', 'reply'); s.msg(sv, b, 'Yeniden oynat 58 … 63', 'reply');
      s.note([b], 'Kimliği görülen olayları ele');
      r.add('İlk bağlantı'); r.add('Kopma'); r.add('Last-Event-ID ile yeniden bağlan'); r.add('Tekrarları ele');
    },
  },
  {
    id: 'sr-fetch-event-source-yetki', title: 'fetch-event-source: yetkili POST akışı', tools: ['fetch-event-source', 'abortcontroller'], topics: ['R14', 'R23'], tags: ['akış', 'yetki'],
    summary: 'EventSource’un yapamadığı POST gövdesi ve Authorization başlığı gönderilir; yeniden deneme politikası onerror’da uygulama tarafından verilir.',
    conditions: ['Kütüphanenin son sürümü 2021: bakım riski'],
    build: (s, r) => {
      const c = s.participant('İstemci'); const a = s.participant('Kimlik'); const sv = s.participant('API');
      s.msg(c, a, 'Erişim belirteci'); s.msg(a, c, 'token', 'reply'); s.msg(c, sv, 'POST /stream Authorization Bearer'); s.msg(sv, c, 'text/event-stream', 'reply');
      s.alt([{ label: '401', body: (x) => { x.msg(sv, c, '401', 'reply'); x.msg(c, a, 'Belirteci yenile'); x.msg(c, sv, 'Yeniden POST'); } }, { label: 'ağ hatası', body: (x) => x.msg(c, sv, 'Geri çekilmeli yeniden dene') }]);
      s.msg(c, sv, 'AbortController.abort()', 'async');
      r.add('Belirteç al'); r.add('Yetkili POST'); r.add('Hata politikası', '401 → yenile; ağ → geri çekil'); r.add('İptal', 'AbortController');
    },
  },
  {
    id: 'sr-websocket-nabiz', title: 'WebSocket: nabız ve sürdürme belirteci', tools: ['websocket'], topics: ['R14'], tags: ['akış', 'dayanıklılık'],
    summary: 'Çift yönlü kanal; canlılık ping/pong ile izlenir, kopmada sürdürme belirteciyle kaçan olaylar istenir.',
    build: (s, r) => {
      const c = s.participant('İstemci'); const sv = s.participant('WS sunucusu');
      s.msg(c, sv, 'Upgrade + alt protokol + kimlik'); s.msg(sv, c, '101', 'reply');
      s.loop('her 20 sn', (x) => { x.msg(c, sv, 'ping'); x.msg(sv, c, 'pong', 'reply'); });
      s.msg(sv, c, 'olay seq 120', 'reply'); s.msg(c, sv, 'kopma', 'lost'); s.msg(c, sv, 'resume token + seq 120'); s.msg(sv, c, 'seq 121 …', 'reply');
      r.add('El sıkışma'); r.add('Nabız'); r.add('Sürdürme belirteci');
    },
  },
  {
    id: 'sr-onay-yetki', title: 'Onaylı işlem: sunucu yetkisi ve idempotency', tools: ['ai-elements', 'ag-ui'], topics: ['R16', 'R23', 'R02'], tags: ['onay', 'güvenlik'],
    summary: 'AI öneri hazırlar, kullanıcı hedef/tutar/etkiyi inceler; sunucu yetkiyi ve tutarı yeniden denetler; tekrar gönderim aynı anahtarla tek işlem olur.',
    build: (s, r) => {
      const u = s.participant('Kullanıcı', true); const ui = s.participant('Onay kartı'); const ag = s.participant('Ajan'); const api = s.participant('İşlem API');
      s.msg(ag, ui, 'Gerekçeli öneri'); s.msg(ui, u, 'Hedef, değişiklik, etki, süre'); s.msg(u, ui, 'Onayla'); s.msg(ui, api, 'POST + Idempotency-Key');
      s.alt([{ label: 'yetkili', body: (x) => x.msg(api, ui, '200 uygulandı', 'reply') }, { label: 'yetkisiz', body: (x) => x.msg(api, ui, '403', 'reply') }, { label: 'zaman aşımı', body: (x) => { x.msg(ui, api, 'GET sonuç (aynı anahtar)'); x.msg(api, ui, 'durum', 'reply'); } }]);
      r.add('Öneri'); r.add('İnceleme'); r.add('Sunucu yetkisi'); r.add('Belirsiz sonuçta sorgu', 'Aynı idempotency anahtarı');
    },
  },
  {
    id: 'sr-iptal', title: 'İptal: istemci, sunucu ve geç gelen olay', tools: ['abortcontroller', 'ag-ui', 'xstate'], topics: ['R13', 'R14'], tags: ['iptal', 'durum'],
    summary: 'İstemci iptal ister; sunucu onaylayana kadar “iptal ediliyor” gösterilir; eski runId ile gelen geç olaylar atılır.',
    build: (s, r) => {
      const ui = s.participant('Panel'); const sv = s.participant('Sunucu'); const w = s.participant('İşçi');
      s.msg(ui, sv, 'POST /runs/r7/cancel'); s.msg(ui, ui, 'Durum: iptal ediliyor'); s.msg(sv, w, 'Durdur sinyali'); s.msg(w, sv, 'Durdu', 'reply'); s.msg(sv, ui, 'CANCELLED r7', 'reply');
      s.msg(sv, ui, 'geç olay (r7)', 'reply'); s.note([ui], 'runId eşleşmiyor veya iptal edildi: at');
      r.add('İptal iste'); r.add('Sunucu onayını bekle'); r.add('Geç olayı at', 'runId ve revizyon');
    },
  },
  {
    id: 'sr-gorunum-paylasim', title: 'Kayıtlı görünüm paylaşımı ve yeniden yetkilendirme', tools: ['tanstack-router'], topics: ['R17', 'R23'], tags: ['görünüm', 'yetki'],
    summary: 'Paylaşılan bağlantı açılınca görünüm tarifi yüklenir, alıcının yetkisi yeniden değerlendirilir; veri alıcı yetkisiyle yeniden sorgulanır.',
    build: (s, r) => {
      const a = s.participant('Alıcı', true); const app = s.participant('Uygulama'); const vs = s.participant('Görünüm deposu'); const auth = s.participant('Yetki'); const d = s.participant('Veri API');
      s.msg(a, app, '/view/v42'); s.msg(app, vs, 'Tarif v42'); s.msg(vs, app, 'tarif + katalog sürümü', 'reply'); s.msg(app, auth, 'Alıcı bu kaynaklara erişebilir mi?');
      s.alt([{ label: 'evet', body: (x) => { x.msg(app, d, 'Sorgu (alıcı yetkisiyle)'); x.msg(d, app, 'veri', 'reply'); } }, { label: 'kısmen', body: (x) => x.msg(app, a, 'Kısmi gösterim + gizlenen bölüm açıklaması', 'reply') }]);
      r.add('Tarifi yükle'); r.add('Yetkiyi yeniden değerlendir'); r.add('Alıcı yetkisiyle sorgula');
    },
  },
  {
    id: 'sr-grafik-dar-sema', title: 'Grafik: dar şema + veri referansı', tools: ['vega-lite', 'echarts'], topics: ['R19', 'R15'], tags: ['grafik', 'doğruluk'],
    summary: 'Model ham motor yapılandırması değil dar grafik şeması üretir; sayıları model değil sunucu hesaplar; birim ve eksen doğrulanır.',
    build: (s, r) => {
      const m = s.participant('Model'); const v = s.participant('Grafik doğrulayıcı'); const q = s.participant('Sorgu servisi'); const ch = s.participant('Grafik motoru');
      s.msg(m, v, 'tür, x, y, birim, toplama, veri referansı'); s.msg(v, q, 'Referansı çöz (kurum + yetki)'); s.msg(q, v, 'satırlar + kaynak + dönem', 'reply');
      s.alt([{ label: 'tutarlı', body: (x) => x.msg(v, ch, 'Spesifikasyon') }, { label: 'eksik veya belirsiz', body: (x) => x.msg(v, ch, 'Tabloya düş + belirsizlik kartı') }]);
      r.add('Dar şema'); r.add('Veri referansı'); r.add('Birim/eksen denetimi'); r.add('Güvenli yedek');
    },
  },
  {
    id: 'sr-otel-iz', title: 'OpenTelemetry: kullanıcıdan araca iz', tools: ['opentelemetry'], topics: ['R25'], tags: ['gözlem'],
    summary: 'Tek iz kimliği tarayıcı, API, ajan ve aracı bağlar; gecikmenin model, ağ, vekil ya da çizimden geldiği ayrıştırılır.',
    build: (s, r) => {
      const b = s.participant('Tarayıcı'); const api = s.participant('API'); const ag = s.participant('Ajan'); const t = s.participant('Araç'); const c = s.participant('Toplayıcı');
      s.msg(b, api, 'traceparent'); s.msg(api, ag, 'traceparent'); s.msg(ag, t, 'span araç'); s.msg(t, ag, 'sonuç', 'reply'); s.msg(ag, api, 'olaylar', 'reply'); s.msg(api, b, 'akış', 'reply');
      s.msg(b, c, 'render span (maskelenmiş)', 'async'); s.msg(api, c, 'sunucu span', 'async');
      r.add('İz başlat'); r.add('Bağlamı yay'); r.add('Maskeleyerek topla');
    },
  },
  {
    id: 'sr-kurum-onbellek', title: 'Kurum değişiminde önbellek temizliği', tools: ['tanstack-query'], topics: ['R15', 'R23'], tags: ['veri', 'güvenlik'],
    summary: 'Kurum değişince açık akışlar kapatılır, sorgu anahtarındaki kurum kimliğiyle önbellek temizlenir, yeni kurum için veri sıfırdan istenir.',
    build: (s, r) => {
      const u = s.participant('Kullanıcı', true); const app = s.participant('Uygulama'); const qc = s.participant('QueryClient'); const sv = s.participant('API');
      s.msg(u, app, 'Kurum B seç'); s.msg(app, sv, 'Açık akışları iptal et'); s.msg(app, qc, 'removeQueries kurum A'); s.msg(app, sv, 'Kurum B verisi'); s.msg(sv, app, 'veri', 'reply');
      r.add('Akışları kapat'); r.add('Önbelleği temizle'); r.add('Yeniden sorgula');
    },
  },
  {
    id: 'sr-alan-dogrulama', title: 'Dosyadan çıkarılan alanları kullanıcıya doğrulatma', tools: ['react-dropzone', 'uppy'], topics: ['R07', 'R16'], tags: ['dosya', 'form'],
    summary: 'Çıkarılan alanlar güven düzeyiyle taslak olarak gelir; kullanıcı düzeltir; düzeltme kaydedilir ve analiz yeniden koşulur.',
    build: (s, r) => {
      const u = s.participant('Kullanıcı', true); const ui = s.participant('Form'); const ex = s.participant('Çıkarıcı'); const an = s.participant('Analiz');
      s.msg(ex, ui, 'Alanlar + güven düzeyi'); s.msg(ui, u, 'Düşük güvenli alanlar vurgulu'); s.msg(u, ui, 'Para birimini düzelt'); s.msg(ui, an, 'Düzeltilmiş veriyle yeniden hesapla'); s.msg(an, ui, 'Sonuç (kaynaklı)', 'reply');
      r.add('Taslak alanlar'); r.add('Kullanıcı düzeltmesi'); r.add('Yeniden analiz');
    },
  },
  {
    id: 'sr-bilesen-secimi', title: 'Bağlama göre katalog alt kümesi ve temsil seçimi', tools: ['json-render', 'a2ui'], topics: ['R11', 'R10'], tags: ['katalog', 'ai'],
    summary: 'Modele bütün katalog değil bağlama göre seçilmiş alt küme verilir; eksik bilgide soru, emin değilse güvenli yedek (tablo/metin).',
    build: (s, r) => {
      const ui = s.participant('Panel'); const pl = s.participant('Planlayıcı (kurallar)'); const m = s.participant('Model'); const v = s.participant('Doğrulayıcı');
      s.msg(ui, pl, 'Amaç, veri türü, alan, risk'); s.msg(pl, m, 'Katalog alt kümesi (5 bileşen)'); s.msg(m, v, 'Seçim + özellikler');
      s.alt([{ label: 'geçerli', body: (x) => x.msg(v, ui, 'Çiz', 'reply') }, { label: 'eksik bilgi', body: (x) => x.msg(v, ui, 'Kullanıcıya soru sor', 'reply') }, { label: 'geçersiz', body: (x) => x.msg(v, ui, 'Tabloya veya metne düş', 'reply') }]);
      r.add('Bağlamı topla'); r.add('Alt küme'); r.add('Doğrula ve yedekle');
    },
  },
  {
    id: 'sr-form-koruma', title: 'AI arayüzü değiştirirken form koruması', tools: ['react-activity', 'react-concurrent'], topics: ['R16', 'R22'], tags: ['form', 'süreklilik'],
    summary: 'Kullanıcı yazarken gelen AI değişikliği öneri olarak bekletilir; bileşen kimliği korunur, odak kaybolmaz.',
    build: (s, r) => {
      const u = s.participant('Kullanıcı', true); const f = s.participant('Form'); const ai = s.participant('AI güncellemesi'); const st = s.participant('Durum sahibi');
      s.msg(u, f, 'Yazıyor'); s.msg(ai, st, 'Yeni düzen'); s.msg(st, f, 'Kirli alan var: öneri olarak beklet'); s.msg(f, u, 'Öneri rozeti'); s.msg(u, f, 'Kabul et'); s.msg(f, st, 'Birleştir (kimlik korunur)');
      r.add('Kirli alanı algıla'); r.add('Öneri olarak beklet'); r.add('Birleştir');
    },
  },
  {
    id: 'sr-coklu-sekme', title: 'Çoklu sekme: tek bağlantı, çok izleyici', tools: ['eventsource', 'last-event-id'], topics: ['R14', 'R27'], tags: ['çoklu-iş'],
    summary: 'Lider sekme bağlantıyı tutar ve olayları diğer sekmelere yayar; lider kapanınca yeni lider Last-Event-ID ile sürdürür.',
    build: (s, r) => {
      const a = s.participant('Sekme A (lider)'); const b = s.participant('Sekme B'); const sv = s.participant('Sunucu');
      s.msg(a, sv, 'GET /events'); s.msg(sv, a, 'olay 90', 'reply'); s.msg(a, b, 'yayın: olay 90', 'async'); s.note([a], 'Sekme kapandı'); s.msg(b, sv, 'GET /events + Last-Event-ID 90'); s.msg(sv, b, 'olay 91 …', 'reply');
      r.add('Lider seç'); r.add('Yayınla'); r.add('Devral');
    },
  },
];

/* ---------------------------------------------------------------- taşıma × protokol birleşimleri */
const TRANSPORTS = [
  { id: 'eventsource', name: 'EventSource', tools: ['eventsource', 'sse'], open: 'GET /stream (çerez oturumu)', note: 'Özel başlık yok: kimlik çerezle', retry: 'Otomatik yeniden bağlanma + Last-Event-ID' },
  { id: 'fetch-event-source', name: 'fetch-event-source', tools: ['fetch-event-source', 'sse'], open: 'POST /stream + Authorization', note: 'Başlık ve gövde gönderilebilir', retry: 'onerror politikası uygulamada' },
  { id: 'websocket', name: 'WebSocket', tools: ['websocket'], open: 'Upgrade + alt protokol', note: 'Çift yönlü; nabız gerekir', retry: 'Sürdürme belirteci + seq' },
  { id: 'http2', name: 'HTTP/2 SSE (vekil arkası)', tools: ['http2', 'sse'], open: 'GET /stream (h2)', note: 'Vekil tamponlaması kapatılmalı', retry: 'Last-Event-ID + nabız yorumu' },
];
const PROTOCOLS = [
  { id: 'agui', name: 'AG-UI', tools: ['ag-ui', 'httpagent'], first: 'RUN_STARTED', mid: 'TEXT_MESSAGE_CONTENT / TOOL_CALL_*', last: 'RUN_FINISHED', topics: ['R08', 'R13'] },
  { id: 'a2ui', name: 'A2UI', tools: ['a2ui'], first: 'surfaceUpdate', mid: 'dataModelUpdate', last: 'beginRendering', topics: ['R08', 'R09'] },
  { id: 'specstream', name: 'json-render SpecStream', tools: ['json-render', 'specstream', 'json-patch'], first: 'JSONL yama satırı', mid: 'op replace /elements', last: 'akış sonu', topics: ['R12'] },
  { id: 'openui', name: 'OpenUI Lang', tools: ['openui', 'openui-lang'], first: 'dil parçası', mid: 'artımlı ayrıştırma', last: 'tam belge', topics: ['R12', 'R09'] },
];

function combo(t: (typeof TRANSPORTS)[number], p: (typeof PROTOCOLS)[number]): SeqDef {
  const conds: string[] = [t.note];
  if (t.id === 'eventsource' && p.id === 'agui') conds.push('HttpAgent POST beklediği için EventSource yerine sunucu tarafı GET köprüsü gerekir');
  if (t.id === 'websocket') conds.push('Protokol taşımadan bağımsız: olay sırası uygulama katmanında seq ile korunur');
  if (p.id === 'openui') conds.push('Token tasarrufu iddiası satıcı ölçümü: ayrıca ölçülmeli');
  if (p.id === 'a2ui') conds.push('A2UI sürümü sabitlenmeli (olgunluk etiketleri belgelerde farklı)');
  return {
    id: `sr-${t.id}-${p.id}`,
    title: `${p.name} üzerinden ${t.name}`,
    summary: `${p.name} mesajları ${t.name} ile taşınır. ${t.note}. Kopmada: ${t.retry}.`,
    tools: [...t.tools, ...p.tools], topics: ['R14', ...p.topics], tags: ['taşıma', 'protokol', 'birleşim'], conditions: conds,
    build: (s, r) => {
      const c = s.participant('İstemci'); const ad = s.participant(`${p.name} adaptörü`); const sv = s.participant('Sunucu');
      if (t.id === 'eventsource' && p.id === 'agui') {
        s.msg(c, sv, 'POST /runs (çalıştırmayı oluştur)'); s.msg(sv, c, 'runId', 'reply');
      }
      s.msg(c, sv, t.open);
      if (t.id === 'websocket') s.loop('nabız', (x) => { x.msg(c, sv, 'ping'); x.msg(sv, c, 'pong', 'reply'); });
      s.msg(sv, ad, p.first, 'reply'); s.msg(sv, ad, p.mid, 'reply');
      s.msg(ad, c, 'Doğrulanmış güncelleme');
      s.msg(sv, c, 'kopma', 'lost'); s.msg(c, sv, t.retry);
      s.msg(sv, ad, p.last, 'reply'); s.msg(ad, c, 'Tamamlandı (ayrıca doğrula)');
      r.add('Bağlan', t.open); r.add('Protokol mesajları', `${p.first} → ${p.mid}`); r.add('Adaptörde doğrula'); r.add('Kopmada sürdür', t.retry); r.add('Bitiş', p.last);
    },
  };
}

export function sequenceFamily(input: GenInput): Workflow[] {
  const defs = [...BASE, ...TRANSPORTS.flatMap((t) => PROTOCOLS.map((p) => combo(t, p)))];
  return defs.map((d) => {
    const s = new Seq();
    const r = new Recorder();
    d.build(s, r);
    return wf({ id: d.id, title: d.title, family: 'protokol-sirasi', diagram: 'sequence', summary: d.summary, mermaid: s.toString(), steps: r.steps, conditions: d.conditions ?? [], tools: d.tools, topics: d.topics, tags: d.tags }, input);
  });
}
