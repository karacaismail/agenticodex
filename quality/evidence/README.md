# API ve Kaizen teslim kanıtı — 2026-09-28

## Çalıştırılan kontroller

| Kontrol | Durum | Kanıt / kapsam |
|---|---|---|
| Katalog yolculuğu | pass | Playwright: 10 test; Chromium, Firefox, WebKit masaüstü, Chromium ve WebKit dokunmatik emülasyonu |
| Mevcut uygulama testleri | pass | 57 test; erişilebilirlik kontrolleri dahil |
| Tüm iş akışlarının SVG çizimi | pass | 24 shard, 646 iş akışı |
| Mermaid ayrıştırma | pass | 646 akış; 10.9.5, 11.17.2, 12.0.0 |
| Mobil genişlik ve durum | pass | 320, 360, 375, 390, 568×320, 768, 991/992/993, 1280; arama korunması, taşma, araç çubuğu |
| Klavye ve dropdown | pass | Tab, Shift+Tab, ok, Enter, Escape; hesaplanmış focus-visible outline |
| Koşullu kaynak teslimi | pass | Build manifestindeki Mermaid girişinin liste ekranında yüklenmemesi; diyagramda yüklenmesi |
| Onaylı görsel regresyon | not_run | Bağımsız onaylı referans henüz yok |
| Aday referans karşılaştırması | fail (beklenen değişim) | Eski ve yeni odak görünümü farklı; before/diff klasörleri inceleme içindir |
| Bağımsız kod/QA incelemesi | pass (sınırlı kapsam) | Ayrı alt ajan kod farkı ve iki mobil ekran görüntüsünü inceledi; görsel referans onayı değildir |
| Fiziksel Safari/iOS/Android, sanal klavye ve gerçek safe area | not_run | Emülasyon fiziksel cihaz doğrulaması değildir |
| Kalem, kumanda, TV | not_applicable | Bu teslimde ürün yolculuğuna dahil değil |
| Service worker | not_applicable | Uygulamada SW kurulmadı; testte engelli |

## Dosyalar ve yeniden üretim

`final/` tarayıcı başına ekran görüntüsü adayları ve ağ JSON kayıtlarını içerir. Ağ kayıtları gerçek tarayıcı sürümü, OS, viewport, giriş yetenekleri ve ölçüm penceresini içerir. Aktarılan baytlar bu pencerenin gözlemidir; tam sayfa performans bütçesi veya cold/warm/SW matrisi doğrulaması değildir.

`visual-candidates/before/` ilk adayları, `visual-candidates/diff/` önce/sonra/fark resimlerini içerir. Odak göstergesi ortak Input katmanında düzeltildi; mobil WebKit Mermaid HTML etiket hatası SVG metni kullanılarak giderildi; araç çubuğu dar ekranda sarılır. Bu resimler onaylanmış baseline değildir.

Komutlar: `npm run e2e:catalog`, `npm run e2e`, `npm run e2e:full`, `GITHUB_PAGES=true npm run build:pages`, `npm run kaizen:observe -- --task api-kaizen --event release-001`.

Kaizen kabul senaryolarının ayrı kapsamı `../kaizen/acceptance-status.json` dosyasındadır: 3 yerel alt kapsam pass, 21 not_run. Yerel gözlem başarılı testleri bağımsız ACCEPTED kararı olarak sunmaz.

## Sürüm ve yayın kanıtı

Manifest / lockfile / kurulu sürüm aynı: React 19.3.0, Mantine 9.6.3, Mermaid 11.17.2, TypeScript 5.9.3, Vite 8.3.1, Playwright 1.63.0. Yerelde gözlenen Node 24.21.0 ve Python 3.9.6; CI Node hedefi 24. Python minimum destek aralığı manifestte tanımlı değildir. Formatter/linter yapılandırılmamıştır; bu kontroller çalıştırılmış sayılmaz.

`c5ee560` için [Pages yayını](https://github.com/karacaismail/agenticodex/actions/runs/36452118918) ve [Catalog adaptive QA](https://github.com/karacaismail/agenticodex/actions/runs/36452118955) success. Canlı Pages üzerinde Chromium ve WebKit, 320×568 dokunmatik emülasyonunda API/Kaizen kümeleri ve CAPA SVG kontrolü geçti. CAPA kontrolünde rota başlığı beklendi; aynı sayfadaki eski SVG'nin yanlış başarı sayılmasına izin verilmedi. Pages taban yolu için yerel 4392 preview kullanıldı; normal kök yoluna ayarlı 4391 preview Pages paketine uygun değildi.

`local-observer.json`: 102 Vitest, 31 Python ve typecheck pass; aynı olay tekrarı duplicate olarak döndü. Bu kanıt bağımsız kabul değildir.


## Bağımsız standart ve QA incelemesi

Ayrı salt okunur alt ajan, observer/testler, Mermaid bileşeni, ortak tema/tokenlar, Vite ve adaptive QA farkını; sürüm ve test kanıtını ve iki mobil WebKit aday görüntüsünü inceledi. Komut çalıştırmadı ve dosya değiştirmedi. BLOCKER/MAJOR bulgu yok. Aynı olayın eşzamanlı rezervasyonunda MINOR SQLite yarışını bildirdi: önce başarısız regresyonla üretildi, sonra `BEGIN IMMEDIATE` ile okuma/yazma seri hale getirildi. 8 ayrı bağlantılı test ve 32 Python testi geçti. Son observer sonucu 102 Vitest + 32 Python + typecheck içerir.

Açık MINOR: dar ekranda diyagram araç çubuğu üç satıra sarılarak dikey alan tüketiyor; dokunma hedefleri korunuyor. Görsel referanslar onaylanmadı. İnceleme; katalog veri dosyaları, skill içeriği, Git metaverisi ve Pages yapılandırmasını kapsamıyordu. Fiziksel cihaz testi yapılmadı.

Kapsam sınırları: outline testi tek başına 3:1 kontrast veya tüm ataların odak stilini kanıtlamaz; ağ testi Mermaid girişini izler, tüm bağımlılık grafiğini veya bütçe eşiğini doğrulamaz; resize testi arama metnini korur, açık dropdown/odak sürekliliğinin tam testi değildir. Otomatik matris dark/reduced-motion kullanır; light ve normal-motion için bu matristen sonuç çıkarılmaz.
