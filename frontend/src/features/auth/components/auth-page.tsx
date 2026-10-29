import { AICompanion } from '../../../components/ai-companion';
import { useState } from 'react';
import { Effect } from 'effect';
import { ArrowRight, Microphone, PhoneDisabled, VideoCamera } from 'iconoir-react';
import { authClient } from '../../../api/auth-client';
import { Brand } from '../../../components/brand';
import { ThemeToggle } from '../../../components/theme-toggle';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.93A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.93V7.48H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.52l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z"
      />
    </svg>
  );
}

export function useAuthActions(authError: boolean) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(authError);

  async function signIn() {
    setBusy(true);
    setFailed(false);
    try {
      const success = await Effect.runPromise(
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.signIn.social({
              provider: 'google',
              callbackURL: window.location.origin + '/',
              errorCallbackURL: window.location.origin + '/?error=oauth',
            });
            if (result.error) throw new Error('Sign-in failed');
          },
          catch: () => 'SIGN_IN_FAILED' as const,
        }).pipe(Effect.match({ onSuccess: () => true, onFailure: () => false })),
      );
      setFailed(!success);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setFailed(false);
    try {
      const success = await Effect.runPromise(
        Effect.tryPromise({
          try: async () => {
            const result = await authClient.signOut();
            if (result.error) throw new Error('Sign-out failed');
          },
          catch: () => 'SIGN_OUT_FAILED' as const,
        }).pipe(Effect.match({ onSuccess: () => true, onFailure: () => false })),
      );
      setFailed(!success);
    } finally {
      setBusy(false);
    }
  }

  return { busy, failed, signIn, signOut };
}

