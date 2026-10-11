import { expect, test } from '@playwright/test';

test('Google sign-in surface supports themes, keyboard access, and narrow screens', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Make room for the conversation.' }),
  ).toBeVisible();
  const google = page.getByRole('button', { name: 'Continue with Google' });
  await expect(google).toBeVisible();
  await page.getByRole('button', { name: 'Use dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: testInfo.outputPath('login-dark.png'), fullPage: true });
  await page.getByRole('button', { name: 'Use light mode' }).click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await google.focus();
  await expect(google).toBeFocused();
  for (const width of [320, 375, 768, 1024, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(google).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('login-light.png'), fullPage: true });
});

test('auth rejects hostile origins and external redirects without creating a session', async ({
  request,
}) => {
  const session = await request.get('/api/auth/get-session');
  expect(session.ok()).toBe(true);
  expect(await session.json()).toBeNull();
  const hostileOrigin = await request.post('/api/auth/sign-in/social', {
    headers: { Origin: 'https://attacker.example' },
    data: { provider: 'google', callbackURL: 'http://localhost:5173/' },
  });
  expect(hostileOrigin.status()).toBe(403);
  const hostileRedirect = await request.post('/api/auth/sign-in/social', {
    headers: { Origin: 'http://localhost:5173' },
    data: { provider: 'google', callbackURL: 'https://attacker.example/' },
  });
  expect(hostileRedirect.status()).toBe(403);
  const callback = await request.get('/api/auth/callback/google?code=invalid&state=invalid', {
    maxRedirects: 0,
  });
  expect(callback.status()).toBe(302);
  expect(callback.headers().location).not.toContain('attacker.example');
  expect(await (await request.get('/api/auth/get-session')).json()).toBeNull();
});

test('Google flow requests identity only and binds the exact callback', async ({ request }) => {
  const response = await request.post('/api/auth/sign-in/social', {
    headers: { Origin: 'http://localhost:5173' },
    data: {
      provider: 'google',
      callbackURL: 'http://localhost:5173/',
      errorCallbackURL: 'http://localhost:5173/?error=oauth',
    },
  });
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { url: string };
  const url = new URL(body.url);
  expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('redirect_uri')).toBe(
    'http://localhost:5173/api/auth/callback/google',
  );
  expect(url.searchParams.get('state')).toBeTruthy();
  expect(url.searchParams.get('scope')?.split(' ').sort()).toEqual(['email', 'openid', 'profile']);
  expect(response.headers()['set-cookie']).toContain('HttpOnly');
});

test('sign-in failure has a usable retry action', async ({ page }) => {
  await page.route('**/api/auth/sign-in/social', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'AUTH_UNAVAILABLE', message: 'Sign-in is unavailable' }),
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('alert')).toContainText('Please try again');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
});
