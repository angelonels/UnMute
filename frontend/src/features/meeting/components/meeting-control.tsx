import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode;
  children?: ReactNode;
  tone?: 'neutral' | 'off' | 'success' | 'warning' | 'primary';
};
const tones = {
  neutral: 'border-border/70 bg-surface text-text hover:bg-surface-muted',
  off: 'border-error/25 bg-error/10 text-error hover:bg-error/15',
  success: 'border-success/25 bg-success/10 text-success hover:bg-success/15',
  warning: 'border-warning/25 bg-warning/10 text-warning hover:bg-warning/15',
  primary: 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/15',
};
export const MeetingControl = forwardRef<HTMLButtonElement, Props>(function MeetingControl(
  { icon, children, tone = 'neutral', className = '', ...props },
  ref,
) {
  return (
    <button
      type="button"
      ref={ref}
      {...props}
      className={`inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:[&:enabled:active:not(:focus-visible)]:scale-[0.96] ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
});
