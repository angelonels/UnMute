'use client';

import { useReducedMotion } from '../../../hooks/use-reduced-motion';

import {
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref, RefObject } from 'react';
import { AnimatePresence, animate, m as motion, useIsPresent, useMotionValue } from 'motion/react';
import type { TargetAndTransition } from 'motion/react';
import { motionTokens } from '../lib/motion-tokens';

const styles = {
  button:
    'relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-4 text-sm font-medium leading-normal whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
  primary: 'border-text bg-text text-surface',
  secondary: 'border-border bg-surface text-text hover:enabled:bg-surface-muted',
  ghost: 'bg-transparent text-muted hover:enabled:bg-surface-muted hover:enabled:text-text',
  danger:
    'border-border bg-surface text-error hover:enabled:border-error hover:enabled:bg-error/10',
  sm: 'min-h-11 px-3',
  md: 'min-h-11',
  lg: 'min-h-12 px-5',
  labelPhase: 'inline-flex items-center justify-center gap-2 whitespace-nowrap [&_svg]:shrink-0',
  loader: 'absolute top-1/2 left-1/2 -mt-2 -ml-2 grid size-4',
  spinner:
    'rounded-full border-[1.5px] border-current border-r-transparent motion-safe:animate-spin',
  labelSlot: 'relative inline-flex min-w-0 items-center justify-center',
  loadingLabel: 'opacity-0',
  labelContent: 'inline-flex flex-none items-center',
};

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart'
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const rest: TargetAndTransition = { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' };
/** Text rises about .3em out of a soft blur; the outgoing label lifts away a little faster. */
const textIn: TargetAndTransition = {
  opacity: 0,
  y: 4,
  filter: `blur(${motionTokens.blur.soft}px)`,
};
const textOut: TargetAndTransition = {
  opacity: 0,
  y: -3,
  filter: `blur(${motionTokens.blur.soft}px)`,
  transition: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.standard] },
};
const iconIn: TargetAndTransition = {
  opacity: 0,
  scale: 0.95,
  filter: `blur(${motionTokens.blur.subtle}px)`,
};
const iconOut: TargetAndTransition = {
  opacity: 0,
  scale: 0.95,
  filter: `blur(${motionTokens.blur.subtle}px)`,
  transition: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.standard] },
};
const fadeIn: TargetAndTransition = { ...rest, opacity: 0 };
const fadeOut: TargetAndTransition = {
  opacity: 0,
  transition: { duration: motionTokens.duration.instant },
};
/** Scale rides the spring; opacity and blur tween so blur never overshoots below zero. */
const iconEnter = {
  ...motionTokens.spring.snappy,
  opacity: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.enter] },
  filter: { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.enter] },
} as const;

/** A key for the label content: text plus element names, so a new label or icon crossfades while prop-only updates stay in place. */
function labelKey(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint')
    return String(node);
  if (Array.isArray(node)) return node.map(labelKey).join('');
  if (!isValidElement(node)) return '';
  const type = node.type as string | { displayName?: string; name?: string };
  return `<${typeof type === 'string' ? type : (type?.displayName ?? type?.name ?? '')}>${labelKey((node.props as { children?: ReactNode }).children)}`;
}

/** Springs the slot to the natural width of the incoming label when it changes, so a new label never snaps the button's size.
 *  The outgoing label is popped out of flow at once, so it never holds the old width. Other resizes (a late web font, a parent reflow) jump straight to the new width, so nothing wobbles on first paint. */
function useMorphWidth(content: RefObject<HTMLElement | null>, key: string, reduced: boolean) {
  const width = useMotionValue<number | 'auto'>('auto');
  const lastKey = useRef(key),
    armedUntil = useRef(0);
  useLayoutEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    armedUntil.current = performance.now() + 700;
  }, [key]);
  useEffect(() => {
    const node = content.current,
      slot = node?.parentElement;
    if (!node || !slot || typeof ResizeObserver === 'undefined') return;
    let measured = false;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = entry.contentRect.width;
      if (!next || !measured || reduced || performance.now() > armedUntil.current) {
        measured = next > 0;
        width.jump(next || 'auto');
        delete slot.dataset.morphing;
        return;
      }
      width.stop();
      slot.dataset.morphing = '';
      animate(width, next, {
        ...motionTokens.spring.morph,
        onComplete: () => {
          delete slot.dataset.morphing;
        },
      });
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      width.stop();
      delete slot.dataset.morphing;
    };
  }, [content, reduced, width]);
  return width;
}

