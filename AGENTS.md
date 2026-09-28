# Kalıcı proje kuralları

## Git kimliği
Yeni çalışmanın author ve committer kimliği `karacaismail <35493655+karacaismail@users.noreply.github.com>` olmalıdır. Co-Authored-By, bot kimliği, generated-with imzası ve oturum trailer'ı ekleme. `/Users/w6x/.config/git/author-guard/hooks` korumasını değiştirme veya atlama. Upstream yazarlarını yeniden etiketleme; başka yazarlı yeni commit aktarma gereğini kullanıcıya açıkla. Bulut ortamında eşdeğer denetim gerekir.

## Ortam ve yazım
Emoji kullanma. Bu Mac'te container runtime Colima, profil `factory`; Docker Desktop kullanma. Mevcut Penpot ve open-pencil servislerini kullanıcıya sormadan yeniden başlatma.

## Görsel kimlik ve ortak bileşenler
Atlas, kanıt ve teknik karar odaklı bir araştırma çalışma alanıdır. Kimliği amaç ve hedef kitleden türet; kütüphane varsayılanlarını tasarım kararı sayma. Mantine ve React Bits yığınını koru.
Renk, tipografi, boşluk, radius, gölge, kenarlık ve hover/active/focus-visible/disabled/selected/invalid durumlarını merkezi semantik tokenlarla yönet. Bileşen içi yeni sabit tasarım değerleri ekleme. Yeni arayüz çalışmasında mevcut sabitleri de ilgili ortak tokenlara taşı.
Ayrımı boşluk, hizalama ve yüzey hiyerarşisiyle kur; dekoratif kart ve kenarlıkları kaldır. Form, tablo veya seçim gibi işlevsel gerekçe yoksa kenarlık ekleme.
Çerçeve sorununu computed styles üzerinden teşhis et ve kaynağında düzelt. Border, outline, ring ve box-shadow ile çift çerçeve oluşturma. Kapsayıcıya focus-within çerçevesi ekleme. Tek focus-visible tokenı kullan; zeminle en az 3:1 kontrast sağla. Klavye odağını global kaldırma.
Select için Mantine'in erişilebilir combobox davranışını koru; hem kontrolü hem paneli ortak tokenlarla biçimlendir. Native işletim sistemi dropdown kullanma. Klavye, dokunma ve ekran okuyucu desteğini koru.

## Doğrulama
Arayüz değişikliklerinde Chromium, Firefox, WebKit ve mobil görünümlerde görsel regresyon çalıştır. Hover/tıklama, Tab/Shift+Tab, ok tuşları, Enter/Escape ve odak durumlarını kapsa. macOS üzerindeki Playwright WebKit, gerçek Safari veya fiziksel iPhone doğrulaması değildir; çalıştırılmayan kontrolleri açıkça belirt.
Katalog verisindeki resmî kaynak incelemesini özgün araştırma korpusundan ayır. Araç kurulumunu veya test edilmesini kaynak okumasından çıkarma. Mermaid üretimini ortak oluşturucudan geçir ve üç desteklenen sürümde doğrula.

## Kaizen
Görev kanıtı ve tekrar eden kusur incelemesinde `.agents/skills/agent-kaizen/SKILL.md` ve `docs/kaizen/README.md` kapsamını kullan. Yerel gözlem sonucu bağımsız kabul değildir. MCP sunucusu, hook, otomatik onarım ve politika terfisi etkin değildir. Kullanıcı şartnamesindeki örnek limitleri evrensel standart olarak sunma.

