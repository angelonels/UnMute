/** Pair with visible status text; reduced motion keeps the indicator still. */
export function LoadingIndicator({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-loading-spinner
      className={`inline-block size-4 shrink-0 rounded-full border-[1.5px] border-current border-r-transparent motion-safe:animate-spin ${className}`}
    />
  );
}
