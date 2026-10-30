import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useId, useState, type ReactNode } from 'react';
import * as Select from '@radix-ui/react-select';
import { m } from 'motion/react';
import { Check, NavArrowDown as ChevronDown, NavArrowUp as ChevronUp } from 'iconoir-react';

/** Arc Select adapted to Tailwind and device controls: https://uiarc.dev/r/select.json. */
export function SelectPicker({
  label,
  icon,
  value,
  options,
  disabled = false,
  onValueChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  const [keyboard, setKeyboard] = useState(false);
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        id={id}
        aria-label={label}
        onKeyDown={() => setKeyboard(true)}
        onPointerDown={() => setKeyboard(false)}
        className="group flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-input bg-surface px-3 text-left text-sm text-text transition-colors duration-150 hover:bg-surface-muted data-[state=open]:bg-surface-muted disabled:cursor-progress disabled:opacity-50 motion-reduce:transition-none"
      >
        <span className="shrink-0 text-muted" aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <Select.Value />
        </span>
        <Select.Icon className="shrink-0 text-muted">
          <ChevronDown width={15} height={15} strokeWidth={1.5} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          asChild
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          onKeyDown={() => setKeyboard(true)}
        >
          <m.div
            initial={
              keyboard
                ? false
                : reduced
                  ? { opacity: 0 }
                  : { opacity: 0, transform: 'translateY(-4px) scale(0.98)' }
            }
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            transition={{
              duration: keyboard ? 0 : reduced ? 0.15 : 0.18,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="z-80 max-h-[min(20rem,var(--radix-select-content-available-height))] w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) max-w-[calc(100vw-1.5rem)] origin-(--radix-select-content-transform-origin) overflow-hidden rounded-2xl border border-border bg-surface p-1.5 text-text shadow-floating"
          >
            <Select.ScrollUpButton className="grid h-7 place-items-center text-muted">
              <ChevronUp width={16} height={16} aria-hidden="true" />
            </Select.ScrollUpButton>
            <Select.Viewport className="space-y-0.5 overscroll-contain">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  textValue={option.label}
                  className="relative flex min-h-11 cursor-default items-center rounded-[0.625rem] py-2 pr-9 pl-3 text-sm leading-5 outline-none! select-none data-[highlighted]:bg-surface-muted"
                >
                  <Select.ItemText>
                    <span className="block [overflow-wrap:anywhere]">{option.label}</span>
                  </Select.ItemText>
                  <Select.ItemIndicator className="absolute right-3 flex items-center">
                    <Check width={15} height={15} strokeWidth={1.5} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="grid h-7 place-items-center text-muted">
              <ChevronDown width={16} height={16} aria-hidden="true" />
            </Select.ScrollDownButton>
          </m.div>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
