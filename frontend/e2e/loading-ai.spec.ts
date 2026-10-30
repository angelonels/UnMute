import { expect, test } from '@playwright/test';

// Failure cases: no visible wait state before the first token, an unlabeled
// streaming state, duplicate live wait announcements, loss of partial text on stop,
// and repeatable copy presses while clipboard completion is still pending.
test('Mumo exposes distinct waiting and streaming states and can stop safely', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await page.getByRole('button', { name: 'Summarize the discussion', exact: true }).click();
  const log = page.getByRole('log', { name: 'Private conversation with Mumo' });
  const announcement = page.getByRole('status', { name: 'Mumo response', exact: true });
  await expect(log).toHaveAttribute('aria-busy', 'true');
  await expect(log.getByText('Thinking…', { exact: true })).toBeVisible();
  await expect(announcement).toHaveCount(1);
  await expect(announcement).toHaveText('Mumo is thinking');
  await page.screenshot({ path: info.outputPath('mumo-waiting.png'), fullPage: true });
  await expect(log.getByText('Writing…', { exact: true })).toBeVisible();
  await expect(announcement).toHaveText('Mumo is writing');
  await expect(log.getByRole('heading', { name: 'A clearer meeting space' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop response', exact: true }).click();
  await expect(log).toHaveAttribute('aria-busy', 'false');
  await expect(log.getByText('Writing…', { exact: true })).toHaveCount(0);
  await expect(log).toContainText('Stopped');
  await expect(log.getByRole('heading', { name: 'A clearer meeting space' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(log).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
  await expect(log.getByRole('article')).toHaveCount(1);
  await expect(log).toContainText('sample discussion');
  await page.screenshot({ path: info.outputPath('mumo-response-complete.png'), fullPage: true });
});

test('copy remains focused and reports pending completion without duplicate writes', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            calls++;
            document.documentElement.dataset.clipboardWrites = String(calls);
            window.addEventListener('release-copy', () => resolve(), { once: true });
          }),
      },
    });
  });
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await page.getByRole('button', { name: 'List action items', exact: true }).click();
  await expect(page.getByRole('log')).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
  const copy = page.getByRole('button', { name: 'Copy answer', exact: true });
  await copy.focus();
  await copy.press('Enter');
  await expect(copy).toHaveAttribute('aria-busy', 'true');
  await expect(copy).toHaveAttribute('aria-disabled', 'true');
  await expect(copy).toContainText('Copying…');
  await expect(copy).toBeFocused();
  await copy.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-clipboard-writes', '1');
  await page.screenshot({ path: info.outputPath('mumo-copy-pending.png'), fullPage: true });
  await page.evaluate(() => window.dispatchEvent(new Event('release-copy')));
  await expect(copy).toContainText('Copied');
  await expect(copy).not.toHaveAttribute('aria-busy', 'true');
  await expect(copy).toBeFocused();
  await info.attach('copy-loading-state.json', {
    body: JSON.stringify(
      { clipboardWrites: 1, focusRetained: true, completion: 'Copied' },
      null,
      2,
    ),
    contentType: 'application/json',
  });
});
