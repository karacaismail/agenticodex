/**
 * Aile 4 — yaşam döngüsü durum makineleri (stateDiagram-v2) ve araç varyantları.
 */
import type { Workflow } from '@/data/types';
import { StateD } from '../mermaid/builder';
import { Recorder, wf, type GenInput } from './common';

type T = [string, string, string?];
interface LcDef {
  id: string;
  title: string;
  summary: string;
  states: string[];
  start: string;
  ends: string[];
  trans: T[];
  notes?: [string, string][];
  composite?: { name: string; states: string[]; trans: T[]; start: string; end: string; attachFrom: string; attachTo: string };
  choice?: { from: string; branches: [string, string][] };
  tools: string[];
  topics: string[];
  tags: string[];
  conditions?: string[];
}

function build(d: LcDef, input: GenInput, family = 'yasam-dongusu'): Workflow {
  const s = new StateD();
  const r = new Recorder();
  const id = new Map<string, string>();
  d.states.forEach((x) => id.set(x, s.state(x)));
  s.start(id.get(d.start)!);
  d.trans.forEach(([a, b, l]) => {
    s.trans(id.get(a)!, id.get(b)!, l);
    r.add(`${a} → ${b}`, l);
  });
  if (d.choice) {
    const c = s.choice();
    s.trans(id.get(d.choice.from)!, c);
    d.choice.branches.forEach(([to, l]) => {
      s.trans(c, id.get(to)!, l);
      r.add(`${d.choice!.from} → ${to}`, l, 'Seçim noktası');
    });
  }
  if (d.composite) {
    const cp = d.composite;
    const k = s.composite(cp.name, (x) => {
      const inner = new Map<string, string>();
      cp.states.forEach((st) => inner.set(st, x.state(st)));
      x.start(inner.get(cp.start)!);
      cp.trans.forEach(([a, b, l]) => x.trans(inner.get(a)!, inner.get(b)!, l));
      x.end(inner.get(cp.end)!);
    });
    s.trans(id.get(cp.attachFrom)!, k);
    s.trans(k, id.get(cp.attachTo)!);
    r.add(`Bileşik durum: ${cp.name}`, cp.states.join(' → '));
  }
  (d.notes ?? []).forEach(([st, n]) => s.note(id.get(st)!, n));
  d.ends.forEach((e) => s.end(id.get(e)!));
  return wf({
    id: d.id, title: d.title, family, diagram: 'state', summary: d.summary, mermaid: s.toString(), steps: r.steps,
    conditions: d.conditions ?? [], tools: d.tools, topics: d.topics, tags: d.tags,
  }, input);
}

