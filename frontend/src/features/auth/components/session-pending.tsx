/** Session resolution must not briefly expose either signed-in or signed-out content. */
export function SessionPending() {
  return (
    <main
      aria-label="Loading account"
      aria-busy="true"
      className="grid min-h-svh place-items-center px-6"
    >
      <p role="status" className="text-sm text-muted">
        Loading…
      </p>
    </main>
  );
}
