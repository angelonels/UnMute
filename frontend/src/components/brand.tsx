import { Link } from '@tanstack/react-router';

/** Continuous ceramic-like curves, a generous counter, and one attached rose terminal. */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4 5.4C4 3.6 5.1 2.8 6.8 3.3l2.1.6c1.3.4 1.9 1.2 1.9 2.6v12.2c0 3.5 1.9 5.5 5.2 5.5s5.2-2 5.2-5.5v-6.1c0-1.2.7-2 1.9-2.4l2.7-.8c1.4-.4 2.2.3 2.2 1.8v7.6C28 26 23.5 30 16 30S4 26 4 18.8V5.4Z"
        fill="currentColor"
      />
      <path
        d="M21.2 12.6c0-1.2.7-2 1.9-2.4l2.7-.8c1.4-.4 2.2.3 2.2 1.8v1.2l-6.8 2.1v-1.9Z"
        className="fill-secondary"
      />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      search={{ error: undefined }}
      aria-label="UnMute home"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-lg text-[1.25rem] font-semibold tracking-[-0.045em] no-underline"
    >
      <BrandMark className="size-9 shrink-0 text-primary" />
      {!compact && <span>UnMute</span>}
    </Link>
  );
}
