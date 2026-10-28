import { useSyncExternalStore } from 'react';

const preference =
  typeof window === 'undefined'
    ? undefined
    : window.matchMedia?.('(prefers-reduced-motion: reduce)');
function subscribe(onChange: () => void) {
  preference?.addEventListener('change', onChange);
  return () => preference?.removeEventListener('change', onChange);
}

/** Reacts to preference changes while the application is open. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => preference?.matches ?? true,
    () => true,
  );
}
