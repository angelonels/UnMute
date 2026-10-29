import { expect, test } from '@playwright/test';

// Failure cases: an inert seated character, long back-facing spins, autonomous
// expression overriding a greeting, loss of seat contact, and motion under reduction.
test('seated Mumo is playful and expressive while the sculpture stays still', async ({
  page,
}, info) => {
  await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const scene = page.locator('canvas[data-stage="sculpture"][data-renderer="webgl"]');
  await expect(scene).toBeVisible();
  const first = await scene.screenshot();
  const observed = new Set<string>();
  await expect
    .poll(
      async () => {
        const pose = await scene.evaluate((node) => ({
          personality: node.getAttribute('data-personality'),
          yaw: Number(node.getAttribute('data-mumo-yaw')),
          support: Number(node.getAttribute('data-support-gap')),
          sculpture: node.getAttribute('data-sculpture-yaw'),
        }));
        if (pose.personality) observed.add(pose.personality);
        expect(Math.abs(pose.yaw)).toBeLessThan(0.8);
        expect(pose.support).toBe(0);
        expect(pose.sculpture).toBe('-0.200');
        return observed.has('delighted') && observed.has('surprised');
      },
      { timeout: 15000, intervals: [150] },
    )
    .toBe(true);
  expect((await scene.screenshot()).equals(first)).toBe(false);
  await page.getByRole('button', { name: 'Say hello to Mumo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Mumo says hello');
  await page.screenshot({ path: info.outputPath('mumo-playful-greeting.png'), fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(scene).toHaveAttribute('data-motion', 'still');
  await expect(scene).toHaveAttribute('data-personality', 'resting');
  const still = await scene.screenshot();
  await page.evaluate(async () => {
    for (let frame = 0; frame < 20; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  });
  expect((await scene.screenshot()).equals(still)).toBe(true);
  await info.attach('mumo-personality.json', {
    body: JSON.stringify(
      { observed: [...observed], sculptureFixed: true, seatGap: 0, reducedMotion: 'still' },
      null,
      2,
    ),
    contentType: 'application/json',
  });
});
