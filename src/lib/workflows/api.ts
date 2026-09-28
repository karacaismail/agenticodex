import type { Workflow } from '@/data/types';
import { Flow } from '../mermaid/builder';
import { Recorder, styled, wf, type GenInput } from './common';

/** Süreç önerileri; ürün dokümanı incelemesi çalışma zamanı doğrulaması değildir. */
const PROCESSES = [
  { id: 'kesif', title: 'API keşfi ve ilk istek', tools: ['postman', 'hoppscotch', 'httpie', 'curl'], input: 'Endpoint, HTTP yöntemi ve örnek veri', prepare: 'Test ortamını seç ve sırları ortam değişkeninden al', action: 'İsteği gönder; durum, başlık ve gövdeyi incele', question: 'Yanıt beklenen sözleşmeyle uyumlu mu?', fix: 'URL, yöntem, gövde ve içerik türünü düzelt', output: 'Maskelenmiş istek ve yanıt örneği', next: 'Kimlik doğrulama ve hata senaryolarına geç' },
  { id: 'auth', title: 'API kimlik doğrulama ve yetki', tools: ['postman', 'hoppscotch', 'insomnia', 'bruno'], input: 'Roller, erişim kapsamları ve test hesapları', prepare: 'Geçerli, süresi dolmuş ve yetkisiz kimlikleri hazırla', action: 'Olumlu ve olumsuz erişim senaryolarını çalıştır', question: 'Yetkisiz erişim doğru biçimde reddedildi mi?', fix: 'Sunucu yetki kontrolünü düzelt; sırları loglardan kaldır', output: 'Rol ve erişim kapsamı test matrisi', next: 'Regresyon koleksiyonuna ekle' },
  { id: 'sozlesme', title: 'API sözleşmesinden test koleksiyonuna', tools: ['postman', 'insomnia', 'bruno'], input: 'Sürüme sabitlenmiş API sözleşmesi ve örnekler', prepare: 'Seçilen aracın içe aktarma kapsamını kontrol et', action: 'İstekleri oluştur; başarı ve hata yanıtlarını doğrula', question: 'Gerekli alanlar ve hata örnekleri kapsandı mı?', fix: 'Eksik örnekleri ve doğrulama ifadelerini tamamla', output: 'Sözleşmeyle eşleştirilmiş test koleksiyonu', next: 'Koleksiyon değişikliğini kod incelemesine gönder' },
  { id: 'git', title: 'Koleksiyon paylaşımı ve kod incelemesi', tools: ['bruno', 'insomnia', 'thunder-client'], input: 'Yerel koleksiyon ve ortam şablonu', prepare: 'Git saklama modunu ve plan koşullarını doğrula', action: 'Sır içermeyen değişikliği diff üzerinden incele', question: 'Temiz ortamda aynı sonuç üretildi mi?', fix: 'Makineye özgü yolları ve eksik değişkenleri düzelt', output: 'Sürümlenmiş koleksiyon ve kullanım yönergesi', next: 'Onaylı koleksiyonu CI koşucusuna bağla' },
  { id: 'ci', title: 'API regresyonu ve CI kalite kapısı', tools: ['bruno', 'hoppscotch', 'insomnia', 'postman', 'hurl'], input: 'Onaylı koleksiyon veya HTTP test dosyaları', prepare: 'Araca uygun CLI sürümünü sabitle; test ortamını hazırla', action: 'Sırları CI üzerinden aktar; testleri çalıştır ve raporu sakla', question: 'Tüm doğrulamalar ve koşucu çıkış kodu başarılı mı?', fix: 'Dağıtımı durdur; maskelenmiş raporla hatayı yeniden üret', output: 'Başarılı test raporu ve sürüm kaydı', next: 'Dağıtım sonrası smoke testine izin ver' },
  { id: 'akis', title: 'SSE ve uzun bağlantı hata ayıklaması', tools: ['insomnia', 'curl', 'eventsource', 'last-event-id'], input: 'Test akış endpointi ve olay örnekleri', prepare: 'SSE için uygun istemciyi seç; tamponlama ve zaman aşımını kontrol et', action: 'Olay sırasını kaydet; bağlantıyı kes ve yeniden bağlan', question: 'Olay kimlikleri, tekrarlar ve iptal doğru işlendi mi?', fix: 'Sunucu akışını veya istemci yeniden bağlanma mantığını düzelt', output: 'Maskelenmiş olay kaydı ve hata senaryosu', next: 'Tarayıcı EventSource davranışını ayrı entegrasyon testiyle doğrula' },
  { id: 'ide', title: 'Editör içinde endpoint geliştirme', tools: ['thunder-client', 'httpie', 'curl'], input: 'Yeni veya değişen endpoint', prepare: 'Yerel geliştirme ortamı ve sentetik test verisini hazırla', action: 'İsteği düzenle; başarı, boş veri ve hatalı gövdeyi dene', question: 'Değişiklik beklenen yanıtları üretti mi?', fix: 'Uygulama kodunu düzelt ve aynı isteği yeniden çalıştır', output: 'Tekrarlanabilir hata örneği veya kabul kaydı', next: 'Kalıcı doğrulamaları Hurl ya da koleksiyon koşucusuna aktar' },
  { id: 'smoke', title: 'Dağıtım sonrası API smoke testi', tools: ['hurl', 'curl', 'httpie'], input: 'Dağıtım adresi ve salt okunur kontrol endpointleri', prepare: 'Beklenen durum kodlarını ve süre sınırlarını tanımla', action: 'TLS, temel yanıt ve sürüm bilgisini kontrol et', question: 'Servis ve temel sözleşme sağlıklı mı?', fix: 'Yayını durdur veya geri dönüş prosedürünü başlat', output: 'Zaman damgalı sağlık raporu', next: 'İzleme sistemine teslim et; yük testini ayrı planla' },
];

export function apiFamily(input: GenInput): Workflow[] {
  return PROCESSES.map((p) => {
    const f = new Flow('TD');
    const r = new Recorder();
    const start = f.node(p.input, 'stadium', 'start');
    const prep = f.node(p.prepare, 'rect', 'tool');
    const action = f.node(p.action, 'rect', 'data');
    const gate = f.node(p.question, 'decision', 'gate');
    const fix = f.node(p.fix, 'rect', 'warn');
    const output = f.node(p.output, 'rect', 'end');
    const next = f.node(p.next, 'stadium', 'end');
    f.edge(start, prep).edge(prep, action).edge(action, gate).edge(gate, fix, 'Hayır').edge(fix, action, 'Yeniden dene').edge(gate, output, 'Evet').edge(output, next);
    [p.input, p.prepare, p.action, p.question, p.fix, p.output, p.next].forEach((s) => r.add(s));
    styled(f);
    return wf({ id: `api-${p.id}`, title: p.title, family: 'api-surecleri', diagram: 'flowchart',
      summary: `${p.input} ile başlar; ${p.output.toLocaleLowerCase('tr')} üretir. Başarısız kontrol düzeltme dalına döner.`,
      mermaid: f.toString(), steps: r.steps, tools: p.tools, golden: ['G12'], topics: ['R27', 'R28'],
      tags: ['api', 'test', p.id], conditions: [p.question, 'Araçlar alternatiflerdir; tümünü aynı anda kurmak gerekmez.', 'Süreç editoryal öneridir; CLI, plan ve protokol desteğini seçilen sürümde doğrula.'],
    }, input);
  });
}
