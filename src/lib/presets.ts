/**
 * Akıllı kümeler (koşullu, dinamik) ve koşullu kova şemaları.
 * Üyelik sabit liste değildir: her açılışta kural veriye uygulanır; veri değişirse küme de değişir.
 */
import type { Bucket } from './grouping';
import { and, cond, not, or, type Rule } from './rules';

export interface SmartCluster {
  id: string;
  name: string;
  why: string;
  color: string;
  icon: string;
  theme: 'karar' | 'risk' | 'yetenek' | 'kanıt' | 'mimari';
  rule: Rule;
}

const OPEN = ['MIT', 'Apache-2.0', 'BSD', 'ISC', 'MPL-2.0', 'Standart'];

export const SMART_CLUSTERS: SmartCluster[] = [
  { id: 'kaizen', name: 'Agent Kaizen kalite sistemi', theme: 'yetenek', color: 'teal', icon: 'test',
    why: 'Üç kalite döngüsünün araç adayları ve proje içi süreç düzeni. Katalog üyeliği kurulu entegrasyon anlamına gelmez.', rule: cond('tags', 'any', ['kaizen']) },
  { id: 'kaizen-evals', name: 'AI değerlendirme ve deneyler', theme: 'kanıt', color: 'blue', icon: 'flask',
    why: 'Sabit veri kümeleriyle model, istem ve ajan sürümlerini değerlendirme adayları.', rule: cond('tags', 'any', ['kaizen-eval']) },
  { id: 'kaizen-traces', name: 'Ajan izleri ve hata incelemesi', theme: 'kanıt', color: 'cyan', icon: 'trace',
    why: 'Başarısız çalışmaları gözlenen izlerle incelemek için adaylar; kök neden doğrulanana kadar hipotez kalır.', rule: cond('tags', 'any', ['kaizen-trace']) },
  { id: 'api-istemcileri', name: 'API istemcileri ve keşif', theme: 'yetenek', color: 'blue', icon: 'plug',
    why: 'API isteği gönderme ve yanıt inceleme yeteneği. GUI, IDE ve CLI seçeneklerini aynı ihtiyaç üzerinden karşılaştır.',
    rule: cond('tags', 'any', ['api-client']) },
  { id: 'api-ci', name: 'API testlerini CI sürecine taşı', theme: 'yetenek', color: 'teal', icon: 'test',
    why: 'Koleksiyon veya HTTP doğrulamalarını bir koşucuyla otomatik çalıştırabilen araçlar. Plan ve sürüm koşullarını araç detayında kontrol et.',
    rule: cond('tags', 'any', ['api-ci']) },
  { id: 'api-yerel', name: 'Yerel API çalışma araçları', theme: 'mimari', color: 'cyan', icon: 'code',
    why: 'Yerel dosya veya yerel saklama seçeneği bulunan API araçları. Bu etiket tüm ağ trafiğinin kapalı olduğu garantisi değildir.',
    rule: and(cond('tags', 'any', ['api-client']), cond('tags', 'any', ['api-local'])) },
  { id: 'hizli-kazanimlar', name: 'Hızlı kazanımlar', theme: 'karar', color: 'teal', icon: 'bolt',
    why: 'Düşük entegrasyon yükü, açık lisans ve Benimse/Dene halkası birlikte: ilk sprintte risk almadan eklenebilecek parçalar.',
    rule: and(cond('effort', 'eq', 'Düşük'), cond('license', 'in', OPEN), cond('ring', 'in', ['Benimse', 'Dene'])) },
  { id: 'cekirdek-yigin', name: 'Çekirdek yığın adayları', theme: 'karar', color: 'indigo', icon: 'stack',
    why: 'Raporların “çekirdek aday” olarak işaret ettiği varlıklar. Her altın kümeden en az birinin burada olması beklenir.',
    rule: cond('stance', 'eq', 'Çekirdek aday') },
  { id: 'prototip-adaylari', name: 'Prototip yarışması', theme: 'karar', color: 'blue', icon: 'flask',
    why: 'Aynı katalog ve senaryoyla karşılaştırılması önerilen adaylar (sentez §12.3: adil deney).',
    rule: cond('stance', 'eq', 'Prototip adayı') },
  { id: 'dogrulama-bekleyen', name: 'Doğrulama bekleyenler', theme: 'kanıt', color: 'red', icon: 'alert',
    why: 'En az bir itirazlı ya da reddedilmiş iddiası olan varlıklar; seçimden önce doğrulama spike’ı gerekir.',
    rule: cond('disputed', 'gte', 1) },
  { id: 'tartismali-protokoller', name: 'Hareketli zemin: protokol ve şemalar', theme: 'risk', color: 'orange', icon: 'protocol',
    why: 'Protokol/şema olup taslak–RC aşamasında ya da itirazlı iddia taşıyanlar. Sürüm sabitleme ve adaptör katmanı şart.',
    rule: and(cond('kind', 'in', ['Protokol', 'Format/Şema']), or(cond('maturity', 'in', ['Taslak', 'RC/Beta', 'Deneysel', 'Bilinmiyor']), cond('disputed', 'gte', 1))) },
  { id: 'react-bagimsiz', name: 'React’tan bağımsız taşınabilir parçalar', theme: 'mimari', color: 'cyan', icon: 'plug',
    why: 'Brief React’ı kesin seçim saymıyor. Framework değişse de korunacak tarayıcı yerel ve framework bağımsız araçlar.',
    rule: and(cond('platform', 'in', ['Tarayıcı yerel', 'Framework bağımsız', 'Çoklu framework', 'Belirtim']), cond('radarEligible', 'is')) },
  { id: 'react-kilidi', name: 'React kilidi', theme: 'risk', color: 'grape', icon: 'lock',
    why: 'Yalnız React ile çalışan parçalar. Astro adaları veya başka framework senaryosunda yeniden değerlendirilmeli.',
    rule: and(cond('platform', 'eq', 'React'), cond('radarEligible', 'is')) },
  { id: 'tarayici-yerel-hareket', name: 'Önce tarayıcı: yerel hareket', theme: 'yetenek', color: 'pink', icon: 'motion',
    why: 'Sentezin “önce CSS, ihtiyaç ölçülürse JS motoru” kararı için tarayıcının yerleşik hareket yetenekleri.',
    rule: and(cond('layer', 'eq', 'L04'), cond('platform', 'in', ['Tarayıcı yerel', 'Belirtim'])) },
  { id: 'js-hareket-motorlari', name: 'JS hareket motorları', theme: 'yetenek', color: 'pink', icon: 'engine',
    why: 'Yerleşim, kesintiye uğrayan geçiş ve zaman çizelgesi için JavaScript motorları; ikisini aynı öğede çalıştırmamak gerekir.',
    rule: and(cond('layer', 'eq', 'L04'), cond('kind', 'in', ['Kütüphane', 'Platform/Servis', 'Format/Şema'])) },
  { id: 'lisans-riski', name: 'Lisans ve ticari risk', theme: 'risk', color: 'yellow', icon: 'license',
    why: 'Ticari, açık çekirdek/Pro ya da lisansı bilinmeyen kullanılabilir araçlar; R26 maliyet ve çıkış stratejisi incelemesi.',
    rule: and(cond('license', 'in', ['Ticari', 'Açık çekirdek/Pro', 'Bilinmiyor']), cond('radarEligible', 'is')) },
  { id: 'akis-dayanikliligi', name: 'Akış dayanıklılığı', theme: 'yetenek', color: 'cyan', icon: 'stream',
    why: 'Uzun ajan işinde sıra, tekrar, yeniden bağlanma, iptal ve yama uygulamasını üstlenen parçalar.',
    rule: cond('tags', 'any', ['akış', 'yeniden-bağlanma', 'yeniden-oynatma', 'iptal', 'yama']) },
  { id: 'dosya-hatti', name: 'Uçtan uca dosya hattı', theme: 'yetenek', color: 'green', icon: 'upload',
    why: 'Seçim, sürdürülebilir aktarım ve kalıcılık: “yükleme %100” ile “iş bitti” ayrımını kuran araçlar.',
    rule: or(cond('golden', 'eq', 'G06'), cond('tags', 'any', ['sürdürme', 'yükleme', 'dosya-seçimi', 'çevrimdışı'])) },
  { id: 'erisilebilirlik-kalkani', name: 'Erişilebilirlik kalkanı', theme: 'yetenek', color: 'lime', icon: 'a11y',
    why: 'Dinamik değişen ekranın klavye, ekran okuyucu ve azaltılmış hareket tercihiyle kullanılabilir kalması için.',
    rule: cond('tags', 'any', ['erişilebilirlik', 'hareket-tercihi', 'ekran-okuyucu', 'headless']) },
  { id: 'guvenlik-siniri', name: 'Güvenlik sınırı', theme: 'risk', color: 'red', icon: 'shield',
    why: 'Üretilen tarif ve eylemleri yalıtan, temizleyen ve tehdit modelini tanımlayan parçalar (R23).',
    rule: or(cond('golden', 'eq', 'G10'), cond('tags', 'any', ['izolasyon', 'xss', 'iframe', 'tehdit-modeli'])) },
  { id: 'ortak-konsensus', name: 'Ortak konsensüs', theme: 'kanıt', color: 'violet', icon: 'users',
    why: 'Sekiz rapordan en az yedisinde geçenler. Çok konuşulmak doğruluk değildir; kanıt düzeyiyle birlikte okuyun.',
    rule: cond('coverage', 'gte', 7) },
  { id: 'gizli-cevherler', name: 'Az konuşulan ama sağlam', theme: 'kanıt', color: 'teal', icon: 'diamond',
    why: 'En fazla dört raporda geçen fakat kanıt puanı 50 ve üzerinde olan varlıklar: gözden kaçan güçlü seçenekler.',
    rule: and(cond('coverage', 'lte', 4), cond('evidence', 'gte', 50)) },
  { id: 'gorunur-ama-zayif', name: 'Görünür ama zayıf kanıtlı', theme: 'kanıt', color: 'orange', icon: 'eye',
    why: 'Çok anılan ama iddiaları zayıf ya da tartışmalı varlıklar: “çok konuşuldu, doğru sanıldı” riskine karşı.',
    rule: and(cond('visibility', 'gte', 55), cond('evidence', 'lt', 50)) },
  { id: 'kanit-bosluklari', name: 'Kanıt boşlukları', theme: 'kanıt', color: 'gray', icon: 'question',
    why: 'Kullanılabilir tür olduğu hâlde hiçbir iddiaya bağlanmamış varlıklar. Karar vermeden önce kaynak eklenmeli.',
    rule: and(cond('evidence', 'isnull'), cond('radarEligible', 'is')) },
  { id: 'sentez-disi', name: 'Sentezin dışında kalanlar', theme: 'kanıt', color: 'gray', icon: 'filter-off',
    why: 'En az üç raporda geçtiği hâlde sentez raporunda anılmayanlar: sentezin sıkıştırırken dışarıda bıraktıkları.',
    rule: and(not(cond('inSynthesis', 'is')), cond('coverage', 'gte', 3)) },
  { id: 'renderer-yarisi', name: 'Renderer seçimi', theme: 'mimari', color: 'grape', icon: 'render',
    why: 'Tarifi bileşene çeviren katman (R09). Sentez, aynı katalogla iki prototip kurmayı öneriyor.',
    rule: cond('layer', 'eq', 'L05') },
  { id: 'sozlesme-omurgasi', name: 'Sözleşme omurgası', theme: 'mimari', color: 'violet', icon: 'protocol',
    why: 'Olay, tarif ve şema sözleşmeleri (R08, R10). Frontend’in backend’den bağımsızlığını taşıyan katman.',
    rule: cond('golden', 'eq', 'G02') },
  { id: 'ai-bilesen-vitrini', name: 'AI bileşen vitrini', theme: 'yetenek', color: 'orange', icon: 'sparkles',
    why: 'Onay kartı, araç durumu, düşünce zinciri ve hareketli bileşen kitleri; hazır işlev ile görsel örnek ayrımı sınanmalı.',
    rule: or(cond('golden', 'eq', 'G08'), cond('tags', 'any', ['ai-bileşeni', 'hareketli-bileşen'])) },
  { id: 'analitik-dogruluk', name: 'Analitik doğruluk', theme: 'yetenek', color: 'yellow', icon: 'chart',
    why: 'Grafiği dar sözleşmeyle çizen motorlar ve dilbilgileri (R19). Ham motor yapılandırmasını modele bırakmamak için.',
    rule: or(cond('golden', 'eq', 'G09'), cond('tags', 'any', ['grafik'])) },
  { id: 'token-marka', name: 'Token ve marka kontrolü', theme: 'yetenek', color: 'lime', icon: 'palette',
    why: 'AI’ın görsel ton seçiminin marka ve erişilebilirlik sınırında kalması için token hattı (R20).',
    rule: cond('tags', 'any', ['token', 'marka', 'tema', 'tasarım-dili']) },
  { id: 'kalite-gozlem', name: 'Kalite ve gözlem hattı', theme: 'mimari', color: 'blue', icon: 'test',
    why: 'Bozuk akış, performans ve hata teşhisi için test ve izleme araçları (R24, R25).',
    rule: or(cond('golden', 'eq', 'G12'), cond('tags', 'any', ['test', 'izleme', 'e2e'])) },
  { id: 'bekleme-bilimi', name: 'Bekleme bilimi', theme: 'kanıt', color: 'gray', icon: 'hourglass',
    why: 'İskelet, spinner, kalan süre ve gecikme eşikleri üzerine deneyler ve rehberler; evrensel eşik yok, koşullu kanıt var.',
    rule: cond('tags', 'any', ['bekleme', 'iskelet', 'ilerleme', 'bekleme-rehberi']) },
  { id: 'ajan-cerceveleri', name: 'Ajan çerçeveleri', theme: 'mimari', color: 'dark', icon: 'robot',
    why: 'AG-UI/A2UI olaylarını üreten arka uç çerçeveleri. Frontend bunlardan birine kilitlenmemeli.',
    rule: and(cond('golden', 'eq', 'S2'), cond('kind', 'in', ['Framework', 'Platform/Servis'])) },
  { id: 'olgunlasmamis-standartlar', name: 'Olgunlaşmamış standartlar', theme: 'risk', color: 'orange', icon: 'draft',
    why: 'Standart/protokol olup taslak, RC ya da deneysel durumda olanlar; tarayıcı veya sürüm matrisi gerekir.',
    rule: and(cond('kind', 'in', ['Standart', 'Protokol', 'Format/Şema', 'Tarayıcı API']), cond('maturity', 'in', ['Taslak', 'RC/Beta', 'Deneysel'])) },
  { id: 'yuksek-risk', name: 'Yüksek risk profili', theme: 'risk', color: 'red', icon: 'flame',
    why: 'Risk puanı 40 ve üzeri: itiraz, lisans, olgunluk ve entegrasyon yükü birleşiyor.',
    rule: cond('riskTier', 'eq', 'Yüksek') },
  { id: 'benimse-halkasi', name: 'Benimse halkası', theme: 'karar', color: 'teal', icon: 'target',
    why: 'Bileşik puanı 66 ve üzeri olanlar. Radar formülü şeffaftır ve veriyle birlikte güncellenir.',
    rule: cond('ring', 'eq', 'Benimse') },
  { id: 'beklet-halkasi', name: 'Beklet halkası', theme: 'karar', color: 'gray', icon: 'pause',
    why: 'Kullanılabilir tür olup bileşik puanı düşük ya da raporlarca ertelenen varlıklar.',
    rule: and(cond('ring', 'eq', 'Beklet'), cond('radarEligible', 'is')) },
  { id: 'coklu-platform', name: 'Çoklu platform', theme: 'mimari', color: 'cyan', icon: 'devices',
    why: 'Mobil, web bileşenleri veya birden çok framework hedefleyen parçalar: farklı istemciler gerekiyorsa.',
    rule: cond('tags', 'any', ['çoklu-platform', 'çoklu-framework', 'web-components', 'mobil']) },
  { id: 'prototip-cekirdegi', name: 'İlk prototip çekirdeği', theme: 'karar', color: 'indigo', icon: 'rocket',
    why: 'Renderer, katalog ve akışlı tarif sorularına (R09, R10, R12) giren çekirdek/prototip adayları: sentezdeki A→C kapıları.',
    rule: and(cond('rTopics', 'any', ['R09', 'R10', 'R12']), cond('stance', 'in', ['Çekirdek aday', 'Prototip adayı'])) },
  { id: 'durum-surekliligi', name: 'Durum ve süreklilik', theme: 'yetenek', color: 'teal', icon: 'state',
    why: 'Sunucu verisi, ajan yaşam döngüsü ve kullanıcı emeğini ayrı sahiplerde tutan araçlar (R13, R15, R16).',
    rule: or(cond('golden', 'eq', 'G05'), cond('tags', 'any', ['durum-makinesi', 'önbellek', 'durum-koruma', 'yaşam-döngüsü'])) },
  { id: 'gorus-ayriligi', name: 'Görüş ayrılığı yoğun', theme: 'kanıt', color: 'orange', icon: 'split',
    why: 'Aynı iddiaya farklı aşamalarda farklı durum verilmiş en az üç iddiası olan varlıklar.',
    rule: cond('contested', 'gte', 3) },
  { id: 'kaynakca-zengin', name: 'Kaynakça zengin', theme: 'kanıt', color: 'blue', icon: 'books',
    why: 'Kaynak siciline en az sekiz URL ile bağlı varlıklar; doğrulama yapmak için en iyi başlangıç noktaları.',
    rule: cond('sourceCount', 'gte', 8) },
];

