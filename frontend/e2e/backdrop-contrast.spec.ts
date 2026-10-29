import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

// Failures: theme-token checks miss image pixels; portrait cover crops move brighter pixels
// behind copy; element boxes include blank space rather than the actual text runs.
for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`login text retains contrast against its actual backdrop in ${theme} at ${viewport.width}px`, async ({
      page,
    }, info) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.route('**/api/auth/get-session**', (route) => route.fulfill({ json: null }));
      await page.goto('/');
      await expect(
        page.getByRole('button', { name: 'Continue with Google', exact: true }),
      ).toBeEnabled();
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      const measurements = await page.evaluate(async () => {
        const heading = document.getElementById('signin-heading');
        if (!heading) throw new Error('Missing sign-in heading');
        const root = heading.closest('main')?.parentElement;
        const backdrop = root?.querySelector<HTMLElement>(":scope > div[aria-hidden='true']");
        if (!root || !backdrop) throw new Error('Missing auth root or studio backdrop');
        const base = getComputedStyle(root).backgroundColor;
        const style = getComputedStyle(backdrop);
        const bounds = root.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(bounds.width);
        canvas.height = Math.ceil(bounds.height);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas unavailable');
        context.fillStyle = base;
        context.fillRect(0, 0, canvas.width, canvas.height);
        const source = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
        const visible = style.display !== 'none' && style.visibility !== 'hidden';
        let imageSize: { width: number; height: number } | null = null;
        if (visible) {
          if (!source || style.backgroundSize !== 'cover' || style.backgroundPosition !== '50% 50%')
            throw new Error(
              `Unsupported backdrop configuration: ${style.backgroundImage} / ${style.backgroundSize} / ${style.backgroundPosition}`,
            );
          const image = new Image();
          image.src = source;
          await image.decode();
          imageSize = { width: image.naturalWidth, height: image.naturalHeight };
          const rect = backdrop.getBoundingClientRect();
          const scale = Math.max(
            rect.width / image.naturalWidth,
            rect.height / image.naturalHeight,
          );
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          context.globalAlpha = Number(style.opacity);
          context.drawImage(
            image,
            rect.left - bounds.left + (rect.width - width) / 2,
            rect.top - bounds.top + (rect.height - height) / 2,
            width,
            height,
          );
          context.globalAlpha = 1;
        }
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = colorCanvas.height = 1;
        const colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });
        if (!colorContext) throw new Error('Color canvas unavailable');
        const luminance = (rgb: number[]) => {
          const linear = rgb.slice(0, 3).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
        };
        const targets = [
          { name: 'heading', node: heading, threshold: 3 },
          { name: 'subtitle', node: heading.nextElementSibling, threshold: 4.5 },
          {
            name: 'playground link',
            node: root.querySelector('a[href*="demo=true"]'),
            threshold: 4.5,
          },
          { name: 'copyright', node: root.querySelector('footer'), threshold: 4.5 },
        ];
        const copy = targets.map(({ name, node, threshold }) => {
          if (!(node instanceof HTMLElement)) throw new Error(`Missing ${name}`);
          const textStyle = getComputedStyle(node);
          colorContext.clearRect(0, 0, 1, 1);
          colorContext.fillStyle = textStyle.color;
          colorContext.fillRect(0, 0, 1, 1);
          const foreground = [...colorContext.getImageData(0, 0, 1, 1).data];
          if (foreground[3] !== 255 || Number(textStyle.opacity) !== 1)
            throw new Error(`Unsupported translucent foreground: ${name}`);
          const foregroundLuminance = luminance(foreground);
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          const samples: { x: number; y: number; rgb: number[]; ratio: number }[] = [];
          while (walker.nextNode()) {
            const text = walker.currentNode;
            if (!text.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(text);
            for (const rect of range.getClientRects()) {
              if (!rect.width || !rect.height) continue;
              for (const row of [0.2, 0.5, 0.8]) {
                for (const column of [0.2, 0.5, 0.8]) {
                  const x = rect.left + rect.width * column;
                  const y = rect.top + rect.height * row;
                  const rgb = [
                    ...context.getImageData(
                      Math.max(0, Math.min(canvas.width - 1, Math.floor(x - bounds.left))),
                      Math.max(0, Math.min(canvas.height - 1, Math.floor(y - bounds.top))),
                      1,
                      1,
                    ).data,
                  ].slice(0, 3);
                  const backgroundLuminance = luminance(rgb);
                  const ratio =
                    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
                    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
                  samples.push({ x, y, rgb, ratio });
                }
              }
            }
          }
          if (!samples.length) throw new Error(`No visible text samples for ${name}`);
          return {
            name,
            threshold,
            foreground,
            fontSize: textStyle.fontSize,
            minimum: Math.min(...samples.map((sample) => sample.ratio)),
            samples,
          };
        });
        return {
          backdrop: {
            source,
            visible,
            base,
            imageSize,
            bounds: { width: bounds.width, height: bounds.height },
          },
          copy,
        };
      });
      const report = info.outputPath('backdrop-contrast.json');
      await writeFile(report, JSON.stringify({ theme, viewport, ...measurements }, null, 2));
      await info.attach('backdrop-contrast.json', {
        path: report,
        contentType: 'application/json',
      });
      await page.screenshot({
        path: info.outputPath(`backdrop-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
      for (const target of measurements.copy) {
        expect(
          target.minimum,
          `${target.name} in ${theme} at ${viewport.width}px: ${JSON.stringify(target.samples.reduce((worst, sample) => (sample.ratio < worst.ratio ? sample : worst)))}`,
        ).toBeGreaterThanOrEqual(target.threshold);
      }
    });
  }
}
