/**
 * Locked in-call shell prototype.
 * Hybrid equal gallery + optional spotlight. Pin is never assumed.
 * Reference only — do not promote into frontend/shared until a real call feature needs it.
 */
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { Theme, MediaTheme } from '@astryxdesign/core/theme';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type SVGProps,
} from 'react';
import { unmuteTheme } from '../../theme/unmute';
import {
  equalTileLayout,
  spotlightFrame,
  TILE_GAP,
} from './-call-layout';
import {
  PEOPLE_MAX,
  PEOPLE_MIN,
  clampSpotlight,
  type ResolvedCallShellSearch,
} from './-call-search';
import './-call-shell.css';

const ROSTER = [
  { id: 'you', name: 'You', hue: 0, faceX: 26, faceY: 46 },
  { id: 'maya', name: 'Maya Chen', hue: 14, faceX: 30, faceY: 40 },
  { id: 'leo', name: 'Leo Park', hue: 28, faceX: 22, faceY: 42 },
  { id: 'priya', name: 'Priya Shah', hue: 8, faceX: 34, faceY: 38 },
  { id: 'jonah', name: 'Jonah Hale', hue: -12, faceX: 20, faceY: 48 },
  { id: 'amara', name: 'Amara Nwosu', hue: 22, faceX: 28, faceY: 36 },
  { id: 'kenji', name: 'Kenji Mori', hue: -6, faceX: 24, faceY: 44 },
  { id: 'sofia', name: 'Sofia Alvarez', hue: 18, faceX: 32, faceY: 41 },
  { id: 'noah', name: 'Noah Berg', hue: 32, faceX: 21, faceY: 39 },
  { id: 'leila', name: 'Leila Haddad', hue: 6, faceX: 29, faceY: 47 },
  { id: 'owen', name: 'Owen Brooks', hue: -16, faceX: 25, faceY: 43 },
  { id: 'rina', name: 'Rina Patel', hue: 36, faceX: 33, faceY: 37 },
] as const;

type Person = (typeof ROSTER)[number] & { index: number };

function useElementSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return undefined;
    }
    const update = () => {
      const next = { w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) };
      setSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export function CallShellPage({
  search,
  onSearch,
}: {
  search: ResolvedCallShellSearch;
  onSearch: (patch: Partial<ResolvedCallShellSearch>) => void;
}) {
  const { ref: stageRef, size } = useElementSize();
  const people = ROSTER.slice(0, search.people).map((person, index) => ({
    ...person,
    index,
  }));

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === 'Escape' && search.speaker !== null) {
        event.preventDefault();
        onSearch({ speaker: null });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearch, search.speaker]);

  function onTile(index: number) {
    onSearch({ speaker: search.speaker === index ? null : index });
  }

  return (
    <Theme theme={unmuteTheme} mode={search.sheet === 'light' ? 'light' : 'dark'}>
      <main className="call-shell">
        <div ref={stageRef} className="call-stage">
          {size.w > 0 && size.h > 0 ? (
            search.speaker === null ? (
              <EqualGallery
                people={people}
                size={size}
                onSpeaker={onTile}
              />
            ) : (
              <SpotlightGrid
                people={people}
                speaker={search.speaker}
                size={size}
                onSpeaker={onTile}
              />
            )
          ) : null}
        </div>
        <MediaTheme mode="dark">
          <div className="call-live">
            <LivePill />
          </div>
          <div className="call-cue">
            <AiCue />
          </div>
          <div className="call-dock">
            <Card elevation="high" padding={2}>
              <CallControls />
            </Card>
          </div>
        </MediaTheme>
      </main>
      <nav className="call-switcher" aria-label="Call layout">
        <Card elevation="high" padding={2}>
          <HStack gap={2} vAlign="center">
            <SegmentedControl
              label="Call layout"
              size="sm"
              value={search.speaker === null ? 'gallery' : 'spotlight'}
              onChange={(value) => {
                onSearch({
                  speaker: value === 'gallery' ? null : (search.speaker ?? 0),
                });
              }}
            >
              <SegmentedControlItem value="gallery" label="Gallery" />
              <SegmentedControlItem value="spotlight" label="Spotlight" />
            </SegmentedControl>
            {search.speaker !== null ? (
              <Text type="supporting">{people[search.speaker]?.name}</Text>
            ) : null}
            <HStack gap={1} vAlign="center">
              <IconButton
                label="Fewer people"
                icon={<Icon icon={MinusGlyph} />}
                size="sm"
                variant="ghost"
                isDisabled={search.people <= PEOPLE_MIN}
                onClick={() => {
                  const peopleCount = search.people - 1;
                  onSearch({
                    people: peopleCount,
                    speaker: clampSpotlight(search.speaker, peopleCount),
                  });
                }}
              />
              <Text type="label" aria-live="polite">
                {search.people}
              </Text>
              <IconButton
                label="More people"
                icon={<Icon icon={PlusGlyph} />}
                size="sm"
                variant="ghost"
                isDisabled={search.people >= PEOPLE_MAX}
                onClick={() => onSearch({ people: search.people + 1 })}
              />
            </HStack>
            <Switch
              label="light sheet"
              size="sm"
              value={search.sheet === 'light'}
              onChange={(on) => onSearch({ sheet: on ? 'light' : undefined })}
            />
          </HStack>
        </Card>
      </nav>
    </Theme>
  );
}

