import { useEffect, useRef } from 'react';
import { useFrameSource } from '../../../hooks/use-frame-source';
import { useVisibility } from '../../../hooks/use-visibility';
import { useReducedMotion } from '../../../hooks/use-reduced-motion';
import { createFrameTask, type FrameTask } from '../../../lib/audio/frame-loop';
import type { AudioVisualSource } from '../../media';
import { voiceContour } from './voice-contour';

/** Audiocn's spectrum-driven attack/release, drawn as one closed contour outside the avatar. */
export function AvatarVoiceContour({ source }: { source: AudioVisualSource }) {
  const host = useRef<SVGSVGElement>(null);
  const line = useRef<SVGPathElement>(null);
  const halo = useRef<SVGPathElement>(null);
  const incoming = useRef<number[]>([0, 0, 0, 0]);
  const task = useRef<FrameTask | null>(null);
  const reduced = useReducedMotion();
  const visible = useVisibility(host, (shown) => {
    if (shown) task.current?.wake();
  });
  useFrameSource(source, (frame) => {
    const bands = incoming.current;
    bands.fill(0);
    for (let i = 0; i < frame.bands.length; i++) {
      const group = Math.min(3, Math.floor((i * 4) / frame.bands.length));
      const value = frame.bands[i]!;
      if (Number.isFinite(value))
        bands[group] = Math.max(bands[group]!, Math.min(1, Math.max(0, value)));
    }
    if (
      visible.current &&
      (bands.some((value) => value > 0) || host.current?.hasAttribute('data-active'))
    )
      task.current?.wake();
  });
  useEffect(() => {
    const levels = [0, 0, 0, 0];
    let previous = 0;
    let phase = 0;
    const painter = createFrameTask((now) => {
      if (!visible.current) {
        previous = 0;
        return false;
      }
      const elapsed = previous ? Math.min(100, now - previous) : 33;
      if (previous && elapsed < (reduced ? 250 : 32)) return true;
      previous = now;
      for (let i = 0; i < levels.length; i++) {
        const target = incoming.current[i]!;
        levels[i] =
          levels[i]! +
          (target - levels[i]!) * (1 - Math.exp(-elapsed / (target > levels[i]! ? 45 : 70)));
        if (levels[i]! < 0.01 && target === 0) levels[i] = 0;
      }
      const energy = Math.max(...levels);
      if (!reduced) phase += (elapsed / 1000) * energy;
      const shape = voiceContour(levels, reduced ? 0 : phase);
      line.current?.setAttribute('d', shape.path);
      halo.current?.setAttribute('d', shape.path);
      host.current?.setAttribute('opacity', String(Math.min(1, energy * 3)));
      host.current?.toggleAttribute('data-active', energy > 0.01);
      return energy > 0 || incoming.current.some((value) => value > 0);
    });
    task.current = painter;
    return () => {
      painter.stop();
      task.current = null;
    };
  }, [reduced, visible]);
  return (
    <svg
      ref={host}
      data-slot="avatar-voice-contour"
      aria-hidden="true"
      viewBox="0 0 160 160"
      fill="none"
      opacity="0"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <path
        ref={halo}
        stroke="currentColor"
        strokeWidth="7"
        strokeOpacity="0.06"
        fill="currentColor"
        fillOpacity="0.025"
      />
      <path ref={line} stroke="currentColor" strokeWidth="1.35" strokeOpacity="0.8" />
    </svg>
  );
}
