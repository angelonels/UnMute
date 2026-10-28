import { expect, test } from '@playwright/test';

test('the AI companion moves autonomously and respects system reduced motion', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  const character = page.getByRole('button', { name: 'Say hello to Mumo', exact: true });
  const canvas = character.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
  const firstFrame = await canvas.screenshot();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(firstFrame), { timeout: 7000 })
    .toBe(false);
  await expect(page.getByRole('button', { name: 'Pause companion motion' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Device settings', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Companion animation' })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Close device settings', exact: true }).click();
  await page.screenshot({ path: info.outputPath('companion-reduced-motion.png'), fullPage: true });
});

test('reduced motion keeps a real 3D scene still and conversation replaces the welcome', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/meeting?demo=true');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  const canvas = page
    .getByRole('button', { name: 'Say hello to Mumo', exact: true })
    .locator('canvas');
  await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
  await expect(canvas).toHaveAttribute('data-motion', 'still');
  await page.getByRole('button', { name: 'List action items', exact: true }).click();
  await expect(page.getByRole('log', { name: 'Private conversation with Mumo' })).toContainText(
    'Next steps',
  );
  await expect(page.getByRole('heading', { name: 'What’s on your mind?' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Latest answer', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('companion-conversation.png'), fullPage: true });
});

test('Mumo attends to the composer and follows the response lifecycle', async ({ page }, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  const character = page.locator('[data-companion-activity]');
  await expect(character).toHaveAttribute('data-companion-activity', 'wandering');
  const composer = page.getByRole('textbox', { name: 'Message Mumo', exact: true });
  await composer.focus();
  await expect(character).toHaveAttribute('data-companion-activity', 'attentive');
  await composer.fill('What did we decide?');
  await expect(character).toHaveAttribute('data-companion-activity', 'composing');
  await expect(character.locator('canvas')).toHaveAttribute('data-attention', 'composer');
  await composer.press('Enter');
  await expect(character).toHaveAttribute('data-companion-activity', 'thinking');
  await expect(character).toHaveAttribute('data-companion-activity', 'working');
  await expect(character).toHaveAttribute('data-companion-activity', 'celebrating', {
    timeout: 15000,
  });
  await composer.fill('And the follow-up?');
  await expect(character).toHaveAttribute('data-companion-activity', 'composing');
  await composer.press('Tab');
  await expect(character).not.toHaveAttribute('data-companion-activity', 'composing');
  await page.screenshot({ path: info.outputPath('mumo-contextual-attention.png'), fullPage: true });
});

test('short Mumo panels reveal explicit submissions while preserving passive reading', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What’s on your mind?' })).toBeInViewport({
    ratio: 1,
  });
  const character = page.locator('[data-companion-activity] canvas');
  await expect.poll(() => character.evaluate((el) => el.getBoundingClientRect().height)).toBe(64);
  await page.getByRole('button', { name: 'Summarize the discussion', exact: true }).click();
  const log = page.getByRole('log', { name: 'Private conversation with Mumo' });
  await expect(log).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
  const viewport = log.locator('xpath=../..');
  await viewport.evaluate((el) => {
    el.scrollTop = 0;
  });
  const composer = page.getByRole('textbox', { name: 'Message Mumo', exact: true });
  await composer.fill('What is next?');
  await composer.press('Enter');
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight))
    .toBeLessThan(48);
  await viewport.evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(log).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(page.getByRole('button', { name: 'Latest answer', exact: true })).toBeVisible();
  await page.screenshot({
    path: info.outputPath('mumo-short-passive-reading.png'),
    fullPage: true,
  });
});
