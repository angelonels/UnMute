import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      className="grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-text"
      aria-label={dark ? 'Use light mode' : 'Use dark mode'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? (
        <Sun size={19} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon size={19} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
