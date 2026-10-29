/** The lifted terminal opens the U; keep the same silhouette in public/unmute-mark.svg. */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M4 5h7v14.5a5 5 0 0 0 10 0V14h7v5.5a12 12 0 0 1-24 0V5Z" fill="currentColor" />
      <path d="m21 3 7-2v8l-7 2V3Z" className="fill-secondary-ink" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/"
      aria-label="UnMute home"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-lg text-[1.25rem] font-semibold tracking-[-0.055em] no-underline"
    >
      <BrandMark className="size-9 shrink-0 text-primary" />
      {!compact && <span>UnMute</span>}
    </a>
  );
}
