import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'navigation-user',
    name: 'Alex Morgan',
    email: 'alex@example.test',
    emailVerified: true,
    image: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  session: {
    id: 'navigation-session',
    userId: 'navigation-user',
    token: 'test-fixture-only',
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

test('brand returns from a meeting without reloading or flashing sign-in during session resolution', async ({
  page,
}, info) => {
  let releaseSession: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    releaseSession = resolve;
  });
  let sessionRequests = 0;
  await page.route('**/api/auth/get-session**', async (route) => {
    sessionRequests++;
    await gate;
    await route.fulfill({ json: session });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const state = { loginSeen: false, documentMarker: 'same-document' };
    Object.assign(window, { navigationAudit: state });
    new MutationObserver(() => {
      if (
        document.getElementById('signin-heading') ||
        Array.from(document.querySelectorAll('button')).some((button) =>
          button.textContent?.includes('Google'),
        )
      )
        state.loginSeen = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await expect(page.getByRole('heading', { name: 'Design sync', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const state = (window as Window & { navigationAudit: { documentMarker: string } })
      .navigationAudit;
    state.documentMarker = 'meeting-document';
  });
  await page.getByRole('link', { name: 'UnMute home', exact: true }).click();
  await expect.poll(() => sessionRequests).toBe(1);
  await expect(page.getByRole('main', { name: 'Loading account', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Google/ })).toHaveCount(0);
  releaseSession();
  await expect(page.getByRole('button', { name: 'Start meeting', exact: true })).toBeVisible();
  const audit = await page.evaluate(
    () =>
      (window as Window & { navigationAudit: { loginSeen: boolean; documentMarker: string } })
        .navigationAudit,
  );
  expect(audit).toEqual({ loginSeen: false, documentMarker: 'meeting-document' });
  await info.attach('brand-navigation-audit.json', {
    body: JSON.stringify(audit),
    contentType: 'application/json',
  });
  await page.screenshot({ path: info.outputPath('meeting-to-workspace.png'), fullPage: true });
});
