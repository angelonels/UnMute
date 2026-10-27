import { AICompanion } from '../../../components/ai-companion';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';

export function MeetingPanel({
  open,
  onOpenChange,
  side,
  title,
  description,
  children,
  modal,
  trigger,
  keyboard,
  onKeyboard,
  companionExpanded = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'left' | 'right';
  title: string;
  description: string;
  children: ReactNode;
  modal: boolean;
  trigger: RefObject<HTMLButtonElement | null>;
  companionExpanded?: boolean;
  keyboard: boolean;
  onKeyboard: () => void;
}) {
  const reduced = useReducedMotion();
  const shift = side === 'left' ? '-24px' : '24px';
  const hidden =
    reduced || keyboard ? { opacity: 0 } : { opacity: 0, transform: `translateX(${shift})` };
  const content = (
    <>
      {modal && (
        <Dialog.Overlay asChild forceMount>
          <m.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: keyboard ? 0 : 0.15 }}
          />
        </Dialog.Overlay>
      )}
      <Dialog.Content
        asChild
        forceMount
        onOpenAutoFocus={(event) => {
          if (!modal && !keyboard) event.preventDefault();
        }}
        onEscapeKeyDown={onKeyboard}
        onInteractOutside={(event) => {
          if (!modal) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <m.aside
          initial={hidden}
          animate={{ opacity: 1, transform: 'translateX(0px)' }}
          exit={{
            ...hidden,
            transition: { duration: keyboard ? 0 : 0.15, ease: [0.23, 1, 0.32, 1] },
          }}
          transition={{ duration: keyboard ? 0 : reduced ? 0.15 : 0.24, ease: [0.23, 1, 0.32, 1] }}
          className={`flex min-h-0 shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-transparent bg-surface shadow-shell ${modal ? `fixed inset-y-3 z-50 w-[min(23rem,calc(100%-1.5rem))] ${side === 'left' ? 'left-3' : 'right-3'}` : 'relative z-20 w-76'}`}
        >
          <header className="flex shrink-0 items-start justify-between gap-2 px-5 pt-5 pb-4">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-sm font-medium tracking-tight">
                {title === 'UnMute AI' && (
                  <AICompanion
                    size={companionExpanded ? 48 : 28}
                    label={companionExpanded ? 'UnMute AI companion' : undefined}
                  />
                )}
                <span>{title}</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={`Close ${title === 'UnMute AI' ? 'UnMute AI' : 'meeting chat'}`}
              className="-me-2 -mt-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none"
            >
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </header>
          {children}
        </m.aside>
      </Dialog.Content>
    </>
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <AnimatePresence initial={false}>
        {open &&
          (modal ? (
            <Dialog.Portal forceMount key={side}>
              {content}
            </Dialog.Portal>
          ) : (
            <div key={side} className="contents">
              {content}
            </div>
          ))}
      </AnimatePresence>
    </Dialog.Root>
  );
}
