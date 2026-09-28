/**
 * Gruplama boyutları. Her boyut "neye göre?" sorusunu ve hangi karara hizmet ettiğini açıklar.
 */
import { communityById, goldenById, layerById, meta, segmentById, topicById } from '@/data';
import type { Dimension } from './grouping';
import { cond, type FieldKey, type Rule } from './rules';

export const RING_ORDER = ['Benimse', 'Dene', 'Değerlendir', 'Beklet'];
export const RING_COLOR: Record<string, string> = { Benimse: 'teal', Dene: 'blue', Değerlendir: 'yellow', Beklet: 'gray' };
export const RISK_COLOR: Record<string, string> = { Düşük: 'teal', Orta: 'yellow', Yüksek: 'red' };
export const EVIDENCE_ORDER = ['Güçlü', 'Orta', 'Zayıf', 'Tartışmalı', 'Kanıt yok'];
export const EVIDENCE_COLOR: Record<string, string> = { Güçlü: 'teal', Orta: 'blue', Zayıf: 'yellow', Tartışmalı: 'red', 'Kanıt yok': 'gray' };
export const CONSENSUS_ORDER = ['Ortak (7–8 rapor)', 'Çoğunluk (4–6)', 'Azınlık (2–3)', 'Tekil (1)', 'Yalnız ara analiz/sentez', 'Korpus dışı ekleme'];
export const MATURITY_ORDER = ['Kararlı', 'RC/Beta', 'Taslak', 'Deneysel', 'Araştırma', 'Bilinmiyor'];
export const MATURITY_COLOR: Record<string, string> = { Kararlı: 'teal', 'RC/Beta': 'blue', Taslak: 'yellow', Deneysel: 'orange', Araştırma: 'violet', Bilinmiyor: 'gray' };
export const STANCE_ORDER = ['Çekirdek aday', 'Prototip adayı', 'Seçimli', 'Referans', 'Ertele/Kaçın'];
export const STANCE_COLOR: Record<string, string> = { 'Çekirdek aday': 'teal', 'Prototip adayı': 'blue', Seçimli: 'cyan', Referans: 'gray', 'Ertele/Kaçın': 'red' };
export const EFFORT_ORDER = ['Düşük', 'Orta', 'Yüksek'];
export const LICENSE_ORDER = ['MIT', 'Apache-2.0', 'BSD', 'ISC', 'MPL-2.0', 'Açık çekirdek/Pro', 'Ticari', 'Standart', 'Uygulanmaz', 'Bilinmiyor'];
export const PLATFORM_ORDER = ['Tarayıcı yerel', 'Framework bağımsız', 'Çoklu framework', 'React', 'Sunucu', 'Belirtim', 'Tasarım'];
export const KIND_ORDER = ['Kütüphane', 'Framework', 'Bileşen', 'Protokol', 'Format/Şema', 'Standart', 'Tarayıcı API', 'Test Aracı', 'Metrik', 'Platform/Servis', 'Tasarım Sistemi', 'Rehber', 'Araştırma', 'Model', 'Tarayıcı', 'Kuruluş'];

