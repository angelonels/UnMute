'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react';
import {
  AnimatePresence,
  animate,
  m as motion,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import type { PanInfo, Transition } from 'motion/react';
import { X } from 'lucide-react';
import { motionTokens } from '../lib/motion-tokens';

/**
 * The last item a drawer showed. Pass the selected item (or null when nothing is open) and render the drawer's content
 * from the result, so the content stays on screen while the panel slides out instead of vanishing the moment it closes.
 */
const styles = {
  content:
    'fixed z-[51] flex max-h-dvh w-[min(30rem,calc(100vw-1rem))] max-w-screen flex-col overflow-hidden border border-border bg-surface text-text shadow-floating data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:rounded-l-3xl data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:rounded-r-3xl data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:max-h-[min(32rem,100dvh)] data-[side=top]:w-full data-[side=top]:rounded-b-3xl data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:max-h-[min(32rem,100dvh)] data-[side=bottom]:w-full data-[side=bottom]:rounded-t-3xl data-[contained]:absolute data-[contained]:z-20 data-[contained]:max-h-full data-[contained]:w-[min(22rem,calc(100%-2rem))] data-[state=closed]:pointer-events-none!',
  overlay:
    'fixed inset-0 z-50 bg-black/35 backdrop-blur-sm data-[contained]:absolute data-[contained]:z-10 data-[contained]:bg-black/15 data-[contained]:backdrop-blur-none data-[state=closed]:pointer-events-none! motion-reduce:backdrop-blur-none',
  header: 'flex shrink-0 items-start justify-between gap-5 border-b border-border p-5 sm:p-6',
  handle: 'touch-none select-none',
  swap: 'block leading-normal',
  title: 'relative m-0 text-lg leading-normal font-medium tracking-normal',
  description: 'relative mt-2 max-w-lg text-sm leading-normal text-muted',
  close:
    'grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-surface-muted text-muted hover:text-text motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:[&:active:not(:focus-visible)]:scale-[0.96]',
  body: 'min-h-0 overflow-auto overscroll-contain p-5 text-sm leading-normal sm:p-6 [scrollbar-width:thin]',
  keyframes: '',
};

export function useDrawerItem<T>(item: T | null | undefined): T | null | undefined {
  const [last, setLast] = useState(item);
  if (item != null && item !== last) setLast(item);
  return item ?? last;
}

/** Mirrors the open state so the panel can stay mounted while it slides out, retarget mid-flight, and close itself after a drag. */
const DrawerContext = createContext<{
  open: boolean;
  flung: boolean;
  keyboard: boolean;
  setOpen: (open: boolean) => void;
  fling: () => void;
  openedAt: RefObject<number>;
} | null>(null);

export function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [keyboard, setKeyboard] = useState(false);
  // Portals do not share a DOM ancestor with their trigger, so capture modality at the document.
  useEffect(() => {
    const key = () => setKeyboard(true);
    const pointer = () => setKeyboard(false);
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', pointer, true);
    return () => {
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('pointerdown', pointer, true);
    };
  }, []);
  // A drag that dismisses the panel hands its velocity to the exit spring; every other close uses the shorter tween.
  const [flung, setFlung] = useState(false);
  // When the drawer last opened, so a click that reopens it mid-close is not also read as a click outside the leaving panel.
  const openedAt = useRef(0);
  const open = openProp ?? uncontrolled;
  const setOpen = useCallback(
    (next: boolean) => {
      setFlung(false);
      if (next) openedAt.current = performance.now();
      if (openProp === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const fling = useCallback(() => {
    setOpen(false);
    setFlung(true);
  }, [setOpen]);
  const value = useMemo(
    () => ({ open, flung, keyboard, setOpen, fling, openedAt }),
    [open, flung, keyboard, setOpen, fling],
  );
  return (
    <DrawerContext.Provider value={value}>
      <DialogPrimitive.Root {...props} open={open} onOpenChange={setOpen} />
    </DrawerContext.Provider>
  );
}

export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps extends ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Renders the drawer inside this element instead of the page body, anchored to its edges. The element needs position: relative and overflow: hidden. */
  container?: HTMLElement | null;
}

const fade: Transition = { duration: motionTokens.duration.instant };
/* A click or Escape returns the panel quickly; a flick keeps its velocity in a spring of the same length. The shadow fades over the last stretch so it leaves with the panel instead of popping away at unmount. */
const shadowOut: Transition = {
  duration: motionTokens.duration.standard,
  times: [0, 0.65, 1],
  ease: 'linear',
};
const leave: Transition = {
  default: { duration: motionTokens.duration.standard, ease: [...motionTokens.ease.standard] },
  opacity: shadowOut,
};
const flingOut: Transition = {
  default: { ...motionTokens.spring.smooth, visualDuration: motionTokens.duration.standard },
  opacity: shadowOut,
};

/** When the title or description changes while open, the new copy rises in and the old copy leaves upward. */
function SwapText({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const keyboard = useContext(DrawerContext)?.keyboard ?? false;
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={text}
        className={styles.swap}
        initial={
          reduced || keyboard
            ? false
            : { opacity: 0, y: '0.3em', filter: `blur(${motionTokens.blur.soft}px)` }
        }
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={
          reduced || keyboard
            ? { opacity: 0, transition: { duration: 0 } }
            : {
                opacity: 0,
                y: '-0.3em',
                filter: `blur(${motionTokens.blur.subtle}px)`,
                transition: {
                  duration: motionTokens.duration.fast,
                  ease: [...motionTokens.ease.standard],
                },
              }
        }
        transition={{
          duration: keyboard ? 0 : motionTokens.duration.standard,
          ease: [...motionTokens.ease.enter],
        }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}

export function DrawerContent({
  title,
  description,
  children,
  side = 'right',
  container,
  className,
  onInteractOutside,
  ...props
}: DrawerContentProps) {
  const drawer = useContext(DrawerContext);
  const reduced = useReducedMotion();
  const keyboard = drawer?.keyboard ?? false;
  const panelRef = useRef<HTMLDivElement>(null);
  const offset = useMotionValue<number | string>(0);
  const pan = useRef<number | null>(null);
  const axis = side === 'left' || side === 'right' ? 'x' : 'y';
  const sign = side === 'right' || side === 'bottom' ? 1 : -1;
  const offscreen = { [axis]: `${sign * 100}%` };
  const classes = [styles.content, className].filter(Boolean).join(' ');
  const draggable = drawer !== null && !reduced;

  const panelSize = () =>
    (axis === 'x' ? panelRef.current?.offsetWidth : panelRef.current?.offsetHeight) ?? 480;

  // The header is the grab handle. It follows the pointer toward the edge and rubber-bands the other way.
  function panStart(event: PointerEvent) {
    const target = event.target instanceof Element ? event.target : null;
    if (!draggable || target?.closest("button, a, input, select, textarea, [role='button']"))
      return;
    // The entrance animates in percent of the panel, so a grab mid-flight converts it to pixels.
    const value = offset.get();
    pan.current = typeof value === 'number' ? value : (parseFloat(value) / 100) * panelSize();
    offset.stop();
  }
  function panMove(_: PointerEvent, info: PanInfo) {
    if (pan.current === null) return;
    const toward = (pan.current + info.offset[axis]) * sign;
    offset.set(sign * (toward >= 0 ? toward : -Math.sqrt(-toward)));
  }
  // Past a third of the panel, or on a quick flick toward the edge, the drawer closes and keeps its velocity; otherwise it springs back.
  function panEnd(_: PointerEvent, info: PanInfo) {
    if (pan.current === null) return;
    pan.current = null;
    const toward = Number(offset.get()) * sign;
    if (toward > panelSize() / 3 || (toward > 0 && info.velocity[axis] * sign > 500))
      drawer?.fling();
    else animate(offset, 0, motionTokens.spring.snappy);
  }

  const inner = (
    <>
      <motion.div
        className={[styles.header, draggable ? styles.handle : ''].filter(Boolean).join(' ')}
        onPanStart={panStart}
        onPan={panMove}
        onPanEnd={panEnd}
      >
        <div>
          <DialogPrimitive.Title className={styles.title}>
            <SwapText text={title} />
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className={styles.description}>
              <SwapText text={description} />
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <DialogPrimitive.Close className={styles.close} aria-label="Close drawer">
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </DialogPrimitive.Close>
      </motion.div>
      <div className={styles.body}>{children}</div>
    </>
  );

  // Under a bare Radix root the open state is unknown here, so CSS keyframes keyed off data-state animate the layers instead.
  if (drawer === null) {
    return (
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay
          className={`${styles.overlay} ${styles.keyframes}`}
          data-contained={container ? '' : undefined}
        />
        <DialogPrimitive.Content
          {...props}
          onInteractOutside={onInteractOutside}
          data-side={side}
          data-contained={container ? '' : undefined}
          className={`${classes} ${styles.keyframes}`}
        >
          {inner}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }

  // The panel springs fully opaque from its own edge and returns to it faster than it arrived, from wherever it is.
  return (
    <AnimatePresence custom={{ flung: drawer.flung, keyboard }}>
      {drawer.open && (
        <DialogPrimitive.Portal key="drawer" forceMount container={container}>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className={styles.overlay}
              data-contained={container ? '' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              variants={{
                exit: ({ keyboard: instant }: { keyboard: boolean }) => ({
                  opacity: 0,
                  transition: instant
                    ? { duration: 0 }
                    : reduced
                      ? fade
                      : {
                          duration: motionTokens.duration.fast,
                          ease: [...motionTokens.ease.standard],
                        },
                }),
              }}
              exit="exit"
              transition={
                keyboard
                  ? { duration: 0 }
                  : reduced
                    ? fade
                    : {
                        duration: motionTokens.duration.standard,
                        ease: [...motionTokens.ease.enter],
                      }
              }
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content
            {...props}
            asChild
            forceMount
            // Radix reads a click outside on click, so the press that reopens a closing drawer would dismiss it again.
            onInteractOutside={(event) => {
              onInteractOutside?.(event);
              if (event.detail.originalEvent.timeStamp < drawer.openedAt.current)
                event.preventDefault();
            }}
          >
            <motion.div
              ref={panelRef}
              className={classes}
              data-side={side}
              data-contained={container ? '' : undefined}
              style={{ [axis]: offset }}
              variants={{
                exit: ({ flung, keyboard: instant }: { flung: boolean; keyboard: boolean }) =>
                  instant
                    ? { opacity: 0, transition: { duration: 0 } }
                    : reduced
                      ? { opacity: 0, transition: fade }
                      : { ...offscreen, opacity: [1, 1, 0], transition: flung ? flingOut : leave },
              }}
              initial={keyboard ? false : reduced ? { opacity: 0 } : { ...offscreen, opacity: 1 }}
              animate={{ [axis]: 0, opacity: 1 }}
              exit="exit"
              transition={keyboard ? { duration: 0 } : reduced ? fade : motionTokens.spring.smooth}
            >
              {inner}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
