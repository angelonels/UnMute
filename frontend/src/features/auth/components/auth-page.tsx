import { useState } from 'react';
import { Effect } from 'effect';
import { ArrowUpRight, AudioLines, Check, Headphones } from 'lucide-react';
import { authClient } from '../../../api/auth-client';
import { Brand } from '../../../components/brand';
import { ThemeToggle } from '../../../components/theme-toggle';
import { Button } from '../../../components/arc/button/button';

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
    <div className="mx-auto max-w-[96rem] px-(--page-gutter) pb-6">
      <header className="flex min-h-24 items-center justify-between gap-4">
        <Brand />
        <div className="flex items-center gap-5">
          <span className="hidden text-xs text-muted sm:block">A clearer space to connect.</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="grid min-h-[calc(100svh-8rem)] gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-16">
        <section
          aria-labelledby="conversation-heading"
          className="relative isolate hidden flex-col overflow-hidden rounded-[2rem] bg-panel p-10 text-white lg:flex xl:p-12"
        >
          <span className="inline-flex items-center gap-2 text-xs text-white/80">
            <span className="size-1.5 rounded-full bg-accent" />A little less noise.
          </span>
          <h2
            id="conversation-heading"
            className="mt-12 text-[clamp(2.5rem,4vw,4rem)] leading-[1.06] font-medium tracking-[-0.055em]"
          >
            Good conversations.
            <br />
            <span className="text-[#c5d6ff]">Nothing lost.</span>
          </h2>
          <p className="mt-5 max-w-72 text-sm leading-7 text-[#e1e9ff]">
            Less to manage. More to say.
            <br />A little more room to be here.
          </p>
          <div
            className="relative mx-auto mt-6 min-h-80 w-full max-w-lg flex-1"
            role="img"
            aria-label="Two voices coming together in a conversation"
          >
            <div className="absolute top-4 -left-24 size-88 rounded-full border border-white/10" />
            <div className="absolute top-24 -right-28 size-88 rounded-full border border-white/10" />
            <div className="absolute top-8 left-0 flex size-44 -rotate-8 flex-col items-center justify-center gap-4 rounded-[2.5rem] bg-[#eaf0ff] text-[#163c86] shadow-floating xl:left-4 xl:size-48">
              <span className="text-3xl font-medium tracking-tight">hello.</span>
              <AudioLines size={58} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-[10px] tracking-widest">YOUR VOICE</span>
            </div>
            <div className="absolute top-24 right-0 flex size-44 rotate-8 flex-col items-center justify-center gap-4 rounded-[2.5rem] bg-accent text-[#513512] shadow-floating xl:right-4 xl:size-48">
              <span className="text-3xl font-medium tracking-tight">I’m here.</span>
              <AudioLines size={58} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-[10px] tracking-widest">THEIR VOICE</span>
            </div>
            <div className="absolute inset-x-4 bottom-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#143875] px-5 py-4 shadow-floating">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10">
                <Headphones size={18} aria-hidden="true" />
              </span>
              <p className="text-sm">More presence. More possibility.</p>
              <Check className="ms-auto shrink-0 text-accent" size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between text-xs text-[#e1e9ff]">
            <span>Made for being here.</span>
            <span>UnMute.</span>
          </div>
        </section>
        <section
          aria-labelledby="signin-heading"
          className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center px-2 sm:px-8 lg:px-0"
        >
          <div className="flex w-full max-w-96 flex-1 flex-col justify-center py-12">
            <span className="mb-8 grid size-12 place-items-center rounded-2xl bg-primary/8 text-primary">
              <AudioLines size={25} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-primary">Welcome to UnMute</span>
            <h1
              id="signin-heading"
              className="mt-4 text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.08] font-medium tracking-[-0.055em]"
            >
              Make room for <br />
              the conversation.
            </h1>
            <p className="mt-6 text-base leading-7 text-muted">
              Your people. Your ideas. Your next big thing.
              <br />
              It’s good to have you here.
            </p>
            <Button
              variant="secondary"
              size="lg"
              loading={busy}
              disabled={isPending || Boolean(sessionError)}
              onClick={() => void signIn()}
              className="mt-10 !min-h-14 w-full !rounded-2xl !border-input !font-medium [&_svg]:size-5"
            >
              <GoogleMark />
              <span>
                {busy
                  ? 'Connecting to Google…'
                  : isPending
                    ? 'Checking your session…'
                    : 'Continue with Google'}
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Button>
            {failed && (
              <p className="mt-4 text-sm leading-6 text-error" role="alert">
                We couldn’t complete sign-in. Please try again.
              </p>
            )}
            {sessionError && (
              <div role="alert" className="mt-4 text-sm text-error">
                We couldn’t check your session.{' '}
                <button
                  className="min-h-11 cursor-pointer px-2 underline"
                  onClick={() => void refetch()}
                >
                  Try again
                </button>
              </div>
            )}
            <p className="mt-5 text-center text-xs leading-6 text-muted">
              One account. A whole new conversation.
            </p>
            <div className="mt-12 flex items-center gap-3 border-t border-border/70 pt-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/20 text-text">
                <Headphones size={17} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="text-xs leading-5 text-muted">
                Bring your voice.
                <br />
                <span className="text-text">We’ll make the space.</span>
              </p>
            </div>
          </div>
          <footer className="flex w-full max-w-96 flex-wrap justify-between gap-3 pb-3 text-[11px] text-muted">
            <span>A little less noise. A little more you.</span>
            <span>UnMute © {new Date().getFullYear()}</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
