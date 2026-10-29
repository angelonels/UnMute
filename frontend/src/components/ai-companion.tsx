import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { useTheme } from 'next-themes';
import {
  createEngine,
  renderStillSvg,
  type EngineHandle,
  type ExpressionName,
  type ShapeName,
  type StateName,
} from './companion/dotty-engine';
import type { CompanionEmotion, CompanionOptions, CompanionScene } from './companion/scene';

export interface CompanionHandle {
  poke: () => void;
  blink: () => void;
}
interface CompanionProps {
  size?: number;
  active?: boolean;
  label?: string;
  className?: string;
  finish?: 'auto' | 'ceramic' | 'graphite';
  emotion?: CompanionEmotion;
  state?: StateName;
  shape?: ShapeName;
  expression?: ExpressionName | null;
  attention?: 'composer' | 'answer' | null;
  dimensional?: boolean;
  pokeable?: boolean;
  onPoke?: () => void;
  ref?: Ref<CompanionHandle>;
}
type CharacterProps = CompanionProps & {
  state: StateName;
  shape: ShapeName;
  expression: ExpressionName | null;
};

/** One Dotty personality, with a numeric 3D renderer and the original SVG for compact marks. */
export function AICompanion({
  ref,
  pokeable = false,
  onPoke,
  state = 'idle',
  shape = 'blob',
  emotion = 'auto',
  expression,
  ...props
}: CompanionProps) {
  const character = useRef<CompanionHandle>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [greeting, setGreeting] = useState(0);
  const engaged = hovered || focused;
  useEffect(() => {
    if (!greeting) return;
    const timer = window.setTimeout(() => setGreeting(0), 1400);
    return () => window.clearTimeout(timer);
  }, [greeting]);
  useImperativeHandle(
    ref,
    () => ({ poke: () => character.current?.poke(), blink: () => character.current?.blink() }),
    [],
  );
  const face =
    pokeable && state === 'idle' && !props.attention && expression === undefined
      ? greeting
        ? 'surprised'
        : engaged
          ? 'inspecting'
          : companionExpression(expression, emotion, state)
      : companionExpression(expression, emotion, state);
  const common = {
    ...props,
    state,
    shape,
    expression: face,
    emotion,
    ref: character,
    label: pokeable ? undefined : props.label,
    active: props.active || (pokeable && engaged),
  };
  const content =
    props.dimensional || (props.size ?? 24) >= 48 ? (
      <Companion3D {...common} />
    ) : (
      <CompanionMark {...common} />
    );
  return pokeable ? (
    <button
      type="button"
      aria-label={props.label ?? 'Say hello to Mumo'}
      title="Say hello"
      data-interaction={greeting ? 'greeted' : engaged ? 'engaged' : 'idle'}
      className="relative shrink-0 scale-100 cursor-pointer rounded-full bg-transparent p-0 transition-[background-color] duration-150 ease-out hover:bg-primary/5 motion-safe:transition-[scale,background-color] motion-safe:enabled:active:not-focus-visible:scale-[0.96]"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => {
        character.current?.poke();
        setGreeting((value) => value + 1);
        onPoke?.();
      }}
    >
      {content}
      {greeting > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text shadow-sm"
        >
          Hi!
        </span>
      )}
      <span role="status" className="sr-only">
        {greeting ? 'Mumo says hello.' : ''}
      </span>
    </button>
  ) : (
    content
  );
}

