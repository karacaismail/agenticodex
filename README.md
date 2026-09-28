# GenUI Atlas

GenUI araştırma korpusundan (8 rapor, 34 ara analiz, 889 iddialı kanıt sicili, 550 kaynak) üretilmiş araç, altın küme, dinamik gruplama ve iş akışı atlası.

- **163 varlık:** kütüphane, protokol, standart, tarayıcı API'si, tasarım sistemi, araştırma, model
- **15 altın küme:** 12 çekirdek küme ve 3 destek halkası
- **17 gruplama boyutu:** her biri "neye göre?" sorusunu ve hangi karara yaradığını açıklar
- **36 akıllı (koşullu) küme**, **9 veri güdümlü topluluk**, **7 koşullu kova şeması**
- Kullanıcının kendi kuralıyla kurduğu canlı kümeler
- **577 iş akışı**, 16 aile. Akış üretici çalışma anında 864 temel birleşim üretir.
- **2.700 üzerinde dinamik sayfa**

Arayüz: React 19, Mantine 9 ve React Bits. Diyagramlar Mermaid ile çiziliyor; sürüm `11.17.2`'ye sabitli, her diyagram 10.9, 11.17 ve 12.0 ile doğrulanıyor.

## Çalıştırma

```bash
npm install
npm run dev          # geliştirme sunucusu
npm run build        # veri + iş akışları + Mermaid doğrulaması + tip denetimi + üretim derlemesi
npm run preview      # derlenmiş uygulama (http://localhost:4173)
```

Veri hattı tek başına da koşabilir:

```bash
npm run data               # python3 scripts/build_data.py → src/data/generated/*.json
npm run workflows          # tsx scripts/gen-workflows.ts → workflows.json
npm run validate:mermaid   # her diyagram × 3 Mermaid sürümü; hata varsa çıkış kodu 1
```

Korpus dosyaları bu klasörün bir üst dizininde durur (`../*.md`, `../evidence-register.json`, `../partial-analyses/`).

## Mimari

```
scripts/
  catalog.py            elle düzenlenmiş varlık kataloğu: kimlik, takma ad regex'i, tür, katman, altın küme, etiket
  enrich/*.json         korpustan çıkarılmış içerik: açıklama, lisans, olgunluk, olgular, riskler, konular
  build_data.py         korpus analizi: geçiş sayıları, iddia–araç–konu eşlemesi, birlikte anılma grafiği,
                        Louvain toplulukları, kanıt/risk/bileşik puan, radar halkası, sentez yapıları
  gen-workflows.ts      iş akışı üretimi (uygulamayla aynı kod)
  validate-mermaid.mjs  üç sürümlü derleme kapısı
src/
  lib/mermaid/builder.ts  sürüm-güvenli Mermaid oluşturucu (Flow, Seq, StateD, Gantt)
  lib/rules.ts            koşul motoru (VE/VEYA/DEĞİL, 17 işleç, URL kodlama)
  lib/grouping.ts         tekil/çok değerli gruplama, iç içe gruplama, koşullu kovalar
  lib/dimensions.ts       17 gruplama boyutu ("neye göre?" + gerekçe)
  lib/presets.ts          36 akıllı küme, 7 kova şeması
  lib/workflows/*         16 iş akışı ailesi ve çalışma anı üretici
  pages/*                 30 sayfa türü (kod bölmeli, tembel yüklenir)
  components/reactbits/*  React Bits bileşenleri (resmî kayıttan)
```

### Gruplama boyutları: neye göre?

| Boyut | Soru |
|---|---|
| Altın küme | Ürünü kurarken hangi işi çözüyor? |
| Mimari katman | Yığında (stack) nerede duruyor? |
| Tür | Kütüphane mi, protokol mü, standart mı? |
| Rapor duruşu | Raporlar bu ürün için ne öneriyor? |
| Radar halkası | Kanıt, konsensüs, olgunluk ve duruşa göre benimseme düzeyi nedir? |
| Kanıt düzeyi | Bağlı iddialar ne kadar desteklenmiş? |
| Konsensüs | Sekiz rapordan kaçı bahsediyor? |
| Olgunluk / Lisans / Platform bağı / Entegrasyon yükü / Risk | Sürüm, hukuk, taşınabilirlik, maliyet, risk |
| Birlikte anılma | Raporlarda hangi araçlarla aynı paragrafta geçiyor? (Louvain) |
| Üretici | Kim sürdürüyor? |
| Segment / Konu / Yetenek etiketi | Çok değerli: araştırma bölümü, R01–R28, yetenek |

Radar halkası karar farkındadır. Bileşik puan %33 kanıt, %25 rapor kapsaması, %24 olgunluk ve %18 rapor duruşundan oluşur. Üst halkalar için raporların çekirdek ya da prototip önerisi de gerekir.

### İş akışı aileleri

