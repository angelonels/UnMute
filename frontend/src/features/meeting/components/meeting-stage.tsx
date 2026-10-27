import { LocalVideo } from '../../media';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, AudioLines, MonitorUp, Pin, Sparkles } from 'lucide-react';
import { focusOrder, galleryGeometry, type Participant } from '../meeting-model';
import { ParticipantTile } from './participant-tile';

export function MeetingStage({
  cameraStream,
  screenStream,
  people,
  speakerId,
  pinnedId,
  layout,
  sharing,
  captions,
  demo,
  onPin,
  onFocus,
}: {
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
  people: Participant[];
  speakerId: string;
  pinnedId: string | null;
  layout: 'gallery' | 'focus';
  sharing: boolean;
  captions: boolean;
  demo: boolean;
  onPin: (id: string) => void;
  onFocus: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const [page, setPage] = useState(0);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const focus =
    people.find((person) => person.id === pinnedId) ??
    people.find((person) => person.id === speakerId) ??
    people[0];
  const focused = layout === 'focus' || sharing;
  const sticky = sharing ? people.find((person) => person.id === pinnedId) : undefined;
  const allOrdered = focused
    ? focusOrder(people, pinnedId, speakerId, sharing ? undefined : focus?.id)
    : people;
  const ordered = allOrdered.filter((person) => person.id !== sticky?.id);
  const geometry = galleryGeometry(size.width, size.height, ordered.length);
  const slots = focused ? (size.width < 520 ? 2 : size.width < 900 ? 3 : 5) : geometry.capacity;
  const capacity = Math.max(1, slots - (sticky ? 1 : 0));
  const pageCount = Math.max(1, Math.ceil(ordered.length / capacity));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = [
    ...(sticky ? [sticky] : []),
    ...ordered.slice(currentPage * capacity, (currentPage + 1) * capacity),
  ];
  const columns = Math.min(geometry.columns, visible.length || 1);
  const speaker = people.find((person) => person.id === speakerId && person.microphone);
  const tile = (person: Participant, compact = false) => (
    <ParticipantTile
      key={person.id}
      person={person}
      stream={person.self ? cameraStream : null}
      compact={compact}
      speaking={person.id === speaker?.id}
      pinned={person.id === pinnedId}
      onPin={() => onPin(person.id)}
    />
  );
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" aria-label="Meeting stage">
      <div className="flex min-h-8 shrink-0 items-center justify-between gap-2 px-1 text-xs text-muted">
        <span className="inline-flex min-w-0 items-center gap-2">
          {sharing ? (
            <>
              <MonitorUp size={14} className="text-success" aria-hidden="true" />
              Your screen · local capture
            </>
          ) : pinnedId && layout === 'focus' ? (
            <>
              <Pin size={13} aria-hidden="true" />
              Pinned to your view
            </>
          ) : speaker ? (
            <>
              <AudioLines size={14} className="text-success" aria-hidden="true" />
              <span className="truncate">{speaker.name} is speaking</span>
            </>
          ) : (
            'Your room to connect'
          )}
        </span>
        {!focused && speaker && !visible.some((person) => person.id === speakerId) && (
          <button className="min-h-8 shrink-0 cursor-pointer px-2 text-primary" onClick={onFocus}>
            Show speaker
          </button>
        )}
        <span className="shrink-0 tabular-nums">
          {people.length} {people.length === 1 ? 'person' : 'people'}
        </span>
      </div>
      <div ref={stageRef} className="flex min-h-0 flex-1 flex-col gap-3">
        {focused ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              {sharing && screenStream ? (
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
                  <LocalVideo stream={screenStream} label="Your shared screen" contain />
                </div>
              ) : sharing ? (
                <SharedScreen />
              ) : focus ? (
                tile(focus, size.height < 220)
              ) : null}
            </div>
            {visible.length > 0 && size.height >= 280 && (
              <div
                className="grid h-32 shrink-0 gap-2 sm:h-36"
                aria-label="Participant filmstrip"
                style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0,1fr))` }}
              >
                {visible.map((person) => tile(person, true))}
              </div>
            )}
          </>
        ) : (
          <div
            role="region"
            aria-label="Participant gallery"
            className="grid min-h-0 flex-1 gap-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
              gridTemplateRows: `repeat(${Math.ceil(visible.length / columns)}, minmax(0,1fr))`,
            }}
          >
            {visible.map((person) => tile(person, size.height < 220))}
          </div>
        )}
      </div>
      {captions && (
        <div
          className="shrink-0 rounded-xl bg-surface px-4 py-3 text-center text-xs leading-5 text-text"
          role="status"
        >
          <span className="me-2 font-medium text-muted">
            {demo ? 'Sample captions' : 'Captions'}
          </span>
          {demo
            ? 'Maya: “Let’s give the conversation a little more room.”'
            : 'Live captions will be available when meeting services are connected.'}
        </div>
      )}
      {pageCount > 1 && (!focused || size.height >= 280) && (
        <nav
          aria-label="Participant pages"
          className="flex h-9 shrink-0 items-center justify-center gap-4"
        >
          <button
            type="button"
            aria-label="Previous participants"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-surface text-text disabled:cursor-default disabled:opacity-35"
          >
            <ArrowLeft size={15} aria-hidden="true" />
          </button>
          <span className="text-xs tabular-nums text-muted">
            {currentPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next participants"
            disabled={currentPage === pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-surface text-text disabled:cursor-default disabled:opacity-35"
          >
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  );
}

function SharedScreen() {
  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#f6f4ef] text-[#333b36]"
      aria-label="Shared screen preview"
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-black/8 px-4 text-[10px] text-[#68716a]">
        <span>UnMute / design direction</span>
        <span>Sample screen</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overscroll-contain p-[clamp(1rem,4vw,3rem)]">
        <span className="mb-4 inline-flex items-center gap-2 text-[10px] font-medium tracking-widest text-[#6f7868]">
          <Sparkles size={13} aria-hidden="true" />
          MAKE ROOM FOR THE MOMENT
        </span>
        <h2 className="max-w-xl text-[clamp(1.5rem,3.5vw,3.5rem)] leading-[1.06] font-medium tracking-[-0.055em]">
          A clearer space
          <br />
          to connect.
        </h2>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#dce6dc] p-3 text-[10px] sm:p-5">
            <span className="block text-xl sm:text-3xl">01</span>
            <p className="mt-2">People first</p>
          </div>
          <div className="rounded-xl bg-[#e7ddd3] p-3 text-[10px] sm:p-5">
            <span className="block text-xl sm:text-3xl">02</span>
            <p className="mt-2">Less noise</p>
          </div>
          <div className="rounded-xl bg-[#e2dff0] p-3 text-[10px] sm:p-5">
            <span className="block text-xl sm:text-3xl">03</span>
            <p className="mt-2">More presence</p>
          </div>
        </div>
        <p className="mt-5 text-[10px] text-[#68716a]">
          Frontend preview • no screen is being captured
        </p>
      </div>
    </section>
  );
}
