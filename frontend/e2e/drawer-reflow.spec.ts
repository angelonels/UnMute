import { expect, test } from '@playwright/test';

// Failure cases: enlarged drawer headings must wrap without pushing the close
// control outside the viewport; closing must still return keyboard focus.
for (const theme of ['light', 'dark']) {
  test(`mobile drawer header reflows at enlarged text in ${theme} mode`, async ({ page }, info) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.route('**/api/auth/get-session**', (route) =>
      route.fulfill({
        json: {
          user: {
            id: 'drawer-reflow-user',
            name: 'Alex Morgan',
            email: 'alex@example.test',
            emailVerified: true,
            image: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          session: {
            id: 'drawer-reflow-session',
            userId: 'drawer-reflow-user',
            token: 'test-fixture-only',
            expiresAt: '2099-01-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      }),
    );
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const trigger = page.getByRole('button', { name: 'Open navigation', exact: true });
    await trigger.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Your workspace', exact: true });
    const close = drawer.getByRole('button', { name: 'Close drawer', exact: true });
    await expect(drawer).toBeVisible();
    await expect(close).toBeVisible();
    const bounds = await close.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    const header = drawer
      .getByRole('heading', { name: 'Your workspace', exact: true })
      .locator('xpath=../..');
    expect(await header.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({
      path: info.outputPath(`drawer-enlarged-${theme}.png`),
      fullPage: true,
    });
    await close.press('Enter');
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