const BASE: LcDef[] = [
  {
    id: 'yd-dosya-tek', title: 'Tek dosya: seçimden doğrulanmış analize', tags: ['dosya', 'durum'], tools: ['react-dropzone', 'uppy', 'tus'], topics: ['R07', 'R13'],
    summary: 'Seçildi → denetlendi → aktarıldı → çıkarıldı → analiz edildi → doğrulandı. “Yükleme %100” yalnız aktarımın bittiğini söyler.',
    states: ['Seçildi', 'Denetleniyor', 'Reddedildi', 'Aktarılıyor', 'Duraklatıldı', 'Aktarıldı', 'Çıkarılıyor', 'Parola bekliyor', 'Analiz ediliyor', 'Kullanıcı doğruluyor', 'Tamamlandı', 'Hata'],
    start: 'Seçildi', ends: ['Tamamlandı', 'Reddedildi'],
    trans: [['Seçildi', 'Denetleniyor'], ['Denetleniyor', 'Reddedildi', 'tür veya boyut dışı'], ['Denetleniyor', 'Aktarılıyor', 'uygun'], ['Aktarılıyor', 'Duraklatıldı', 'ağ kesildi'], ['Duraklatıldı', 'Aktarılıyor', 'sürdür'], ['Aktarılıyor', 'Aktarıldı', 'bayt tamam'], ['Aktarıldı', 'Çıkarılıyor'], ['Çıkarılıyor', 'Parola bekliyor', 'şifreli'], ['Parola bekliyor', 'Çıkarılıyor', 'parola girildi'], ['Çıkarılıyor', 'Analiz ediliyor'], ['Analiz ediliyor', 'Kullanıcı doğruluyor', 'alanlar çıkarıldı'], ['Kullanıcı doğruluyor', 'Tamamlandı', 'onaylandı'], ['Analiz ediliyor', 'Hata', 'okuyucu başarısız'], ['Hata', 'Aktarıldı', 'yeniden dene']],
    notes: [['Aktarıldı', 'Bayt ilerlemesi gerçektir; analiz yüzdesi değildir'], ['Kullanıcı doğruluyor', 'Çıkarılan alanlar düzenlenebilir kalır']],
  },
  {
    id: 'yd-dosya-toplu', title: 'Toplu dosya: kısmi sonuçla ilerleme', tags: ['dosya', 'kısmi-sonuç'], tools: ['uppy', 'filepond', 'tus'], topics: ['R07', 'R05'],
    summary: '13 dosyanın 9’u okundu, 2’si analizde, 2’si parola bekliyor: toplu işte hazır olan sonuç açılabilir; tek dosya hatası bütünü durdurmaz.',
    states: ['Kuyrukta', 'Kısmen hazır', 'Tamamı aktarıldı', 'Bir kısmı bekliyor', 'Rapor hazır', 'Kullanıcı kısmi sonucu açtı'],
    start: 'Kuyrukta', ends: ['Rapor hazır'],
    trans: [['Kuyrukta', 'Kısmen hazır', 'ilk dosya analiz edildi'], ['Kısmen hazır', 'Kullanıcı kısmi sonucu açtı', 'aç'], ['Kullanıcı kısmi sonucu açtı', 'Kısmen hazır', 'geri dön'], ['Kısmen hazır', 'Tamamı aktarıldı'], ['Tamamı aktarıldı', 'Bir kısmı bekliyor', 'parola veya hata'], ['Bir kısmı bekliyor', 'Rapor hazır', 'kalanlar çözüldü veya hariç tutuldu'], ['Tamamı aktarıldı', 'Rapor hazır', 'hepsi tamam']],
    notes: [['Kısmen hazır', 'Toplam ilerleme bayt ağırlıklı anlatılır']],
  },
  {
    id: 'yd-ajan-calistirma', title: 'Ajan çalıştırması: paralel alt durumlar', tags: ['ajan', 'durum'], tools: ['ag-ui', 'xstate', 'httpagent'], topics: ['R13', 'R14'],
    summary: 'Tek “yükleniyor” değişkeni yerine çalıştırma, araç, veri ve görünüm durumları ayrılır; iptal ve onay bekleme açık geçişlerdir.',
    states: ['Boşta', 'Başlatıldı', 'Akış alınıyor', 'Araç çalışıyor', 'Onay bekliyor', 'İptal isteniyor', 'İptal edildi', 'Bitti', 'Sessiz', 'Başarısız'],
    start: 'Boşta', ends: ['Bitti', 'İptal edildi', 'Başarısız'],
    trans: [['Boşta', 'Başlatıldı', 'RunStarted'], ['Başlatıldı', 'Akış alınıyor'], ['Akış alınıyor', 'Araç çalışıyor', 'ToolCallStart'], ['Araç çalışıyor', 'Akış alınıyor', 'ToolCallEnd'], ['Akış alınıyor', 'Onay bekliyor', 'interrupt'], ['Onay bekliyor', 'Akış alınıyor', 'kullanıcı onayı'], ['Akış alınıyor', 'Sessiz', 'nabız yok'], ['Sessiz', 'Akış alınıyor', 'olay geldi'], ['Sessiz', 'Başarısız', 'zaman aşımı'], ['Akış alınıyor', 'İptal isteniyor', 'kullanıcı iptal'], ['İptal isteniyor', 'İptal edildi', 'sunucu onayı'], ['Akış alınıyor', 'Bitti', 'RunFinished']],
    notes: [['İptal isteniyor', 'Sunucu onayı gelmeden iptal edildi deme'], ['Bitti', 'Olay akışının bitmesi sonucun doğrulandığı anlamına gelmez']],
  },
  {
    id: 'yd-arac-cagrisi', title: 'Araç çağrısı kartı', tags: ['ajan', 'ai-bileşeni'], tools: ['ai-elements', 'ant-design-x', 'ag-ui'], topics: ['R03', 'R13'],
    summary: 'Araç çağrısının argüman akışı, çalışma, sonuç ve hata durumları; ToolCallEnd araç sonucunun doğrulandığı anlamına gelmez.',
    states: ['Argüman akıyor', 'Argüman tamam', 'Çalışıyor', 'Sonuç geldi', 'Sonuç doğrulandı', 'Hata'],
    start: 'Argüman akıyor', ends: ['Sonuç doğrulandı', 'Hata'],
    trans: [['Argüman akıyor', 'Argüman tamam', 'ToolCallArgs bitti'], ['Argüman tamam', 'Çalışıyor'], ['Çalışıyor', 'Sonuç geldi', 'ToolCallResult'], ['Sonuç geldi', 'Sonuç doğrulandı', 'şema ve kaynak uygun'], ['Çalışıyor', 'Hata', 'araç hatası'], ['Sonuç geldi', 'Hata', 'şema dışı']],
  },
  {
    id: 'yd-baglanti-sse', title: 'SSE bağlantısı ve yeniden bağlanma', tags: ['akış', 'bağlantı'], tools: ['sse', 'eventsource', 'last-event-id'], topics: ['R14'],
    summary: 'Bağlantı kopunca iş sürebilir; yeniden bağlanırken Last-Event-ID ile kaçan olaylar yeniden oynatılır ve tekrarlar elenir.',
    states: ['Bağlanıyor', 'Açık', 'Koptu', 'Bekleme (retry)', 'Yeniden oynatılıyor', 'Kapalı'],
    start: 'Bağlanıyor', ends: ['Kapalı'],
    trans: [['Bağlanıyor', 'Açık', 'onopen'], ['Açık', 'Koptu', 'ağ hatası'], ['Koptu', 'Bekleme (retry)'], ['Bekleme (retry)', 'Bağlanıyor', 'retry ms doldu'], ['Açık', 'Yeniden oynatılıyor', 'Last-Event-ID ile açıldı'], ['Yeniden oynatılıyor', 'Açık', 'boşluk kapandı'], ['Açık', 'Kapalı', 'iş bitti veya close']],
    notes: [['Yeniden oynatılıyor', 'Olay kimliğine göre tekrarları ele']],
  },
  {
    id: 'yd-akisli-tarif', title: 'Akışlı UI tarifi: mesajdan uygulanabilir güncellemeye', tags: ['akış', 'tarif'], tools: ['json-render', 'specstream', 'json-patch', 'jsonl'], topics: ['R12'],
    summary: 'Ağ parçası → tam mesaj → biçim/katalog/veri/eylem denetimi → uygulama. Son geçerli görünüm her hatada korunur.',
    states: ['Parça alındı', 'Tampon', 'Tam mesaj', 'Doğrulanıyor', 'Uygulandı', 'Reddedildi', 'Son geçerli görünüm'],
    start: 'Parça alındı', ends: ['Uygulandı'],
    trans: [['Parça alındı', 'Tampon'], ['Tampon', 'Tam mesaj', 'satır sonu'], ['Tam mesaj', 'Doğrulanıyor'], ['Doğrulanıyor', 'Uygulandı', 'şema + katalog + eylem uygun'], ['Doğrulanıyor', 'Reddedildi', 'bozuk veya bilinmeyen bileşen'], ['Reddedildi', 'Son geçerli görünüm'], ['Son geçerli görünüm', 'Parça alındı', 'sonraki mesaj']],
    notes: [['Tampon', 'İlk harf geldi diye buton çalıştırılmaz']],
  },
  {
    id: 'yd-bilesen-render', title: 'Bileşen gösterimi: iskeletten doğrulanmış sonuca', tags: ['renderer', 'kısmi-sonuç'], tools: ['json-render', 'a2ui-react', 'react-suspense'], topics: ['R09', 'R12', 'R05'],
    summary: 'Bileşen türü bilinince iskelet; veri referansı gelince yer tutucu; veri doğrulanınca gerçek görünüm. Eylemler en son etkinleşir.',
    states: ['Tür biliniyor', 'İskelet', 'Özellikler kısmi', 'Veri bekleniyor', 'Görünür (salt okunur)', 'Etkileşimli', 'Hata sınırı'],
    start: 'Tür biliniyor', ends: ['Etkileşimli'],
    trans: [['Tür biliniyor', 'İskelet'], ['İskelet', 'Özellikler kısmi'], ['Özellikler kısmi', 'Veri bekleniyor', 'veri referansı'], ['Veri bekleniyor', 'Görünür (salt okunur)', 'veri doğrulandı'], ['Görünür (salt okunur)', 'Etkileşimli', 'eylem parametreleri tam'], ['Özellikler kısmi', 'Hata sınırı', 'geçersiz özellik'], ['Hata sınırı', 'İskelet', 'yeni tarif']],
  },
  {
    id: 'yd-onay-karti', title: 'Onay kartı: etkili işlem', tags: ['onay', 'güvenlik'], tools: ['ai-elements', 'ant-design-x'], topics: ['R16', 'R23', 'R02'],
    summary: 'Hedef, değişiklik, etki ve geçerlilik süresi gösterilir; onay sunucuda yetkilendirilir ve tekrar gönderim idempotent işlenir.',
    states: ['Taslak', 'İncelemede', 'Onaylandı', 'Sunucu yetkilendiriyor', 'Uygulandı', 'Reddedildi', 'Süresi doldu', 'Belirsiz sonuç'],
    start: 'Taslak', ends: ['Uygulandı', 'Reddedildi', 'Süresi doldu'],
    trans: [['Taslak', 'İncelemede', 'AI gerekçeli öneri'], ['İncelemede', 'Onaylandı', 'kullanıcı onayı'], ['İncelemede', 'Reddedildi'], ['İncelemede', 'Süresi doldu', 'geçerlilik bitti'], ['Onaylandı', 'Sunucu yetkilendiriyor'], ['Sunucu yetkilendiriyor', 'Uygulandı', 'yetki + tutar kontrolü'], ['Sunucu yetkilendiriyor', 'Reddedildi', '403'], ['Sunucu yetkilendiriyor', 'Belirsiz sonuç', 'zaman aşımı'], ['Belirsiz sonuç', 'Uygulandı', 'sonuç sorgusu: yapıldı'], ['Belirsiz sonuç', 'İncelemede', 'sonuç sorgusu: yapılmadı']],
    notes: [['Belirsiz sonuç', 'Çift tıklama ve tekrar gönderme için idempotency anahtarı']],
  },
  {
    id: 'yd-form-taslak', title: 'Form taslağı: AI değişikliği ile kullanıcı emeği', tags: ['form', 'süreklilik'], tools: ['react-activity', 'json-schema', 'zod'], topics: ['R16'],
    summary: 'Kullanıcı yazarken AI değişikliği öneri olarak gelir; dondurma, birleştirme ve geri alma seçenekleri korunur.',
    states: ['Boş', 'AI doldurdu', 'Kullanıcı düzenliyor', 'AI öneri bekletiliyor', 'Birleştirildi', 'Geri alındı', 'Kaydedildi'],
    start: 'Boş', ends: ['Kaydedildi'],
    trans: [['Boş', 'AI doldurdu', 'taslak alanlar'], ['AI doldurdu', 'Kullanıcı düzenliyor'], ['Kullanıcı düzenliyor', 'AI öneri bekletiliyor', 'yeni AI çıktısı'], ['AI öneri bekletiliyor', 'Birleştirildi', 'kullanıcı kabul'], ['AI öneri bekletiliyor', 'Kullanıcı düzenliyor', 'yoksay'], ['Birleştirildi', 'Geri alındı', 'geri al'], ['Geri alındı', 'Kullanıcı düzenliyor'], ['Birleştirildi', 'Kaydedildi', 'doğrulama + kaydet'], ['Kullanıcı düzenliyor', 'Kaydedildi', 'doğrulama + kaydet']],
    notes: [['Kullanıcı düzenliyor', 'Odak ve seçim korunur; bileşen kimliği değişmez']],
  },
  {
    id: 'yd-kayitli-gorunum', title: 'Kayıtlı görünüm: canlı ve anlık', tags: ['görünüm', 'paylaşım'], tools: ['tanstack-router', 'tanstack-query'], topics: ['R17'],
    summary: 'Görünüm tarifi, sorgu ve veri sürümü ayrı saklanır; katalog veya yetki değişince eski görünüm geçiş, kısmi gösterim veya yeniden üretimle açılır.',
    states: ['Oluşturuldu', 'Canlı', 'Anlık görüntü', 'Paylaşıldı', 'Yetki yeniden değerlendiriliyor', 'Katalog değişti', 'Geçirildi', 'Kısmi gösterim'],
    start: 'Oluşturuldu', ends: ['Geçirildi', 'Kısmi gösterim'],
    trans: [['Oluşturuldu', 'Canlı', 'sorgu kaydet'], ['Oluşturuldu', 'Anlık görüntü', 'veriyi dondur'], ['Canlı', 'Paylaşıldı'], ['Anlık görüntü', 'Paylaşıldı'], ['Paylaşıldı', 'Yetki yeniden değerlendiriliyor', 'başka kullanıcı açtı'], ['Canlı', 'Katalog değişti', 'bileşen sürümü'], ['Katalog değişti', 'Geçirildi', 'dönüştürücü var'], ['Katalog değişti', 'Kısmi gösterim', 'dönüştürücü yok']],
  },
  {
    id: 'yd-grafik-dogrulama', title: 'Grafik tarifi doğrulama', tags: ['grafik', 'doğruluk'], tools: ['vega-lite', 'echarts'], topics: ['R19', 'R15'],
    summary: 'Model grafiği dar şemayla önerir; veri sunucudan referansla gelir; eksen, birim ve toplama doğrulanmadan grafik “sonuç” gibi gösterilmez.',
    states: ['Öneri', 'Şema denetimi', 'Veri sorgusu', 'Birim ve eksen denetimi', 'Gösterildi', 'Tabloya düştü', 'Reddedildi'],
    start: 'Öneri', ends: ['Gösterildi', 'Tabloya düştü'],
    trans: [['Öneri', 'Şema denetimi'], ['Şema denetimi', 'Reddedildi', 'ham motor yapılandırması'], ['Şema denetimi', 'Veri sorgusu', 'dar şema uygun'], ['Veri sorgusu', 'Birim ve eksen denetimi'], ['Birim ve eksen denetimi', 'Gösterildi', 'tutarlı'], ['Birim ve eksen denetimi', 'Tabloya düştü', 'eksik veri veya belirsizlik'], ['Reddedildi', 'Tabloya düştü', 'güvenli yedek']],
  },
  {
    id: 'yd-gosterge-zamanlama', title: 'Bekleme göstergesi zamanlaması', tags: ['bekleme', 'hareket'], tools: ['kolibri', 'vercel-guidelines', 'carbon'], topics: ['R05'],
    summary: 'Gösterge gecikmeli başlar, göründüyse en az bir süre görünür kalır. Eşikler rehberlere göre değişir; ürün içinde ölçülmelidir.',
    states: ['İstek başladı', 'Gecikme penceresi', 'Gösterge görünür', 'En az görünürlük', 'Gizlendi', 'Sonuç anında'],
    start: 'İstek başladı', ends: ['Gizlendi', 'Sonuç anında'],
    trans: [['İstek başladı', 'Gecikme penceresi'], ['Gecikme penceresi', 'Sonuç anında', 'gecikmeden önce bitti'], ['Gecikme penceresi', 'Gösterge görünür', 'gecikme doldu'], ['Gösterge görünür', 'En az görünürlük', 'iş bitti'], ['En az görünürlük', 'Gizlendi', 'süre doldu']],
    notes: [['Gecikme penceresi', 'Örn. Kolibri 300 ms, GitLab 100 ms; evrensel eşik yok']],
  },
  {
    id: 'yd-hareket-kesinti', title: 'Kesintiye uğrayan geçiş', tags: ['hareket', 'erişilebilirlik'], tools: ['motion', 'view-transitions', 'reduced-motion'], topics: ['R06', 'R21'],
    summary: 'Geçiş yarıda tersine dönebilir, öğe görünümden çıkarılabilir; azaltılmış hareket tercihinde anlam korunur, hareket kısalır.',
    states: ['Durgun', 'Giriş', 'Tersine dönüyor', 'Çıkış', 'Kaldırıldı', 'Azaltılmış'],
    start: 'Durgun', ends: ['Kaldırıldı'],
    trans: [['Durgun', 'Giriş', 'yeni veri'], ['Giriş', 'Tersine dönüyor', 'yarıda iptal'], ['Tersine dönüyor', 'Durgun'], ['Giriş', 'Durgun', 'bitti'], ['Durgun', 'Çıkış', 'silindi'], ['Çıkış', 'Kaldırıldı'], ['Durgun', 'Azaltılmış', 'prefers-reduced-motion'], ['Azaltılmış', 'Durgun', 'anlık durum değişimi']],
    notes: [['Tersine dönüyor', 'Aynı öğeyi iki motor yönetmemeli']],
  },
  {
    id: 'yd-katalog-surum', title: 'Katalog bileşeni sürüm yaşamı', tags: ['katalog', 'sürüm'], tools: ['zod', 'json-schema', 'json-render'], topics: ['R10', 'R17'],
    summary: 'Modelin gördüğü tanım ile uygulamanın doğruladığı şema aynı sürümlü kaynaktan üretilir; kullanım dışı bırakma dönüştürücüyle yapılır.',
    states: ['Taslak', 'Etkin', 'Kullanım dışı', 'Dönüştürücü yazıldı', 'Kaldırıldı'],
    start: 'Taslak', ends: ['Kaldırıldı'],
    trans: [['Taslak', 'Etkin', 'kabul ölçütleri geçti'], ['Etkin', 'Kullanım dışı', 'yeni sürüm'], ['Kullanım dışı', 'Dönüştürücü yazıldı'], ['Dönüştürücü yazıldı', 'Kaldırıldı', 'eski tarifler geçirildi']],
    notes: [['Etkin', 'Durum, veri, eylem, dar ekran, klavye ve hata davranışı tanımlı']],
  },
  {
    id: 'yd-iddia-dogrulama', title: 'İddia doğrulama yaşamı', tags: ['kanıt'], tools: ['generative-interfaces'], topics: ['R28'],
    summary: 'Sicildeki bir iddianın kaynak, pasaj ve karşı kanıtla ele alınışı; aynı kaynağın tekrarları bağımsız doğrulama sayılmaz.',
    states: ['Kaydedildi', 'Kaynak açıldı', 'Pasaj eşleşti', 'Destekleniyor', 'Doğrulanmadı', 'İtirazlı', 'Reddedildi'],
    start: 'Kaydedildi', ends: ['Destekleniyor', 'Reddedildi'],
    trans: [['Kaydedildi', 'Kaynak açıldı'], ['Kaynak açıldı', 'Doğrulanmadı', 'erişim yok'], ['Kaynak açıldı', 'Pasaj eşleşti'], ['Pasaj eşleşti', 'Destekleniyor', 'kapsam uyuşuyor'], ['Pasaj eşleşti', 'İtirazlı', 'karşı kanıt'], ['İtirazlı', 'Reddedildi', 'kaynak iddiayı desteklemiyor'], ['İtirazlı', 'Destekleniyor', 'kapsam daraltıldı'], ['Doğrulanmadı', 'Kaynak açıldı', 'yeni erişim']],
  },
  {
    id: 'yd-kurum-degisimi', title: 'Kurum (tenant) değişimi ve önbellek', tags: ['güvenlik', 'veri'], tools: ['tanstack-query'], topics: ['R15', 'R23'],
    summary: 'Aynı tarayıcıda müşteri değişince önbellek, açık akışlar ve kayıtlı taslaklar kurum bağlamıyla temizlenir veya ayrılır.',
    states: ['Kurum A etkin', 'Değişim istendi', 'Akışlar kapatılıyor', 'Önbellek temizleniyor', 'Kurum B etkin'],
    start: 'Kurum A etkin', ends: ['Kurum B etkin'],
    trans: [['Kurum A etkin', 'Değişim istendi'], ['Değişim istendi', 'Akışlar kapatılıyor', 'iptal + sunucu onayı'], ['Akışlar kapatılıyor', 'Önbellek temizleniyor', 'sorgu anahtarında kurum kimliği'], ['Önbellek temizleniyor', 'Kurum B etkin']],
    notes: [['Önbellek temizleniyor', 'Kurum karışması veri sızıntısıdır']],
  },
  {
    id: 'yd-yeniden-deneme', title: 'Yeniden deneme ve geri çekilme', tags: ['dayanıklılık'], tools: ['fetch-event-source', 'abortcontroller'], topics: ['R14', 'R13'],
    summary: 'Geçici hata üstel geri çekilmeyle yeniden denenir; kalıcı hata (401/403/400) yeniden denenmez, kullanıcıya açıklanır.',
    states: ['İstek', 'Başarılı', 'Geçici hata', 'Bekle', 'Kalıcı hata', 'Vazgeçildi'],
    start: 'İstek', ends: ['Başarılı', 'Kalıcı hata', 'Vazgeçildi'],
    trans: [['İstek', 'Başarılı'], ['İstek', 'Geçici hata', '5xx veya ağ'], ['Geçici hata', 'Bekle', 'deneme sayısı < sınır'], ['Bekle', 'İstek', 'geri çekilme süresi'], ['Geçici hata', 'Vazgeçildi', 'sınır aşıldı'], ['İstek', 'Kalıcı hata', '4xx']],
  },
  {
    id: 'yd-hata-yalitimi', title: 'Bileşen hata yalıtımı', tags: ['renderer', 'dayanıklılık'], tools: ['react', 'json-render'], topics: ['R09', 'R24'],
    summary: 'Tek bileşenin hatası çalışma alanını çökertmez; hata sınırı son geçerli görünümü korur ve kullanıcıya dar bir yedek sunar.',
    states: ['Çiziliyor', 'Çizildi', 'Hata yakalandı', 'Yedek gösteriliyor', 'Yeniden denendi'],
    start: 'Çiziliyor', ends: ['Çizildi'],
    trans: [['Çiziliyor', 'Çizildi'], ['Çiziliyor', 'Hata yakalandı', 'istisna'], ['Hata yakalandı', 'Yedek gösteriliyor', 'metin veya tablo'], ['Yedek gösteriliyor', 'Yeniden denendi', 'yeni tarif'], ['Yeniden denendi', 'Çiziliyor']],
  },
  {
    id: 'yd-coklu-is', title: 'Çoklu iş ve bildirim', tags: ['çoklu-iş'], tools: ['ag-ui', 'service-worker'], topics: ['R27', 'R13'],
    summary: 'Kullanıcı başka işe geçince uzun iş arka planda sürer; tamamlanınca bildirim gelir ve sonuç kaldığı yerden açılır.',
    states: ['Ön planda', 'Arka planda', 'Tamamlandı', 'Bildirildi', 'Sonuç açıldı', 'Başarısız'],
    start: 'Ön planda', ends: ['Sonuç açıldı', 'Başarısız'],
    trans: [['Ön planda', 'Arka planda', 'kullanıcı başka işe geçti'], ['Arka planda', 'Tamamlandı'], ['Arka planda', 'Başarısız'], ['Tamamlandı', 'Bildirildi'], ['Bildirildi', 'Sonuç açıldı', 'tıkla'], ['Arka planda', 'Ön planda', 'geri döndü']],
  },
  {
    id: 'yd-yetki-yukseltme', title: 'Yetki yükseltme isteği', tags: ['güvenlik', 'onay'], tools: ['owasp-llm'], topics: ['R02', 'R23'],
    summary: 'AI izinli yüzeyin dışına çıkan bir eylem önerirse eylem düz metne veya daha dar bir temsile iner; yükseltme ayrı onay ister.',
    states: ['Öneri', 'Politika denetimi', 'İzinli', 'Daraltıldı', 'Düz metne döndü', 'Yükseltme onayı'],
    start: 'Öneri', ends: ['İzinli', 'Düz metne döndü'],
    trans: [['Öneri', 'Politika denetimi'], ['Politika denetimi', 'İzinli', 'yüzey izni var'], ['Politika denetimi', 'Daraltıldı', 'kısmi izin'], ['Daraltıldı', 'İzinli'], ['Politika denetimi', 'Yükseltme onayı', 'etkili işlem'], ['Yükseltme onayı', 'İzinli', 'yetkili onay'], ['Yükseltme onayı', 'Düz metne döndü', 'ret']],
  },
  {
    id: 'yd-token-surum', title: 'Tasarım token sürümü', tags: ['token', 'marka'], tools: ['design-tokens', 'style-dictionary', 'figma'], topics: ['R20'],
    summary: 'Tek kaynaktan (DTCG) tema üretilir; AI’a yalnız semantik seçenekler açılır; sürüm geçişi kontrast testiyle kapanır.',
    states: ['Kaynak değişti', 'Derleniyor', 'Kontrast testi', 'Yayında', 'Geri alındı'],
    start: 'Kaynak değişti', ends: ['Yayında', 'Geri alındı'],
    trans: [['Kaynak değişti', 'Derleniyor', 'Style Dictionary'], ['Derleniyor', 'Kontrast testi'], ['Kontrast testi', 'Yayında', 'WCAG geçti'], ['Kontrast testi', 'Geri alındı', 'başarısız']],
  },
  {
    id: 'yd-gozlem-izi', title: 'Uçtan uca iz (trace) yaşamı', tags: ['gözlem'], tools: ['opentelemetry'], topics: ['R25'],
    summary: 'Kullanıcı eylemi, API, ajan, araç ve çizim aynı iz kimliğiyle bağlanır; hassas veri günlüğe yazılmadan maskelenir.',
    states: ['Eylem', 'API isteği', 'Ajan çalıştırması', 'Araç çağrısı', 'Çizim', 'Maskelendi', 'Saklandı'],
    start: 'Eylem', ends: ['Saklandı'],
    trans: [['Eylem', 'API isteği', 'iz kimliği üret'], ['API isteği', 'Ajan çalıştırması', 'bağlamı taşı'], ['Ajan çalıştırması', 'Araç çağrısı'], ['Araç çağrısı', 'Çizim', 'sonuç'], ['Çizim', 'Maskelendi', 'hassas alanlar'], ['Maskelendi', 'Saklandı']],
  },
  {
    id: 'yd-coklu-sekme', title: 'Çoklu sekme koordinasyonu', tags: ['çoklu-iş', 'bağlantı'], tools: ['eventsource', 'service-worker'], topics: ['R14', 'R27'],
    summary: 'Aynı işi izleyen birden fazla sekme tek bağlantıyı paylaşır; lider sekme kapanınca başka sekme devralır.',
    states: ['Tek sekme', 'Lider seçildi', 'Takipçi', 'Lider kapandı', 'Devralındı'],
    start: 'Tek sekme', ends: ['Devralındı'],
    trans: [['Tek sekme', 'Lider seçildi', 'ikinci sekme açıldı'], ['Lider seçildi', 'Takipçi', 'olaylar yayınlanır'], ['Takipçi', 'Lider kapandı'], ['Lider kapandı', 'Devralındı', 'Last-Event-ID ile sürdür']],
  },
];

