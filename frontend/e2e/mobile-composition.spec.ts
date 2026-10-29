import { expect, test } from '@playwright/test';

// Failure cases: a tiny detached sculpture on tall phones, primary action below the
// first screen, clipped content at compact widths, lost Mumo target, and neutral white surfaces.
for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 812, height: 375 },
  ]) {
    test(`mobile sign-in is composed and usable at ${viewport.width}px in ${theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
      await page.goto('/');
      const google = page.getByRole('button', { name: 'Continue with Google', exact: true });
      await expect(google).toBeInViewport({ ratio: 1 });
      const scene = page.locator('canvas[data-stage="sculpture"][data-renderer="webgl"]');
      await expect(scene).toBeVisible();
      const artwork = await scene.boundingBox();
      if (!artwork) throw new Error('Missing sculpture');
      if (viewport.height >= 780 && viewport.width <= 430) {
        expect(artwork.width).toBeGreaterThanOrEqual(viewport.width * 0.65);
      }
      const mumo = page.getByRole('button', { name: 'Say hello to Mumo', exact: true });
      const target = await mumo.boundingBox();
      expect(target?.width).toBeGreaterThanOrEqual(44);
      expect(target?.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (theme === 'light') {
        const [red, green, blue] = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Color measurement unavailable');
          context.fillStyle = getComputedStyle(document.body).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data);
        });
        expect(blue! - red!).toBeGreaterThan(3);
        expect(blue! - green!).toBeGreaterThan(3);
        expect(red).toBeGreaterThan(230);
        expect(green).toBeGreaterThan(230);
      }
      await page.screenshot({
        path: info.outputPath(`mobile-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
      await google.focus();
      await expect(google).toBeFocused();
    });
  }
}
