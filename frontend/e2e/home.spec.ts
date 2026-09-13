import { expect, test } from '@playwright/test';

test('home page renders with a healthy API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'UnMute' })).toBeVisible();
  await expect(page.getByText('API healthy')).toBeVisible();
});
