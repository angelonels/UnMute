import { useReducedMotion } from '../hooks/use-reduced-motion';
import { HalfMoon as Moon, SunLight as Sun } from 'iconoir-react';
import { m } from 'motion/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const [pointer, setPointer] = useState(false);
  const dark = resolvedTheme === 'dark';
  const animated = pointer && !reduced;
  const transition = animated
    ? { type: 'spring' as const, stiffness: 460, damping: 30, mass: 0.7 }
    : { duration: 0 };
  return (
    <button
      type="button"
      className="group relative flex h-11 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full"
      aria-label={dark ? 'Use light mode' : 'Use dark mode'}
      title={dark ? 'Use light mode' : 'Use dark mode'}
      onPointerDown={() => setPointer(true)}
      onKeyDown={() => setPointer(false)}
      onClick={(event) => {
        if (event.detail === 0) setPointer(false);
        setTheme(dark ? 'light' : 'dark');
      }}
    >
      <span className="relative grid h-8 w-14 grid-cols-2 items-center rounded-full px-[3px] border border-border/65 bg-surface-muted text-muted group-hover:border-muted/45">
        <m.span
          aria-hidden="true"
          initial={false}
          animate={{ x: dark ? 24 : 0 }}
          transition={transition}
          className="absolute top-[3px] left-[3px] size-6 rounded-full border border-border/45 bg-surface shadow-sm"
        />
        <m.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: dark ? -60 : 0, scale: dark ? 0.85 : 1, opacity: dark ? 0.55 : 1 }}
          transition={transition}
          className={`relative grid place-items-center ${dark ? 'text-muted' : 'text-text'}`}
        >
          <Sun width={14} height={14} strokeWidth={1.5} aria-hidden="true" />
        </m.span>
        <m.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: dark ? 0 : 30, scale: dark ? 1 : 0.85, opacity: dark ? 1 : 0.55 }}
          transition={transition}
          className={`relative grid place-items-center ${dark ? 'text-text' : 'text-muted'}`}
        >
          <Moon width={14} height={14} strokeWidth={1.5} aria-hidden="true" />
        </m.span>
      </span>
    </button>
  );
}
