import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import type { ComponentPropsWithoutRef } from 'react';
import { motionTokens } from './arc/lib/motion-tokens';

/** Keeps Radix focus/escape behaviour while exit presence owns the visual lifetime. */
export function ModalSurface({
  open,
  instant = false,
  children,
  className = '',
  ...props
}: ComponentPropsWithoutRef<typeof Dialog.Content> & { open: boolean; instant?: boolean }) {
  const reduced = useReducedMotion();
  const mode = instant ? 'instant' : reduced ? 'reduced' : 'pointer';
  return (
    <AnimatePresence custom={mode}>
      {open && (
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild forceMount>
            <m.div
              className="fixed inset-0 z-50 bg-black/35"
              initial={{ opacity: instant ? 1 : 0 }}
              animate={{ opacity: 1 }}
              custom={mode}
              variants={{
                out: (input: string) => ({
                  opacity: 0,
                  transition: { duration: input === 'instant' ? 0 : 0.15 },
                }),
              }}
              exit="out"
              transition={{ duration: instant ? 0 : 0.2, ease: [...motionTokens.ease.enter] }}
            />
          </Dialog.Overlay>
          <Dialog.Content {...props} asChild forceMount>
            <m.div
              data-motion={mode}
              className={`fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-1/2 overflow-y-auto overscroll-contain rounded-3xl border border-transparent bg-surface p-6 shadow-floating ${className}`}
              initial={
                instant ? false : { opacity: 0, transform: reduced ? 'none' : 'scale(0.97)' }
              }
              animate={{ opacity: 1, transform: 'none' }}
              custom={mode}
              variants={{
                out: (input: string) => ({
                  opacity: 0,
                  transform: input === 'pointer' ? 'scale(0.97)' : 'none',
                  transition: {
                    duration: input === 'instant' ? 0 : 0.15,
                    ease: [...motionTokens.ease.exit],
                  },
                }),
              }}
              exit="out"
              transition={{
                duration: instant ? 0 : reduced ? 0.15 : 0.2,
                ease: [...motionTokens.ease.enter],
              }}
            >
              {children}
            </m.div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </AnimatePresence>
  );
}
