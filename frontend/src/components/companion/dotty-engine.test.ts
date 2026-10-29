import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEngine,
  STATE_NAMES,
  SHAPE_NAMES,
  EXPRESSION_NAMES,
  type FrameInput,
  type EngineHandle,
} from './dotty-engine';

// Failure cases before adapting the renderer: invalid shape buffers, broken expression/state
// mapping, motion despite reduced-motion, and callbacks surviving destroyed ownership.
describe('Dotty numeric renderer adapter', () => {
  let handle: EngineHandle | undefined;
  let host: HTMLDivElement;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => {
    handle?.destroy();
    host.remove();
    vi.unstubAllGlobals();
  });
  it('supports every official shape, expression and state with finite numeric frames', () => {
    const frames: FrameInput[] = [];
    handle = createEngine(host, { reducedMotion: true, onFrame: (frame) => frames.push(frame) });
    expect([STATE_NAMES.length, SHAPE_NAMES.length, EXPRESSION_NAMES.length]).toEqual([9, 27, 12]);
    for (const shape of SHAPE_NAMES) handle.update({ shape });
    for (const expression of EXPRESSION_NAMES) handle.update({ expression });
    for (const state of STATE_NAMES) handle.update({ state });
    expect(frames.length).toBeGreaterThan(48);
    for (const frame of frames) {
      expect(frame.radii).toHaveLength(96);
      expect(frame.radii.every((value) => Number.isFinite(value) && value > 0)).toBe(true);
      expect(frame.eyes.every((eye) => Object.values(eye).every(Number.isFinite))).toBe(true);
      expect(frame.parts).toHaveLength(0);
    }
  });
  it('does not poke or animate reduced-motion characters', () => {
    const callback = vi.fn();
    handle = createEngine(host, { reducedMotion: true, onFrame: callback });
    const count = callback.mock.calls.length;
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    handle.poke();
    handle.blink();
    expect(callback).toHaveBeenCalledTimes(count);
    handle.destroy();
    handle = undefined;
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
  it('unregisters an engine if its initial renderer fails', () => {
    expect(() =>
      createEngine(host, {
        reducedMotion: true,
        onFrame: () => {
          throw new Error('Renderer unavailable');
        },
      }),
    ).toThrow('Renderer unavailable');
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
