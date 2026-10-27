import { expect, test } from '@playwright/test';

test('the AI companion moves autonomously and respects its settings preference', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Open UnMute AI', exact: true }).click();
  const character = page.getByRole('img', { name: 'UnMute AI companion', exact: true });
  const canvas = character.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
  const firstFrame = await canvas.screenshot();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(firstFrame), { timeout: 7000 })
    .toBe(false);
  await expect(page.getByRole('button', { name: 'Pause companion motion' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Device settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Companion animation' }).uncheck();
  await page.getByRole('button', { name: 'Close device settings', exact: true }).click();
  await page.screenshot({ path: info.outputPath('companion-paused.png'), fullPage: true });
});

test('reduced motion keeps a real 3D scene still and conversation replaces the welcome', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Open UnMute AI', exact: true }).click();
  const canvas = page
    .getByRole('img', { name: 'UnMute AI companion', exact: true })
    .locator('canvas');
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
  await page.getByRole('button', { name: 'List action items', exact: true }).click();
  await expect(page.getByRole('log', { name: 'Private AI conversation' })).toContainText(
    'Example answer',
  );
  await expect(page.getByRole('heading', { name: 'A little room to think.' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Latest answer', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('companion-conversation.png'), fullPage: true });
});
