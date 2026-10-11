import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Effect } from 'effect';
import { authClient } from '../../../api/auth-client';

const authButtonClassName =
  'flex min-h-14 w-full cursor-pointer items-center justify-center gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold text-text transition-transform duration-160 ease-out-expo disabled:cursor-wait disabled:text-disabled enabled:hover:border-primary contrast-more:border-text [&:not(:disabled):active:not(:focus-visible)]:scale-97 motion-reduce:transition-opacity motion-reduce:duration-100 motion-reduce:ease-linear motion-reduce:active:scale-100 motion-reduce:enabled:active:opacity-80 [&_svg]:size-5 [&_svg]:shrink-0';

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M7 11v10M13 6v20M19 10v12M25 14v4"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function useAuthActions(authError: boolean) {
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
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return (
    <div className="mx-auto max-w-[88rem] px-(--page-gutter) pb-8 max-[901px]:ps-[max(var(--page-gutter),env(safe-area-inset-left))] max-[901px]:pe-[max(var(--page-gutter),env(safe-area-inset-right))]">
      <header className="flex min-h-24 items-center justify-between">
        <a
          className="inline-flex items-center text-2xl font-bold tracking-[-0.065em] no-underline"
          href="/"
          aria-label="UnMute home"
        >
          <span className="me-2 size-8 text-primary">
            <BrandMark />
          </span>
          UnMute<span className="text-primary">.</span>
        </a>
        <button
          className="grid size-12 cursor-pointer place-items-center rounded-full border border-border bg-surface text-text hover:border-primary contrast-more:border-text [&:active:not(:focus-visible)]:scale-97 motion-reduce:active:scale-100 motion-reduce:active:opacity-80 [&_svg]:size-5"
          aria-label={dark ? 'Use light mode' : 'Use dark mode'}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            {dark ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
              </>
            ) : (
              <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
            )}
          </svg>
        </button>
      </header>
      <main className="grid min-h-[min(48rem,calc(100svh-8rem))] grid-cols-2 gap-[clamp(2rem,4vw,4rem)] max-[901px]:flex max-[901px]:flex-col-reverse max-[901px]:gap-12">
        <section
          className="relative flex flex-col overflow-hidden rounded-3xl bg-panel p-[clamp(1.5rem,3vw,2.5rem)] text-white max-[901px]:mx-auto max-[901px]:w-full max-[901px]:max-w-xl"
          aria-labelledby="conversation-heading"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold tracking-[0.1em]">A little less noise.</span>
          </div>
          <h2
            id="conversation-heading"
            className="mt-10 mb-4 text-[clamp(2rem,3.1vw,3.5rem)] leading-[1.08] font-[550] tracking-[-0.045em] max-[901px]:mt-8 max-[901px]:text-[clamp(2rem,6vw,2.5rem)]"
          >
            Good conversations.
            <br />
            Nothing lost.
          </h2>
          <p className="m-0 text-base leading-[1.6] text-[#e1e9ff] contrast-more:text-white">
            A video platform that takes the notes,
            <br className="max-[901px]:hidden" /> so you can be here for the moment.
          </p>
          <div
            className="relative isolate mx-auto mt-6 min-h-88 w-full max-w-lg flex-1 max-[901px]:min-h-92"
            role="img"
            aria-label="Two voices meeting in a conversation, with their words captured below"
          >
            <div className="absolute -start-28 -top-4 -z-10 size-96 rounded-full border border-[#ffffff20]" />
            <div className="absolute -end-24 top-12 -z-10 size-96 rounded-full border border-[#ffffff20]" />
            <div className="absolute start-4 top-2 flex size-48 -rotate-10 flex-col items-center justify-center gap-4 rounded-full bg-[#eaf0ff] text-[#163c86] shadow-[0_1.5rem_3rem_#10275626] max-[1101px]:start-0 max-[1101px]:size-40 max-[901px]:top-8">
              <span className="text-2xl font-[550] tracking-[-0.04em]">hello.</span>
              <div className="flex h-15 items-center gap-1">
                {['h-4', 'h-7', 'h-11', 'h-15', 'h-9', 'h-13', 'h-7', 'h-4'].map(
                  (heightClass, i) => (
                    <i key={i} className={`w-1 rounded-2xl bg-current ${heightClass}`} />
                  ),
                )}
              </div>
              <span className="text-[0.5rem] font-[650] tracking-[0.15em]">YOUR VOICE</span>
            </div>
            <div className="absolute end-2 top-16 flex size-48 rotate-9 flex-col items-center justify-center gap-4 rounded-full bg-accent text-[#513512] shadow-[0_1.5rem_3rem_#10275626] max-[1101px]:end-0 max-[1101px]:top-20 max-[1101px]:size-40 max-[901px]:top-28">
              <span className="text-2xl font-[550] tracking-[-0.04em]">I’m here.</span>
              <div className="flex h-15 items-center gap-1">
                {['h-3', 'h-6', 'h-10', 'h-7', 'h-13', 'h-9', 'h-5', 'h-3'].map(
                  (heightClass, i) => (
                    <i key={i} className={`w-1 rounded-2xl bg-current ${heightClass}`} />
                  ),
                )}
              </div>
              <span className="text-[0.5rem] font-[650] tracking-[0.15em]">THEIR VOICE</span>
            </div>
            <div className="absolute inset-x-1 bottom-4 flex -rotate-2 items-center gap-4 rounded-xl bg-[#f0f4ff] p-4 text-[#153361] shadow-[0_0.5rem_2rem_#10275624]">
              <span className="text-2xl" aria-hidden="true">
                ↳
              </span>
              <div>
                <span className="text-[0.5rem] font-bold tracking-[0.12em] text-[#4b6080]">
                  THE MOMENT, CAPTURED
                </span>
                <p className="mt-1 mb-0 text-xs font-[550]">
                  More presence. Less “what did I miss?”
                </p>
              </div>
              <span className="ms-auto text-base" aria-hidden="true">
                ✓
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs text-[#e1e9ff] contrast-more:text-white [&_svg]:size-6">
            <span>Be present. We’ll keep up.</span>
            <BrandMark />
          </div>
        </section>
        <SignInPanel authError={authError} />
      </main>
    </div>
  );
}

