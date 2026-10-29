import { useReducedMotion } from '../hooks/use-reduced-motion';
import { m } from 'motion/react';
import { useTheme } from 'next-themes';
import { useId, useState } from 'react';

/** A single celestial glyph changes silhouette, rather than presenting two tiny choices. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const [pointer, setPointer] = useState(false);
  const id = useId();
  const dark = resolvedTheme === 'dark';
  const animated = pointer && !reduced;
  const transition = { duration: animated ? 0.28 : 0, ease: [0.23, 1, 0.32, 1] as const };
  return (
    <button
      type="button"
      aria-label={dark ? 'Use light mode' : 'Use dark mode'}
      title={dark ? 'Use light mode' : 'Use dark mode'}
      onPointerDown={() => setPointer(true)}
      onKeyDown={() => setPointer(false)}
      onClick={(event) => {
        if (!event.detail) setPointer(false);
        setTheme(dark ? 'light' : 'dark');
      }}
      className="group grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-border/70 bg-surface text-text hover:border-muted/60 hover:bg-surface-muted motion-safe:transition-[background-color,transform] motion-safe:duration-150 motion-safe:active:not-focus-visible:scale-[0.94]"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="overflow-visible"
      >
        <defs>
          <mask id={id}>
            <rect width="32" height="32" fill="white" />
            <m.circle
              cx="24"
              cy="8"
              r="9"
              fill="black"
              initial={false}
              animate={{ transform: dark ? 'translate(0px, 0px)' : 'translate(13px, -13px)' }}
              transition={transition}
            />
          </mask>
        </defs>
        <m.g
          initial={false}
          animate={{ transform: dark ? 'rotate(-20deg)' : 'rotate(0deg)' }}
          style={{ transformOrigin: '16px 16px' }}
          transition={transition}
        >
          <circle
            cx="16"
            cy="16"
            r="8.5"
            fill={dark ? 'currentColor' : 'var(--accent)'}
            stroke="currentColor"
            strokeWidth="1.25"
            mask={`url(#${id})`}
          />
        </m.g>
        <m.g
          initial={false}
          animate={{
            opacity: dark ? 0 : 1,
            transform: dark ? 'rotate(45deg) scale(0.6)' : 'rotate(0deg) scale(1)',
          }}
          style={{ transformOrigin: '16px 16px' }}
          transition={transition}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path key={angle} d="M16 2.5V4" transform={`rotate(${angle} 16 16)`} />
          ))}
        </m.g>
        <m.g
          initial={false}
          animate={{ opacity: dark ? 1 : 0, transform: dark ? 'scale(1)' : 'scale(0.6)' }}
          style={{ transformOrigin: '25px 8px' }}
          transition={transition}
          fill="currentColor"
        >
          <path d="m25 2 .8 2.2L28 5l-2.2.8L25 8l-.8-2.2L22 5l2.2-.8Z" />
          <circle cx="28" cy="12" r="1" />
        </m.g>
      </svg>
    </button>
  );
}
