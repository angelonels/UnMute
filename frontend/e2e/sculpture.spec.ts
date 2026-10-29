import { expect, test } from '@playwright/test';

// Failure cases: raster-only stage, duplicate WebGL contexts, rebuilt sculpture geometry,
// unwanted sculpture pointer motion, unanchored contact during squash, resize quality tiers,
// motion under reduced motion, and blank context-loss fallback.
test('sign-in sculpture shares real depth, lighting and a fixed camera with Mumo', async ({
  page,
}, info) => {
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const scene = page.locator('canvas[data-stage="sculpture"][data-renderer="webgl"]');
  await expect(scene).toBeVisible();
  await expect(page.locator('canvas[data-renderer="webgl"]')).toHaveCount(1);
  expect(Number(await scene.getAttribute('data-sculpture-depth'))).toBeGreaterThan(0.4);
  const vertices = await scene.getAttribute('data-sculpture-vertices');
  await expect(scene).toHaveAttribute('data-support-gap', '0.000');
  await page.getByRole('button', { name: 'Say hello to Mumo', exact: true }).click();
  await expect(scene).toHaveAttribute('data-support-gap', '0.000');
  const box = await scene.boundingBox();
  if (!box) throw new Error('Sculpture bounds unavailable');
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.35);
  await expect(scene).toHaveAttribute('data-sculpture-yaw', '-0.200');
  expect(await scene.getAttribute('data-sculpture-vertices')).toBe(vertices);
  await page.screenshot({ path: info.outputPath('sculpture-pointer-depth.png'), fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(scene).toHaveAttribute('data-motion', 'still');
  await expect(scene).toHaveAttribute('data-sculpture-yaw', '-0.200');
  await page.getByRole('button', { name: 'Use dark mode' }).click();
  await expect(scene).toHaveAttribute('data-lighting', 'night-studio');
  await page.screenshot({ path: info.outputPath('sculpture-dark-studio.png'), fullPage: true });
  await page.getByRole('button', { name: 'Use light mode' }).click();
  await expect(scene).toHaveAttribute('data-lighting', 'day-studio');
  const still = await scene.getAttribute('data-sculpture-yaw');
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.8);
  await expect(scene).toHaveAttribute('data-sculpture-yaw', still ?? '');
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(scene).toHaveAttribute('data-quality-tier', 'compact');
  await expect(scene).toHaveAttribute('data-shadow-size', '512');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(scene).toHaveAttribute('data-quality-tier', 'wide');
  await expect(scene).toHaveAttribute('data-shadow-size', '1024');
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(scene).toHaveAttribute('data-quality-tier', 'compact');
  await page.screenshot({
    path: info.outputPath('sculpture-mobile-real-volume.png'),
    fullPage: true,
  });
  await scene.evaluate((node: HTMLCanvasElement) => {
    const gl = node.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(scene).toBeHidden();
  await expect(page.locator('[data-companion-stage="sculpture"] img')).toBeVisible();
  await page
    .getByRole('button', { name: 'Say hello to Mumo', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole('status').filter({ visible: true })).toContainText('Mumo says hello');
  await page.screenshot({
    path: info.outputPath('sculpture-context-loss-fallback.png'),
    fullPage: true,
  });
});
