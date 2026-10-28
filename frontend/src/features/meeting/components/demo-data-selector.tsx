import { useState } from 'react';
import type { DemoDataMode } from '../demo-data';

export function DemoDataSelector({
  value,
  onChange,
}: {
  value: DemoDataMode;
  onChange: (value: DemoDataMode) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      aria-label="Demo data"
      className="fixed bottom-1 left-1/2 z-50 flex max-w-[calc(100vw-8px)] -translate-x-1/2 gap-0.5 overflow-x-auto rounded-full bg-neutral-600 p-1 font-sans text-[10px] text-white shadow-lg"
    >
      {open &&
        (
          [
            ['demo', 'Demo'],
            ['worst', 'Worst'],
            ['empty', 'Empty'],
            ['one', 'One'],
            ['large', '1,284'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value === mode}
            className={`shrink-0 rounded-full px-2 py-1 ${value === mode ? 'bg-white text-neutral-900' : ''}`}
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('data', mode);
              window.history.replaceState(window.history.state, '', url);
              onChange(mode);
            }}
          >
            {label}
          </button>
        ))}
      <button
        type="button"
        aria-label={open ? 'Hide demo data selector' : 'Show demo data selector'}
        className="shrink-0 rounded-full px-2 py-1"
        onClick={() => setOpen(!open)}
      >
        {open ? '×' : 'Data'}
      </button>
    </div>
  );
}
