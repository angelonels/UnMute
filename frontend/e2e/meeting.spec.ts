import { expect, test } from '@playwright/test';

test('development room supports local controls, pinning, sharing, and chats', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1618, height: 948 });
  await page.goto('/meeting?demo=true');
  await expect(page.getByRole('heading', { name: 'Design sync', exact: true })).toBeVisible();
  const microphone = page.getByRole('button', { name: 'Microphone off', exact: true });
  await expect(microphone).toHaveClass(/text-error/);
  await page.getByRole('button', { name: 'Demo controls', exact: true }).click();
  await page.getByRole('combobox', { name: 'Capture source' }).click();
  await page.getByRole('option', { name: 'Synthetic test devices', exact: true }).click();
  await page.getByRole('button', { name: 'Close demo controls', exact: true }).click();
  await microphone.click();
  await expect(page.getByRole('button', { name: 'Microphone on', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Pin Maya Chen', exact: true }).click();
  await expect(page.getByText('Pinned to your view', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Share screen', exact: true }).click();
  await expect(page.getByLabel('Your shared screen')).toBeVisible();
  await page.getByRole('button', { name: 'Open UnMute AI', exact: true }).click();
  await page.getByRole('button', { name: 'Summarize the discussion', exact: true }).click();
  await expect(page.getByRole('log', { name: 'Private AI conversation' })).toContainText(
    'Example answer',
  );
  await page.getByRole('button', { name: 'Open meeting chat', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Message everyone' })
    .fill('A message kept in this preview');
  await page.getByRole('textbox', { name: 'Message everyone' }).press('Enter');
  await expect(page.getByRole('log', { name: 'Meeting messages' })).toContainText(
    'A message kept in this preview',
  );
  await page.screenshot({ path: info.outputPath('meeting-both-panels.png'), fullPage: true });
});

test('large rooms paginate and a shrinking room never leaves an empty page', async ({ page }) => {
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Demo controls', exact: true }).click();
  await page.getByRole('combobox', { name: 'Participants in demo' }).click();
  await page.getByRole('option', { name: '48 people', exact: true }).click();
  await page.getByRole('button', { name: 'Close demo controls', exact: true }).click();
  await page.getByRole('button', { name: 'Next participants', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Previous participants', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Demo controls', exact: true }).click();
  await page.getByRole('combobox', { name: 'Participants in demo' }).click();
  await page.getByRole('option', { name: '1 person', exact: true }).click();
  await page.getByRole('combobox', { name: 'Demo connection' }).click();
  await page.getByRole('option', { name: 'Disconnected', exact: true }).click();
  await page.getByRole('button', { name: 'Close demo controls', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Connection status' })).toContainText(
    'Disconnected',
  );
  await expect(
    page.getByRole('region', { name: 'Participant gallery' }).getByRole('article'),
  ).toHaveCount(1);
});

test('phone sheets retain drafts, restore focus, and keep the room within the viewport', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Open meeting chat', exact: true }).click();
  await page.getByRole('textbox', { name: 'Message everyone' }).fill('Keep this draft');
  await page.getByRole('button', { name: 'Close meeting chat', exact: true }).press('Escape');
  await expect(page.getByRole('button', { name: 'Open meeting chat', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open meeting chat', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Message everyone' })).toHaveValue(
    'Keep this draft',
  );
  await page.getByRole('button', { name: 'Close meeting chat', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Leave meeting preview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’ve left the preview.' })).toBeVisible();
  await page.getByRole('button', { name: 'Rejoin preview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Design sync', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('meeting-mobile.png'), fullPage: true });
});

test('local capture renders, stops tracks, handles denial and browser-ended sharing', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const streams: MediaStream[] = [];
    Object.defineProperty(window, '__captureStreams', { value: streams });
    const capture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#355346';
        context.fillRect(0, 0, 640, 360);
      }
      const stream = canvas.captureStream(5);
      streams.push(stream);
      return Promise.resolve(stream);
    };
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: capture,
    });
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
      configurable: true,
      value: capture,
    });
  });
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Camera off', exact: true }).click();
  await expect(page.getByLabel('Your camera video')).toBeVisible();
  await page.getByRole('button', { name: 'Camera on', exact: true }).click();
  expect(
    await page.evaluate(() =>
      (Reflect.get(window, '__captureStreams') as MediaStream[])[0]
        ?.getTracks()
        .every((track) => track.readyState === 'ended'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Share screen', exact: true }).click();
  await expect(page.getByLabel('Your shared screen')).toBeVisible();
  await page.evaluate(() => {
    const stream = (Reflect.get(window, '__captureStreams') as MediaStream[]).at(-1);
    stream?.getVideoTracks()[0]?.dispatchEvent(new Event('ended'));
  });
  await expect(page.getByRole('button', { name: 'Share screen', exact: true })).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')),
    }),
  );
  await page.getByRole('button', { name: 'Microphone off', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('permission');
  await expect(page.getByRole('button', { name: 'Microphone off', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.screenshot({ path: info.outputPath('media-permission-error.png') });
});
