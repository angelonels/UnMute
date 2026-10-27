import { LocalVideo } from '../../media';
import { AudioLines, Hand, MicOff, Pin, PinOff, Video, VideoOff } from 'lucide-react';
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
      className={`group relative flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border ${speaking ? 'border-success' : 'border-border/60'} ${stream ? 'text-white bg-black' : 'bg-surface text-text'}`}
    >
      {stream && (
        <>
          <LocalVideo stream={stream} label="Your camera video" mirror />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/25" />
        </>
      )}
      <div className="absolute inset-x-3 top-3 flex min-w-0 items-center justify-between gap-2">
        {!person.camera && (
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
        )}
        <button
          type="button"
          aria-label={`${pinned ? 'Unpin' : 'Pin'} ${person.name}`}
          aria-pressed={pinned}
          title={`${pinned ? 'Unpin' : 'Pin'} ${person.name}`}
          onClick={onPin}
          className={`ms-auto grid size-9 shrink-0 cursor-pointer place-items-center rounded-full ${pinned ? 'bg-surface text-text shadow-sm' : 'bg-transparent opacity-65 hover:bg-surface-muted hover:opacity-100'}`}
        >
          {pinned ? <PinOff size={15} aria-hidden="true" /> : <Pin size={15} aria-hidden="true" />}
        </button>
      </div>
      <div
        className={`${stream ? 'invisible' : ''} grid shrink-0 place-items-center rounded-full font-medium tracking-[-0.04em] ${tones[person.tone]} ${compact ? 'size-12 text-lg' : 'size-[clamp(3.5rem,8vw,6.5rem)] text-[clamp(1.5rem,3vw,2.5rem)]'}`}
        aria-hidden="true"
      >
        {initials(person.name)}
      </div>
      {!compact && !stream && <span className="mt-3 text-xs opacity-75">{person.role}</span>}
      <div className="absolute inset-x-3 bottom-3 flex min-w-0 items-center gap-2">
        <span title={person.name} className="min-w-0 truncate text-xs font-medium text-shadow-sm">
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
