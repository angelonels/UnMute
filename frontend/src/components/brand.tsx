export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/"
      aria-label="UnMute home"
      className="inline-flex shrink-0 items-center gap-2.5 text-xl font-bold tracking-[-0.06em] no-underline"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-on-primary">
        <svg className="size-6" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M7 11v10M13 6v20M19 10v12M25 14v4"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact && (
        <span>
          UnMute<span className="text-primary">.</span>
        </span>
      )}
    </a>
  );
}