function LabelPhase({
  children,
  icon,
  reduced,
  ref,
}: {
  children: ReactNode;
  icon: boolean;
  reduced: boolean;
  ref?: Ref<HTMLSpanElement>;
}) {
  const present = useIsPresent();
  return (
    <motion.span
      ref={ref}
      className={styles.labelPhase}
      aria-hidden={present ? undefined : true}
      initial={reduced ? fadeIn : icon ? iconIn : textIn}
      animate={rest}
      exit={reduced ? fadeOut : icon ? iconOut : textOut}
      transition={
        reduced
          ? { duration: motionTokens.duration.instant }
          : icon
            ? iconEnter
            : { duration: motionTokens.duration.standard, ease: [...motionTokens.ease.enter] }
      }
    >
      {children}
    </motion.span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    onClick,
    onKeyDownCapture,
    onPointerDownCapture,
    ...props
  },
  ref,
) {
  const reduceMotion = useReducedMotion() ?? false;
  const [keyboard, setKeyboard] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const key = labelKey(children);
  const width = useMorphWidth(contentRef, key, reduceMotion || keyboard);
  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  // A trigger that anchors a menu, popover, or dialog keeps its rect still while pressed, so the layer never measures a scaled anchor.
  // Radix triggers (asChild) pass aria-haspopup or data-state through; the stylesheet repeats the guard.
  const classes = buttonClasses(props, { disabled, loading, keyboard, variant, size, className });

  return (
    <motion.button
      type="button"
      ref={setRefs}
      tabIndex={props.tabIndex ?? 0}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...props}
      onKeyDownCapture={(event) => {
        setKeyboard(true);
        onKeyDownCapture?.(event);
      }}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event);
      }}
      // Loading keeps the button focusable (a disabled button would drop keyboard focus mid-action) and swallows presses instead.
      aria-disabled={loading || props['aria-disabled'] || undefined}
      onClick={(event) => {
        if (loading || props['aria-disabled'] === true || props['aria-disabled'] === 'true') {
          event.preventDefault();
          return;
        }
        // Keep the pointer-down target mounted until its click has been dispatched.
        if (event.detail > 0) setKeyboard(false);
        onClick?.(event);
      }}
    >
      <ButtonLoader loading={loading} instant={keyboard || reduceMotion} />
      <motion.span
        className={[styles.labelSlot, loading ? styles.loadingLabel : ''].filter(Boolean).join(' ')}
        style={{ width: keyboard ? 'auto' : width }}
      >
        <span ref={contentRef} className={styles.labelContent}>
          {keyboard ? (
            <span className={styles.labelPhase}>{children}</span>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <LabelPhase
                key={key}
                icon={!/\S/.test(key.replace(/<[^>]*>/g, ''))}
                reduced={reduceMotion}
              >
                {children}
              </LabelPhase>
            </AnimatePresence>
          )}
        </span>
      </motion.span>
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;

function buttonClasses(
  props: ButtonProps,
  {
    disabled,
    loading,
    keyboard,
    variant,
    size,
    className,
  }: {
    disabled?: boolean;
    loading: boolean;
    keyboard: boolean;
    variant: ButtonVariant;
    size: ButtonSize;
    className?: string;
  },
) {
  const popup = props['aria-haspopup'];
  const anchorsLayer =
    (popup !== undefined && popup !== false && popup !== 'false') ||
    props.role === 'combobox' ||
    (props as Record<string, unknown>)['data-state'] !== undefined;
  const inert =
    disabled || loading || props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    !anchorsLayer && !inert && !keyboard
      ? 'motion-safe:[&:active:not(:focus-visible)]:scale-[0.96]'
      : '',
    keyboard ? 'transition-none!' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return classes;
}
function ButtonLoader({ loading, instant }: { loading: boolean; instant: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {loading && (
        <motion.span
          key="loader"
          className={styles.loader}
          aria-hidden="true"
          initial={instant ? false : { opacity: 0, transform: 'scale(0.95)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          exit={
            instant
              ? { opacity: 0, transition: { duration: 0 } }
              : { ...iconOut, transform: 'scale(0.95)' }
          }
          transition={instant ? { duration: 0 } : iconEnter}
        >
          <span className={styles.spinner} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}
