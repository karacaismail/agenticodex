import { expect, test } from '@playwright/test';
import { expectDiagram, expectNoHorizontalOverflow, watchErrors } from './helpers';

test.describe('çekirdek sayfalar', () => {
  test('genel bakış: KPI’lar veriden gelir, konsol temiz', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('GenUI Atlas');
    await expect(page.getByRole('link', { name: 'İş akışı', exact: true })).toContainText(/5\d\d/);
    await expect(page.getByRole('link', { name: 'Varlık', exact: true })).toContainText('163');
    await expect(page.getByText('12 altın küme: ürünün yapı taşları')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('araçlar: arama ve filtre URL’ye yazılır', async ({ page }) => {
    await page.goto('/araclar');
    await page.getByLabel('Araç ara').fill('motoin');
    await expect(page).toHaveURL(/q=motoin/);
    await expect(page.getByRole('link', { name: 'Motion', exact: true })).toBeVisible();
  });

  test('araç detayı: benimseme akışı çizilir, kanıt sekmesi iddia listeler', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/araclar/a2ui');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('A2UI');
    await page.getByRole('tab', { name: /İş akışları/ }).click();
    await expectDiagram(page);
    await page.getByRole('tab', { name: /Kanıt/ }).click();
    await expect(page.locator('a[href^="/kanit/"]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('bilinmeyen araç 404 gösterir', async ({ page }) => {
    await page.goto('/araclar/olmayan-arac');
    await expect(page.getByText('Aradığın sayfa atlasta yok')).toBeVisible();
  });
});

test.describe('gruplar ve kümeler', () => {
  test('gruplama laboratuvarı: iç gruplama + matris görünümü', async ({ page }) => {
    await page.goto('/gruplar/golden?ic=layer&gorunum=matris');
    await expect(page.getByText('Altın küme: Ürünü kurarken hangi işi çözüyor?')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('grup değeri sayfası ve koşullu kümeye çevirme', async ({ page }) => {
    await page.goto('/gruplar/ring/Benimse');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Benimse');
    await page.getByRole('link', { name: 'Koşullu kümeye çevir' }).click();
    await expect(page).toHaveURL(/\/kumeler\/ozel\?r=/);
    await expectDiagram(page);
  });

  test('özel küme: koşul eklemek üyeleri ve URL’yi değiştirir', async ({ page }) => {
    await page.goto('/kumeler/ozel');
    const badge = page.getByText(/\d+ üye$/).first();
    const before = await badge.innerText();
    await page.getByRole('button', { name: 'Koşul ekle' }).first().click();
    await expect(page).toHaveURL(/r=/);
    await expect(badge).not.toHaveText(before);
    await expectDiagram(page);
  });

  test('akıllı küme sayfası üyeleri ve akışı gösterir', async ({ page }) => {
    await page.goto('/kumeler/akis-dayanikliligi');
    await expect(page.getByText('Neden bu üyeler?').or(page.getByText('Üyeler')).first()).toBeVisible();
    await expectDiagram(page);
  });

  test('topluluk ve kova sayfaları', async ({ page }) => {
    await page.goto('/kumeler/topluluk/C01');
    await expectDiagram(page);
    await page.goto('/kumeler/kova/benimseme-stratejisi');
    await expectDiagram(page);
  });
});

test.describe('iş akışları', () => {
  test('katalog: aile filtresi ve sayfalama', async ({ page }) => {
    await page.goto('/akislar/aile/protokol-sirasi');
    await expect(page.getByText(/^34 akış · sayfa/)).toBeVisible();
    await page.goto('/akislar?tip=state');
    await expect(page.getByText(/\d+ akış · sayfa 1\//)).toBeVisible();
  });

  for (const id of ['benimseme-motion', 'yd-dosya-tek', 'sr-agui-calistirma', 'yol-kurumsal', 'karar-renderer-kurumsal', 'yigin-daisyui-copilotkit-eventsource']) {
    test(`akış detayı çizilir: ${id}`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(`/akislar/${id}`);
      await expectDiagram(page);
      await expect(page.getByText('Mermaid 10.9 · 11.17 · 12.0 ✓')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('akış üretici: seçim değişince URL ve diyagram güncellenir', async ({ page }) => {
    await page.goto('/uretici');
    await expectDiagram(page);
    await page.getByRole('radio', { name: /WebSocket/ }).click();
    await expect(page).toHaveURL(/t=websocket/);
    await expect(page.getByText('WebSocket: nabız ve sürdürme belirteci eklendi')).toBeVisible();
    await expectDiagram(page);
  });
});

test.describe('kanıt ve kalite', () => {
  test('iddialar: durum filtresi ve iddia detayı', async ({ page }) => {
    await page.goto('/kanit?durum=disputed');
    await page.locator('a[href^="/kanit/"]').first().click();
    await expect(page.getByText(/Değerlendirme geçmişi/)).toBeVisible();
  });

  test('konu ve segment sayfaları', async ({ page }) => {
    await page.goto('/konular/R12');
    await expectDiagram(page);
    await page.goto('/segmentler/C');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('GenUI');
  });

  test('mermaid sağlığı: tarayıcıda canlı doğrulama sıfır hata', async ({ page }) => {
    await page.goto('/mermaid-sagligi');
    await expect(page.getByText('Sıfır ayrıştırma hatası')).toBeVisible();
    await page.getByRole('button', { name: 'Şimdi doğrula' }).click();
    await expect(page.getByText(/Canlı sonuç: \d+ diyagramın tamamı geçerli/)).toBeVisible({ timeout: 60_000 });
  });

  test('ağ, radar, karşılaştırma, sentez', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/ag');
    await expect(page.locator('svg[aria-label="Birlikte anılma ağı"] circle').first()).toBeVisible();
    await page.goto('/radar');
    await expect(page.locator('svg[aria-label="Teknoloji radarı"] circle.radar-blip').first()).toBeVisible();
    await page.goto('/karsilastir?ids=motion,gsap,autoanimate');
    await expect(page.getByRole('link', { name: 'GSAP' }).first()).toBeVisible();
    await page.goto('/sentez');
    await expect(page.getByRole('heading', { name: 'Karar defteri' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('etkileşim ve erişilebilirlik', () => {
  test('⌘K arama bir araca götürür', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ara' }).click();
    await page.getByPlaceholder('Araç, küme, konu, iş akışı ara…').fill('Uppy');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/araclar\/uppy/);
  });

  test('klavye kısayolu (⌘/Ctrl+K) aramayı açar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByPlaceholder('Araç, küme, konu, iş akışı ara…')).toBeVisible();
  });

  test('tema anahtarı açık temaya geçer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Temayı değiştir' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'light');
  });

  test('mobil genişlikte yatay taşma yok', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    for (const path of ['/', '/araclar', '/gruplar', '/kumeler', '/akislar', '/akislar/benimseme-a2ui', '/uretici', '/kanit']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page);
    }
    await ctx.close();
  });
});

test.describe('azaltılmış hareket', () => {
  test('prefers-reduced-motion: WebGL arka plan ve JS animasyonları devre dışı, içerik tam', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('GenUI Atlas');
    await expect(page.locator('.hero-bg canvas')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Varlık', exact: true })).toContainText('163');
    await expect(page.getByText('Araçlar, altın kümeler, dinamik gruplar ve iş akışları.', { exact: false })).toBeVisible();
    await ctx.close();
  });

  test('sayfa başlığı (document.title) rotaya göre değişir', async ({ page }) => {
    await page.goto('/araclar/motion');
    await expect(page).toHaveTitle('Motion · GenUI Atlas');
    await page.goto('/akislar');
    await expect(page).toHaveTitle('İş akışı kataloğu · GenUI Atlas');
  });
});

test('site haritası bin+ dinamik sayfayı listeler ve arar', async ({ page }) => {
  await page.goto('/harita');
  await expect(page.getByText(/sayfa, 10 aile/)).toBeVisible();
  await page.getByLabel('Sayfa ara').fill('Uppy');
  await expect(page.getByRole('link', { name: 'Uppy', exact: true })).toBeVisible();
});

test('Pi: harici kaynak, sıfır korpus kanıtı ve koşullu akış', async ({ page }) => {
  await page.goto('/araclar/pi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pi');
  await expect(page.getByText('Korpus dışı ekleme · 2026-09-28 ·')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Birincil kaynak', exact: true })).toHaveAttribute('href', 'https://github.com/earendil-works/pi');
  await expect(page.getByRole('tab', { name: 'Kanıt (0)' })).toBeVisible();
  await page.goto('/akislar/benimseme-pi');
  await expectDiagram(page);
  await expect(page.getByText('Çalışma ortamı sınırları', { exact: true })).toBeVisible();
});