export interface BucketScheme {
  id: string;
  name: string;
  why: string;
  restLabel: string;
  buckets: Bucket[];
}

export const BUCKET_SCHEMES: BucketScheme[] = [
  {
    id: 'benimseme-stratejisi', name: 'Benimseme stratejisi', restLabel: 'Arşiv / yalnız referans',
    why: 'Her varlık ilk eşleşen stratejiye düşer: önce hemen kullanılabilir olanlar, sonra pilot, sonra doğrulama gerekenler.',
    buckets: [
      { id: 'hemen', label: 'Hemen kullan', color: 'teal', rule: and(cond('ring', 'eq', 'Benimse'), cond('effort', 'neq', 'Yüksek')), desc: 'Benimse halkası ve yük yüksek değil' },
      { id: 'pilot', label: 'Pilotla', color: 'blue', rule: cond('ring', 'in', ['Benimse', 'Dene']), desc: 'Benimse/Dene halkası' },
      { id: 'spike', label: 'Spike ile doğrula', color: 'orange', rule: or(cond('disputed', 'gte', 1), cond('maturity', 'in', ['Taslak', 'Deneysel'])), desc: 'İtiraz veya taslak durum' },
      { id: 'izle', label: 'İzle', color: 'yellow', rule: cond('ring', 'eq', 'Değerlendir'), desc: 'Değerlendir halkası' },
    ],
  },
  {
    id: 'kanit-konsensus', name: 'Kanıt × konsensüs dörtlüsü', restLabel: 'Zayıf sinyal',
    why: 'Çok konuşulmak ile iyi desteklenmek ayrı eksenlerdir. Dörtlü, “yankı” ile “kanıt”ı ayırır.',
    buckets: [
      { id: 'altin', label: 'Güçlü kanıt + geniş konsensüs', color: 'teal', rule: and(cond('evidence', 'gte', 55), cond('coverage', 'gte', 6)) },
      { id: 'sessiz', label: 'Güçlü kanıt, dar konsensüs', color: 'cyan', rule: cond('evidence', 'gte', 55) },
      { id: 'yanki', label: 'Geniş konsensüs, zayıf kanıt', color: 'orange', rule: cond('coverage', 'gte', 6) },
      { id: 'kanitsiz', label: 'Kanıtsız görünürlük', color: 'gray', rule: and(cond('evidence', 'isnull'), cond('coverage', 'gte', 3)) },
    ],
  },
  {
    id: 'risk-yuk', name: 'Risk × entegrasyon yükü', restLabel: 'Orta bölge',
    why: 'Düşük risk/düşük yük hızlı kazanım; yüksek risk/yüksek yük en pahalı hatadır.',
    buckets: [
      { id: 'kolay', label: 'Düşük risk · düşük yük', color: 'teal', rule: and(cond('riskTier', 'eq', 'Düşük'), cond('effort', 'eq', 'Düşük')) },
      { id: 'yatirim', label: 'Düşük risk · yatırım gerekir', color: 'blue', rule: cond('riskTier', 'eq', 'Düşük') },
      { id: 'tuzak', label: 'Yüksek risk · kolay görünen', color: 'orange', rule: and(cond('riskTier', 'eq', 'Yüksek'), cond('effort', 'neq', 'Yüksek')) },
      { id: 'pahali', label: 'Yüksek risk · yüksek yük', color: 'red', rule: cond('riskTier', 'eq', 'Yüksek') },
    ],
  },
  {
    id: 'tasinabilirlik', name: 'Taşınabilirlik', restLabel: 'Sunucu / tasarım / diğer',
    why: 'Framework değişirse neyin kalacağını gösterir: tarayıcı yerel en taşınabilir, React’a kilitli en az.',
    buckets: [
      { id: 'yerel', label: 'Tarayıcı yerel', color: 'teal', rule: cond('platform', 'eq', 'Tarayıcı yerel') },
      { id: 'bagimsiz', label: 'Framework bağımsız / belirtim', color: 'cyan', rule: cond('platform', 'in', ['Framework bağımsız', 'Belirtim']) },
      { id: 'coklu', label: 'Çoklu framework', color: 'blue', rule: cond('platform', 'eq', 'Çoklu framework') },
      { id: 'react', label: 'React’a kilitli', color: 'grape', rule: cond('platform', 'eq', 'React') },
    ],
  },
  {
    id: 'gecis-kapilari', name: 'Geçiş kapıları (A–F)', restLabel: 'F — Genişleme ve destek',
    why: 'Sentezdeki aşamalı ürünleştirme kapılarına göre: hangi araç hangi kapıda gerekli olur?',
    buckets: [
      { id: 'A', label: 'A — Temel sözleşme', color: 'violet', rule: or(cond('golden', 'in', ['G02', 'G05']), cond('tags', 'any', ['şema'])) },
      { id: 'B', label: 'B — Sabit çalışan akış', color: 'indigo', rule: cond('golden', 'in', ['G01', 'G04', 'G06']) },
      { id: 'C', label: 'C — Kontrollü GenUI', color: 'grape', rule: cond('golden', 'in', ['G03', 'G08']) },
      { id: 'D', label: 'D — Bildirimsel düzen', color: 'pink', rule: cond('golden', 'in', ['G07', 'G09', 'G11']) },
      { id: 'E', label: 'E — Ürünleştirme', color: 'blue', rule: cond('golden', 'in', ['G10', 'G12']) },
    ],
  },
  {
    id: 'sahiplik-modeli', name: 'Sahiplik modeli', restLabel: 'Bilinmiyor / uygulanmaz',
    why: 'Kodu sahiplenmek (kopyala-uyarla), paket bağımlılığı, standart ve ticari hizmet farklı bakım yükleri getirir.',
    buckets: [
      { id: 'kaynak', label: 'Kaynak kodu sahiplenilen', color: 'teal', rule: cond('tags', 'any', ['kaynak-sahipliği', 'shadcn']) },
      { id: 'acik', label: 'Açık lisanslı paket', color: 'blue', rule: cond('license', 'in', ['MIT', 'Apache-2.0', 'BSD', 'ISC', 'MPL-2.0']) },
      { id: 'standart', label: 'Standart / belirtim', color: 'violet', rule: cond('license', 'eq', 'Standart') },
      { id: 'ticari', label: 'Ticari / açık çekirdek', color: 'orange', rule: cond('license', 'in', ['Ticari', 'Açık çekirdek/Pro']) },
    ],
  },
  {
    id: 'hareket-butcesi', name: 'Hareket bütçesi', restLabel: 'Hareket dışı',
    why: 'Sentezin “önce CSS, ölçülürse JS” kuralı: hareket ihtiyacını en ucuz katmanda karşılamak için.',
    buckets: [
      { id: 'css', label: 'Tarayıcı/CSS ile çözülür', color: 'teal', rule: and(cond('layer', 'eq', 'L04'), cond('platform', 'in', ['Tarayıcı yerel', 'Belirtim'])) },
      { id: 'js', label: 'JS motoru gerekir', color: 'pink', rule: cond('layer', 'eq', 'L04') },
      { id: 'bilesen', label: 'Hazır hareketli bileşen', color: 'orange', rule: cond('tags', 'any', ['hareketli-bileşen', 'sayı-geçişi']) },
    ],
  },
];
