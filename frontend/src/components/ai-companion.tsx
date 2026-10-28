import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useCompanionMotion } from './companion/motion-preference';
import type { CompanionEmotion, CompanionOptions, CompanionScene } from './companion/scene';
import { m, type Variants } from 'motion/react';

// An original UnMute silhouette: a weighted pebble with a folded upper contour.
const silhouette =
  'M31 16C24 19 18 27 15 36C11 49 14 65 23 75C32 85 48 88 62 84C80 79 89 64 87 47C85 31 75 20 61 17C52 15 46 17 40 22C37 24 33 23 34 19C35 16 34 15 31 16Z';
const body: Variants = {
  rest: { transform: 'translateY(0px) rotate(0deg)' },
  greet: {
    transform: [
      'translateY(0px) rotate(0deg)',
      'translateY(-1.5px) rotate(-3deg)',
      'translateY(0px) rotate(0deg)',
    ],
    transition: { duration: 0.36, times: [0, 0.4, 1], ease: [0.23, 1, 0.32, 1] },
  },
};
const eyes: Variants = {
  rest: { transform: 'translateX(0px) scaleY(1)' },
  greet: {
    transform: [
      'translateX(0px) scaleY(1)',
      'translateX(1px) scaleY(1)',
      'translateX(1px) scaleY(0.12)',
      'translateX(0px) scaleY(1)',
    ],
    transition: { duration: 0.36, times: [0, 0.45, 0.62, 1], ease: [0.23, 1, 0.32, 1] },
  },
};

/** A visual acknowledgment, never an indication that AI is listening or processing. */
function CompanionMark({
  size = 24,
  active = false,
  label,
  className = '',
}: {
  size?: number;
  active?: boolean;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  const detailed = size >= 48;
  const expression = active && !reduced ? 'greet' : 'rest';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <defs>
        <linearGradient
          id={`${id}-shell`}
          x1="28"
          y1="17"
          x2="71"
          y2="85"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--companion-light)" />
          <stop offset="0.56" stopColor="var(--companion-body)" />
          <stop offset="1" stopColor="var(--companion-shade)" />
        </linearGradient>
        <linearGradient
          id={`${id}-edge`}
          x1="26"
          y1="17"
          x2="70"
          y2="82"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--companion-edge)" stopOpacity="0.6" />
          <stop offset="0.7" stopColor="var(--companion-edge)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {detailed && <ellipse cx="51" cy="91" rx="25" ry="2.4" className="fill-text/8" />}
      <m.g
        initial={false}
        animate={expression}
        variants={body}
        style={{ transformOrigin: '50px 82px' }}
      >
        <path d={silhouette} fill={detailed ? `url(#${id}-shell)` : 'var(--companion-body)'} />
        {detailed && (
          <>
            <path d={silhouette} fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.1" />
            <path
              d="M32 18C29 24 35 28 41 24"
              fill="none"
              stroke="var(--companion-fold)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M33 42C43 35 62 36 70 44C74 49 72 59 65 64C56 70 40 69 33 61C28 56 28 47 33 42Z"
              fill="var(--companion-face)"
              opacity="0.045"
            />
          </>
        )}
        <m.g variants={eyes} style={{ transformOrigin: '51px 51px' }} fill="var(--companion-face)">
          <rect x="41" y="46" width={detailed ? 5.5 : 7} height="10" rx="3.5" />
          <rect x="56" y="45" width={detailed ? 5.5 : 7} height="10" rx="3.5" />
        </m.g>
        {detailed && (
          <path
            d="M47 65C50 66.8 53 66.5 55.5 64.5"
            fill="none"
            stroke="var(--companion-face)"
            strokeOpacity="0.4"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        )}
      </m.g>
    </svg>
  );
}

interface CompanionProps {
  size?: number;
  active?: boolean;
  label?: string;
  className?: string;
  finish?: 'auto' | 'ceramic' | 'graphite';
  emotion?: CompanionEmotion;
  dimensional?: boolean;
}

/** Compact marks share the silhouette; larger instances are live, full-volume WebGL characters. */
export function AICompanion(props: CompanionProps) {
  return props.dimensional || (props.size ?? 24) >= 48 ? (
    <Companion3D {...props} />
  ) : (
    <CompanionMark {...props} />
  );
}

function Companion3D({
  size = 88,
  active = false,
  label,
  className = '',
  finish = 'auto',
  emotion = 'auto',
}: CompanionProps) {
  const { resolvedTheme } = useTheme();
  const reduced = !!useReducedMotion();
  const [motionEnabled] = useCompanionMotion();
  const paused = !motionEnabled;
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<CompanionScene | null>(null);
  const visible = useRef(false);
  const options = useRef<CompanionOptions>({
    ceramic: finish === 'ceramic',
    reduced: true,
    paused: false,
    visible: false,
    active: false,
    emotion: 'auto',
  });
  const ceramic = finish === 'ceramic' || (finish === 'auto' && resolvedTheme === 'dark');
  useEffect(() => {
    options.current = { ceramic, reduced, paused, visible: visible.current, active, emotion };
    scene.current?.update(options.current);
  }, [ceramic, reduced, paused, active, emotion]);
  useEffect(() => {
    const node = host.current;
    const surface = canvas.current;
    if (!node || !surface || typeof IntersectionObserver === 'undefined') return;
    // Effects can be restarted by Strict Mode and hot updates on the same canvas.
    setStatus('loading');
    visible.current = false;
    let alive = true;
    let requested = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = !!entry?.isIntersecting;
      scene.current?.update({ ...options.current, visible: visible.current });
      if (!visible.current || requested) return;
      requested = true;
      void import('./companion/scene')
        .then(({ createCompanionScene }) => {
          if (!alive) return;
          scene.current = createCompanionScene(
            surface,
            { ...options.current, visible: visible.current },
            () => {
              if (alive) setStatus('unavailable');
            },
          );
          setStatus('ready');
        })
        .catch(() => {
          if (alive) setStatus('unavailable');
        });
    });
    observer.observe(node);
    return () => {
      alive = false;
      observer.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    if (status === 'unavailable') {
      scene.current?.dispose();
      scene.current = null;
    }
  }, [status]);
  return (
    <span
      ref={host}
      className={`group/companion relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: size, height: size }}
    >
      <span role={label ? 'img' : undefined} aria-label={label} className="absolute inset-0">
        <canvas
          ref={canvas}
          aria-hidden="true"
          className={`absolute inset-0 size-full transition-opacity duration-200 motion-reduce:transition-none ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        />
        {status !== 'ready' && <CompanionMark size={size} active={false} />}
      </span>
      {status === 'unavailable' && label && (
        <span className="sr-only">3D rendering is unavailable in this browser.</span>
      )}
    </span>
  );
}