export function AuthPage({ authError = false }: { authError?: boolean }) {
  const { isPending, error: sessionError, refetch } = authClient.useSession();
  const { busy, failed, signIn } = useAuthActions(authError);
  return (
    <div className="mx-auto flex min-h-svh max-w-[100rem] flex-col px-4 sm:px-6 lg:px-8">
      <header className="flex min-h-20 shrink-0 flex-wrap items-center justify-between gap-4 px-1 py-4 [&>a]:max-w-full [&>a]:flex-wrap lg:min-h-24 lg:px-2">
        <Brand />
        <div className="flex items-center gap-5">
          <ThemeToggle />
        </div>
      </header>
      <main className="grid flex-1 overflow-hidden rounded-[2rem] border border-border/60 bg-surface lg:grid-cols-[1.08fr_1fr]">
        <ConversationIllustration />
        <section
          aria-labelledby="signin-heading"
          className="relative flex min-w-0 flex-col justify-center px-5 py-10 sm:px-12 sm:py-16 lg:px-12 xl:px-20"
        >
          <div className="mx-auto flex w-full max-w-96 flex-1 flex-col justify-center">
            <h1
              id="signin-heading"
              className="text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.1] font-medium tracking-[-0.055em] [overflow-wrap:anywhere] min-[360px]:text-[clamp(2.25rem,3.6vw,3.25rem)]"
            >
              Make room for <br />
              <span className="text-muted">the conversation.</span>
            </h1>
            <p className="mt-5 max-w-80 text-sm leading-7 text-muted sm:text-base">
              Video meetings, with Mumo.
            </p>
            <button
              type="button"
              aria-busy={busy}
              aria-disabled={busy || undefined}
              disabled={isPending || Boolean(sessionError)}
              onClick={() => {
                if (!busy) void signIn();
              }}
              className="mt-9 flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm leading-6 font-medium text-on-primary shadow-sm hover:bg-primary-hover disabled:cursor-wait disabled:opacity-50 aria-busy:cursor-progress motion-safe:transition-[background-color,transform] motion-safe:duration-150 motion-safe:ease-out motion-safe:[&:enabled:not([aria-disabled=true]):active:not(:focus-visible)]:scale-[0.96] sm:mt-10"
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-white p-1 [&_svg]:size-5"
                aria-hidden="true"
              >
                <GoogleMark />
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {busy
                  ? 'Connecting to Google…'
                  : isPending
                    ? 'Checking your session…'
                    : 'Continue with Google'}
              </span>
              <ArrowRight
                width={18}
                height={18}
                className="hidden shrink-0 sm:block"
                aria-hidden="true"
              />
            </button>
            {failed && (
              <p
                className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm leading-6 text-error"
                role="alert"
              >
                We couldn’t complete sign-in. Please try again.
              </p>
            )}
            {sessionError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm leading-6 text-error"
              >
                We couldn’t check your session.{' '}
                <button
                  type="button"
                  className="min-h-11 cursor-pointer px-2 underline underline-offset-4"
                  onClick={() => void refetch()}
                >
                  Try again
                </button>
              </div>
            )}
            {import.meta.env.DEV && (
              <a
                href="/meeting?demo=true"
                className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs text-muted hover:border-input hover:text-text"
              >
                Open meeting playground
                <ArrowRight width={14} height={14} aria-hidden="true" />
              </a>
            )}
          </div>
        </section>
      </main>
      <footer className="flex min-h-16 shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 px-1 py-4 text-[11px] text-muted lg:px-2">
        <span>UnMute © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

function ConversationIllustration() {
  return (
    <section
      aria-labelledby="conversation-heading"
      className="relative isolate hidden min-h-[42rem] flex-col overflow-hidden bg-panel px-10 pt-11 pb-8 text-white lg:flex xl:px-14 xl:pt-14"
    >
      <svg
        className="pointer-events-none absolute inset-0 -z-10 size-full opacity-20"
        viewBox="0 0 700 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle cx="350" cy="500" r="220" stroke="currentColor" strokeOpacity="0.5" />
        <circle cx="350" cy="500" r="310" stroke="currentColor" strokeOpacity="0.35" />
        <circle cx="350" cy="500" r="400" stroke="currentColor" strokeOpacity="0.2" />
        <path d="M350 90v710M-100 500h900" stroke="currentColor" strokeOpacity="0.15" />
      </svg>
      <h2
        id="conversation-heading"
        className="max-w-lg text-[clamp(2.5rem,4vw,4rem)] leading-[1.04] font-medium tracking-[-0.055em]"
      >
        Be a little
        <br />
        <span className="text-secondary">more here.</span>
      </h2>
      <div
        className="relative mx-auto mt-12 mb-5 min-h-96 w-full max-w-lg flex-1"
        role="img"
        aria-label="An illustrative conversation with two people and Mumo, your meeting companion"
      >
        <div className="absolute top-8 left-0 w-[88%] -rotate-6 rounded-[1.5rem] border border-white/20 bg-surface p-3 text-text shadow-[0_16px_48px_#001b5b33] xl:top-10">
          <div className="mb-3 flex items-center justify-between px-1 text-[10px]">
            <span className="font-medium">Catch-up</span>
            <span className="text-muted">Illustrative preview</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative grid h-32 place-items-center rounded-2xl bg-selection xl:h-36">
              <span className="grid size-16 place-items-center rounded-full bg-primary text-xl font-medium tracking-tight text-on-primary">
                MC
              </span>
              <span className="absolute bottom-2 left-3 text-[10px] text-primary">Maya</span>
              <span
                className="absolute right-2 bottom-2 flex h-3 items-center gap-0.5 text-primary"
                aria-hidden="true"
              >
                {[5, 10, 7, 12, 5].map((height, index) => (
                  <span key={index} className="w-0.5 rounded-full bg-current" style={{ height }} />
                ))}
              </span>
            </div>
            <div className="relative grid h-32 place-items-center rounded-2xl bg-secondary-soft xl:h-36">
              <span className="grid size-16 place-items-center rounded-full bg-secondary text-xl font-medium tracking-tight text-on-secondary">
                TB
              </span>
              <span className="absolute bottom-2 left-3 text-[10px] text-secondary-ink">Theo</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="grid size-7 place-items-center rounded-lg bg-canvas">
              <Microphone width={13} height={13} />
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-canvas">
              <VideoCamera width={13} height={13} />
            </span>
            <span className="grid h-7 w-10 place-items-center rounded-lg bg-[#bf5353] text-white">
              <PhoneDisabled width={14} height={14} />
            </span>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 flex w-[55%] rotate-6 flex-col items-center rounded-[1.5rem] border border-white/25 bg-secondary px-4 pb-5 text-on-secondary shadow-[0_16px_48px_#001b5b33]">
          <div className="-mt-6">
            <AICompanion
              finish="ceramic"
              size={152}
              className="[--companion-body:var(--companion-paper-body)] [--companion-face:var(--companion-paper-face)]"
            />
          </div>
          <span className="text-sm font-medium tracking-tight">Mumo</span>
        </div>
      </div>
    </section>
  );
}
