import { expect, test } from '@playwright/test';

test('keyboard settings and chat respond without movement and return focus', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  const settings = page.getByRole('button', { name: 'Device settings', exact: true });
  await settings.focus();
  await settings.press('Enter');
  const modal = page.getByRole('dialog', { name: 'Device settings', exact: true });
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAttribute('data-motion', 'instant');
  await modal.press('Escape');
  await expect(settings).toBeFocused();
  await page.getByRole('button', { name: 'Open meeting chat', exact: true }).press('Enter');
  const composer = page.getByRole('textbox', { name: 'Message everyone' });
  await composer.fill('An immediate keyboard message');
  await composer.press('Enter');
  const message = page
    .getByRole('log', { name: 'Meeting messages' })
    .getByText('An immediate keyboard message', { exact: true });
  await expect(message).toBeVisible();
  await expect(message.locator('xpath=ancestor::li[1]')).toHaveAttribute(
    'data-message-motion',
    'instant',
  );
  await page.screenshot({ path: info.outputPath('keyboard-chat.png'), fullPage: true });
});

test('pointer modal can close during entrance and reduced motion removes scaling', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  const settings = page.getByRole('button', { name: 'Device settings', exact: true });
  await settings.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Device settings', exact: true })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settings.click();
  const modal = page.getByRole('dialog', { name: 'Device settings', exact: true });
  await expect(modal).toHaveAttribute('data-motion', 'reduced');
  await expect(modal).toHaveCSS('transform', 'none');
  await page.screenshot({ path: info.outputPath('reduced-settings.png'), fullPage: true });
});
