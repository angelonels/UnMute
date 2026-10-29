import { expect, test } from '@playwright/test';

// Failure cases: favicon and inline paths drift, rose terminal disappears at small
// sizes, or the mark clips against its view box when the silhouette changes.
for (const theme of ['light', 'dark'] as const) {
  test(`logo silhouette stays coherent and readable in ${theme}`, async ({ page }, info) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
    await page.goto('/');
    const mark = page.getByRole('link', { name: 'UnMute home', exact: true }).locator('svg');
    await expect(mark).toBeVisible();
    const paths = await mark
      .locator('path')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d')));
    const icon = await page.request.get('/unmute-mark.svg');
    expect(icon.ok()).toBe(true);
    const geometry = await page.evaluate(
      (source) => {
        const document = new DOMParser().parseFromString(source, 'image/svg+xml');
        return [...document.querySelectorAll('path')].map((path) => path.getAttribute('d'));
      },
      await icon.text(),
    );
    expect(paths).toEqual(geometry);
    const bounds = await mark.evaluate((node: SVGSVGElement) => {
      const box = node.getBBox();
      // SVG bounds use float32 internally; compare at subpixel precision rather
      // than treating a millionth of a view-box unit as visible clipping.
      const subpixel = (value: number) => Math.round(value * 1000) / 1000;
      return {
        x: subpixel(box.x),
        y: subpixel(box.y),
        right: subpixel(box.x + box.width),
        bottom: subpixel(box.y + box.height),
      };
    });
    expect(bounds.x).toBeGreaterThanOrEqual(2);
    expect(bounds.y).toBeGreaterThanOrEqual(2);
    expect(bounds.right).toBeLessThanOrEqual(30);
    expect(bounds.bottom).toBeLessThanOrEqual(30);
    for (const size of [24, 36]) {
      const readability = await page.evaluate(
        async ({ source, size }) => {
          const image = new Image();
          image.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Logo measurement unavailable');
          context.drawImage(image, 0, 0, size, size);
          const pixels = context.getImageData(0, 0, size, size).data;
          let body = 0;
          let rose = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3]! < 180) continue;
            const red = pixels[index]!;
            const green = pixels[index + 1]!;
            const blue = pixels[index + 2]!;
            if (blue > green + 15) body++;
            if (red > green + 15) rose++;
          }
          return { body, rose };
        },
        { source: await icon.text(), size },
      );
      expect(readability.body).toBeGreaterThan(size * size * 0.15);
      expect(readability.rose).toBeGreaterThan(size * size * 0.005);
    }
    await mark.screenshot({ path: info.outputPath(`logo-${theme}-36.png`) });
  });
}
