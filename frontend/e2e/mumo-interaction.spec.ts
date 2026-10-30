import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'mumo-interaction-user',
    name: 'Alex Morgan',
    email: 'alex@example.test',
    emailVerified: true,
    image: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  session: {
    id: 'mumo-interaction-session',
    userId: 'mumo-interaction-user',
    token: 'test-fixture-only',
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

// Failure cases: workspace hero hover must not engage Mumo; character hover and keyboard
// focus must engage it locally; pointer/touch activation must acknowledge the greeting;
// reduced motion and unavailable WebGL must keep that interaction usable.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: session }));
});

test('workspace Mumo recognizes local hover, pointer presses and keyboard activation', async ({
  page,
}, info) => {
  await page.goto('/');
  const mumo = page.getByRole('button', { name: 'Say hello to Mumo', exact: true });
  await expect(mumo).toBeVisible();
  await expect(mumo.locator('canvas')).toHaveAttribute('data-renderer', 'webgl');
  await page.getByRole('heading', { name: 'Ready when you are.', exact: true }).hover();
  await expect(mumo).toHaveAttribute('data-interaction', 'idle');
  await mumo.hover();
  await expect(mumo).toHaveAttribute('data-interaction', 'engaged');
  await page.mouse.down();
  await expect.poll(() => mumo.evaluate((node) => getComputedStyle(node).scale)).toBe('0.96');
  await page.mouse.up();
  await expect(mumo).toHaveAttribute('data-interaction', 'greeted');
  await expect(mumo.getByText('Hi!', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('workspace-mumo-greeting.png'), fullPage: true });
  await page.mouse.move(0, 0);
  await mumo.press('Tab');
  await expect(mumo).toHaveAttribute('data-interaction', 'idle');
  await mumo.focus();
  await expect(mumo).toHaveAttribute('data-interaction', 'engaged');
  await mumo.press('Enter');
  await expect(mumo.getByRole('status')).toHaveText('Mumo says hello.');
});

test('touch greeting stays usable with reduced motion and WebGL fallback', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: session }));
  await page.goto('/');
  const mumo = page.getByRole('button', { name: 'Say hello to Mumo', exact: true });
  await expect(mumo.locator('canvas')).toHaveAttribute('data-renderer', 'webgl');
  await mumo
    .locator('canvas')
    .evaluate((node) => node.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(mumo.locator('svg')).toBeVisible();
  await mumo.tap();
  await expect(mumo.getByText('Hi!', { exact: true })).toBeVisible();
  await expect(mumo).toHaveCSS('scale', '1');
  await expect(mumo.locator('canvas')).not.toBeVisible();
  await page.screenshot({
    path: info.outputPath('mumo-touch-reduced-fallback.png'),
    fullPage: true,
  });
  await context.close();
});
