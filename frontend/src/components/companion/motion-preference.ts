import { useSyncExternalStore } from 'react';

const key = 'unmute-companion-motion';
const event = 'unmute-companion-motion-change';
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener('storage', listener);
  };
}
function snapshot() {
  return localStorage.getItem(key) !== 'off';
}
export function useCompanionMotion() {
  const enabled = useSyncExternalStore(subscribe, snapshot, () => false);
  return [
    enabled,
    (value: boolean) => {
      localStorage.setItem(key, value ? 'on' : 'off');
      window.dispatchEvent(new Event(event));
    },
  ] as const;
}
