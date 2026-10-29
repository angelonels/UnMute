import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1618, height: 948 },
  ]) {
    test(`meeting stays usable at ${viewport.width}px in ${theme}`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.goto('/meeting?demo=true&microphone=false&camera=false&data=worst');
      const leave = page.getByRole('button', { name: 'Leave meeting preview', exact: true });
      await expect(leave).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole('button', { name: 'Hide demo data selector', exact: true }).click();
      await page.getByRole('button', { name: 'Open Mumo', exact: true }).click();
      const panel = page.getByRole('dialog', { name: 'Mumo', exact: true });
      await expect(panel).toHaveCSS('overscroll-behavior-y', 'contain');
      await expect(page.getByRole('textbox', { name: 'Message Mumo', exact: true })).toBeInViewport(
        { ratio: 1 },
      );
      await page.screenshot({
        path: info.outputPath(`mumo-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
      await panel.press('Escape');
      await expect(panel).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Open Mumo', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Open participants', exact: true }).click();
      await page
        .getByRole('searchbox', { name: 'Find a participant', exact: true })
        .fill('no participant matches');
      await expect(page.getByText('No matching participants.', { exact: true })).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`people-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
    });
  }
}

test('pointer-open panels exit instantly with Escape and retain scroll containment', async ({
  page,
}, info) => {
  await page.goto('/meeting?demo=true&microphone=false&camera=false');
  await page.getByRole('button', { name: 'Open meeting chat', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Meeting chat', exact: true });
  await expect(panel).toHaveAttribute('data-motion', 'pointer');
  await panel.press('Escape');
  await expect(panel).toHaveCount(0);
  await page.getByRole('button', { name: 'Open meeting chat', exact: true }).press('Enter');
  await expect(panel).toHaveAttribute('data-motion', 'instant');
  await expect(panel).toHaveCSS('overscroll-behavior-y', 'contain');
  await page.screenshot({ path: info.outputPath('keyboard-panel.png'), fullPage: true });
});
