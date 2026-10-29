import { expect, test } from '@playwright/test';

// Failure cases: permission waits look idle, repeated activation duplicates capture,
// device selection remains active, denied requests stay busy, and screen waits lack feedback.
test('media permission waits remain visible, recoverable and safe to activate once', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    let requests = 0;
    let resolveCapture: ((stream: MediaStream) => void) | undefined;
    let rejectCapture: ((error: DOMException) => void) | undefined;
    const capture = () => {
      requests++;
      return new Promise<MediaStream>((resolve, reject) => {
        resolveCapture = resolve;
        rejectCapture = reject;
      });
    };
    Object.defineProperty(window, '__pendingCapture', {
      value: {
        requests: () => requests,
        resolve: () => {
          const canvas = document.createElement('canvas');
          canvas.getContext('2d')?.fillRect(0, 0, canvas.width, canvas.height);
          resolveCapture?.(canvas.captureStream(5));
        },
        reject: () => rejectCapture?.(new DOMException('Denied', 'NotAllowedError')),
      },
    });
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: capture });
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', { value: capture });
  });
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  const camera = page.getByRole('button', { name: 'Camera off', exact: true });
  await camera.press('Enter');
  await expect(camera).toBeDisabled();
  await expect(camera).toBeFocused();
  await expect(camera).toHaveAttribute('aria-busy', 'true');
  await expect(camera.locator('[data-loading-spinner]')).toHaveClass(/motion-safe:animate-spin/);
  await expect(page.getByRole('status').filter({ hasText: 'Starting camera…' })).toBeVisible();
  await camera.evaluate((button: HTMLButtonElement) => button.click());
  expect(await page.evaluate(() => Reflect.get(window, '__pendingCapture').requests())).toBe(1);
  await page.getByRole('button', { name: 'Device settings', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'camera input' })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'Connecting…' })).toBeVisible();
  await page.getByRole('button', { name: 'Close device settings', exact: true }).click();
  await page.screenshot({ path: info.outputPath('camera-permission-pending.png'), fullPage: true });
  await page.evaluate(() => Reflect.get(window, '__pendingCapture').reject());
  await expect(camera).toBeEnabled();
  await expect(camera).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('alert')).toContainText('permission');
  await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await camera.click();
  await page.evaluate(() => Reflect.get(window, '__pendingCapture').resolve());
  await expect(page.getByRole('button', { name: 'Camera on', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Your camera video')).toBeVisible();
  await expect(page.getByLabel('Your camera video')).toHaveAttribute('aria-busy', 'false');
  const share = page.getByRole('button', { name: 'Share screen', exact: true });
  await share.click();
  await expect(share).toBeDisabled();
  await expect(share).toHaveAttribute('aria-busy', 'true');
  await expect(
    page.getByRole('status').filter({ hasText: 'Choose a screen to share…' }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Use dark mode', exact: true }).click();
  expect(
    await share
      .locator('[data-loading-spinner]')
      .evaluate((icon) => getComputedStyle(icon).animationName),
  ).toBe('none');
  await page.screenshot({ path: info.outputPath('screen-picker-pending.png'), fullPage: true });
  await page.evaluate(() => Reflect.get(window, '__pendingCapture').reject());
  await expect(share).toBeEnabled();
  await expect(page.getByRole('alert')).toContainText('Screen sharing permission');
});