/* ---------------------------------------------------------------- araç varyantları */
function uploadVariant(tool: string, name: string, special: T[], extra: string[], summary: string, cond: string): LcDef {
  return {
    id: `yd-yukleme-${tool}`, title: `Yükleme yaşamı · ${name}`, tags: ['dosya', 'varyant'], tools: [tool], topics: ['R07'],
    summary, conditions: [cond],
    states: ['Seçildi', 'Denetlendi', ...extra, 'Aktarıldı', 'İşleniyor', 'Bitti', 'Hata'],
    start: 'Seçildi', ends: ['Bitti'],
    trans: [['Seçildi', 'Denetlendi'], ...special, ['Aktarıldı', 'İşleniyor'], ['İşleniyor', 'Bitti'], ['İşleniyor', 'Hata'], ['Hata', 'Denetlendi', 'yeniden dene']],
  };
}

const VARIANTS: LcDef[] = [
  uploadVariant('react-dropzone', 'react-dropzone', [['Denetlendi', 'Kendi yükleyicin', 'dropzone yalnız seçimi yapar'], ['Kendi yükleyicin', 'Aktarıldı', 'fetch veya XHR']], ['Kendi yükleyicin'],
    'react-dropzone bir HTTP yükleyicisi değildir: seçim ve sürükle-bırakı sağlar, aktarım ve sürdürme ayrı kurulmalıdır.', 'react-dropzone aktarım yapmadığı için “kendi yükleyicin” durumu eklendi'),
  uploadVariant('uppy', 'Uppy', [['Denetlendi', 'Parçalı aktarım', '@uppy/tus'], ['Parçalı aktarım', 'Duraklatıldı', 'ağ kesildi'], ['Duraklatıldı', 'Parçalı aktarım', 'sürdür'], ['Parçalı aktarım', 'Aktarıldı']], ['Parçalı aktarım', 'Duraklatıldı'],
    'Uppy, Tus eklentisiyle kaldığı yerden sürdürmeyi destekler; sunucu tarafında Tus uyumlu uç nokta gerekir.', 'Uppy + Tus sürdürme desteği için duraklat/sürdür döngüsü eklendi'),
  uploadVariant('filepond', 'FilePond', [['Denetlendi', 'Sunucu işleme', 'process uç noktası'], ['Sunucu işleme', 'Geri alınabilir', 'revert'], ['Geri alınabilir', 'Aktarıldı']], ['Sunucu işleme', 'Geri alınabilir'],
    'FilePond önizleme ve sunucu işleme/geri alma (revert) uç noktalarıyla çalışır; sürdürme için parçalı yükleme yapılandırılmalıdır.', 'FilePond sunucu işleme ve revert uç noktaları nedeniyle ek durumlar'),
  uploadVariant('tus', 'Tus protokolü', [['Denetlendi', 'Oluşturuldu', 'POST'], ['Oluşturuldu', 'Parça gönderiliyor', 'PATCH'], ['Parça gönderiliyor', 'Ofset sorgusu', 'bağlantı koptu'], ['Ofset sorgusu', 'Parça gönderiliyor', 'HEAD Upload-Offset'], ['Parça gönderiliyor', 'Aktarıldı']], ['Oluşturuldu', 'Parça gönderiliyor', 'Ofset sorgusu'],
    'Tus: POST ile oluştur, PATCH ile parça gönder, kopmada HEAD ile Upload-Offset sorgulayıp kaldığı yerden sürdür.', 'Tus protokolünün POST/PATCH/HEAD adımları durumlara açıldı'),
  {
    id: 'yd-baglanti-eventsource', title: 'Bağlantı yaşamı · EventSource', tags: ['akış', 'varyant'], tools: ['eventsource', 'last-event-id'], topics: ['R14'],
    summary: 'Yerleşik EventSource yalnız GET yapar ve özel başlık gönderemez; kimlik çerezle taşınır, yeniden bağlanma ve Last-Event-ID otomatiktir.',
    conditions: ['Özel başlık gönderilemediği için çerez oturumu durumu eklendi'],
    states: ['Çerez oturumu', 'Bağlanıyor', 'Açık', 'Otomatik yeniden bağlanma', 'Kapalı'], start: 'Çerez oturumu', ends: ['Kapalı'],
    trans: [['Çerez oturumu', 'Bağlanıyor', 'GET'], ['Bağlanıyor', 'Açık'], ['Açık', 'Otomatik yeniden bağlanma', 'hata'], ['Otomatik yeniden bağlanma', 'Açık', 'Last-Event-ID otomatik'], ['Açık', 'Kapalı', 'close']],
  },
  {
    id: 'yd-baglanti-fetch-event-source', title: 'Bağlantı yaşamı · fetch-event-source', tags: ['akış', 'varyant'], tools: ['fetch-event-source', 'abortcontroller'], topics: ['R14'],
    summary: 'POST ve Authorization başlığı gönderilebilir; yeniden deneme politikası uygulamada yazılır. Son sürüm 2021: bakım riski izlenmeli.',
    conditions: ['Başlık desteği için yetkili POST durumu; bakım riski notu eklendi'],
    states: ['Yetkili POST', 'Açık', 'onerror', 'Politika kararı', 'Durduruldu'], start: 'Yetkili POST', ends: ['Durduruldu'],
    trans: [['Yetkili POST', 'Açık', 'onopen 200'], ['Açık', 'onerror', 'ağ'], ['onerror', 'Politika kararı'], ['Politika kararı', 'Yetkili POST', 'geçici: yeniden dene'], ['Politika kararı', 'Durduruldu', 'kalıcı: throw'], ['Açık', 'Durduruldu', 'AbortController']],
  },
  {
    id: 'yd-baglanti-websocket', title: 'Bağlantı yaşamı · WebSocket', tags: ['akış', 'varyant'], tools: ['websocket'], topics: ['R14'],
    summary: 'Çift yönlü; canlılık nabzı ve sürdürme belirteci uygulama protokolünde tanımlanmalıdır, tarayıcı yeniden bağlanmayı kendisi yapmaz.',
    conditions: ['WebSocket otomatik yeniden bağlanmadığı için nabız ve sürdürme belirteci durumları eklendi'],
    states: ['El sıkışma', 'Açık', 'Nabız bekleniyor', 'Kapandı', 'Sürdürme belirteciyle bağlan'], start: 'El sıkışma', ends: ['Kapandı'],
    trans: [['El sıkışma', 'Açık', 'alt protokol + kimlik'], ['Açık', 'Nabız bekleniyor', 'ping'], ['Nabız bekleniyor', 'Açık', 'pong'], ['Nabız bekleniyor', 'Sürdürme belirteciyle bağlan', 'zaman aşımı'], ['Sürdürme belirteciyle bağlan', 'Açık', 'kaçan olaylar'], ['Açık', 'Kapandı', 'close']],
  },
  {
    id: 'yd-baglanti-http2', title: 'Bağlantı yaşamı · HTTP/2 ve ters vekil', tags: ['akış', 'varyant'], tools: ['http2', 'sse'], topics: ['R14', 'R22'],
    summary: 'HTTP/2 çoklama bağlantı sınırını gevşetir; ters vekilde sıkıştırma ve tamponlama akışı bekletebilir, zaman aşımı nabızla aşılır.',
    conditions: ['Vekil tamponlaması ve zaman aşımı için ayrı durumlar eklendi'],
    states: ['Vekil', 'Tamponlanıyor', 'Akış iletiliyor', 'Boşta zaman aşımı', 'Nabız'], start: 'Vekil', ends: ['Akış iletiliyor'],
    trans: [['Vekil', 'Tamponlanıyor', 'buffering açık'], ['Tamponlanıyor', 'Akış iletiliyor', 'buffering kapatıldı'], ['Vekil', 'Akış iletiliyor'], ['Akış iletiliyor', 'Boşta zaman aşımı', 'sessizlik'], ['Boşta zaman aşımı', 'Nabız', 'yorum satırı gönder'], ['Nabız', 'Akış iletiliyor']],
  },
  {
    id: 'yd-hareket-motion', title: 'Geçiş yaşamı · Motion', tags: ['hareket', 'varyant'], tools: ['motion'], topics: ['R06'],
    summary: 'AnimatePresence çıkış animasyonunu yönetir; layout geçişi aynı öğe kimliğine bağlıdır, kimlik değişirse süreklilik kaybolur.',
    states: ['Monte', 'Giriş', 'Layout geçişi', 'Çıkış (AnimatePresence)', 'Söküldü'], start: 'Monte', ends: ['Söküldü'],
    trans: [['Monte', 'Giriş', 'initial → animate'], ['Giriş', 'Layout geçişi', 'boyut değişti'], ['Layout geçişi', 'Giriş'], ['Giriş', 'Çıkış (AnimatePresence)', 'kaldırıldı'], ['Çıkış (AnimatePresence)', 'Söküldü', 'exit bitti']],
  },
  {
    id: 'yd-hareket-view-transitions', title: 'Geçiş yaşamı · View Transitions', tags: ['hareket', 'varyant'], tools: ['view-transitions', 'react-viewtransition'], topics: ['R06'],
    summary: 'startViewTransition eski/yeni anlık görüntüleri alır; desteklenmeyen tarayıcıda anında güncelleme kabul edilebilir yedektir.',
    conditions: ['Tarayıcı desteği değiştiği için özellik algılama seçimi eklendi'],
    states: ['Özellik algılama', 'Eski görüntü', 'DOM güncellemesi', 'Yeni görüntü', 'Animasyon', 'Anında güncelleme'], start: 'Özellik algılama', ends: ['Animasyon', 'Anında güncelleme'],
    trans: [['Özellik algılama', 'Eski görüntü', 'destekleniyor'], ['Özellik algılama', 'Anında güncelleme', 'desteklenmiyor'], ['Eski görüntü', 'DOM güncellemesi'], ['DOM güncellemesi', 'Yeni görüntü'], ['Yeni görüntü', 'Animasyon']],
  },
  {
    id: 'yd-hareket-starting-style', title: 'Geçiş yaşamı · @starting-style', tags: ['hareket', 'varyant'], tools: ['starting-style', 'interpolate-size'], topics: ['R06'],
    summary: 'CSS ile giriş animasyonu: ilk çizimde başlangıç stili; display: none öğeler için transition-behavior gerekir.',
    states: ['display none', 'Başlangıç stili', 'Hedef stil', 'Çıkış'], start: 'display none', ends: ['Çıkış'],
    trans: [['display none', 'Başlangıç stili', 'görünür yapıldı'], ['Başlangıç stili', 'Hedef stil', 'transition'], ['Hedef stil', 'Çıkış', 'allow-discrete']],
  },
  {
    id: 'yd-renderer-json-render', title: 'Renderer yaşamı · json-render', tags: ['renderer', 'varyant'], tools: ['json-render', 'specstream', 'zod'], topics: ['R09', 'R12'],
    summary: 'Katalog (Zod) tanımı → SpecStream JSONL yamaları → RFC 6902 uygulama → katalog bileşenleriyle çizim.',
    states: ['Katalog yüklendi', 'Yama alındı', 'Yama uygulandı', 'Tarif doğrulandı', 'Çizildi', 'Yama reddedildi'], start: 'Katalog yüklendi', ends: ['Çizildi'],
    trans: [['Katalog yüklendi', 'Yama alındı'], ['Yama alındı', 'Yama uygulandı', 'JSON Patch'], ['Yama alındı', 'Yama reddedildi', 'bozuk satır'], ['Yama reddedildi', 'Yama alındı'], ['Yama uygulandı', 'Tarif doğrulandı', 'Zod'], ['Tarif doğrulandı', 'Çizildi']],
  },
  {
    id: 'yd-renderer-a2ui', title: 'Renderer yaşamı · A2UI', tags: ['renderer', 'varyant'], tools: ['a2ui', 'a2ui-react'], topics: ['R08', 'R09'],
    summary: 'Yüzey (surface) güncellemesi, veri modeli güncellemesi ve çizime başla mesajları; kullanıcı eylemi ajana geri döner. Sürüm sabitlenmeli.',
    conditions: ['A2UI olgunluk etiketleri belgeler arasında farklı: sürüm sabitleme notu'],
    states: ['Yüzey oluşturuldu', 'Bileşen ağacı', 'Veri modeli', 'Çizime başla', 'Görünür', 'Kullanıcı eylemi'], start: 'Yüzey oluşturuldu', ends: ['Görünür'],
    trans: [['Yüzey oluşturuldu', 'Bileşen ağacı', 'surfaceUpdate'], ['Bileşen ağacı', 'Veri modeli', 'dataModelUpdate'], ['Veri modeli', 'Çizime başla', 'beginRendering'], ['Çizime başla', 'Görünür'], ['Görünür', 'Kullanıcı eylemi', 'userAction'], ['Kullanıcı eylemi', 'Bileşen ağacı', 'ajan yanıtı']],
  },
  {
    id: 'yd-renderer-copilotkit', title: 'Renderer yaşamı · CopilotKit', tags: ['renderer', 'varyant'], tools: ['copilotkit', 'ag-ui'], topics: ['R09'],
    summary: 'AG-UI olaylarını dinleyen React tarafı; üretken bileşen, araç çağrısına bağlı çizim ve insan onayı (human-in-the-loop) durumları.',
    states: ['Ajan bağlandı', 'Olay akışı', 'Üretken bileşen', 'İnsan onayı', 'Tamam'], start: 'Ajan bağlandı', ends: ['Tamam'],
    trans: [['Ajan bağlandı', 'Olay akışı', 'AG-UI'], ['Olay akışı', 'Üretken bileşen', 'araç çağrısı → bileşen'], ['Üretken bileşen', 'İnsan onayı', 'onay gerekli'], ['İnsan onayı', 'Olay akışı', 'yanıt'], ['Olay akışı', 'Tamam']],
  },
  {
    id: 'yd-renderer-tambo', title: 'Renderer yaşamı · Tambo', tags: ['renderer', 'varyant'], tools: ['tambo'], topics: ['R09', 'R26'],
    summary: 'Kayıtlı React bileşenleri ve Zod özellik şemaları; ajan hizmeti bulutta ya da kendi sunucunda. API anahtarı ve işletim maliyeti hesaba katılmalı.',
    conditions: ['Bulut/kendi sunucu seçimi için barındırma durumu eklendi'],
    states: ['Bileşen kaydı', 'Barındırma seçimi', 'İleti akışı', 'Bileşen seçildi', 'Özellik akışı', 'Etkileşimli'], start: 'Bileşen kaydı', ends: ['Etkileşimli'],
    trans: [['Bileşen kaydı', 'Barındırma seçimi'], ['Barındırma seçimi', 'İleti akışı', 'bulut veya self-host'], ['İleti akışı', 'Bileşen seçildi'], ['Bileşen seçildi', 'Özellik akışı', 'Zod şeması'], ['Özellik akışı', 'Etkileşimli']],
  },
  {
    id: 'yd-renderer-openui', title: 'Renderer yaşamı · OpenUI Lang', tags: ['renderer', 'varyant'], tools: ['openui', 'openui-lang'], topics: ['R09', 'R12'],
    summary: 'Özel UI dili artımlı ayrıştırılır; token tasarrufu iddiası satıcı ölçümüdür, bağımsız doğrulanmadı.',
    conditions: ['Token tasarrufu iddiası doğrulanmadığı için ölçüm notu'],
    states: ['Dil akışı', 'Artımlı ayrıştırma', 'Bileşen eşleme', 'Çizim', 'Ayrıştırma hatası'], start: 'Dil akışı', ends: ['Çizim'],
    trans: [['Dil akışı', 'Artımlı ayrıştırma'], ['Artımlı ayrıştırma', 'Bileşen eşleme'], ['Artımlı ayrıştırma', 'Ayrıştırma hatası'], ['Ayrıştırma hatası', 'Dil akışı', 'son geçerli'], ['Bileşen eşleme', 'Çizim']],
  },
];

export function lifecycleFamily(input: GenInput): Workflow[] {
  return [...BASE, ...VARIANTS].map((d) => build(d, input));
}
