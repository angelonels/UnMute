import { expect, test } from '@playwright/test';

for (const surface of ['login', 'workspace'] as const) {
  test(`${surface} visual review in both themes on phone and desktop`, async ({ page }, info) => {
    if (surface === 'workspace') {
      await page.route('**/api/auth/get-session**', (route) =>
        route.fulfill({
          json: {
            user: {
              id: 'visual-user',
              name: 'Alex Morgan',
              email: 'alex@example.test',
              emailVerified: true,
              image: null,
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            session: {
              id: 'visual-session',
              userId: 'visual-user',
              token: 'test-fixture-only',
              expiresAt: '2099-01-01',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          },
        }),
      );
    }
    await page.goto('/');
    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((value) => localStorage.setItem('theme', value), theme);
      await page.reload();
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
        await expect(
          page.getByRole('button', {
            name: surface === 'login' ? 'Continue with Google' : 'Start meeting',
            exact: true,
          }),
        ).toBeInViewport({ ratio: 1 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await expect(page.locator('canvas[data-renderer="webgl"]')).toBeVisible();
        if (surface === 'login' && width >= 1024) {
          // The studio backdrop is first requested when the desktop breakpoint appears.
          await page.evaluate(async (value) => {
            const backdrop = new Image();
            backdrop.src = `/images/auth-studio-${value}.webp`;
            await backdrop.decode();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }, theme);
        }
        await page.screenshot({
          path: info.outputPath(`${surface}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  });
}
