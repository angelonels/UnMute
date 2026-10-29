import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'workspace-test-user',
    name: 'Alex Morgan',
    email: 'alex@example.test',
    emailVerified: true,
    image: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  session: {
    id: 'workspace-test-session',
    userId: 'workspace-test-user',
    token: 'test-fixture-only',
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: (constraints: MediaStreamConstraints) => {
        if (constraints.audio)
          return Promise.resolve(new AudioContext().createMediaStreamDestination().stream);
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        return Promise.resolve(canvas.captureStream(5));
      },
    });
  });
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: session }));
});

test('workspace panels and meeting preview preserve keyboard access', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Start meeting', exact: true });
  await expect(start).toBeVisible();
  await page.getByRole('button', { name: 'Collapse navigation' }).click();
  await expect(page.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.getByRole('button', { name: 'Expand navigation' }).click();
  const account = page.getByRole('button', { name: 'Account: Alex Morgan', exact: true });
  await account.press('Enter');
  const accountPanel = page.getByRole('dialog', { name: 'Account', exact: true });
  await expect(accountPanel).toBeVisible();
  await accountPanel.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  await expect(settings).toBeVisible();
  await expect(settings.getByText('alex@example.test', { exact: true })).toBeVisible();
  await settings.getByRole('radio', { name: 'Dark', exact: true }).check();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await settings.getByRole('radio', { name: 'System', exact: true }).check();
  await expect(settings.getByRole('radio', { name: 'System', exact: true })).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('workspace-settings.png'), fullPage: true });
  await settings.press('Escape');
  await expect(settings).toHaveCount(0);
  await expect(account).toBeFocused();
  await start.press('Enter');
  const preview = page.getByRole('dialog', { name: 'Before you meet' });
  await expect(preview).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Close meeting preview' })).toBeFocused();
  for (const name of ['Microphone', 'Camera']) {
    const toggle = preview.getByRole('button', { name, exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(preview.getByRole('status')).toContainText('Local preview');
  await expect(preview.getByLabel('Your camera video')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('meeting-preview.png'), fullPage: true });
  await preview.getByRole('button', { name: 'Back to workspace' }).click();
  await expect(start).toBeFocused();
});

test('workspace fits narrow and wide screens in both themes', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      localStorage.setItem('theme', value);
    }, theme);
    await page.reload();
    for (const width of [320, 375, 768, 1024, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole('button', { name: 'Start meeting', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const navigation = page.getByRole('dialog', { name: 'Your workspace', exact: true });
    await expect(navigation).toBeVisible();
    await navigation.getByRole('button', { name: 'Close drawer' }).press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath(`workspace-mobile-${theme}.png`),
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const navigation = page.getByRole('dialog', { name: 'Your workspace', exact: true });
  await navigation.getByRole('button', { name: 'Account: Alex Morgan', exact: true }).click();
  const account = page.getByRole('dialog', { name: 'Account', exact: true });
  await account.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Settings', exact: true });
  await expect(settings).toBeVisible();
  await settings.getByRole('radio', { name: 'Light', exact: true }).check();
  await expect(page.locator('html')).toHaveClass(/light/);
  await settings.press('Escape');
  await expect(
    navigation.getByRole('button', { name: 'Account: Alex Morgan', exact: true }),
  ).toBeFocused();
});

test('sign-out failure leaves a working retry', async ({ page }) => {
  await page.route('**/api/auth/sign-out', (route) =>
    route.fulfill({ status: 503, json: { message: 'Unavailable' } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Account: Alex Morgan', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText('Sign-out failed');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeEnabled();
});

test('meeting preview keeps device controls and long names within a narrow viewport', async ({
  page,
}, testInfo) => {
  await page.route('**/api/auth/get-session**', (route) =>
    route.fulfill({
      json: {
        ...session,
        user: { ...session.user, name: 'Alexanderthegreatwithanunbrokenfamilyname Morgan' },
      },
    }),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeAttached();
  await page.getByRole('button', { name: 'Start meeting', exact: true }).press('Enter');
  const preview = page.getByRole('dialog', { name: 'Before you meet' });
  await expect(preview).toBeVisible();
  for (const name of ['Microphone', 'Camera']) {
    const control = preview.getByRole('button', { name, exact: true });
    await expect(control).toBeVisible();
    expect(
      await control.evaluate((node) => node.scrollWidth <= node.clientWidth),
      `${name} content must fit inside its control`,
    ).toBe(true);
  }
  expect(await preview.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await preview.getByRole('button', { name: 'Back to workspace' }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath('preview-narrow-long-name.png'),
    fullPage: true,
  });
  await preview.getByRole('button', { name: 'Back to workspace' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Start meeting', exact: true })).toBeFocused();
});

test('account popover closes outside and removed workspace placeholders stay absent', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const account = page.getByRole('button', { name: 'Account: Alex Morgan', exact: true });
  await account.click();
  await expect(page.getByRole('dialog', { name: 'Account', exact: true })).toBeVisible();
  await page.getByRole('heading', { name: 'Overview', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Account', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /About this workspace|Side panel|Open side panel/ }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Collapse navigation' }).click();
  await expect(
    page
      .getByRole('complementary', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'UnMute home' }),
  ).toBeVisible();
  await expect(account).toBeVisible();
  await page.screenshot({ path: info.outputPath('workspace-compact-account.png'), fullPage: true });
});
