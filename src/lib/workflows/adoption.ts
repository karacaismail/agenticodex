/**
 * Aile 1 — araç başına koşullu benimseme / kanıt okuma / uyumluluk izleme akışı.
 * Dallar aracın özelliklerine göre açılır: lisans, olgunluk, itiraz, platform bağı, yük ve katman.
 */
import type { Tool, Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { Recorder, styled, wf, goldenName, layerName, type GenInput } from './common';

const LAYER_TESTS: Record<string, string[]> = {
  L01: ['Örneklem ve bağlamı hedef panelle karşılaştır'],
  L02: ['Açık/koyu tema kontrast ölçümü', 'Marka token sınırı dışına çıkış denemesi'],
  L03: ['Klavye ile tam gezinme ve odak koruma', 'Dar kapsayıcı (320 px) davranışı', 'Ekran okuyucu duyuruları'],
  L04: ['azaltılmış hareket tercihiyle çalıştır', 'Yarıda tersine dönen ve kesilen geçiş', 'Aynı öğeye iki motor dokunmuyor mu?'],
  L05: ['Bozuk mesaj ve bilinmeyen bileşen', 'Tekrar olay ve sırası değişmiş yama', 'Son geçerli görünüm korunuyor mu?'],
  L06: ['Sürüme sabitlenmiş olay kaydıyla yeniden oynatma', 'Bilinmeyen alan/olay türüne karşı dayanıklılık', 'Sağlayıcı değiştirme uyumluluk testi'],
  L07: ['Yarış durumu ve geç gelen olay (eski çalıştırma kimliği)', 'Kurum değişiminde önbellek temizliği', 'İptal ve yeniden deneme geçişleri'],
  L08: ['Bağlantı kesilip yeniden bağlanma', 'Tekrar teslim ve olay eleme', 'Ters vekil tamponlama ve zaman aşımı'],
  L09: ['Ağ kesintisi ve kaldığı yerden sürdürme', 'Bozuk, büyük ve parolalı dosya', 'Tek dosya hatası diğerlerini durdurmuyor mu?'],
  L10: ['Yanıltıcı grafik örnek kümesi (eksen, birim, eksik veri)', 'Grafik–tablo–metin aynı veri tutarlılığı', 'Kapsayıcı yeniden boyutlanması'],
  L11: ['Kararsız (flaky) test oranı', 'Gerçek arıza kayıtlarından regresyon seti'],
  L12: ['Enjeksiyon ve XSS saldırı kümesi', 'Yetki yükseltme ve izolasyon kaçış testi'],
  L13: ['Olay sözleşmesi uyumu (AG-UI/A2UI)', 'İptal onayı ve iş devamlılığı'],
  L14: ['Temsil seçimi değerlendirme kümesi', 'Katalog dışı çıktı oranı'],
  L15: ['Paket boyutu ve ilk etkileşim süresi', 'Etkileşimli alan sınırı (ada/istemci uygulaması)'],
  L16: ['Tarayıcı destek matrisi (Chrome, Safari, Firefox)', 'Desteklenmeyen tarayıcıda kabul edilebilir davranış'],
};

const LAYER_PROTO: Record<string, string> = {
  L02: 'Token hattı prototipi: tek kaynaktan tema üret',
  L03: 'Aynı 10 bileşenlik katalogla prototip',
  L04: 'Aynı cihaz ve işte hareket karşılaştırması',
  L05: 'Aynı katalog ve senaryoyla renderer prototipi',
  L06: 'Sürüme sabitlenmiş olay kaydıyla adaptör prototipi',
  L07: 'Paralel iş ve iptal senaryosuyla durum prototipi',
  L08: 'Gerçek ağ ve vekil arkasında akış prototipi',
  L09: 'Çoklu, büyük ve kesilen dosya prototipi',
  L10: 'Dar grafik şemasıyla grafik prototipi',
  L11: 'Kayıtlı olaylarla test koşumu',
  L12: 'Tehdit modeli ve saldırı testi prototipi',
  L13: 'Olay üreten örnek ajan',
  L15: 'Etkileşimli alan sınırı prototipi',
};

const RESEARCH_KINDS = new Set(['Araştırma', 'Rehber', 'Tasarım Sistemi']);
const WATCH_KINDS = new Set(['Model', 'Tarayıcı', 'Kuruluş']);

function alternatives(t: Tool, input: GenInput): Tool[] {
  return input.tools
    .filter((x) => x.id !== t.id && x.layer === t.layer && x.golden === t.golden && x.radarEligible)
    .sort((a, b) => b.composite - a.composite || a.id.localeCompare(b.id))
    .slice(0, 3);
}

function researchFlow(t: Tool, input: GenInput): Workflow {
  const f = new Flow('TD');
  const r = new Recorder();
  const a = f.node(`${t.name}\nKanıt okuma akışı`, 'stadium', 'start');
  const b = f.node('Birincil kaynağı aç ve tarihini kaydet', 'rect');
  r.add('Birincil kaynağı aç', 'Yayın/güncelleme ve erişim tarihini ayrı kaydet.');
  const c = f.node('Yöntem: örneklem, görev ve ölçüm', 'rect', 'data');
  r.add('Yöntemi çıkar', 'Örneklem büyüklüğü, görev türü ve ölçülen değişken (tercih mi, görev başarısı mı?).');
  const d = f.node('Bağlam hedef SaaS paneline uyuyor mu?', 'decision', 'decide');
  const e = f.node('Sonucu koşullu ilke olarak kaydet', 'rect');
  const g = f.node('Yalnız ilham olarak kullan; eşik türetme', 'rect', 'warn');
  r.add('Bağlam uyumunu sına', 'Deneyin cihazı, görevi ve kullanıcıları panelle aynı mı?');
  const disputed = t.claimStatus.disputed + t.claimStatus.rejected;
  const h = f.node(disputed ? `Karşı kanıtı oku: ${disputed} itirazlı iddia` : 'Karşı kanıt ve çelişen çalışmaları ara', 'rect', disputed ? 'risk' : undefined);
  r.add('Karşı kanıtı oku', disputed ? `${disputed} itirazlı/reddedilmiş iddia var.` : 'Aynı soruyu ters yönde yanıtlayan çalışmaları ekle.');
  const i = f.node('Ürün içi deney planı: aynı iş, veri ve ölçüt', 'sub', 'gate');
  r.add('Ürün içi deney planla', 'Sabit ekran ile üretken ekranı aynı ölçütlerle karşılaştır.');
  const j = f.node('Karar defterine koşul ve sınırla işle', 'stadium', 'end');
  r.add('Karar defterine işle');
  f.edge(a, b).edge(b, c).edge(c, d).edge(d, e, 'evet').edge(d, g, 'hayır').edge(e, h).edge(g, h).edge(h, i).edge(i, j);
  styled(f, ['start', 'end', 'decide', 'risk', 'warn', 'data', 'gate']);
  return wf({
    id: `benimseme-${t.id}`,
    title: `${t.name} · Kanıt okuma akışı`,
    family: 'benimseme',
    diagram: 'flowchart',
    summary: `${t.name} bir ${t.kind.toLowerCase()} kaynağıdır; ürün kararı için evrensel eşik değil, koşullu kanıt olarak okunur. Akış yöntem, bağlam uyumu ve karşı kanıtı ayırır.`,
    mermaid: f.toString(),
    steps: r.steps,
    conditions: [disputed ? `${disputed} itirazlı iddia olduğu için karşı kanıt adımı vurgulandı` : 'İtirazlı iddia yok: karşı kanıt araması standart adım'],
    tools: [t.id],
    topics: t.rTopics,
    tags: ['kanıt', 'araştırma'],
  }, input);
}

function watchFlow(t: Tool, input: GenInput): Workflow {
  const f = new Flow('LR');
  const r = new Recorder();
  const s = f.node(`${t.name}\nUyumluluk izleme`, 'stadium', 'start');
  const kindTxt = t.kind === 'Model' ? 'Model sağlayıcı sözleşmesini ürün veri modelinden ayır' : t.kind === 'Tarayıcı' ? 'Destek matrisini sürüm numarasıyla kaydet' : 'İlgili belirtimleri durum etiketiyle izle';
  const a = f.node(kindTxt, 'rect', 'data');
  r.add(kindTxt);
  const b = f.node(t.kind === 'Tarayıcı' ? 'Özellik algılama + kabul edilebilir yedek davranış' : t.kind === 'Model' ? 'Sağlayıcıyı değiştir: aynı değerlendirme kümesiyle koş' : 'Taslak → aday → standart geçişini takip et', 'rect');
  r.add(t.kind === 'Tarayıcı' ? 'Özellik algılama ve yedek davranış' : t.kind === 'Model' ? 'Sağlayıcı değişim testi' : 'Standart durumunu izle');
  const c = f.node('Kırılma tespit edildi mi?', 'decision', 'decide');
  const d = f.node('Sürümü sabitle ve etkilenen akışları işaretle', 'rect', 'risk');
  const e = f.node('Periyodik yeniden doğrulama', 'stadium', 'end');
  r.add('Kırılmayı tespit et', 'Sürüm notlarını ve kayıtlı olay yeniden oynatmasını karşılaştır.');
  r.add('Periyodik yeniden doğrula');
  f.edge(s, a).edge(a, b).edge(b, c).edge(c, d, 'evet').edge(c, e, 'hayır').edge(d, e);
  styled(f, ['start', 'end', 'decide', 'risk', 'data']);
  return wf({
    id: `benimseme-${t.id}`,
    title: `${t.name} · Uyumluluk izleme akışı`,
    family: 'benimseme',
    diagram: 'flowchart',
    summary: `${t.name} doğrudan kurulan bir paket değil; ürünün davranışını etkileyen ${t.kind.toLowerCase()} olarak izlenir. Akış kırılmayı erken yakalamak için sürüm ve destek değişimini takip eder.`,
    mermaid: f.toString(),
    steps: r.steps,
    conditions: [`Tür “${t.kind}” olduğu için benimseme yerine izleme akışı seçildi`],
    tools: [t.id],
    topics: t.rTopics,
    tags: ['uyumluluk', 'izleme'],
  }, input);
}

export function adoptionWorkflow(t: Tool, input: GenInput): Workflow {
  if (RESEARCH_KINDS.has(t.kind) && t.layer === 'L01') return researchFlow(t, input);
  if (WATCH_KINDS.has(t.kind)) return watchFlow(t, input);

  const f = new Flow('TD');
  const r = new Recorder();
  const conditions: string[] = [];
  const alts = alternatives(t, input);

  const start = f.node(`${t.name}\nBenimseme akışı`, 'stadium', 'start');
  const need = f.node(`İhtiyaç: ${goldenName(input, t.golden)}`, 'rect');
  r.add('İhtiyacı adlandır', `Altın küme: ${goldenName(input, t.golden)}.`);
  const alt = f.node(alts.length ? `Katman: ${layerName(input, t.layer)}\nAlternatifler: ${alts.map((a) => a.name).join(', ')}` : `Katman: ${layerName(input, t.layer)}`, 'rect', 'data');
  r.add('Alternatifleri listele', alts.length ? alts.map((a) => a.name).join(', ') : 'Aynı katmanda doğrudan alternatif yok.');
  f.edge(start, need).edge(need, alt);

  const stance = f.node(`${t.provenance ? "Katalog duruşu" : "Rapor duruşu"}: ${t.stance}`, 'decision', 'decide');
  f.edge(alt, stance);
  if (t.stance === 'Ertele/Kaçın') {
    const why = f.node('Gerekçeyi kaydet ve yeniden değerlendirme tarihi koy', 'rect', 'warn');
    const hold = f.node('Karar: Beklet', 'stadium', 'muted');
    f.edge(stance, why, 'ertele').edge(why, hold);
    r.add('Erteleme gerekçesini kaydet', 'Raporlar bu varlığı çekirdekte kullanmamayı öneriyor.', 'Duruş: Ertele/Kaçın');
    conditions.push('Raporlar ertelemeyi önerdiği için akış erken sonlanan bir dal içeriyor');
  }

  let prev = stance;
  const chain = (label: string, cls: string, title: string, detail: string, cond: string) => {
    const n = f.node(label, 'rect', cls);
    f.edge(prev, n, prev === stance ? 'incele' : undefined);
    prev = n;
    r.add(title, detail, cond);
    conditions.push(cond);
  };

  if (t.id === 'pi') {
    chain('Pi çalışma ortamını izole et', 'risk', 'Çalışma ortamı sınırları', 'Dosya, süreç, ağ ve kimlik bilgisi erişimini uygulama ortamında sınırla; yerleşik izin sistemi varsayma.', 'Pi README yerleşik erişim sınırlandırması olmadığını belirtiyor');
    chain('Pi olaylarını arayüz sözleşmesine uyarla', 'data', 'Olay adaptörü', 'pi-agent-core araç ve durum olaylarını uygulama sözleşmesine eşle; AG-UI/A2UI uyumunu prototiple doğrula.', 'Hazır protokol uyumluluğu doğrulanmadı');
  }
  if (['Ticari', 'Açık çekirdek/Pro', 'Bilinmiyor'].includes(t.license)) {
    chain(`Lisans incelemesi: ${t.license}`, 'risk', 'Lisans incelemesi', 'Ücretli katman, kullanım kısıtı ve çıkış maliyeti (R26).', `Lisans “${t.license}” olduğu için lisans incelemesi eklendi`);
  }
  if (['Taslak', 'RC/Beta', 'Deneysel', 'Bilinmiyor'].includes(t.maturity)) {
    chain(`Sürümü sabitle${t.version ? ` (${t.version})` : ''} + adaptör katmanı`, 'warn', 'Sürümü sabitle', 'Tam sürümü kilitle; ürün kodunu bir adaptör arkasına al.', `Olgunluk “${t.maturity}” olduğu için sürüm sabitleme ve adaptör eklendi`);
  }
  const disputed = t.claimStatus.disputed + t.claimStatus.rejected;
  if (disputed > 0) {
    chain(`Doğrulama spike’ı: ${disputed} itirazlı iddia`, 'risk', 'Doğrulama spike’ı', 'İtirazlı iddiaları birincil kaynak ve küçük deneyle yeniden sına.', `${disputed} itirazlı/reddedilmiş iddia olduğu için doğrulama spike’ı eklendi`);
  }
  if (t.platform === 'React') {
    chain('React bağımlılığını kaydet: etkileşimli alan sınırı', 'warn', 'React bağımlılığını kaydet', 'Brief React’ı kesin seçim saymıyor; Astro adası veya tek istemci uygulaması sınırı çiz.', 'Yalnız React ile çalıştığı için framework bağımlılığı notu eklendi');
  }
  if (t.effort === 'Yüksek') {
    chain('Entegrasyon bütçesi ve çıkış stratejisi', 'warn', 'Entegrasyon bütçesi', 'Adaptör, test ve bakım işini tahminle; değiştirme yolunu yaz.', 'Entegrasyon yükü yüksek olduğu için bütçe ve çıkış adımı eklendi');
  }
  if (!conditions.length) conditions.push('Açık lisans, kararlı sürüm ve itirazsız kanıt: doğrudan prototipe geçildi');

  const proto = f.node(LAYER_PROTO[t.layer] ?? 'Dar kapsamlı prototip', 'sub', 'gate');
  f.edge(prev, proto, prev === stance ? 'uygun' : undefined);
  r.add('Prototip', LAYER_PROTO[t.layer] ?? 'Dar kapsamlı prototip.');

  const tests = LAYER_TESTS[t.layer] ?? ['Kabul testleri'];
  const testIds: string[] = [];
  f.subgraph('Katmana özgü kabul testleri', (g) => {
    tests.forEach((x) => testIds.push(g.node(x, 'rect', 'tool')));
  });
  testIds.forEach((id) => f.edge(proto, id));
  tests.forEach((x) => r.add(`Test: ${x}`));

  const ok = f.node('Kabul ölçütleri geçti mi?', 'decision', 'decide');
  testIds.forEach((id) => f.edge(id, ok));
  const end = f.node(`Karar: ${t.ring} halkası`, 'stadium', 'end');
  f.edge(ok, end, 'evet');
  const back = f.node(alts.length ? `Kapsamı daralt ya da ${alts[0].name} ile karşılaştır` : 'Kapsamı daralt ya da özel geliştirmeyi değerlendir', 'rect', 'warn');
  f.edge(ok, back, 'hayır');
  f.edge(back, alt, 'yeniden', 'dotted');
  r.add('Karar ver', `Geçerse ${t.ring} halkasında kalır; geçmezse kapsam daraltılır veya alternatif denenir.`);

  styled(f, ['start', 'end', 'decide', 'risk', 'warn', 'data', 'gate', 'tool', 'muted']);
  return wf({
    id: `benimseme-${t.id}`,
    title: `${t.name} · Benimseme akışı`,
    family: 'benimseme',
    diagram: 'flowchart',
    summary: `${t.name} için ihtiyaçtan karara koşullu yol: ${conditions.length} koşul dalı, ${tests.length} katmana özgü test ve ${alts.length} alternatifle geri dönüş. Radar halkası şu an “${t.ring}”.`,
    mermaid: f.toString(),
    steps: r.steps,
    conditions,
    tools: [t.id, ...alts.map((a) => a.id)],
    topics: t.rTopics,
    tags: ['benimseme', t.ring.toLowerCase()],
  }, input);
}

export function adoptionFamily(input: GenInput): Workflow[] {
  return input.tools.map((t) => adoptionWorkflow(t, input));
}
