# Agent Kaizen: Atlas entegrasyonu

## Karar

Tek bir dosya türü yeterli değildir. Görev içi düzeltme, CAPA/DÖF ve ölçülmüş süreç iyileştirmesi birbirine bağlı üç döngüdür.

| Parça | Görevi | Bu projedeki karşılığı |
|---|---|---|
| Markdown | Sözleşme, sınırlar, CAPA ve deney kayıtları | Bu belge ve templates.md |
| Skill | Ajanın ne zaman hangi kanıtı isteyeceği | `.agents/skills/agent-kaizen/SKILL.md` |
| Deterministik denetleyici | Gerçek test sonuçlarını kaynak kimliğiyle kaydetmek | `scripts/kaizen.py`, gözlem modu |
| MCP | Harici iz/deney/kayıt araçlarına erişim | İsteğe bağlı adaptör sözleşmesi; sunucu kurulmadı |
| Ajan | Belirsiz hataya hipotez ve düzeltme önerisi | Skill ile yönlendirilen mevcut kod ajanı; ayrı otonom ajan başlatılmadı |
| Bağımsız CI | Kabul ve politika terfisi yetkisi | Bu depoda kurulmuş bağımsız güven sınırı yok |

MCP yapılandırması bir sunucu uygulaması değildir. Skill bir runner değildir. Markdown dosyasının varlığı hook veya otomasyonu etkinleştirmez. Kullanıcının şartnamesi tasarım girdisidir; içindeki global Claude ayarı yazma talimatları bu entegrasyonda uygulanmadı.

## Çalışan kapsam

`npm run kaizen:observe -- --task api-kaizen --event benzersiz-olay-kimligi`

- Kod/kalite allowlist'inden deterministik dosya hash manifesti üretir; dirty ve izlenmeyen ilgili dosyalar dahil edilir. Silinen izlenen dosyalar işaretlenir. Secret adı taşıyan ve anahtar dosyaları dışlanır. Manifest kapsamı tüm dosya sisteminin veya build'in kimliği değildir.
- Mevcut typecheck, Vitest ve Python testlerini çalıştırır. Test keşfi sıfır, hata, atlama veya kaynak değişimi başarılı gözlem sayılmaz.
- Ham stdout, test adları ve trace gövdelerini kalıcı kayda almaz. Manifestteki dosya yolları yine özel bilgi taşıyabilir; `.kaizen/` yerel ve Git dışıdır.
- SQLite `(project,event)` kimliğiyle tekrarları önler. Farklı kaynakla tekrar kullanılan olay kimliğini reddeder. Çalışmakta veya yarıda kalmış aynı olayı otomatik yeniden başlatmaz.
- Her çalışmanın ayrı JSON kanıtı, checksum'ı ve JSONL dışa aktarımı vardır. Checksum yetki kanıtı değildir; yerel dosyalar ajan tarafından değiştirilebilir.
- Timeout/iptalde alt süreç grubunu sonlandırır. İşlem zorla öldürülürse olay `in progress` kalabilir; kayıt incelenip yeni olay kimliği kullanılmalıdır.
- Sonuç yalnız `checks_passed_observe_only`, `checks_failed`, `source_changed`, `timeout`, `cancelled` veya `adapter_error` olur. `ACCEPTED` üretilmez. Gerçek maliyet bilinmiyorsa null; kabul başına maliyet N/A'dır.

Bu komut mevcut Pages CI'den ayrıdır. Pages'in başarılı yayını bağımsız Kaizen kabulü anlamına gelmez.

## Üç döngü ve 12 alt süreç

Atlas'ta `/akislar/aile/kaizen` altında 3 döngü, 12 alt süreç ve şartnamedeki 24 kabul senaryosu bulunur. Süreçler: olay alımı, ortam kimliği, test planlama, runner adaptörleri, kanıt deposu, sınıflandırma, parmak izi, sınırlı onarım, CAPA, metrikler, deney, terfi.

24 kabul senaryosu tasarım senaryosudur; hepsi uygulanmış veya çalıştırılmış testler değildir. `scripts/tests/test_kaizen.py`, yerel gözlem alt kümesini sınar: sıfır test, başarısız/atlanmış test, kaynak değişimi, olay tekrarı/çakışması, secret adı dışlama ve timeout. Üretici yetkisi, eski endpoint, gerçek cihaz, holdout, hook yüklenmesi ve politika terfisi için bağımsız altyapı hâlâ gerekir.

