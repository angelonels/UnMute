import { expect, test } from '@playwright/test';

// Failure cases: unresolved identity exposes login/workspace; busy CTA shifts or repeats
// requests; session retry unmounts the recovery control; reduced motion keeps a spinning loader.
for (const theme of ['light', 'dark'] as const) {
  test(`initial session resolution stays neutral and branded in ${theme}`, async ({
    page,
  }, info) => {
    let release: () => void = () => undefined;
    const response = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/auth/get-session**', async (route) => {
      await response;
      await route.fulfill({ json: null });
    });
    await page.goto('/');
    const pending = page.getByRole('main', { name: 'Loading account', exact: true });
    await expect(pending).toBeVisible();
    await expect(pending.getByText('UnMute', { exact: true })).toBeVisible();
    await expect(pending.getByRole('status')).toContainText('Loading');
    await expect(pending.locator('[data-loading-spinner]')).toHaveCSS('animation-name', 'none');
    await expect(page.getByRole('button', { name: /Google|Start meeting/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`session-pending-${theme}.png`),
      fullPage: true,
    });
    release();
    await expect(
      page.getByRole('button', { name: 'Continue with Google', exact: true }),
    ).toBeEnabled();
  });
}

test('Google sign-in keeps focus and stable geometry while blocking duplicate submissions', async ({
  page,
}, info) => {
  let release: () => void = () => undefined;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
  await page.route('**/api/auth/sign-in/social', async (route) => {
    requests++;
    await response;
    await route.fulfill({ status: 503, json: { message: 'Unavailable' } });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const action = page.getByRole('button', { name: 'Continue with Google', exact: true });
  await expect(action).toBeEnabled();
  const before = await action.boundingBox();
  await action.press('Enter');
  const pending = page.getByRole('button', { name: 'Connecting to Google…', exact: true });
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  await expect(pending).toBeFocused();
  await expect(pending.locator('[data-loading-spinner]')).toHaveCSS('animation-name', 'none');
  const during = await pending.boundingBox();
  expect(during?.height).toBe(before?.height);
  expect(during?.width).toBe(before?.width);
  await pending.press('Enter');
  expect(requests).toBe(1);
  await expect(page.getByRole('status').filter({ hasText: 'Connecting to Google' })).toBeAttached();
  await page.screenshot({ path: info.outputPath('google-sign-in-pending.png'), fullPage: true });
  release();
  await expect(page.getByRole('alert')).toContainText('Please try again');
  await expect(
    page.getByRole('button', { name: 'Continue with Google', exact: true }),
  ).toBeEnabled();
});

test('session retry stays in place with focused progress and usable recovery', async ({
  page,
}, info) => {
  let release: () => void = () => undefined;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route('**/api/auth/get-session**', async (route) => {
    requests++;
    if (requests > 1) await response;
    await route.fulfill({ status: 503, json: { message: 'Unavailable' } });
  });
  await page.goto('/');
  const retry = page.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeVisible();
  await retry.press('Enter');
  const checking = page.getByRole('button', { name: 'Checking…', exact: true });
  await expect(checking).toBeFocused();
  await expect(checking).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('main', { name: 'Loading account', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Sign in to UnMute', exact: true })).toBeVisible();
  await checking.press('Enter');
  expect(requests).toBe(2);
  await page.screenshot({ path: info.outputPath('session-retry-pending.png'), fullPage: true });
  release();
  await expect(retry).toBeVisible();
  await expect(retry).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('We couldn’t check your session');
});
