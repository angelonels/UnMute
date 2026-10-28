import * as Dialog from '@radix-ui/react-dialog';
import { Lock, Xmark } from 'iconoir-react';
import { AICompanion } from '../../../components/ai-companion';
import type { CompanionBehavior } from '../companion-behavior';

export function CompanionHeader({
  behavior,
  available,
  demo,
}: {
  behavior: CompanionBehavior;
  available: boolean;
  demo: boolean;
}) {
  return (
    <header
      data-companion-activity={behavior.activity}
      className="relative shrink-0 border-b border-border/50 bg-primary/3 px-4 pt-1 pb-3"
    >
      <Dialog.Title className="sr-only">Mumo</Dialog.Title>
      <Dialog.Description className="sr-only">Your private meeting companion</Dialog.Description>
      <Dialog.Close
        aria-label="Close Mumo"
        className="absolute top-2 right-2 z-10 grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted"
      >
        <Xmark width={17} height={17} aria-hidden="true" />
      </Dialog.Close>
      <div className="flex h-24 items-center justify-center [@media(max-height:700px)]:h-16">
        <AICompanion
          size={112}
          className="[@media(max-height:700px)]:h-16! [@media(max-height:700px)]:w-16!"
          dimensional
          pokeable
          state={behavior.state}
          expression={behavior.expression}
          attention={behavior.attention}
          label="Say hello to Mumo"
        />
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-xl font-medium tracking-[-0.04em]">
          Mumo<span className="text-primary">.</span>
        </p>
        <span
          className="mb-0.5 flex shrink-0 items-center gap-1.5 text-[10px] text-muted"
          title="Private conversation"
        >
          <Lock width={11} height={11} aria-hidden="true" />
          {demo ? 'Sample meeting' : 'Just us'}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-4 text-muted">
        {available ? behavior.caption : 'Not connected yet'}
      </p>
    </header>
  );
}
