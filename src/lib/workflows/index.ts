import type { Workflow, WorkflowFamily } from '@/data/types';
import type { GenInput } from './common';
import { kaizenFamily } from './kaizen';
import { apiFamily } from './api';
import { adoptionFamily } from './adoption';
import { communityFamily, gateFamily, goldenFamily, topicFamily } from './structural';
import { lifecycleFamily } from './lifecycles';
import { sequenceFamily } from './sequences';
import { decisionFamily } from './decisions';
import { failureFamily, scenarioFamily } from './scenarios';
import { claimFamily, roadmapFamily, stackFamily, threatFamily } from './extras';
import { bucketSchemeFamily, smartClusterFamily } from './clusters';

export type { GenInput } from './common';

export const FAMILY_DEFS: Omit<WorkflowFamily, 'count'>[] = [
  { id: 'kaizen', name: 'Agent Kaizen kalite döngüleri', desc: 'Üç döngü, 12 alt süreç ve 24 kabul senaryosu. Süreç tasarımlarıdır; çalışan otomasyon iddiası değildir.', diagram: 'flowchart' },
  { id: 'api-surecleri', name: 'API geliştirme ve test süreçleri', desc: 'Keşif, kimlik doğrulama, sözleşme, Git paylaşımı, CI regresyonu, SSE hata ayıklaması, IDE ve smoke testleri.', diagram: 'flowchart' },
  { id: 'benimseme', name: 'Benimseme akışları', desc: 'Her araç için lisans, olgunluk, itiraz, platform ve katmana göre koşullu dallanan benimseme; araştırmalar için kanıt okuma, platformlar için uyumluluk izleme.', diagram: 'flowchart' },
  { id: 'konu-karar', name: 'Araştırma konusu kararları', desc: 'R01–R28: ana soru, alt sorular, kanıt, aday araçlar, açık doğrulama ve beklenen çıktı.', diagram: 'flowchart' },
  { id: 'altin-hat', name: 'Altın küme hatları', desc: 'Her altın kümede çekirdek adaylardan tek ana seçime, tamamlayıcılara ve kabul testine.', diagram: 'flowchart' },
  { id: 'yasam-dongusu', name: 'Yaşam döngüleri', desc: 'Dosya, ajan, bağlantı, tarif, onay, form ve görünüm durum makineleri; araç varyantlarıyla.', diagram: 'state' },
  { id: 'protokol-sirasi', name: 'Protokol ve etkileşim sıraları', desc: 'AG-UI, A2UI, SpecStream, MCP Apps, Tus, SSE ve taşıma × protokol birleşimleri.', diagram: 'sequence' },
  { id: 'karar-agaci', name: 'Koşullu karar ağaçları', desc: '14 teknik karar × 4 bağlam profili: sorular profile göre öne alınır veya eklenir.', diagram: 'flowchart' },
  { id: 'senaryo', name: 'Kullanıcı senaryoları', desc: '12 gerçek iş senaryosu × sabit / kontrollü seçim / bildirimsel düzen.', diagram: 'flowchart' },
  { id: 'ariza', name: 'Arıza ve kurtarma', desc: '12 arıza kipi × akış, dosya ve form bağlamı: algıla, yalıt, koru, kurtar, test et.', diagram: 'flowchart' },
  { id: 'tehdit', name: 'Tehdit modelleri', desc: 'OWASP LLM ve GenUI’ye özgü tehditler için derinlemesine savunma.', diagram: 'flowchart' },
  { id: 'yigin', name: 'Yığın entegrasyonları', desc: '4 UI temeli × 6 renderer × 3 taşıma; birleşime özgü koşullar.', diagram: 'flowchart' },
  { id: 'yol-haritasi', name: 'Yol haritaları', desc: 'Sentezin A–F geçiş kapıları; profil ve kapı ayrıntısı (örnek süreler).', diagram: 'gantt' },
  { id: 'iddia-dogrulama', name: 'İtirazlı iddia doğrulama', desc: 'Sicilde itirazlı veya reddedilmiş her iddia için kaynak–pasaj–etki akışı.', diagram: 'flowchart' },
  { id: 'topluluk', name: 'Birlikte anılma hatları', desc: 'Veri güdümlü toplulukların katman katman birlikte çalışma hattı.', diagram: 'flowchart' },
  { id: 'kume-eylem', name: 'Akıllı küme eylemleri', desc: 'Her koşullu küme için kural → canlı üyeler → temaya göre eylem planı.', diagram: 'flowchart' },
  { id: 'kova', name: 'Koşullu gruplama şemaları', desc: 'CASE WHEN mantığıyla sıralı kovalar ve yedek kova.', diagram: 'flowchart' },
  { id: 'kapi', name: 'Geçiş kapıları', desc: 'Kapı A → F: çıktı, adaylar, ölçüm ve geçiş koşulu.', diagram: 'flowchart' },
];

export function generateAll(input: GenInput, edges: { a: string; b: string; w: number; c: number }[] = []): { families: WorkflowFamily[]; workflows: Workflow[] } {
  const workflows: Workflow[] = [
    ...kaizenFamily(input),
    ...apiFamily(input),
    ...adoptionFamily(input),
    ...topicFamily(input),
    ...goldenFamily(input),
    ...lifecycleFamily(input),
    ...sequenceFamily(input),
    ...decisionFamily(input),
    ...scenarioFamily(input),
    ...failureFamily(input),
    ...threatFamily(input),
    ...stackFamily(input),
    ...roadmapFamily(input),
    ...claimFamily(input),
    ...communityFamily(input, edges),
    ...gateFamily(input),
    ...smartClusterFamily(input),
    ...bucketSchemeFamily(input),
  ];
  const families: WorkflowFamily[] = FAMILY_DEFS.map((f) => ({ ...f, count: workflows.filter((w) => w.family === f.id).length })).filter((f) => f.count > 0);
  return { families, workflows };
}
