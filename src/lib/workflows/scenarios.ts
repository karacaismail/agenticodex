/**
 * Aile 7 — kullanıcı senaryoları × GenUI kontrol düzeyi; Aile 8 — arıza kipleri × bağlam.
 */
import type { Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { Recorder, styled, wf, type GenInput } from './common';

interface Scenario {
  id: string;
  name: string;
  persona: string;
  goal: string;
  steps: string[];
  risk: string;
  riskRecovery: string;
  critical: boolean;
  tools: string[];
  topics: string[];
}

const SCENARIOS: Scenario[] = [
  { id: 'iade-analizi', name: 'İade nedenleri analizi', persona: 'Tolga (e-ticaret)', goal: 'Geçen ayın iade nedenlerini anlamak', steps: ['Soruyu yazar', 'Üç sonuç kartı', 'Nedenlere göre tablo', 'Haftalara göre karşılaştır'], risk: 'Filtre yanlış dönemi kapsar', riskRecovery: 'Dönem ve kaynak kartta görünür; kullanıcı düzeltir', critical: false, tools: ['echarts', 'tanstack-query'], topics: ['R01', 'R19'] },
  { id: 'teklif-karsilastirma', name: 'Teklif belgelerini karşılaştırma', persona: 'Tolga (satın alma)', goal: 'Üç teklifi aynı ölçütlerle karşılaştırıp onayla kaydetmek', steps: ['Üç dosya yükler', 'Dosya durumları', 'Karşılaştırma tablosu', 'Para birimini düzeltir', 'Onayla kaydeder'], risk: 'Bir dosya okunamaz', riskRecovery: 'Diğer dosyalar kullanılabilir kalır', critical: true, tools: ['uppy', 'tus', 'json-render'], topics: ['R07', 'R28'] },
  { id: 'toplu-dosya', name: 'Toplu dosya analizi', persona: 'Analist', goal: '13 PDF ve bir Excel’i işlemek', steps: ['Dosyaları bırakır', 'Aktarım ilerlemesi', '9 dosya okundu', '2 dosya parola istiyor', 'Kısmi rapor'], risk: 'Parolalı dosyalar bütün ilerlemeyi kilitler', riskRecovery: 'Kısmi sonuç açılır; parola bekleyenler ayrı listelenir', critical: false, tools: ['react-dropzone', 'uppy', 'filepond'], topics: ['R07', 'R05'] },
  { id: 'toplu-islem-onayi', name: 'Onaylı toplu işlem', persona: 'Operasyon yöneticisi', goal: 'AI’ın önerdiği 40 müşteriye bildirim göndermek', steps: ['AI hedef listesi önerir', 'Etki ve tutar özeti', 'Açık onay', 'Sunucu yetkisi', 'Sonuç kaydı'], risk: 'Çift tıklama iki kez gönderir', riskRecovery: 'Idempotency anahtarıyla tek işlem', critical: true, tools: ['ai-elements', 'ag-ui'], topics: ['R16', 'R23'] },
  { id: 'rapor-paylasimi', name: 'Rapor paylaşımı', persona: 'Ekip lideri', goal: 'Ürettiği görünümü ekibiyle paylaşmak', steps: ['Görünümü kaydeder', 'Canlı/anlık seçer', 'Bağlantı paylaşır', 'Alıcı açar'], risk: 'Alıcı yetkisi olmayan veriyi görür', riskRecovery: 'Yetki yeniden değerlendirilir; kısmi gösterim', critical: false, tools: ['tanstack-router'], topics: ['R17'] },
  { id: 'canli-pano', name: 'Canlı pano izleme', persona: 'Destek sorumlusu', goal: 'Açık talepleri anlık izlemek', steps: ['Panoyu açar', 'Akış bağlanır', 'Sayılar güncellenir', 'Anomali uyarısı'], risk: 'Bağlantı sessizce kopar', riskRecovery: 'Nabız ve “son güncelleme” zamanı', critical: false, tools: ['sse', 'numberflow'], topics: ['R14', 'R05'] },
  { id: 'grafik-secimi', name: 'Uygun grafik seçimi', persona: 'Pazarlama analisti', goal: 'Kanal performansını karşılaştırmak', steps: ['Karşılaştırma ister', 'Grafik önerisi', 'Tabloya geçiş', 'Birim kontrolü'], risk: 'Yanıltıcı eksen', riskRecovery: 'Dar şema + birim denetimi; tabloya yedek', critical: false, tools: ['vega-lite', 'echarts'], topics: ['R19', 'R11'] },
  { id: 'form-taslagi', name: 'AI destekli form taslağı', persona: 'Muhasebe uzmanı', goal: 'Faturadan kayıt formu doldurmak', steps: ['Faturayı yükler', 'Alanlar taslak dolar', 'Kullanıcı düzeltir', 'Doğrulama', 'Kaydet'], risk: 'AI güncellemesi yazılanı siler', riskRecovery: 'Kirli alan korunur; öneri olarak bekletilir', critical: true, tools: ['json-schema', 'zod', 'react-activity'], topics: ['R16'] },
  { id: 'uzun-arastirma', name: 'Uzun araştırma işi', persona: 'Strateji analisti', goal: 'Büyük belge kümesinden sentez çıkarmak', steps: ['İşi başlatır', 'Parçalar işlenir', 'Ara sonuçlar', 'Çelişki taraması', 'Sentez'], risk: 'Parçalar arası ilişki kaybolur', riskRecovery: 'Özgün pasaja dönüş ve çelişki taraması', critical: false, tools: ['ag-ui', 'xstate'], topics: ['R12', 'R15', 'R27'] },
  { id: 'coklu-sekme-is', name: 'Birden çok sekmede uzun iş', persona: 'Veri mühendisi', goal: 'İki sekmede aynı işi izlemek', steps: ['İşi başlatır', 'İkinci sekme açar', 'Bir sekme kapanır', 'Sonuç diğerinde'], risk: 'Yanlış iptal güveni', riskRecovery: 'Sunucu onayı ve sonuç sorgusu', critical: false, tools: ['eventsource', 'last-event-id'], topics: ['R14', 'R27'] },
  { id: 'banka-hesabi', name: 'Banka hesabı değişikliği', persona: 'Finans yöneticisi', goal: 'Tedarikçi IBAN’ını güncellemek', steps: ['Tedarikçiyi bulur', 'Yeni IBAN', 'İkinci onay', 'Denetim kaydı'], risk: 'Sahte değişiklik talebi', riskRecovery: 'Sabit ekran + çift onay; AI yalnız bağlantı önerir', critical: true, tools: ['owasp-llm'], topics: ['R01', 'R02', 'R23'] },
  { id: 'kurum-degistirme', name: 'Kurum değiştirme', persona: 'Danışman (çok müşterili)', goal: 'Müşteri A’dan B’ye geçmek', steps: ['Kurum seçer', 'Açık işler kapanır', 'Önbellek temizlenir', 'B verisi yüklenir'], risk: 'Önbellekte kurum karışması', riskRecovery: 'Kurum kimliği sorgu anahtarında; temizlik testi', critical: true, tools: ['tanstack-query'], topics: ['R15', 'R23'] },
];

const LEVELS = [
  { id: 'sabit', name: 'Sabit panel', desc: 'Karşılaştırmanın zorunlu temel çizgisi: önceden tasarlanmış ekran.' },
  { id: 'kontrollu', name: 'Kontrollü seçim', desc: 'AI yalnız izinli katalog parçasını seçer.' },
  { id: 'bildirimsel', name: 'Bildirimsel düzen', desc: 'AI izinli parçalarla yeni düzen kurar; kullanıcı durumu korunur.' },
] as const;

export function scenarioFamily(input: GenInput): Workflow[] {
  const out: Workflow[] = [];
  for (const sc of SCENARIOS) {
    for (const lv of LEVELS) {
      const f = new Flow('TD');
      const r = new Recorder();
      const conditions: string[] = [lv.desc];
      const s = f.node(`${sc.name}\n${lv.name}`, 'stadium', 'start');
      const who = f.node(`${sc.persona}: ${sc.goal}`, 'rect', 'user');
      f.edge(s, who);
      r.add('Hedef', `${sc.persona}: ${sc.goal}`);
      let prev = who;
      if (sc.critical && lv.id !== 'sabit') {
        const guard = f.node('Kritik iş: kabuk ve eylem sabit kalır; AI yalnız öneri yapar', 'flag', 'risk');
        f.edge(prev, guard);
        prev = guard;
        r.add('Kritik iş koruması', 'Sentez: tekrarlı ve etkili işlerde yerleşim öğrenilebilir kalmalı.', 'Kritik senaryo');
        conditions.push('Kritik senaryo olduğu için AI eylem yetkisi daraltıldı');
      }
      if (lv.id === 'sabit') {
        const nav = f.node('Menüden ilgili sayfaya git', 'rect');
        f.edge(prev, nav);
        prev = nav;
        r.add('Sabit gezinme');
      } else {
        const ctx = f.node('Bağlam: amaç, veri türü, alan, risk', 'rect', 'data');
        const sel = f.node(lv.id === 'kontrollu' ? 'AI katalog alt kümesinden bileşen seçer' : 'AI izinli parçalarla düzen kurar', 'rect', 'ai');
        const val = f.node('Katalog + veri + eylem doğrulaması', 'decision', 'decide');
        const fb = f.node('Güvenli yedek: tablo veya metin', 'rect', 'warn');
        f.edge(prev, ctx).edge(ctx, sel).edge(sel, val).edge(val, fb, 'geçersiz');
        r.add('Bağlamı topla'); r.add(lv.id === 'kontrollu' ? 'Bileşen seçimi' : 'Düzen kompozisyonu'); r.add('Doğrula', 'Geçersizse güvenli yedek');
        prev = val;
        if (lv.id === 'bildirimsel') {
          const keep = f.node('Kullanıcı taslağı, odak ve seçim korunur', 'rect', 'user');
          f.edge(val, keep, 'geçerli');
          prev = keep;
          r.add('Kullanıcı durumunu koru', undefined, 'Bildirimsel düzen');
          conditions.push('Bildirimsel düzende kullanıcı durumunu koruma adımı eklendi');
        }
      }
      sc.steps.forEach((st, i) => {
        const n = f.node(st, 'rect', i === sc.steps.length - 1 ? 'end' : undefined);
        f.edge(prev, n, prev.startsWith('n') && i === 0 && lv.id === 'kontrollu' ? 'geçerli' : undefined);
        prev = n;
        r.add(st);
      });
      const risk = f.node(`Risk: ${sc.risk}`, 'flag', 'risk');
      const rec = f.node(sc.riskRecovery, 'rect', 'end');
      f.edge(prev, risk, 'arıza', 'dotted').edge(risk, rec);
      r.add(`Risk: ${sc.risk}`, sc.riskRecovery);
      const metric = f.node('Ölç: görev başarısı, hata, düzeltme süresi', 'sub', 'gate');
      f.edge(rec, metric).edge(prev, metric);
      r.add('Ölç', 'Aynı iş, veri ve yetkiyle üç düzey karşılaştırılır (sentez §12.3).');
      styled(f, ['start', 'end', 'decide', 'risk', 'warn', 'data', 'ai', 'user', 'gate']);
      out.push(wf({
        id: `senaryo-${sc.id}-${lv.id}`,
        title: `${sc.name} · ${lv.name}`,
        family: 'senaryo',
        diagram: 'flowchart',
        summary: `${sc.persona} ${sc.goal.toLocaleLowerCase('tr')} istiyor. ${lv.desc} Risk: ${sc.risk.toLocaleLowerCase('tr')}.`,
        mermaid: f.toString(),
        steps: r.steps,
        conditions,
        tools: sc.tools,
        topics: [...sc.topics, 'R01'],
        tags: ['senaryo', lv.id, sc.critical ? 'kritik' : 'standart'],
      }, input));
    }
  }
  return out;
}

/* ---------------------------------------------------------------- arıza kipleri */
const FAILURES = [
  { id: 'bozuk-mesaj', name: 'Bozuk mesaj', detect: 'Ayrıştırma hatası', tools: ['jsonl', 'json-patch'], topics: ['R12', 'R24'] },
  { id: 'bilinmeyen-bilesen', name: 'Bilinmeyen bileşen', detect: 'Katalogda yok', tools: ['json-render', 'a2ui'], topics: ['R10', 'R12'] },
  { id: 'tekrar-olay', name: 'Tekrarlı olay', detect: 'Aynı olay kimliği ikinci kez', tools: ['last-event-id'], topics: ['R14'] },
  { id: 'sirasiz-olay', name: 'Sırası değişmiş olay', detect: 'Revizyon numarası geride', tools: ['json-patch'], topics: ['R12', 'R14'] },
  { id: 'baglanti-kesilmesi', name: 'Bağlantı kesilmesi', detect: 'onerror / close', tools: ['sse', 'websocket'], topics: ['R14'] },
  { id: 'sessizlik', name: 'Sessizlik / zaman aşımı', detect: 'Nabız yok', tools: ['sse'], topics: ['R13', 'R14'] },
  { id: 'kullanici-iptali', name: 'Kullanıcı iptali', detect: 'İptal düğmesi', tools: ['abortcontroller'], topics: ['R13'] },
  { id: 'gec-olay', name: 'Geç gelen olay (eski çalıştırma)', detect: 'runId eşleşmiyor', tools: ['xstate'], topics: ['R13'] },
  { id: 'yetki-reddi', name: 'Yetki reddi (403)', detect: 'Sunucu 403', tools: ['owasp-llm'], topics: ['R23', 'R16'] },
  { id: 'sema-disi-veri', name: 'Şema dışı veri (birim/tarih)', detect: 'Doğrulayıcı reddi', tools: ['zod', 'json-schema'], topics: ['R15', 'R19'] },
  { id: 'katalog-disi-cikti', name: 'Model katalog dışı çıktı', detect: 'İzinli sınıf dışı', tools: ['owasp-llm'], topics: ['R11', 'R02'] },
  { id: 'tarayici-destegi', name: 'Tarayıcı desteği yok', detect: 'Özellik algılama başarısız', tools: ['view-transitions', 'can-i-use'], topics: ['R06', 'R21'] },
];
const CONTEXTS = [
  { id: 'akis', name: 'Akışlı yanıt', keep: 'Son geçerli görünüm korunur', recover: 'Yeniden bağlan ve kaçan olayları oynat', tools: ['sse'] },
  { id: 'dosya', name: 'Dosya hattı', keep: 'Diğer dosyaların sonuçları açık kalır', recover: 'Dosyayı yeniden dene veya hariç tut', tools: ['uppy'] },
  { id: 'form', name: 'Form ve eylem', keep: 'Kullanıcının yazdıkları ve odak korunur', recover: 'İşlemi sonuç sorgusuyla doğrula', tools: ['react-activity'] },
];

export function failureFamily(input: GenInput): Workflow[] {
  const out: Workflow[] = [];
  for (const fm of FAILURES) {
    for (const cx of CONTEXTS) {
      const f = new Flow('LR');
      const r = new Recorder();
      const s = f.node(`${fm.name}\n${cx.name}`, 'stadium', 'risk');
      const d = f.node(`Algıla: ${fm.detect}`, 'rect', 'data');
      const iso = f.node('Yalıt: yalnız etkilenen parça', 'rect');
      const keep = f.node(cx.keep, 'rect', 'user');
      const tell = f.node('Kullanıcıya ne olduğunu ve seçenekleri söyle', 'rect', 'user');
      const ch = f.node('Kendiliğinden düzelir mi?', 'decision', 'decide');
      const auto = f.node(cx.recover, 'rect', 'end');
      const man = f.node('Kullanıcı seçimi: tekrar dene, atla, iptal', 'rect', 'warn');
      const log = f.node('İz kimliğiyle günlüğe yaz (maskeli)', 'db', 'data');
      const reg = f.node('Regresyon testine ekle', 'sub', 'gate');
      f.edge(s, d).edge(d, iso).edge(iso, keep).edge(keep, tell).edge(tell, ch).edge(ch, auto, 'evet').edge(ch, man, 'hayır').edge(auto, log).edge(man, log).edge(log, reg);
      ['Algıla', 'Yalıt', cx.keep, 'Kullanıcıya açıkla', 'Kurtarma kararı', cx.recover, 'Günlüğe yaz', 'Regresyon testi'].forEach((x, i) => r.add(x, i === 0 ? fm.detect : undefined));
      styled(f, ['end', 'decide', 'risk', 'warn', 'data', 'user', 'gate']);
      out.push(wf({
        id: `ariza-${fm.id}-${cx.id}`,
        title: `${fm.name} · ${cx.name}`,
        family: 'ariza',
        diagram: 'flowchart',
        summary: `${cx.name} bağlamında “${fm.name.toLocaleLowerCase('tr')}” arızası: algıla → yalıt → koru → açıkla → kurtar → günlüğe yaz → regresyon.`,
        mermaid: f.toString(),
        steps: r.steps,
        conditions: [`Bağlam: ${cx.name} — ${cx.keep.toLocaleLowerCase('tr')}`],
        tools: [...fm.tools, ...cx.tools, 'opentelemetry'],
        topics: [...fm.topics, 'R24', 'R25'],
        tags: ['arıza', cx.id],
      }, input));
    }
  }
  return out;
}