## Hazır araçların yeri

- [Langfuse](https://langfuse.com/docs/evaluation/overview), [LangSmith](https://docs.langchain.com/langsmith/evaluation-types), [Phoenix](https://arize.com/docs/phoenix/) ve [Opik](https://www.comet.com/docs/opik/): izler, veri kümeleri ve değerlendirme deneyleri için adaylar.
- [Promptfoo](https://www.promptfoo.dev/docs/intro/): istem/model karşılaştırması, regresyon ve red team.
- [DeepEval](https://deepeval.com/docs/getting-started): Python tabanlı LLM ve ajan değerlendirme testleri.
- [Stryker](https://stryker-mutator.io/docs/): deterministik mutasyon testleri; testlerin kusuru yakalayabildiğini kontrol etmek için.

Bunlar tam Kaizen/CAPA sisteminin yerine geçmez. Başlangıçta mevcut testler ve yerel gözlem yeterli; iz ihtiyacı doğarsa bu platformlardan birini seç. Bu çalışmada hiçbiri yüklenmedi veya hesaba bağlanmadı. Kaynak inceleme tarihi 2026-09-28; özellik ve planlar seçilecek sürümde tekrar kontrol edilmelidir.

API araçları aynı döngüye bağlanır: Postman/Hoppscotch keşif ve koleksiyon; Bruno Git/CI; Insomnia çok protokollü teşhis; Hurl regresyon; HTTPie/curl küçük hata örneği; Thunder Client IDE kontrolü. `/akislar/aile/api-surecleri` süreçleri Kaizen runner/triage aşamalarının girdileridir.

## MCP ve ajan sınırı

İleride gereken en küçük MCP yüzeyi: `list_runs(project_id)`, `read_evidence(run_id)`, `propose_capa(task_id,evidence_refs)`. Okuma ve öneri izinleri ayrı tutulmalı; araç girdileri doğrulanmalı ve idempotency uygulanmalı. `accept`, `promote_policy`, `deploy`, genel shell veya sır okuma araçları bu yüzeye eklenmemeli. Bu bir adaptör tasarımıdır, çalışır MCP sunucusu değildir.

Ajan hipotez üretir ve yetkili düzeltmeyi önerir. Kod ajanından bağımsız değerlendirici kabul verir. En fazla üç deneme, aynı kusurda yeni kanıtsız iki tekrar ve bütçesiz unattended başlatmama ilkeleri henüz otomatik onarımda uygulanmış değildir; otomatik onarım kapalıdır.

## Sonraki kurulum ve geri alma

Korunan evaluator işi, ayrı kimlik, sabitlenmiş politika, gerçek artifact deposu ve harici holdout kurulmadan otomatik kabul/terfi açılmamalı. Adaptive teslimatın build manifesti, ağ trafiği, cold/warm/SW ve gerçek cihaz kontrolleri bu gözlem komutuna henüz bağlanmadı.

Geri alma: komutu çağırmayı bırak; skill ve katalog değişikliklerini Git üzerinden geri al. `.kaizen/` kanıtlarını saklama politikasına göre arşivle. Global ayar veya çalışan servis değiştirilmedi.

## QA katmanları

`Catalog adaptive QA` CI işi, katalog yolculuğunu Chromium/Firefox/WebKit ile ve 320 px dokunmatik profillerle sınar; PR, main push ve manuel tetiklemede çalışır. Periyodik geniş tarama için ayrı zamanlama kurulmadı; mevcut `e2e:full` manuel çalıştırılabilir. Fiziksel cihaz/sürüm öncesi kontrolü ayrı yapılmalıdır.

Görsel karşılaştırma altyapısı vardır; henüz bağımsız onaylı referans yoktur. Varsayılan koşu davranış/ağ kontrollerini zorunlu tutar ve ekran görüntüsü adaylarını artifact olarak üretir. İncelenip onaylanmış referanslar yerleştirildikten sonra `VISUAL_REFERENCES=1 npm run e2e:catalog` deterministik karşılaştırmayı zorunlu kılar. Bu değişkeni kapatmak mevcut bir onaylı referansı atlamak için kullanılmamalıdır. İlk adaylar `quality/evidence/visual-candidates/` altında inceleme amacıyla saklanır.