function EqualGallery({
  people,
  size,
  onSpeaker,
}: {
  people: Person[];
  size: { w: number; h: number };
  onSpeaker: (index: number) => void;
}) {
  const layout = equalTileLayout(people.length, size.w, size.h, TILE_GAP);
  return (
    <div className="call-gallery" role="region" aria-label="Equal gallery">
      {people.map((person) => (
        <Tile
          key={person.id}
          person={person}
          isSpeaker={false}
          width={layout.tileW}
          height={layout.tileH}
          onSelect={() => onSpeaker(person.index)}
        />
      ))}
    </div>
  );
}

function SpotlightGrid({
  people,
  speaker,
  size,
  onSpeaker,
}: {
  people: Person[];
  speaker: number;
  size: { w: number; h: number };
  onSpeaker: (index: number) => void;
}) {
  if (people.length <= 1) {
    const person = people[0];
    if (!person) {
      return null;
    }
    return (
      <div role="region" aria-label="Spotlight" style={{ width: '100%', height: '100%' }}>
        <Tile
          person={person}
          isSpeaker
          fill
          onSelect={() => onSpeaker(person.index)}
        />
      </div>
    );
  }

  if (people.length === 2) {
    const stacked = size.w < size.h * 0.9;
    return (
      <div
        className="call-split"
        data-axis={stacked ? 'col' : 'row'}
        role="region"
        aria-label="Spotlight"
      >
        {people.map((person) => (
          <Tile
            key={person.id}
            person={person}
            isSpeaker={person.index === speaker}
            fill
            onSelect={() => onSpeaker(person.index)}
          />
        ))}
      </div>
    );
  }

  const speakerPerson = people[speaker] ?? people[0];
  if (!speakerPerson) {
    return null;
  }
  const others = people.filter((person) => person.index !== speakerPerson.index);
  const frame = spotlightFrame(others.length, size.w, size.h, TILE_GAP);

  return (
    <div className="call-spotlight" data-side={frame.side} role="region" aria-label="Spotlight">
      <div
        className="call-spotlight-main"
        style={{ width: frame.main.w, height: frame.main.h, flex: '0 0 auto' }}
      >
        <Tile
          person={speakerPerson}
          isSpeaker
          fill
          onSelect={() => onSpeaker(speakerPerson.index)}
        />
      </div>
      <div
        className="call-spotlight-strip"
        data-side={frame.side}
        style={{ width: frame.strip.w, height: frame.strip.h, flex: '0 0 auto' }}
      >
        {others.map((person) => (
          <Tile
            key={person.id}
            person={person}
            isSpeaker={false}
            fill
            onSelect={() => onSpeaker(person.index)}
          />
        ))}
      </div>
    </div>
  );
}

function Tile({
  person,
  isSpeaker,
  onSelect,
  width,
  height,
  fill,
}: {
  person: Person;
  isSpeaker: boolean;
  onSelect: () => void;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  const style: CSSProperties = {
    ...faceStyle(person),
    ...(width ? { width } : null),
    ...(height ? { height } : null),
  } as CSSProperties;

  return (
    <button
      type="button"
      className="call-tile"
      data-speaker={isSpeaker}
      data-fill={fill ? 'true' : undefined}
      aria-pressed={isSpeaker}
      aria-label={
        isSpeaker
          ? person.name + ', spotlighted, click to return to gallery'
          : 'Spotlight ' + person.name
      }
      style={style}
      onClick={onSelect}
    >
      <div className="call-video" />
      <div className="call-tile-meta">
        <MediaTheme mode="dark">
          <HStack gap={1} padding={1} vAlign="center">
            <StatusDot
              variant={isSpeaker ? 'success' : 'neutral'}
              label={isSpeaker ? person.name + ' is spotlighted' : person.name + ' is live'}
              isPulsing={isSpeaker}
            />
            <Text type="label" color="inherit" className="call-tile-name">
              {person.name}
            </Text>
          </HStack>
        </MediaTheme>
      </div>
    </button>
  );
}

function faceStyle(person: Person): CSSProperties {
  return {
    '--face-hue': person.hue + 'deg',
    '--face-x': person.faceX + '%',
    '--face-y': person.faceY + '%',
  } as CSSProperties;
}

function LivePill() {
  return (
    <Card elevation="med" padding={2}>
      <HStack gap={2} vAlign="center">
        <StatusDot variant="error" label="Live indicator" isPulsing />
        <Text type="label">LIVE</Text>
        <Text type="supporting">Standup · 24:12</Text>
      </HStack>
    </Card>
  );
}

function AiCue() {
  return (
    <Card elevation="med" padding={3}>
      <VStack gap={1} align="start">
        <Text type="supporting">Cue</Text>
        <Text type="code">Ask about the Q3 timeline</Text>
      </VStack>
    </Card>
  );
}

function CallControls() {
  return (
    <HStack gap={2} vAlign="center">
      <IconButton
        label="Mute microphone"
        tooltip="Mute"
        icon={<Icon icon="microphone" />}
      />
      <IconButton
        label="Toggle camera"
        tooltip="Camera"
        icon={<Icon icon={CameraGlyph} />}
      />
      <IconButton
        label="Leave call"
        tooltip="Leave"
        variant="destructive"
        icon={<Icon icon={EndGlyph} />}
      />
      <IconButton
        label="More actions"
        tooltip="More"
        variant="ghost"
        icon={<Icon icon="moreHorizontal" />}
      />
      <Button label="Share" variant="primary" />
    </HStack>
  );
}

function CameraGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="M15 10l6-3v10l-6-3z" />
    </svg>
  );
}

function EndGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 15c4-3 8-3 12 0M8 18l-2-4 4 .5M16 18l2-4-4 .5" />
    </svg>
  );
}

function MinusGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