function SignInPanel({ authError }: { authError: boolean }) {
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const { busy, failed, signIn, signOut } = useAuthActions(authError);
  return (
    <section
      className="flex flex-col items-center justify-center px-6 pt-8 pb-6 max-[1101px]:px-0 max-[901px]:min-h-[calc(100svh-8rem)] max-[901px]:p-0"
      aria-labelledby="signin-heading"
    >
      <div className="flex w-full max-w-96 flex-1 flex-col justify-center pt-8 pb-24">
        <span className="text-xs font-semibold tracking-[0.1em] text-primary">
          WELCOME TO UNMUTE
        </span>
        <h1
          id="signin-heading"
          className="mt-4 mb-4 text-[clamp(2rem,3vw,3rem)] leading-[1.12] font-semibold tracking-[-0.05em] max-[901px]:text-[clamp(2rem,7vw,3rem)]"
        >
          {session ? (
            'You’re in. Be present.'
          ) : (
            <>
              Make room for <br />
              the conversation.
            </>
          )}
        </h1>
        <p className="m-0 text-base leading-[1.7] whitespace-pre-line text-muted [overflow-wrap:anywhere]">
          {session
            ? `Signed in as ${session.user.name}. Your UnMute account is ready.`
            : 'Less to manage. More to say.\nSign in or create your account to get started.'}
        </p>
        <AuthControls
          session={session}
          isPending={isPending}
          sessionError={Boolean(sessionError)}
          refetch={refetch}
          busy={busy}
          failed={failed}
          signIn={signIn}
          signOut={signOut}
        />
      </div>
      <footer className="flex w-full max-w-96 flex-wrap justify-between gap-4 text-[0.6875rem] text-muted max-[901px]:mt-8">
        <span>A clearer space to connect.</span>
        <span className="tracking-[0.025em]">UnMute © {new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}

type AuthControlsProps = ReturnType<typeof useAuthActions> & {
  session: typeof authClient.$Infer.Session | null;
  isPending: boolean;
  sessionError: boolean;
  refetch: () => unknown;
};

function AuthControls({
  session,
  isPending,
  sessionError,
  refetch,
  busy,
  failed,
  signIn,
  signOut,
}: AuthControlsProps) {
  return (
    <div className="mt-6">
      {session ? (
        <>
          <div className="mt-4 mb-9 flex items-center gap-4">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-2xl text-on-primary"
              aria-hidden="true"
            >
              {session.user.name.slice(0, 1)}
            </span>
            <div>
              <strong className="block [overflow-wrap:anywhere]">{session.user.name}</strong>
              <span className="block text-sm text-muted [overflow-wrap:anywhere]">
                {session.user.email}
              </span>
            </div>
          </div>
          <button className={authButtonClassName} onClick={() => void signOut()} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </>
      ) : (
        <button
          className={authButtonClassName}
          onClick={() => void signIn()}
          disabled={busy || isPending}
          aria-busy={busy || isPending}
        >
          <GoogleMark />
          <span className="me-auto">
            {busy
              ? 'Connecting to Google…'
              : isPending
                ? 'Checking your session…'
                : 'Continue with Google'}
          </span>
          <span className="ms-auto text-xl leading-none text-muted" aria-hidden="true">
            ↗
          </span>
        </button>
      )}
      {failed && (
        <p className="mt-4 text-sm leading-[1.6] text-error" role="alert">
          {session ? 'We couldn’t sign you out.' : 'We couldn’t complete sign-in.'} Please try
          again.
        </p>
      )}
      {sessionError && (
        <div className="mt-4 text-sm leading-[1.6] text-error" role="alert">
          We couldn’t check your session.{' '}
          <button
            className="min-h-11 cursor-pointer border-0 bg-transparent p-3 text-inherit underline"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
