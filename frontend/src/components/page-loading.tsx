import { BrandMark } from './brand';
import { LoadingIndicator } from './loading-indicator';

/** A neutral route/session boundary that carries no account or media dependencies. */
export function PageLoading({ label = 'Loading page' }: { label?: string }) {
  return (
    <main
      aria-label={label}
      aria-busy="true"
      className="grid min-h-svh place-items-center bg-canvas px-6 text-text"
    >
      <div className="flex flex-col items-center gap-6">
        <span className="grid size-20 place-items-center rounded-3xl border border-border/60 bg-surface shadow-sm">
          <BrandMark className="size-11 text-primary" />
        </span>
        <div className="text-center">
          <p className="text-base font-semibold tracking-tight">UnMute</p>
          <p
            role="status"
            className="mt-2 flex items-center justify-center gap-2.5 text-sm text-muted"
          >
            <LoadingIndicator />
            Loading…
          </p>
        </div>
      </div>
    </main>
  );
}