function CompanionMark({
  size = 24,
  active = false,
  label,
  className = '',
  state,
  shape,
  expression,
  attention = null,
  ref,
}: CharacterProps) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLSpanElement>(null);
  const engine = useRef<EngineHandle | null>(null);
  const [poster] = useState(() => ({ __html: renderStillSvg({ shape, state, expression }) }));
  useImperativeHandle(
    ref,
    () => ({ poke: () => engine.current?.poke(), blink: () => engine.current?.blink() }),
    [],
  );
  const initialOptions = useEffectEvent(() => ({
    state,
    shape,
    expression,
    attention,
    followPointer: false,
    reducedMotion: reduced,
    maxFrameRate: 30,
  }));
  useEffect(() => {
    if (!host.current) return;
    engine.current = createEngine(host.current, initialOptions());
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
    // Initial options are reconciled by the update effect below.
  }, []);
  useEffect(() => {
    engine.current?.update({ state, shape, expression, attention, reducedMotion: reduced });
  }, [state, shape, expression, attention, reduced]);
  useEffect(() => {
    if (active) engine.current?.blink();
  }, [active]);
  return (
    <span
      ref={host}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 align-middle [--dotty-ink:var(--companion-body)] [--dotty-spot:var(--companion-face)] ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={poster}
    />
  );
}

function Companion3D({
  size = 88,
  active = false,
  label,
  className = '',
  finish = 'auto',
  emotion = 'auto',
  state,
  shape,
  expression,
  attention = null,
  ref,
}: CharacterProps) {
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<CompanionScene | null>(null);
  const fallback = useRef<CompanionHandle>(null);
  const visible = useRef(false);
  const ceramic = finish === 'ceramic' || (finish === 'auto' && resolvedTheme === 'dark');
  const options = useRef<CompanionOptions>({
    ceramic,
    reduced,
    visible: false,
    active,
    emotion,
    state,
    shape,
    expression,
    attention,
  });
  useImperativeHandle(
    ref,
    () => ({
      poke: () => (scene.current ?? fallback.current)?.poke(),
      blink: () => (scene.current ?? fallback.current)?.blink(),
    }),
    [],
  );
  useEffect(() => {
    options.current = {
      ceramic,
      reduced,
      visible: visible.current,
      active,
      emotion,
      state,
      shape,
      expression,
      attention,
    };
    scene.current?.update(options.current);
  }, [ceramic, reduced, active, emotion, state, shape, expression, attention]);
  useEffect(() => {
    const node = host.current,
      surface = canvas.current;
    if (!node || !surface || typeof IntersectionObserver === 'undefined') return;
    let alive = true,
      requested = false,
      prepareFrame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = !!entry?.isIntersecting;
      scene.current?.update({ ...options.current, visible: visible.current });
      if (!visible.current || requested) return;
      requested = true;
      void import('./companion/scene')
        .then(({ createCompanionScene }) => {
          if (!alive) return;
          prepareFrame = requestAnimationFrame(() => {
            if (!alive) return;
            try {
              scene.current = createCompanionScene(
                surface,
                { ...options.current, visible: visible.current },
                () => {
                  if (alive) setStatus('unavailable');
                },
              );
              setStatus('ready');
            } catch {
              setStatus('unavailable');
            }
          });
        })
        .catch(() => {
          if (alive) setStatus('unavailable');
        });
    });
    observer.observe(node);
    return () => {
      alive = false;
      cancelAnimationFrame(prepareFrame);
      observer.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    if (status === 'unavailable') {
      scene.current?.dispose();
      scene.current = null;
    }
  }, [status]);
  return (
    <span
      ref={host}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: size, height: size }}
      data-companion-state={state}
      data-companion-shape={shape}
    >
      <canvas
        ref={canvas}
        data-attention={attention ?? 'wandering'}
        data-motion={reduced ? 'still' : 'autonomous'}
        aria-hidden="true"
        className={`absolute inset-0 size-full ${status === 'ready' ? 'visible' : 'invisible'}`}
      />
      {status !== 'ready' && (
        <CompanionMark
          ref={fallback}
          size={size}
          active={active}
          state={state}
          shape={shape}
          expression={expression}
          attention={attention}
        />
      )}
      {status === 'unavailable' && label && (
        <span className="sr-only">3D rendering unavailable.</span>
      )}
    </span>
  );
}

function companionExpression(
  expression: ExpressionName | null | undefined,
  emotion: CompanionEmotion,
  state: StateName,
) {
  if (expression !== undefined) return expression;
  if (emotion === 'curious') return 'inspecting';
  if (emotion === 'calm') return 'calm';
  return emotion === 'happy' || state === 'idle' ? 'happy' : null;
}
