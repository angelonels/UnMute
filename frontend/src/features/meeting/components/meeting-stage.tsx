import { LocalVideo } from '../../media';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Voice as AudioLines,
  Presentation as MonitorUp,
} from 'iconoir-react';
import { focusOrder, galleryGeometry, type Participant } from '../meeting-model';
import { ParticipantTile } from './participant-tile';

export function MeetingStage({
  reflowKey,
  animateReflow,
  selfSpeaking,
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
  reflowKey: string;
  animateReflow: boolean;
  selfSpeaking: boolean;
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
  const { focus, focused, visible, columns, pageCount, currentPage } = stageSelection(
    people,
    pinnedId,
    speakerId,
    layout,
    sharing,
    size,
    page,
  );
  const speaker = people.find(
    (person) => person.id === speakerId && person.microphone && (!person.self || selfSpeaking),
  );
  const tile = (person: Participant, compact = false) => (
    <ParticipantTile
      reflowKey={`${reflowKey}:${Math.round(size.width)}`}
      animateReflow={animateReflow}
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
    <section
      className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      aria-label="Meeting stage"
    >
      <span className="sr-only" role="status">
        {sharing
          ? 'Your screen · local capture'
          : pinnedId && layout === 'focus'
            ? 'Pinned to your view'
            : speaker
              ? `${speaker.name} is speaking`
              : 'Your room to connect'}
      </span>
      <div ref={stageRef} className="flex min-h-0 flex-1 flex-col gap-3">
        {focused ? (
          <FocusedStage
            sharing={sharing}
            screenStream={screenStream}
            focus={focus}
            height={size.height}
            visible={visible}
            tile={tile}
          />
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
      <StagePages
        pageCount={pageCount}
        focused={focused}
        height={size.height}
        speaker={speaker}
        visible={visible}
        speakerId={speakerId}
        currentPage={currentPage}
        setPage={setPage}
        onFocus={onFocus}
      />
    </section>
  );
}

function stageSelection(
  people: Participant[],
  pinnedId: string | null,
  speakerId: string,
  layout: 'gallery' | 'focus',
  sharing: boolean,
  size: { width: number; height: number },
  page: number,
) {
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
  return { focus, focused, visible, columns, pageCount, currentPage };
}

function SharedScreen({ stream }: { stream: MediaStream }) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
      <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
        <MonitorUp width={13} height={13} className="text-success" aria-hidden="true" />
        Your screen · local capture
      </span>
      <LocalVideo stream={stream} label="Your shared screen" contain />
    </div>
  );
}

function StagePages({
  pageCount,
  focused,
  height,
  speaker,
  visible,
  speakerId,
  currentPage,
  setPage,
  onFocus,
}: {
  pageCount: number;
  focused: boolean;
  height: number;
  speaker: Participant | undefined;
  visible: Participant[];
  speakerId: string;
  currentPage: number;
  setPage: (value: number) => void;
  onFocus: () => void;
}) {
  return (
    <>
      {' '}
      {pageCount > 1 && (!focused || height >= 280) && (
        <nav
          aria-label="Participant pages"
          className="relative flex h-9 shrink-0 items-center justify-center gap-4"
        >
          {!focused && speaker && !visible.some((person) => person.id === speakerId) && (
            <button
              type="button"
              onClick={onFocus}
              aria-label="Show speaker"
              className="absolute start-0 inline-flex min-h-9 max-w-[calc((100%-10rem)/2)] items-center gap-1.5 overflow-hidden px-2 text-xs text-muted hover:text-text"
            >
              <AudioLines width={13} height={13} className="shrink-0" aria-hidden="true" />
              <span className="hidden truncate sm:inline">Show speaker</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Previous participants"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-surface text-text disabled:cursor-default disabled:opacity-35"
          >
            <ArrowLeft width={15} height={15} aria-hidden="true" />
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
            <ArrowRight width={15} height={15} aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}

function FocusedStage({
  sharing,
  screenStream,
  focus,
  height,
  visible,
  tile,
}: {
  sharing: boolean;
  screenStream: MediaStream | null;
  focus: Participant | undefined;
  height: number;
  visible: Participant[];
  tile: (person: Participant, compact?: boolean) => ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        {sharing && screenStream ? (
          <SharedScreen stream={screenStream} />
        ) : focus ? (
          tile(focus, height < 220)
        ) : null}
      </div>
      {visible.length > 0 && height >= 280 && (
        <div
          className="grid h-32 shrink-0 gap-2 sm:h-36"
          aria-label="Participant filmstrip"
          style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0,1fr))` }}
        >
          {visible.map((person) => tile(person, true))}
        </div>
      )}
    </>
  );
}
