import { expect, test } from '@playwright/test';

// Failures: low-contrast action labels, accent copy, muted copy, and missing theme overrides.
test('brand palette retains readable semantic pairs in both themes', async ({ page }, info) => {
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
  await page.goto('/');
  const measurements: Record<string, Record<string, number>> = {};
  for (const theme of ['light', 'dark']) {
    const toggle = page.getByRole('button', { name: `Use ${theme} mode`, exact: true });
    if (await toggle.isVisible()) await toggle.click();
    measurements[theme] = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas unavailable');
      const luminance = (token: string) => {
        context.fillStyle = styles.getPropertyValue(token).trim();
        context.fillRect(0, 0, 1, 1);
        const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
      };
      return Object.fromEntries(
        [
          ['--on-primary', '--primary'],
          ['--on-secondary', '--secondary'],
          ['--secondary-ink', '--secondary-soft'],
          ['--muted', '--surface'],
          ['--text', '--canvas'],
        ].map(([foreground, background]) => {
          const a = luminance(foreground!);
          const b = luminance(background!);
          return [`${foreground}/${background}`, (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)];
        }),
      );
    });
    for (const ratio of Object.values(measurements[theme]!))
      expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
  await info.attach('palette-contrast.json', {
    body: JSON.stringify(measurements, null, 2),
    contentType: 'application/json',
  });
  await expect(page.getByRole('link', { name: 'UnMute home' })).toBeVisible();
  const favicon = await page.request.get('/unmute-mark.svg');
  expect(favicon.ok()).toBe(true);
  expect(await favicon.text()).toContain('<svg');
});
