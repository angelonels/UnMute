import { expect, test } from '@playwright/test';

// Failures: light mode silently changes Mumo into a blue character, theme changes
// replace its ceramic identity, and WebGL loss falls back to a blue/white-eyed mark.
for (const theme of ['light', 'dark'] as const) {
  test(`Mumo keeps a ceramic body and ink face in the ${theme} workspace`, async ({
    page,
  }, info) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.route('**/api/auth/get-session**', (route) =>
      route.fulfill({
        json: {
          user: {
            id: 'material-user',
            name: 'Alex Morgan',
            email: 'alex@example.test',
            image: null,
          },
          session: {
            id: 'material-session',
            userId: 'material-user',
            expiresAt: '2099-01-01T00:00:00Z',
          },
        },
      }),
    );
    await page.goto('/');
    const mumo = page.getByRole('button', { name: 'Say hello to Mumo', exact: true });
    const canvas = mumo.locator('canvas[data-renderer="webgl"]');
    await expect(canvas).toBeVisible();
    // Measure the rendered volume rather than only checking a CSS token or finish flag.
    await expect(async () => {
      const pixels = (await canvas.screenshot()).toString('base64');
      const material = await page.evaluate(async (value) => {
        const image = new Image();
        image.src = `data:image/png;base64,${value}`;
        await image.decode();
        const surface = document.createElement('canvas');
        surface.width = image.width;
        surface.height = image.height;
        const context = surface.getContext('2d');
        if (!context) throw new Error('Material measurement unavailable');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, surface.width, surface.height).data;
        let ceramic = 0;
        let blue = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]!;
          const g = pixels[i + 1]!;
          const b = pixels[i + 2]!;
          if (Math.min(r, g, b) > 145 && Math.max(r, g, b) - Math.min(r, g, b) < 45) ceramic++;
          if (b > r + 45 && b > g + 25) blue++;
        }
        return { ceramic: ceramic / (pixels.length / 4), blue: blue / (pixels.length / 4) };
      }, pixels);
      expect(material.ceramic).toBeGreaterThan(0.08);
      expect(material.blue).toBeLessThan(0.03);
    }).toPass({ timeout: 5000 });
    await page.screenshot({ path: info.outputPath(`mumo-material-${theme}.png`), fullPage: true });
    await canvas.evaluate((node: HTMLCanvasElement) => {
      node.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect(canvas).toBeHidden();
    const fallback = mumo.locator('[style*="--companion-body"], [class*="--companion-body"]');
    await expect(fallback).toBeVisible();
    const colors = await fallback.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        body: style.getPropertyValue('--companion-body').trim(),
        face: style.getPropertyValue('--companion-face').trim(),
      };
    });
    expect(colors.body).toContain('0.89');
    expect(colors.face).toContain('0.23');
    await page.screenshot({ path: info.outputPath(`mumo-fallback-${theme}.png`), fullPage: true });
  });
}