Benimseme (163) · araştırma konusu kararları (28) · altın küme hatları (15) · yaşam döngüleri (39, durum makinesi) · protokol sıraları (34, sıralı diyagram) · koşullu karar ağaçları (56 = 14 karar × 4 profil) · kullanıcı senaryoları (36) · arıza ve kurtarma (36) · tehdit modelleri (12) · yığın entegrasyonları (72 = 4 UI × 6 renderer × 3 taşıma) · yol haritaları (10, Gantt) · itirazlı iddia doğrulama (18) · birlikte anılma hatları (9) · akıllı küme eylemleri (36) · koşullu gruplama şemaları (7) · geçiş kapıları (6).

Dallar veriden gelir. Örnek: ticari lisanslı araca lisans incelemesi, taslak olgunluktaki araca sürüm sabitleme ve adaptör, itirazlı iddiası olan araca doğrulama spike'ı eklenir.

## Mermaid sürüm güvenliği

1. **Tam sürüm sabitleme:** `mermaid@11.17.2`, şapka (`^`) yok.
2. **Güvenli alt küme:** yalnız `flowchart`, `sequenceDiagram`, `stateDiagram-v2` ve `gantt`. Yeni `@{shape}` sözdizimi, frontmatter, `direction` ve markdown dizgeleri kullanılmaz.
3. **Kaçışlama:** etiketler her zaman tırnak içinde; `" # ; &` karakterleri varlık koduna çevrilir, `< >` ve ters tırnak nötrlenir. Kimlikler oluşturucu tarafından üretilir, ayrılmış sözcükler kimlik olamaz.
4. **Derleme kapısı:** `validate:mermaid` her diyagramı 10.9, 11.17 ve 12.0 ile ayrıştırır.
5. **Çalışma anı:** kullanıcı kuralından ya da üreticiden gelen diyagramlar aynı oluşturucuyla üretilir ve testlerde üç sürümle sınanır.
6. **Güvenli yedek:** çizim hatası sayfayı çökertmez; hata ve kaynak kod gösterilir.

Uygulamadaki `/mermaid-sagligi` sayfası derleme raporunu gösterir ve bütün akışları tarayıcıda canlı olarak yeniden doğrulayabilir.

## Testler (TDD)

```bash
npm test                 # Vitest (birim ve bileşen) + Python unittest (veri sözleşmesi)
npm run e2e              # Playwright: işlev, mobil taşma, azaltılmış hareket, axe (WCAG 2.2 AA, iki tema)
npm run e2e:full         # 577 iş akışı sayfasının tamamı gerçek tarayıcıda SVG olarak çizilir
```

Kapsam:
- Oluşturucu tuzaklı etiketlerle üç sürümde sınanır; bozuk kodu her sürümün reddettiği negatif kontrolle doğrulanır.
- Koşul ve gruplama motorları test edilir.
- Her grubun eşdeğer kuralı, grubun üyelerini birebir vermelidir.
- 577 akışın sözleşmesi test edilir: benzersiz kimlik, referans bütünlüğü, determinizm, üç sürümde geçerlilik ve koşullu dallar.
- Üreticinin 864 temel birleşimi doğrulanır.
- Veri hattı test edilir: 889/550/28 bütünlüğü, topluluk bölümlemesi, radar kalibrasyonu, çekirdek/detay ayrımı.
- Erişilebilirlik: iki temada 14 sayfada ciddi ya da kritik ihlal yok. Kontrast renkleri hesaplanarak üretilir.

## Kanıt sınırı

Sicil model değerlendirmelerini korur; kesinleşmiş gerçek değildir. 550 URL, 550 bağımsız doğrulanmış kaynak anlamına gelmez. Aynı kaynağın birden çok raporda tekrarı bağımsız doğrulama sayılmaz. Kanıt, konsensüs ve risk puanları şeffaf formüllerle hesaplanır; uygulama bunları karar desteği olarak sunar, hüküm olarak değil.

## Pi katalog kaydı

[Pi](https://github.com/earendil-works/pi), 28 Eylül 2026 tarihinde kullanıcı isteğiyle GitHub README incelemesine dayanarak eklendi. `/araclar/pi` sayfasında kaynak bilgisi; `/akislar/benimseme-pi` sayfasında izolasyon ve olay adaptörü adımlarını içeren koşullu akış bulunur. S2 (Ajan Arka Ucu & Modeller) kümesinde ve L13 katmanındadır. Bu katalog eklemesi Pi çalışma zamanını kurmaz. Özgün rapor kapsamı, iddia ve kaynak sicili sayıları korunur; Pi için korpus kanıtı sıfırdır.

## GitHub Pages

Yayın adresi: https://karacaismail.github.io/agenticodex/

`main` dalına gönderilen değişiklikler `.github/workflows/pages.yml` ile test edilir ve yayınlanır. Pages derlemesi depoda tutulan üretilmiş katalog verisini kullanır; özgün araştırma dosyalarının üst klasörde bulunmasını gerektirmez. Yeni veri üretmek için yerel `npm run build:data` komutu kullanılır.

Pages sürümü `/agenticodex/` altında hash yönlendirme kullanır; örnek: `https://karacaismail.github.io/agenticodex/#/araclar/pi`. Doğrudan bağlantı ve yenileme sunucu tarafında 404 üretmez. Yerel geliştirmede normal yollar korunur.