export const DIMENSIONS: Dimension[] = [
  {
    key: 'golden', label: 'Altın küme', type: 'single',
    question: 'Ürünü kurarken hangi işi çözüyor?',
    rationale: 'İş hedefine göre ideal gruplama: 12 çekirdek küme ürünün yapı taşlarını, 3 destek halkası kanıt, arka uç ve platformu toplar. Bir kümeden bir çekirdek aday seçmek mimariyi tamamlar.',
    get: (t) => t.golden, order: meta.golden.map((g) => g.id),
    labelFor: (k) => goldenById.get(k)?.name ?? k, colorFor: (k) => goldenById.get(k)?.color ?? 'gray', descFor: (k) => goldenById.get(k)?.job ?? '',
  },
  {
    key: 'layer', label: 'Mimari katman', type: 'single',
    question: 'Yığında (stack) nerede duruyor?',
    rationale: 'Deneyimden tarayıcıya 16 katman. Aynı katmanda iki araç çoğu zaman alternatiftir; farklı katmanlardakiler birlikte çalışır. Çakışan bağımlılıkları görmeyi kolaylaştırır.',
    get: (t) => t.layer, order: meta.layers.map((l) => l.id),
    labelFor: (k) => layerById.get(k)?.name ?? k, descFor: (k) => layerById.get(k)?.desc ?? '',
  },
  {
    key: 'kind', label: 'Tür', type: 'single',
    question: 'Ne tür bir şey: kütüphane mi, protokol mü, standart mı?',
    rationale: 'Kurulan paket ile uyulan sözleşme ve okunan araştırma farklı sahiplik ister. Tür, bakım ve karar sorumluluğunu ayırır.',
    get: (t) => t.kind, order: KIND_ORDER,
  },
  {
    key: 'stance', label: 'Rapor duruşu', type: 'single',
    question: 'Raporlar bu ürün için ne öneriyor?',
    rationale: 'Sentez ve raporların önerisi: çekirdek aday, prototip adayı, seçimli, referans veya ertele. Yol haritasındaki sırayı belirler.',
    get: (t) => t.stance, order: STANCE_ORDER, colorFor: (k) => STANCE_COLOR[k] ?? 'gray',
  },
  {
    key: 'ring', label: 'Radar halkası', type: 'single',
    question: 'Kanıt, konsensüs, olgunluk ve duruşun bileşik puanına göre benimseme düzeyi nedir?',
    rationale: 'Karar farkında halka. Bileşik puan = %33 kanıt + %25 rapor kapsaması + %24 olgunluk + %18 rapor duruşu. Benimse: çekirdek aday ve puan ≥70 (ya da prototip adayı, puan ≥78, kanıt ≥60). Dene: çekirdek/prototip adayı ve ≥55 ya da seçimli ve ≥72. Değerlendir: ≥50. Diğerleri ve ertelenenler: Beklet. Veri değişince halka kendiliğinden değişir.',
    get: (t) => t.ring, order: RING_ORDER, colorFor: (k) => RING_COLOR[k] ?? 'gray',
  },
  {
    key: 'evidence', label: 'Kanıt düzeyi', type: 'single',
    question: 'Bu araca bağlı iddialar ne kadar desteklenmiş?',
    rationale: '889 iddianın son değerlendirme durumundan türetilir: desteklenen tam, doğrulanmamış 0,4 puan; itirazlı ve reddedilen ceza puanı alır. İddiası olmayan araç “Kanıt yok” grubundadır.',
    get: (t) => t.evidenceTier, order: EVIDENCE_ORDER, colorFor: (k) => EVIDENCE_COLOR[k] ?? 'gray',
  },
  {
    key: 'consensus', label: 'Konsensüs', type: 'single',
    question: 'Sekiz bağımsız rapordan kaçı bahsediyor?',
    rationale: 'Çok raporda geçmek önemi gösterir ama doğruluk kanıtı değildir: aynı kaynak birden çok modelde tekrar edilebilir. Kanıt düzeyiyle birlikte okunmalıdır.',
    get: (t) => t.consensus, order: CONSENSUS_ORDER,
  },
  {
    key: 'maturity', label: 'Olgunluk', type: 'single',
    question: 'Sürüm ve kararlılık durumu nedir?',
    rationale: 'Taslak/RC protokoller sürüm sabitleme ve adaptör katmanı gerektirir; kararlı araçlar doğrudan kullanılabilir. Geçiş riskini gösterir.',
    get: (t) => t.maturity, order: MATURITY_ORDER, colorFor: (k) => MATURITY_COLOR[k] ?? 'gray',
  },
  {
    key: 'license', label: 'Lisans', type: 'single',
    question: 'Hukuki ve ticari kullanım koşulu nedir?',
    rationale: 'Açık lisans, açık çekirdek/Pro, ticari ve standart ayrımı; toplam sahip olma maliyeti ve çıkış stratejisini etkiler (R26).',
    get: (t) => t.license, order: LICENSE_ORDER,
  },
  {
    key: 'platform', label: 'Platform bağı', type: 'single',
    question: 'React’a mı bağlı, yoksa tarayıcı yerel mi?',
    rationale: 'Brief, React’ı kesinleşmiş seçim saymıyor. Bu boyut, framework değişirse hangi parçaların taşınabileceğini gösterir.',
    get: (t) => t.platform, order: PLATFORM_ORDER,
  },
  {
    key: 'effort', label: 'Entegrasyon yükü', type: 'single',
    question: 'Ürüne almak ne kadar iş gerektirir?',
    rationale: 'Sunucu sözleşmesi, adaptör, test ve bakım işini kaba bir düzeyde gösterir. Hızlı kazanımları ve pahalı kararları ayırır.',
    get: (t) => t.effort, order: EFFORT_ORDER, colorFor: (k) => ({ Düşük: 'teal', Orta: 'yellow', Yüksek: 'red' })[k] ?? 'gray',
  },
  {
    key: 'risk', label: 'Risk profili', type: 'single',
    question: 'İtiraz, lisans, olgunluk ve yük bakımından ne kadar riskli?',
    rationale: 'Risk puanı = itiraz oranı ×40 + lisans riski + olgunluk riski + entegrasyon yükü (+ çok sayıda görüş ayrılığı). Pilot öncesi doğrulama önceliğini belirler.',
    get: (t) => t.riskTier, order: ['Düşük', 'Orta', 'Yüksek'], colorFor: (k) => RISK_COLOR[k] ?? 'gray',
  },
  {
    key: 'community', label: 'Birlikte anılma', type: 'single',
    question: 'Raporlarda hangi araçlarla aynı paragrafta geçiyor?',
    rationale: 'Veri güdümlü küme: tekrarsız paragraflarda birlikte geçiş kosinüs ağırlığıyla grafa dönüştürülüp Louvain topluluk algılamasıyla bölündü. Elle kurulan altın kümelerle karşılaştırmak gizli bağımlılıkları gösterir.',
    get: (t) => t.community, order: [...meta.communities.map((c) => c.id), 'C00'],
    labelFor: (k) => (k === 'C00' ? 'Bağımsız (topluluğa girmeyen)' : communityById.get(k)?.name ?? k),
  },
  {
    key: 'vendor', label: 'Üretici / ekosistem', type: 'single',
    question: 'Kim sürdürüyor?',
    rationale: 'Aynı üreticiye çok sayıda parçada bağlanmak tek nokta riskidir; ekosistem uyumu ise entegrasyonu kolaylaştırır.',
    get: (t) => t.vendor,
  },
  {
    key: 'segment', label: 'Araştırma segmenti', type: 'multi',
    question: 'Araştırma programının hangi bölümünde (A–G) ele alındı?',
    rationale: 'Brief’in 7 segmenti; bir araç birden çok segmentte yer alabilir. Hangi karar hattını beslediğini gösterir.',
    get: (t) => t.segments, order: meta.segments.map((s) => s.id),
    labelFor: (k) => (segmentById.get(k) ? `${k} — ${segmentById.get(k)!.title}` : k),
  },
  {
    key: 'topic', label: 'Araştırma konusu', type: 'multi',
    question: 'Hangi araştırma sorusuna (R01–R28) yanıt veriyor?',
    rationale: '28 araştırma dosyası. Çok değerli: bir araç birden fazla soruya girdi olabilir. Açık kalan doğrulamaları araca bağlar.',
    get: (t) => t.rTopics, order: Array.from({ length: 28 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`),
    labelFor: (k) => (topicById.get(k) ? `${k} · ${topicById.get(k)!.short}` : k),
  },
  {
    key: 'tag', label: 'Yetenek etiketi', type: 'multi',
    question: 'Hangi yeteneği sağlıyor?',
    rationale: 'İnce taneli yetenekler (akış, renderer, iptal, sürdürme…). Bir ihtiyaç için bütün adayları katmandan bağımsız görmeyi sağlar.',
    get: (t) => t.tags,
  },
];

export function dimensionByKey(key: string): Dimension | undefined {
  return DIMENSIONS.find((d) => d.key === key);
}

const DIM_FIELD: Record<string, { field: FieldKey; multi: boolean }> = {
  golden: { field: 'golden', multi: false }, layer: { field: 'layer', multi: false }, kind: { field: 'kind', multi: false },
  stance: { field: 'stance', multi: false }, ring: { field: 'ring', multi: false }, evidence: { field: 'evidenceTier', multi: false },
  consensus: { field: 'consensus', multi: false }, maturity: { field: 'maturity', multi: false }, license: { field: 'license', multi: false },
  platform: { field: 'platform', multi: false }, effort: { field: 'effort', multi: false }, risk: { field: 'riskTier', multi: false },
  community: { field: 'community', multi: false }, vendor: { field: 'vendor', multi: false },
  segment: { field: 'segments', multi: true }, topic: { field: 'rTopics', multi: true }, tag: { field: 'tags', multi: true },
};

/** Bir grubu eşdeğer koşula çevirir: grup → dinamik küme. */
export function ruleForGroup(dimKey: string, value: string): Rule | null {
  const m = DIM_FIELD[dimKey];
  if (!m) return null;
  return m.multi ? cond(m.field, 'any', [value]) : cond(m.field, 'eq', value);
}
