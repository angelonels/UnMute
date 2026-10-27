import { LocalVideo } from '../../media';
import { AudioLines, Hand, MicOff, Pin, PinOff, Video, VideoOff } from 'lucide-react';
import { initials, type Participant } from '../meeting-model';

const tones = {
  sage: 'bg-[#dbe7df] text-[#355346] dark:bg-[#233a31] dark:text-[#bdcebf]',
  clay: 'bg-[#f0e1d8] text-[#795741] dark:bg-[#443128] dark:text-[#dbc0ab]',
  lavender: 'bg-[#e5dff1] text-[#65507f] dark:bg-[#352d46] dark:text-[#cfc0e1]',
  slate: 'bg-[#dce4ed] text-[#465b74] dark:bg-[#293644] dark:text-[#bdcbdc]',
  sand: 'bg-[#ebe6d5] text-[#6e6344] dark:bg-[#3d3828] dark:text-[#d3cba9]',
  rose: 'bg-[#f1dfe1] text-[#7b4d55] dark:bg-[#452c32] dark:text-[#d9b7be]',
};

export function ParticipantTile({
  person,
  speaking,
  pinned,
  onPin,
  compact = false,
  stream,
}: {
  person: Participant;
  speaking: boolean;
  pinned: boolean;
  onPin: () => void;
  compact?: boolean;
  stream?: MediaStream | null;
}) {
  return (
    <article
      aria-label={`${person.name}${person.self ? ', you' : ''}${speaking ? ', speaking' : ''}`}
      className={`group relative flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 ${speaking ? 'border-success' : 'border-transparent'} ${stream ? 'text-white bg-black' : tones[person.tone]}`}
    >
      {stream && (
        <>
          <LocalVideo stream={stream} label="Your camera video" mirror />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/25" />
        </>
      )}
      <div className="absolute inset-x-3 top-3 flex min-w-0 items-center justify-between gap-2">
        <span
          className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${person.camera ? 'bg-black/5 dark:bg-black/15' : 'bg-surface/90 text-error'} ${compact ? 'hidden sm:inline-flex' : ''}`}
        >
          {person.camera ? (
            <Video size={12} aria-hidden="true" />
          ) : (
            <VideoOff size={12} aria-hidden="true" />
          )}
          <span className="truncate">
            {person.camera ? (stream ? 'Camera on' : 'Video preview') : 'Camera off'}
          </span>
        </span>
        <button
          type="button"
          aria-label={`${pinned ? 'Unpin' : 'Pin'} ${person.name}`}
          aria-pressed={pinned}
          title={`${pinned ? 'Unpin' : 'Pin'} ${person.name}`}
          onClick={onPin}
          className={`ms-auto grid size-9 shrink-0 cursor-pointer place-items-center rounded-full ${pinned ? 'bg-surface text-text shadow-sm' : 'bg-black/5 hover:bg-black/10 dark:bg-black/15 dark:hover:bg-black/25'}`}
        >
          {pinned ? <PinOff size={15} aria-hidden="true" /> : <Pin size={15} aria-hidden="true" />}
        </button>
      </div>
      <div
        className={`${stream ? 'invisible' : ''} grid shrink-0 place-items-center rounded-full bg-white/30 font-medium tracking-[-0.04em] shadow-[inset_0_1px_0_#ffffff30] dark:bg-white/8 ${compact ? 'size-12 text-lg' : 'size-[clamp(3.5rem,8vw,6.5rem)] text-[clamp(1.5rem,3vw,2.5rem)]'}`}
        aria-hidden="true"
      >
        {initials(person.name)}
      </div>
      {!compact && !stream && <span className="mt-3 text-xs opacity-75">{person.role}</span>}
      <div className="absolute inset-x-3 bottom-3 flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-shadow-sm">
          {person.name}
          {person.self ? ' (you)' : ''}
        </span>
        {person.hand && (
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full bg-surface text-warning"
            aria-label="Hand raised"
          >
            <Hand size={13} aria-hidden="true" />
          </span>
        )}
        <span className="ms-auto flex shrink-0 items-center gap-1.5">
          {speaking && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-[10px] font-medium text-success">
              <AudioLines size={12} aria-hidden="true" />
              <span className={compact ? 'sr-only' : 'hidden min-[800px]:inline'}>Speaking</span>
            </span>
          )}
          {!person.microphone && (
            <span
              className="grid size-6 place-items-center rounded-full bg-surface/90 text-error"
              aria-label="Microphone off"
            >
              <MicOff size={13} aria-hidden="true" />
            </span>
          )}
        </span>
      </div>
    </article>
  );
}
