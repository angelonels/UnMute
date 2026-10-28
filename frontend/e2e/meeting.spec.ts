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
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await page.getByRole('button', { name: 'Summarize the discussion', exact: true }).click();
  await expect(page.getByRole('log', { name: 'Private conversation with Mumo' })).toContainText(
    'A clearer meeting space',
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

test('AI streams, stops without losing partial text, retries and retains drafts', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await page.getByRole('button', { name: 'Summarize the discussion', exact: true }).click();
  const log = page.getByRole('log', { name: 'Private conversation with Mumo' });
  await expect(log).toHaveAttribute('aria-busy', 'true');
  await expect(log.getByRole('article')).toContainText('A clearer meeting space');
  await page.getByRole('button', { name: 'Stop response', exact: true }).click();
  await expect(log).toHaveAttribute('aria-busy', 'false');
  await expect(log).toContainText('Stopped');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(log).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
  await expect(log.getByRole('article')).toHaveCount(1);
  await expect(log).toContainText('sample discussion');
  await page.getByRole('textbox', { name: 'Message Mumo', exact: true }).fill('A follow-up draft');
  await page.getByRole('button', { name: 'Close Mumo', exact: true }).click();
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Message Mumo', exact: true })).toHaveValue(
    'A follow-up draft',
  );
  await page.screenshot({ path: info.outputPath('ai-stream-complete.png'), fullPage: true });
});

test('device choice survives off/on and a late capture is stopped after leaving', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const tracks: MediaStreamTrack[] = [];
    const requested: (MediaTrackConstraints | boolean | undefined)[] = [];
    let resolvePending: ((stream: MediaStream) => void) | undefined;
    Object.defineProperty(window, '__mediaFixture', {
      value: {
        tracks,
        requested,
        resolve: () => {
          const stream = document.createElement('canvas').captureStream();
          tracks.push(...stream.getTracks());
          resolvePending?.(stream);
        },
      },
    });
    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
      value: async () => [
        { kind: 'videoinput', deviceId: 'external-camera', label: 'External camera', groupId: '' },
      ],
    });
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: (constraints: MediaStreamConstraints) => {
        requested.push(constraints.video);
        if (requested.length === 3)
          return new Promise<MediaStream>((resolve) => {
            resolvePending = resolve;
          });
        const stream = document.createElement('canvas').captureStream();
        tracks.push(...stream.getTracks());
        return Promise.resolve(stream);
      },
    });
  });
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Device settings', exact: true }).click();
  await page.getByRole('combobox', { name: 'camera input' }).click();
  await page.getByRole('option', { name: 'External camera', exact: true }).click();
  await page.getByRole('button', { name: 'Close device settings', exact: true }).click();
  await page.getByRole('button', { name: 'Camera on', exact: true }).click();
  await page.getByRole('button', { name: 'Camera off', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Camera on', exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__mediaFixture').requested[1])).toEqual({
    deviceId: { exact: 'external-camera' },
  });
  await page.getByRole('button', { name: 'Camera on', exact: true }).click();
  await page.getByRole('button', { name: 'Camera off', exact: true }).click();
  await page.getByRole('button', { name: 'Leave meeting preview', exact: true }).click();
  await page.evaluate(() => Reflect.get(window, '__mediaFixture').resolve());
  await expect
    .poll(() =>
      page.evaluate(() =>
        Reflect.get(window, '__mediaFixture').tracks.every(
          (track: MediaStreamTrack) => track.readyState === 'ended',
        ),
      ),
    )
    .toBe(true);
  await page.screenshot({ path: info.outputPath('late-capture-stopped.png') });
});

test('companion studio exposes Dotty states, shape morphing and system reduced motion', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Demo controls', exact: true }).click();
  await page.getByRole('button', { name: 'Open companion studio', exact: true }).click();
  const studio = page.getByRole('dialog', { name: 'Companion studio', exact: true });
  for (const state of [
    'Thinking',
    'Working',
    'Celebrating',
    'Listening',
    'Sleeping',
    'Alert',
    'Shapeshift',
    'Bouncing',
    'Idle',
  ]) {
    await studio.getByRole('combobox', { name: 'Companion state' }).click();
    await page.getByRole('option', { name: state, exact: true }).click();
    await expect(studio.locator('[data-companion-state]')).toHaveAttribute(
      'data-companion-state',
      state.toLowerCase(),
    );
    await expect(studio.locator('canvas[data-engine="dotty"]')).toBeVisible();
  }
  await studio.getByRole('combobox', { name: 'Companion shape' }).click();
  await page.getByRole('option', { name: 'Cloud', exact: true }).click();
  // Long silhouettes must remain framed even at the peak of a bounce or spin.
  for (const [shape, state] of [
    ['Bunny', 'Bouncing'],
    ['Bunny', 'Celebrating'],
    ['Drop', 'Celebrating'],
  ]) {
    await studio.getByRole('combobox', { name: 'Companion shape' }).click();
    await page.getByRole('option', { name: shape, exact: true }).click();
    await studio.getByRole('combobox', { name: 'Companion state' }).click();
    await page.getByRole('option', { name: state, exact: true }).click();
    await page.screenshot({
      path: info.outputPath(`companion-${shape}-${state}.png`),
      fullPage: true,
    });
  }
  await studio.getByRole('button', { name: 'Poke', exact: true }).click();
  await studio.getByRole('button', { name: 'Blink', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(studio.locator('canvas')).toHaveAttribute('data-motion', 'still');
  await page.screenshot({ path: info.outputPath('companion-studio-reduced.png'), fullPage: true });
});

test('AI preserves a partial interrupted answer and recovers without a duplicate prompt', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Demo controls', exact: true }).click();
  await page.getByRole('combobox', { name: 'Demo AI response' }).click();
  await page.getByRole('option', { name: 'Interrupt response', exact: true }).click();
  await page.getByRole('button', { name: 'Close demo controls', exact: true }).click();
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await page.getByRole('button', { name: 'Summarize the discussion', exact: true }).click();
  const log = page.getByRole('log', { name: 'Private conversation with Mumo' });
  await expect(log.getByRole('alert')).toContainText('Response interrupted');
  await expect(log.getByRole('heading', { name: 'A clearer meeting space' })).toBeVisible();
  await page.getByRole('button', { name: 'Demo controls', exact: true }).click();
  await page.getByRole('combobox', { name: 'Demo AI response' }).click();
  await page.getByRole('option', { name: 'Stream normally', exact: true }).click();
  await page.getByRole('button', { name: 'Close demo controls', exact: true }).click();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(log).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
  await expect(log.getByRole('article')).toHaveCount(1);
  await expect(log.getByRole('alert')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('ai-recovered.png'), fullPage: true });
});
