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
| Bağımsız QA incelemesi | not_run | Uygulayıcıdan ayrı değerlendirici çalıştırılmadı |
| Fiziksel Safari/iOS/Android, sanal klavye ve gerçek safe area | not_run | Emülasyon fiziksel cihaz doğrulaması değildir |
| Kalem, kumanda, TV | not_applicable | Bu teslimde ürün yolculuğuna dahil değil |
| Service worker | not_applicable | Uygulamada SW kurulmadı; testte engelli |

## Dosyalar ve yeniden üretim

`final/` tarayıcı başına ekran görüntüsü adayları ve ağ JSON kayıtlarını içerir. Ağ kayıtları gerçek tarayıcı sürümü, OS, viewport, giriş yetenekleri ve ölçüm penceresini içerir. Aktarılan baytlar bu pencerenin gözlemidir; tam sayfa performans bütçesi veya cold/warm/SW matrisi doğrulaması değildir.

`visual-candidates/before/` ilk adayları, `visual-candidates/diff/` önce/sonra/fark resimlerini içerir. Odak göstergesi ortak Input katmanında düzeltildi; mobil WebKit Mermaid HTML etiket hatası SVG metni kullanılarak giderildi; araç çubuğu dar ekranda sarılır. Bu resimler onaylanmış baseline değildir.

Komutlar: `npm run e2e:catalog`, `npm run e2e`, `npm run e2e:full`, `GITHUB_PAGES=true npm run build:pages`, `npm run kaizen:observe -- --task api-kaizen --event release-001`.

Kaizen kabul senaryolarının ayrı kapsamı `../kaizen/acceptance-status.json` dosyasındadır: 3 yerel alt kapsam pass, 21 not_run. Yerel gözlem başarılı testleri bağımsız ACCEPTED kararı olarak sunmaz.
