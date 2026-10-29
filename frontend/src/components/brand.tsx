import { Link } from '@tanstack/react-router';

/** Rounded asymmetric arms echo the ceramic sculpture; keep the favicon paths identical. */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4 5.7Q4 2.6 6.6 3.3l2.3.7Q11 4.6 11 6.8V19c0 6.8 10 6.8 10 0v-6q0-2 1.8-2.6l2.6-.8Q28 8.8 28 11.2V19C28 32 4 32 4 19V5.7Z"
        fill="currentColor"
      />
      <path d="M21 13q0-2 1.8-2.6l2.6-.8Q28 8.8 28 11.2V13l-7 2.2V13Z" className="fill-secondary" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      search={{ error: undefined }}
      aria-label="UnMute home"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-lg text-[1.25rem] font-semibold tracking-[-0.055em] no-underline"
    >
      <BrandMark className="size-9 shrink-0 text-primary" />
      {!compact && <span>UnMute</span>}
    </Link>
  );
}
