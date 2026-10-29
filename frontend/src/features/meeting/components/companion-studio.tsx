import { useRef, useState } from 'react';
import { Eye, OpenSelectHandGesture, Sparks, Triangle, Emoji } from 'iconoir-react';
import { AICompanion, type CompanionHandle } from '../../../components/ai-companion';
import {
  EXPRESSION_NAMES,
  SHAPE_NAMES,
  STATE_NAMES,
  type ExpressionName,
  type ShapeName,
  type StateName,
} from '../../../components/companion/dotty-engine';
import { SelectPicker } from '../../../components/select-picker';

const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);

/** Development-only inspector for the full Dotty state, shape and expression vocabulary. */
export function CompanionStudio() {
  const character = useRef<CompanionHandle>(null);
  const [state, setState] = useState<StateName>('bouncing');
  const [shape, setShape] = useState<ShapeName>('blob');
  const [expression, setExpression] = useState<ExpressionName | 'auto'>('auto');
  return (
    <div className="mt-5 grid items-center gap-6 sm:grid-cols-2">
      <div className="flex min-w-0 flex-col items-center justify-center rounded-3xl border border-border/60 bg-canvas/50 py-5">
        <AICompanion
          ref={character}
          size={240}
          dimensional
          pokeable
          state={state}
          shape={shape}
          expression={expression === 'auto' ? null : expression}
          label="Say hello to the companion"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => character.current?.poke()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs text-muted hover:bg-surface-muted"
          >
            <OpenSelectHandGesture width={16} height={16} /> Poke
          </button>
          <button
            type="button"
            onClick={() => character.current?.blink()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs text-muted hover:bg-surface-muted"
          >
            <Eye width={16} height={16} /> Blink
          </button>
        </div>
      </div>
      <div className="min-w-0 space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium">State</p>
          <SelectPicker
            label="Companion state"
            icon={<Sparks width={17} height={17} />}
            value={state}
            options={STATE_NAMES.map((value) => ({ value, label: title(value) }))}
            onValueChange={(value) => {
              const next = STATE_NAMES.find((state) => state === value);
              if (next) setState(next);
            }}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium">Shape</p>
          <SelectPicker
            label="Companion shape"
            icon={<Triangle width={17} height={17} />}
            value={shape}
            options={SHAPE_NAMES.map((value) => ({ value, label: title(value) }))}
            onValueChange={(value) => {
              const next = SHAPE_NAMES.find((shape) => shape === value);
              if (next) setShape(next);
            }}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium">Expression</p>
          <SelectPicker
            label="Companion expression"
            icon={<Emoji width={17} height={17} />}
            value={expression}
            options={[
              { value: 'auto', label: 'Match state' },
              ...EXPRESSION_NAMES.map((value) => ({ value, label: title(value) })),
            ]}
            onValueChange={(value) => {
              if (value === 'auto') setExpression(value);
              else {
                const next = EXPRESSION_NAMES.find((expression) => expression === value);
                if (next) setExpression(next);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
