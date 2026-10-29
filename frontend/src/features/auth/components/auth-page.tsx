import { AICompanion } from '../../../components/ai-companion';
import { useState } from 'react';
import { Effect } from 'effect';
import { ArrowRight } from 'iconoir-react';
import { Link } from '@tanstack/react-router';
import { authClient } from '../../../api/auth-client';
import { Brand } from '../../../components/brand';
import { ThemeToggle } from '../../../components/theme-toggle';
import { LoadingIndicator } from '../../../components/loading-indicator';

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
  const [retrying, setRetrying] = useState(false);
  async function retrySession() {
    if (retrying) return;
    setRetrying(true);
    try {
      await refetch();
    } finally {
      setRetrying(false);
    }
  }
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-x-clip bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden bg-canvas bg-[url('/images/auth-studio-light.webp')] bg-cover bg-center bg-blend-multiply lg:block dark:bg-[url('/images/auth-studio-dark.webp')] dark:bg-blend-normal"
      />
      <header className="mx-auto flex min-h-18 w-full max-w-[112rem] shrink-0 flex-wrap items-center justify-between gap-4 px-6 py-3 [&>a]:max-w-full [&>a]:flex-wrap sm:px-10 lg:min-h-24 lg:px-12">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-[112rem] flex-1 content-center items-center gap-4 px-6 pt-0 pb-4 sm:px-10 min-[640px]:max-lg:[@media(max-height:600px)]:grid-cols-[1fr_1.2fr] lg:grid-cols-[1.8fr_1fr] lg:gap-10 lg:px-12 lg:py-6">
        <SignInArtwork />
        <section
          aria-labelledby="signin-heading"
          className="min-w-0 text-center lg:py-12 lg:text-left"
        >
          <div className="mx-auto w-full max-w-[30rem]">
            <h1
              id="signin-heading"
              className="text-[clamp(2.5rem,12vw,3.5rem)] leading-[1.04] lg:text-[clamp(2.5rem,6.3vw,6rem)] lg:leading-[1.02] font-normal tracking-[-0.065em] [overflow-wrap:anywhere]"
            >
              Sign in to <span className="block">UnMute</span>
            </h1>
            <p className="mt-3 text-base leading-6 tracking-[-0.02em] text-muted lg:mt-7 lg:text-2xl lg:leading-8">
              Meet, talk, be here.
            </p>
            <GoogleSignInButton
              busy={busy}
              checking={isPending}
              disabled={isPending || Boolean(sessionError)}
              onSignIn={signIn}
            />
            {failed && (
              <p
                className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm leading-6 text-error"
                role="alert"
              >
                We couldn’t complete sign-in. Please try again.
              </p>
            )}
            {(sessionError || retrying) && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm leading-6 text-error"
              >
                We couldn’t check your session.{' '}
                <button
                  type="button"
                  aria-busy={retrying}
                  aria-disabled={retrying || undefined}
                  className="inline-grid min-h-11 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-2 underline underline-offset-4 aria-busy:cursor-progress"
                  onClick={() => void retrySession()}
                >
                  <span
                    aria-hidden="true"
                    className={`col-start-1 row-start-1 ${retrying ? '' : 'invisible'}`}
                  >
                    <LoadingIndicator />
                  </span>
                  <span
                    aria-hidden={retrying || undefined}
                    className={`col-start-2 row-start-1 ${retrying ? 'invisible' : ''}`}
                  >
                    Try again
                  </span>
                  <span
                    aria-hidden={!retrying || undefined}
                    className={`col-start-2 row-start-1 ${retrying ? '' : 'invisible'}`}
                  >
                    Checking…
                  </span>
                </button>
              </div>
            )}
            {import.meta.env.DEV && (
              <Link
                to="/meeting"
                search={{ demo: true, microphone: false, camera: false }}
                className="mt-2 flex min-h-11 items-center justify-center text-sm text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-current lg:mt-8"
              >
                Open meeting playground
              </Link>
            )}
          </div>
        </section>
      </main>
      <footer className="mx-auto flex min-h-11 w-full max-w-[112rem] shrink-0 items-center justify-center px-6 py-3 lg:justify-start text-xs text-[oklch(0.46_0.025_285)] sm:px-10 lg:px-12 dark:text-muted">
        UnMute © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function GoogleSignInButton({
  busy,
  checking,
  disabled,
  onSignIn,
}: {
  busy: boolean;
  checking: boolean;
  disabled: boolean;
  onSignIn: () => Promise<void>;
}) {
  return (
    <>
      <button
        type="button"
        aria-busy={busy}
        aria-disabled={busy || undefined}
        disabled={disabled}
        onClick={() => {
          if (!busy) void onSignIn();
        }}
        className="mt-6 flex min-h-15 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 text-base leading-6 font-medium text-on-primary shadow-sm hover:bg-primary-hover disabled:cursor-wait disabled:opacity-50 aria-busy:cursor-progress motion-safe:transition-[background-color,transform] motion-safe:duration-150 motion-safe:ease-out motion-safe:[&:enabled:not([aria-disabled=true]):active:not(:focus-visible)]:scale-[0.96] lg:mt-12"
      >
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full bg-white p-1 [&_svg]:size-5"
          aria-hidden="true"
        >
          {busy ? <LoadingIndicator className="text-primary" /> : <GoogleMark />}
        </span>
        <span className="grid min-w-0 grid-cols-[minmax(0,1fr)] [overflow-wrap:anywhere]">
          <span
            aria-hidden={busy || undefined}
            className={`col-start-1 row-start-1 ${busy ? 'invisible' : ''}`}
          >
            {checking ? 'Checking your session…' : 'Continue with Google'}
          </span>
          <span
            aria-hidden={!busy || undefined}
            className={`col-start-1 row-start-1 ${busy ? '' : 'invisible'}`}
          >
            Connecting to Google…
          </span>
        </span>
        <ArrowRight
          width={18}
          height={18}
          className="hidden shrink-0 sm:block"
          aria-hidden="true"
        />
      </button>
      <span role="status" aria-label="Sign-in progress" className="sr-only">
        {busy ? 'Connecting to Google…' : ''}
      </span>
    </>
  );
}

function SignInArtwork() {
  return (
    <div className="relative mx-auto aspect-square w-[min(82vw,38svh)] max-w-full max-sm:[@media(max-height:700px)]:w-40 min-[640px]:max-lg:[@media(max-height:600px)]:w-[min(30vw,65svh)] lg:w-[min(100%,76svh)] lg:max-w-[52rem]">
      <AICompanion
        size={640}
        stage="sculpture"
        finish="ceramic"
        pokeable
        label="Say hello to Mumo"
        className="size-full! [--companion-body:var(--companion-paper-body)] [--companion-face:var(--companion-paper-face)]"
      />
    </div>
  );
}