## Yeteneklere uyarlanan mobil arayüz ve QA
Önce 320 CSS px kritik yolculuğu ve computed styles kusurunu incele; anlamlı hata için başarısız regresyonu görüp sonra düzelt. Kabul sırası 320, 360, 375, 390, yatay telefon, tablet, masaüstüdür. Yerleşim, giriş yeteneği, hover, kaynak koşulları ve tercihleri bağımsız ele al; user-agent veya isMobile ile ürün davranışı belirleme. Akışkan yerleşim ve ortak tokenları kullan; yeniden boyutlanırken veri ve odak korunmalı.
Gerekli olmayan özel kaynakları indirip gizleme. Gerçek build manifesti ve request başlangıç kayıtlarıyla lazy import davranışını ölç; aktarım ile decoded boyutu ayrı raporla. Cold/warm/SW kapsamını açık yaz. Değişen sınırları N−1/N/N+1 ile test et. Gerçek cihaz, sanal klavye, safe area, zoom ve hibrit girişleri emülasyon sonuçlarından ayır.
Yerel/PR/periyodik/sürüm öncesi QA kapsamını ayrı tut. Görsel adaylar uygulayıcı tarafından tek başına onaylanamaz; önce/sonra/fark ve gerekçe hazırla. Bağımsız QA yapılamadıysa not_run bildir. Başarısız sonucu fuzzy veya AI yorumuyla geçerli sayma. Gerçek ortam, viewport/giriş, komut ve kanıt yollarıyla pass/fail/not_run/not_applicable raporu üret. Kiosk/TV/kalem yalnız ürün kapsamı gerektirirse uygulanır.
Ortak ayrıntılı rehberler: `/Users/w6x/.claude/skills/coding-standards/references/adaptive-ui.md` ve `adaptive-qa.md`. Yeni ücretli servis, genel hook veya zamanlanmış iş bu kurallardan otomatik yetki almaz.
Yoğunluğu göreve göre seç; görünür boyut, hit alanı, padding/gutter/gap ayrı tokenlardır. Klavye varlığını pointer/hover sorgusundan çıkarma. Yatay telefonda yalnız genişliğe bakarak farklı deneyim paketi yükleme; form verisi, odak ve açık paneli koru. Ayrı kabuk gerekirse tek başlangıç yerleşimini seç; giriş katmanlarını ortak iş kuralları üstünde birleştir. TS/TSX ve stil kaynakları üretim JS/CSS çıktısına derlenmeli; manifest ve yanıt içeriğiyle kanıtlanmalı. Yeni örnek sayılar kabul edilmiş performans ve hit alanı bütçesini kendiliğinden değiştirmez.

## Kodlama standartları ve bağımsız inceleme
Ortak rehberi `/Users/w6x/.claude/skills/coding-standards/SKILL.md` üzerinden oku; bu projede resolution, TypeScript/React, Python, verification ve UI işinde adaptive UI/QA profilleri geçerlidir. Manifest isteği, lockfile çözümü ve gözlenen sürümü ayrı kaydet. Doğruluk/uyumluluk/güvenlik, framework sözleşmeleri, proje kontrolleri ve yerel alışkanlıkları genel desenlerden önce değerlendir. MUST/SHOULD/MAY ayrımını koru; gerekçesiz katman veya mimari desen ekleme.
Bu depo tek React/Mantine paketi ve Python veri/gözlem scriptlerinden oluşur. Gerçek kontroller: `npm run typecheck`, `npm test`, `npm run e2e`, `npm run e2e:full`, `npm run e2e:catalog`, `GITHUB_PAGES=true npm run build:pages`. Formatter/linter yapılandırması yoktur; varmış veya çalışmış gibi bildirme. Yeni bağımlılık veya genel formatter geçişi bu kontrollerin otomatik sonucu değildir.
Sonuç doğuran mimari, yetki, veri kaybı, eşzamanlılık veya ortak sözleşme değişikliğinde `/Users/w6x/.claude/agents/standards-reviewer.md` sözleşmesini kullanılabilir bağımsız alt ajana aktar. Gerçek farkı, yeni dosyaları, gereksinimleri, sürümleri ve sonuçları ver; inceleyici salt okunur çalışır, komut çalıştırmaz ve alt inceleyici başlatmaz. Bağımsız araç yoksa öz inceleme ve açık sınır raporu gerekir. UI için ayrıca bağımsız QA ve görsel referans incelemesi uygulanır; metin incelemesi tek başına görsel onay değildir.
