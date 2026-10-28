import { useReducedMotion } from '../../../hooks/use-reduced-motion';
import { m } from 'motion/react';
import { LocalVideo, type AudioVisualSource } from '../../media';
import { AvatarVoiceContour } from './avatar-voice-contour';
import {
  Voice as AudioLines,
  OpenSelectHandGesture as Hand,
  MicrophoneMute as MicOff,
  Pin,
  PinSlash as PinOff,
  VideoCameraOff as VideoOff,
} from 'iconoir-react';
import { initials, type Participant } from '../meeting-model';

const tones = {
  sage: 'bg-person-sage text-person-sage-ink',
  clay: 'bg-person-clay text-person-clay-ink',
  lavender: 'bg-person-lavender text-person-lavender-ink',
  slate: 'bg-person-slate text-person-slate-ink',
  sand: 'bg-person-sand text-person-sand-ink',
  rose: 'bg-person-rose text-person-rose-ink',
};

export function ParticipantTile({
  reflowKey,
  animateReflow,
  person,
  speaking,
  pinned,
  onPin,
  compact = false,
  stream,
  audio,
}: {
  reflowKey: string;
  animateReflow: boolean;
  person: Participant;
  speaking: boolean;
  pinned: boolean;
  onPin: () => void;
  compact?: boolean;
  stream?: MediaStream | null;
  audio?: AudioVisualSource;
}) {
  const reduced = useReducedMotion();
  return (
    <m.article
      layout={animateReflow && !reduced ? 'position' : false}
      layoutDependency={reflowKey}
      transition={{ type: 'spring', stiffness: 420, damping: 42 }}
      aria-label={`${person.name}${person.self ? ', you' : ''}${speaking ? ', speaking' : ''}`}
      className={`group relative flex h-full min-h-0 min-w-0 flex-1 flex-col items-center overflow-hidden [container-type:size] [container-name:tile] rounded-2xl border ${speaking ? 'border-success' : 'border-border/60'} ${stream ? 'text-white bg-black' : 'bg-surface text-text'}`}
    >
      {stream && (
        <>
          <LocalVideo stream={stream} label="Your camera video" mirror />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/25" />
        </>
      )}
      <TileControls person={person} compact={compact} pinned={pinned} onPin={onPin} />
      <TileAvatar
        person={person}
        compact={compact}
        stream={stream}
        audio={audio}
        reflowKey={reflowKey}
        animate={animateReflow && !reduced}
      />
      <div className="flex min-h-11 w-full shrink-0 items-center gap-2 px-3 pt-2 pb-3">
        <span title={person.name} className="min-w-0 truncate text-xs font-medium text-shadow-sm">
          {person.name}
          {person.self ? ' (you)' : ''}
        </span>
        <TileIndicators person={person} speaking={speaking} compact={compact} />
      </div>
    </m.article>
  );
}

function TileAvatar({
  person,
  compact,
  stream,
  audio,
  reflowKey,
  animate,
}: {
  person: Participant;
  compact: boolean;
  stream?: MediaStream | null;
  audio?: AudioVisualSource;
  reflowKey: string;
  animate: boolean;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden px-4 [container-type:size]">
      <m.div
        layout={animate ? 'position' : false}
        layoutDependency={reflowKey}
        transition={{ type: 'spring', stiffness: 420, damping: 42 }}
        className={`${stream ? 'invisible' : ''} relative grid shrink-0 place-items-center font-medium tracking-[-0.04em] ${tones[
          person.tone
        ]
          .split(' ')
          .filter((tone) => tone.startsWith('text-'))
          .join(
            ' ',
          )} ${compact ? 'size-[min(4.5rem,95cqh,90cqw)] text-lg' : 'size-[min(9.75rem,75cqh,90cqw)] text-[clamp(1.5rem,3vw,2.5rem)]'}`}
        aria-hidden="true"
      >
        {!stream && audio && <AvatarVoiceContour source={audio} />}
        <span
          data-slot="participant-avatar"
          className={`relative grid size-2/3 place-items-center rounded-full ${tones[person.tone]}`}
        >
          {initials(person.name)}
        </span>
      </m.div>
      {!compact && !stream && person.role && (
        <span
          title={person.role}
          dir="auto"
          className="mt-3 line-clamp-2 max-w-full shrink-0 text-center text-xs opacity-75 [overflow-wrap:anywhere] [@container_tile_(height<15rem)]:hidden"
        >
          {person.role}
        </span>
      )}
    </div>
  );
}
function TileIndicators({
  person,
  speaking,
  compact,
}: {
  person: Participant;
  speaking: boolean;
  compact: boolean;
}) {
  return (
    <>
      {' '}
      {person.hand && (
        <span
          className="grid size-6 shrink-0 place-items-center rounded-full bg-surface text-warning"
          aria-label="Hand raised"
        >
          <Hand width={13} height={13} aria-hidden="true" />
        </span>
      )}
      <span className="ms-auto flex shrink-0 items-center gap-1.5">
        {speaking && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-[10px] font-medium text-success">
            <AudioLines width={12} height={12} aria-hidden="true" />
            <span className={compact ? 'sr-only' : 'hidden min-[800px]:inline'}>Speaking</span>
          </span>
        )}
        {!person.microphone && (
          <span
            className="grid size-6 place-items-center rounded-full bg-surface/90 text-error"
            aria-label="Microphone off"
          >
            <MicOff width={13} height={13} aria-hidden="true" />
          </span>
        )}
      </span>
    </>
  );
}

function TileControls({
  person,
  compact,
  pinned,
  onPin,
}: {
  person: Participant;
  compact: boolean;
  pinned: boolean;
  onPin: () => void;
}) {
  return (
    <div className="flex min-h-11 w-full shrink-0 items-center justify-between gap-2 px-3 pt-2">
      {!person.camera && !compact && (
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-surface/90 px-2 py-1 text-[10px] font-medium text-error">
          <VideoOff width={12} height={12} aria-hidden="true" />
          <span className="truncate">Camera off</span>
        </span>
      )}
      <button
        type="button"
        aria-label={`${pinned ? 'Unpin' : 'Pin'} ${person.name}`}
        aria-pressed={pinned}
        title={`${pinned ? 'Unpin' : 'Pin'} ${person.name}`}
        onClick={onPin}
        className={`ms-auto grid size-9 shrink-0 cursor-pointer place-items-center rounded-full ${pinned ? 'bg-surface text-text shadow-sm' : 'bg-transparent opacity-65 hover:bg-surface-muted hover:opacity-100'}`}
      >
        {pinned ? (
          <PinOff width={15} height={15} aria-hidden="true" />
        ) : (
          <Pin width={15} height={15} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
