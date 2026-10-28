import { useReducedMotion } from '../../../hooks/use-reduced-motion';
import { AICompanion } from '../../../components/ai-companion';
import { MeetingLayoutIcon } from '../../../components/icons/meeting-layout';
import { m } from 'motion/react';
import { ChatBubbleIcon, type ChatBubbleIconHandle } from '../../../components/icons/chat-bubble';
import SegmentedControl from '../../../components/arc/segmented-control/segmented-control';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ClosedCaptionsTag as Captions,
  OpenSelectHandGesture as Hand,
  Microphone as Mic,
  MicrophoneMute as MicOff,
  Presentation as MonitorUp,
  PhoneDisabled as PhoneOff,
  Group as Users,
  VideoCamera as Video,
  VideoCameraOff as VideoOff,
  Wifi,
  WifiOff,
} from 'iconoir-react';
import { useLocalMedia, useMicrophoneLevel } from '../../media';
import { Brand } from '../../../components/brand';
import { ThemeToggle } from '../../../components/theme-toggle';
import {
  initialMedia,
  formatCount,
  type Connection,
  type MediaPreferences,
  type MeetingMessage,
  type Participant,
} from '../meeting-model';
import {
  createDemoAIStream,
  type DemoAIScenario,
  fixtureMessages,
  fixtureParticipants,
  type DemoDataMode,
} from '../demo-data';
import { MeetingControl } from './meeting-control';
import { MeetingStage } from './meeting-stage';
import { MeetingPanel } from './meeting-panel';
import { MeetingChat, PeopleList } from './meeting-conversations';
import { CompanionHeader } from './companion-header';
import { AIConversation } from './ai-conversation';
import { useAIConversation } from '../use-ai-conversation';
import type { AIStreamSource } from '../ai-stream';
import { DeviceSettings } from './device-settings';
import { DemoControls } from './demo-controls';
import { DemoDataSelector } from './demo-data-selector';

const subscribe = (notify: () => void) => {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};
const snapshot = () => window.innerWidth;
const serverSnapshot = () => 1024;

type MeetingPageProps = {
  aiSource?: AIStreamSource;
  userName: string;
  demo: boolean;
  onRestart: () => void;
  initialMicrophone: boolean;
  initialCamera: boolean;
};
function useMeetingRoom({
  userName,
  demo,
  onRestart,
  initialMicrophone,
  initialCamera,
  aiSource,
}: {
  aiSource?: AIStreamSource;
  userName: string;
  demo: boolean;
  onRestart: () => void;
  initialMicrophone: boolean;
  initialCamera: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const width = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [captureMode, setCaptureMode] = useState('native');
  const localMedia = useLocalMedia(
    initialMicrophone,
    initialCamera,
    import.meta.env.DEV && demo ? captureMode : 'native',
  );
  const microphoneMeterRef = useRef<HTMLMeterElement>(null);
  const microphoneLevel = useMicrophoneLevel(localMedia.streams.microphone, microphoneMeterRef);
  const [preferences, setPreferences] = useState(initialMedia);
  const media = {
    ...preferences,
    microphone: !!localMedia.streams.microphone,
    camera: !!localMedia.streams.camera,
    sharing: !!localMedia.streams.screen,
  };
  const [dataMode, setDataMode] = useState<DemoDataMode>(() => {
    const value = new URLSearchParams(window.location.search).get('data');
    return value === 'worst' || value === 'empty' || value === 'one' || value === 'large'
      ? value
      : 'demo';
  });
  const [count, setCount] = useState(6);
  const [speaker, setSpeaker] = useState('demo-1');
  const [connection, setConnection] = useState<Connection>('ready');
  const [pin, setPin] = useState<string | null>(null);
  const [layout, setLayout] = useState<'gallery' | 'focus'>('gallery');
  const [panels, setPanels] = useState({ left: false, right: false });
  const [rightTab, setRightTab] = useState<'chat' | 'people'>('chat');
  const [keyboard, setKeyboard] = useState(false);
  const [messages, setMessages] = useState<MeetingMessage[]>(() =>
    import.meta.env.DEV && demo ? fixtureMessages(dataMode) : [],
  );
  const [chatDraft, setChatDraft] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [ended, setEnded] = useState(false);
  const [aiScenario, setAiScenario] = useState<DemoAIScenario>('normal');
  const developmentAISource = useMemo(
    () => (import.meta.env.DEV && demo ? createDemoAIStream(aiScenario) : undefined),
    [demo, aiScenario],
  );
  const ai = useAIConversation(aiSource ?? developmentAISource, connection === 'ready' && !ended);
  const aiTrigger = useRef<HTMLButtonElement>(null);
  const chatIcon = useRef<ChatBubbleIconHandle>(null);
  const chatTrigger = useRef<HTMLButtonElement>(null);
  const peopleTrigger = useRef<HTMLButtonElement>(null);
  const [rightOpener, setRightOpener] = useState<'chat' | 'people'>('chat');
  const self: Participant = {
    id: 'self',
    name: userName,
    role: 'Your space',
    tone: 'slate',
    microphone: media.microphone,
    camera: media.camera,
    hand: media.hand,
    self: true,
  };
  const base = import.meta.env.DEV && demo ? fixtureParticipants(dataMode, count, self) : [self];
  const speakerId = base.some((person) => person.id === speaker)
    ? speaker
    : (base.find((person) => !person.self)?.id ?? 'self');
  const people = base.map((person) =>
    !person.self && person.id === speakerId ? { ...person, microphone: true } : person,
  );
  const pinnedId = people.some((person) => person.id === pin) ? pin : null;
  const showLeft = panels.left && (width >= 1440 || !panels.right);
  const openPanel = (side: 'left' | 'right', open: boolean) =>
    setPanels((previous) => ({
      ...previous,
      [side]: open,
      ...(open && width < 1440 ? { [side === 'left' ? 'right' : 'left']: false } : {}),
    }));
  const toggle = (key: keyof MediaPreferences) => {
    if (key === 'camera' || key === 'microphone') localMedia.toggle(key);
    else if (key === 'sharing') localMedia.toggle('screen');
    else setPreferences((previous) => ({ ...previous, [key]: !previous[key] }));
  };
  const pinPerson = (id: string) => {
    setPin((previous) => (previous === id ? null : id));
    setLayout('focus');
  };
  function sendChat() {
    const text = chatDraft.trim();
    if (!text || connection !== 'ready') return;
    setMessages((previous) =>
      [
        ...previous,
        { id: crypto.randomUUID(), authorId: 'self', text, createdAt: new Date().toISOString() },
      ].slice(-200),
    );
    setChatDraft('');
  }
  return {
    userName,
    demo,
    onRestart,
    initialMicrophone,
    initialCamera,
    aiSource,
    reducedMotion,
    width,
    captureMode,
    setCaptureMode,
    localMedia,
    microphoneMeterRef,
    microphoneLevel,
    preferences,
    setPreferences,
    media,
    dataMode,
    setDataMode,
    count,
    setCount,
    speaker,
    setSpeaker,
    connection,
    setConnection,
    pin,
    setPin,
    layout,
    setLayout,
    panels,
    setPanels,
    rightTab,
    setRightTab,
    keyboard,
    setKeyboard,
    messages,
    setMessages,
    chatDraft,
    setChatDraft,
    peopleSearch,
    setPeopleSearch,
    ended,
    setEnded,
    aiScenario,
    setAiScenario,
    developmentAISource,
    ai,
    aiTrigger,
    chatIcon,
    chatTrigger,
    peopleTrigger,
    rightOpener,
    setRightOpener,
    self,
    base,
    speakerId,
    people,
    pinnedId,
    showLeft,
    openPanel,
    toggle,
    pinPerson,
    sendChat,
  };
}
type MeetingRoom = ReturnType<typeof useMeetingRoom>;
export function MeetingPage(props: MeetingPageProps) {
  const room = useMeetingRoom(props);
  if (room.ended) return <MeetingEnded room={room} />;
  return <MeetingRoomView room={room} />;
}
function MeetingEnded({ room }: { room: MeetingRoom }) {
  const { onRestart } = room;
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <main className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-shell">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface-muted text-muted">
          <PhoneOff width={26} height={26} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-medium tracking-[-0.04em]">You’ve left the preview.</h1>
        <p className="mt-3 text-sm leading-7 text-muted">A little space between conversations.</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-7 min-h-12 w-full cursor-pointer rounded-xl bg-primary px-5 text-sm font-medium text-on-primary"
        >
          Rejoin preview
        </button>
        <Link
          to="/"
          search={{ error: undefined }}
          className="mt-3 flex min-h-12 items-center justify-center rounded-xl text-sm text-muted"
        >
          Back to workspace
        </Link>
      </main>
    </div>
  );
}
function MeetingRoomView({ room }: { room: MeetingRoom }) {
  const {
    setKeyboard,
    demo,
    dataMode,
    setDataMode,
    setMessages,
    connection,
    showLeft,
    openPanel,
    ai,
    width,
    aiTrigger,
    keyboard,
    reducedMotion,
    panels,
    microphoneLevel,
    localMedia,
    people,
    speakerId,
    pinnedId,
    layout,
    media,
    pinPerson,
    setPin,
    setLayout,
    rightOpener,
    peopleTrigger,
    chatTrigger,
  } = room;
  return (
    <div
      className="flex h-svh flex-col overflow-hidden bg-canvas p-2 sm:p-3"
      onKeyDownCapture={() => setKeyboard(true)}
      onPointerDownCapture={() => setKeyboard(false)}
    >
      {import.meta.env.DEV && demo && (
        <DemoDataSelector
          value={dataMode}
          onChange={(value) => {
            setDataMode(value);
            setMessages(fixtureMessages(value));
          }}
        />
      )}
      <MeetingHeader room={room} />
      {connection !== 'ready' && (
        <p
          className={`mb-3 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs ${connection === 'offline' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}
          role="alert"
        >
          {connection === 'offline' ? (
            <WifiOff width={14} height={14} aria-hidden="true" />
          ) : (
            <Wifi width={14} height={14} aria-hidden="true" />
          )}
          {connection === 'offline'
            ? 'Disconnected. Chat is paused.'
            : 'Reconnecting. Chat will be available when the connection returns.'}
          <span className="ms-auto text-[10px]">Demo state</span>
        </p>
      )}
      <div className="flex min-h-0 flex-1 gap-2 sm:gap-3">
        <MeetingPanel
          open={showLeft}
          onOpenChange={(open) => openPanel('left', open)}
          side="left"
          title="Mumo"
          header={<CompanionHeader behavior={ai.companion} available={ai.available} demo={demo} />}
          description="Only visible to you"
          modal={width < 1024}
          trigger={aiTrigger}
          keyboard={keyboard}
          onKeyboard={() => setKeyboard(true)}
        >
          <div id="meeting-ai" className="flex min-h-0 flex-1 flex-col">
            <AIConversation
              keyboard={keyboard}
              conversation={ai}
              disabled={connection !== 'ready'}
            />
          </div>
        </MeetingPanel>
        <m.main
          layout={keyboard || reducedMotion ? false : 'position'}
          layoutDependency={`${showLeft}:${panels.right}:${width}`}
          transition={{ type: 'spring', stiffness: 420, damping: 42 }}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <MeetingStage
            reflowKey={`${showLeft}:${panels.right}`}
            animateReflow={!keyboard}
            selfSpeaking={microphoneLevel.speaking}
            selfAudio={microphoneLevel.visual}
            cameraStream={localMedia.streams.camera}
            screenStream={localMedia.streams.screen}
            people={people}
            speakerId={connection === 'ready' ? speakerId : ''}
            pinnedId={pinnedId}
            layout={layout}
            sharing={media.sharing}
            captions={media.captions}
            demo={demo}
            onPin={pinPerson}
            onFocus={() => {
              setPin(null);
              setLayout('focus');
            }}
          />
        </m.main>
        <MeetingPanel
          open={panels.right}
          onOpenChange={(open) => openPanel('right', open)}
          side="right"
          title="Meeting chat"
          description="Keep everyone in the conversation."
          modal={width < 1024}
          trigger={rightOpener === 'people' ? peopleTrigger : chatTrigger}
          keyboard={keyboard}
          onKeyboard={() => setKeyboard(true)}
        >
          <RoomConversation room={room} />
        </MeetingPanel>
      </div>
      {localMedia.error && (
        <div
          role="alert"
          className="mt-2 flex shrink-0 items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-2 text-xs text-error"
        >
          <span>{localMedia.error}</span>
          <button type="button" onClick={localMedia.clearError} className="min-h-11 shrink-0 px-2">
            Dismiss
          </button>
        </div>
      )}
      <MeetingFooter room={room} />
    </div>
  );
}
function MeetingFooter({ room }: { room: MeetingRoom }) {
  const {
    aiTrigger,
    showLeft,
    openPanel,
    ai,
    keyboard,
    layout,
    setLayout,
    peopleTrigger,
    panels,
    rightTab,
    setRightOpener,
    setRightTab,
    people,
    chatTrigger,
    chatIcon,
    pinnedId,
  } = room;
  return (
    <footer className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-x-1 gap-y-2 pt-2 sm:gap-x-3">
      <div className="col-start-1 row-start-1">
        <MeetingControl
          ref={aiTrigger}
          aria-label="Open Mumo"
          aria-expanded={showLeft}
          aria-controls="meeting-ai"
          tone={showLeft ? 'primary' : 'neutral'}
          onClick={() => openPanel('left', !showLeft)}
          icon={
            <AICompanion
              size={44}
              dimensional
              state={ai.companion.state}
              expression={ai.companion.expression}
              attention={ai.companion.attention}
              active={showLeft && !keyboard}
            />
          }
        >
          <span className="hidden min-[420px]:inline">Mumo</span>
        </MeetingControl>
      </div>
      <div className="col-start-2 row-start-1 justify-self-center min-[1100px]:hidden">
        <LayoutPicker layout={layout} onChange={setLayout} />
      </div>
      <div className="col-start-3 row-start-1">
        <div className="flex gap-2">
          <MeetingControl
            ref={peopleTrigger}
            aria-label="Open participants"
            aria-expanded={panels.right && rightTab === 'people'}
            onClick={() => {
              setRightOpener('people');
              setRightTab('people');
              openPanel('right', true);
            }}
            icon={<Users width={18} height={18} strokeWidth={1.5} aria-hidden="true" />}
          >
            <span className="tabular-nums">{formatCount(people.length)}</span>
          </MeetingControl>
          <MeetingControl
            ref={chatTrigger}
            aria-label="Open meeting chat"
            aria-expanded={panels.right && rightTab === 'chat'}
            aria-controls="meeting-chat"
            tone={panels.right && rightTab === 'chat' ? 'primary' : 'neutral'}
            onClick={() => {
              if (!panels.right && !keyboard) chatIcon.current?.startAnimation();
              else chatIcon.current?.stopAnimation();
              setRightOpener('chat');
              setRightTab('chat');
              openPanel('right', !(panels.right && rightTab === 'chat'));
            }}
            icon={<ChatBubbleIcon ref={chatIcon} size={18} aria-hidden="true" />}
          >
            <span className="hidden min-[420px]:inline">Chat</span>
          </MeetingControl>
        </div>
      </div>
      <span role="status" className="sr-only">
        {pinnedId ? 'Your pin changes only your view.' : ''}
      </span>
      <MediaDock room={room} />
    </footer>
  );
}
function MeetingHeader({ room }: { room: MeetingRoom }) {
  const {
    demo,
    connection,
    captureMode,
    keyboard,
    aiScenario,
    setAiScenario,
    localMedia,
    setCaptureMode,
    count,
    setCount,
    speakerId,
    setSpeaker,
    people,
    setConnection,
    onRestart,
    layout,
    setLayout,
  } = room;
  return (
    <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 pb-2 min-[1100px]:grid-cols-[minmax(0,1fr)_auto_auto] min-[1100px]:gap-x-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <div className="hidden sm:block">
          <Brand compact />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium tracking-tight">
            {demo ? 'Design sync' : 'Your meeting'}
          </h1>
          <span
            role="status"
            aria-label="Connection status"
            className={`mt-0.5 block truncate text-[10px] ${connection === 'ready' ? 'text-muted' : connection === 'offline' ? 'text-error' : 'text-warning'}`}
          >
            {connection === 'ready'
              ? import.meta.env.DEV && demo && captureMode === 'synthetic'
                ? 'Synthetic devices · local preview'
                : 'Local preview'
              : connection === 'offline'
                ? 'Disconnected'
                : 'Reconnecting…'}
          </span>
        </div>
      </div>
      <div className="order-2 flex shrink-0 items-center gap-1 min-[1100px]:order-3">
        {import.meta.env.DEV && demo && (
          <DemoControls
            keyboard={keyboard}
            aiScenario={aiScenario}
            onAIScenario={setAiScenario}
            captureMode={captureMode}
            onCaptureMode={(value) => {
              localMedia.stopAll();
              setCaptureMode(value);
            }}
            onEndShare={() => {
              const track = localMedia.streams.screen?.getVideoTracks()[0];
              track?.stop();
              track?.dispatchEvent(new Event('ended'));
            }}
            count={count}
            onCount={setCount}
            speakerId={speakerId}
            onSpeaker={setSpeaker}
            people={people}
            connection={connection}
            onConnection={setConnection}
            onReset={onRestart}
          />
        )}
        <DeviceSettings
          keyboard={keyboard}
          error={localMedia.error}
          devices={localMedia.devices}
          selectedDevices={localMedia.selectedDevices}
          streams={localMedia.streams}
          pending={localMedia.pending}
          onSelect={localMedia.start}
        />
        <ThemeToggle />
      </div>
      <div className="hidden min-h-11 items-center justify-end min-[1100px]:order-2 min-[1100px]:flex">
        <LayoutPicker layout={layout} onChange={setLayout} />
      </div>
    </header>
  );
}
function LayoutPicker({
  layout,
  onChange,
}: {
  layout: 'gallery' | 'focus';
  onChange: (value: 'gallery' | 'focus') => void;
}) {
  return (
    <SegmentedControl
      label="Meeting layout"
      options={[
        { value: 'gallery', label: 'Gallery', icon: <MeetingLayoutIcon /> },
        { value: 'focus', label: 'Focus', icon: <MeetingLayoutIcon focus /> },
      ]}
      value={layout}
      onValueChange={(value) => onChange(value === 'focus' ? 'focus' : 'gallery')}
    />
  );
}

function RoomConversation({ room }: { room: MeetingRoom }) {
  const {
    rightTab,
    setRightTab,
    people,
    messages,
    chatDraft,
    setChatDraft,
    sendChat,
    connection,
    pinnedId,
    pinPerson,
    peopleSearch,
    setPeopleSearch,
  } = room;
  return (
    <div id="meeting-chat" className="flex min-h-0 flex-1 flex-col">
      <div
        className="mx-4 mb-4 flex gap-1 rounded-xl bg-surface-muted p-1"
        role="tablist"
        aria-label="Meeting panel"
      >
        <button
          type="button"
          id="meeting-chat-tab"
          role="tab"
          aria-selected={rightTab === 'chat'}
          aria-controls="meeting-chat-tabpanel"
          tabIndex={rightTab === 'chat' ? 0 : -1}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'End') {
              event.preventDefault();
              setRightTab('people');
              document.getElementById('meeting-people-tab')?.focus();
            }
          }}
          onClick={() => setRightTab('chat')}
          className={`min-h-9 flex-1 cursor-pointer rounded-lg text-xs ${rightTab === 'chat' ? 'bg-surface font-medium shadow-sm' : 'text-muted'}`}
        >
          Chat
        </button>
        <button
          type="button"
          id="meeting-people-tab"
          role="tab"
          aria-selected={rightTab === 'people'}
          aria-controls="meeting-people-tabpanel"
          tabIndex={rightTab === 'people' ? 0 : -1}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home') {
              event.preventDefault();
              setRightTab('chat');
              document.getElementById('meeting-chat-tab')?.focus();
            }
          }}
          onClick={() => setRightTab('people')}
          className={`min-h-9 flex-1 cursor-pointer rounded-lg text-xs ${rightTab === 'people' ? 'bg-surface font-medium shadow-sm' : 'text-muted'}`}
        >
          People · {formatCount(people.length)}
        </button>
      </div>
      <div
        role="tabpanel"
        id={`meeting-${rightTab}-tabpanel`}
        aria-labelledby={`meeting-${rightTab}-tab`}
        className="flex min-h-0 flex-1 flex-col"
      >
        {rightTab === 'chat' ? (
          <MeetingChat
            people={people}
            messages={messages}
            draft={chatDraft}
            onDraft={setChatDraft}
            onSend={sendChat}
            disabled={connection !== 'ready'}
          />
        ) : (
          <PeopleList
            people={people}
            pinnedId={pinnedId}
            onPin={pinPerson}
            search={peopleSearch}
            onSearch={setPeopleSearch}
          />
        )}
      </div>
    </div>
  );
}

function MediaDock({ room }: { room: MeetingRoom }) {
  const { media, localMedia, toggle, ai, setEnded } = room;
  return (
    <div className="col-span-3 row-start-2 mx-auto flex max-w-full flex-wrap items-center justify-center min-[1100px]:col-span-1 min-[1100px]:col-start-2 min-[1100px]:row-start-1 gap-0.5 rounded-2xl border border-border/60 bg-surface p-1 shadow-sm sm:gap-3 sm:p-2 sm:px-3">
      <MicrophoneControl room={room} />
      <MeetingControl
        aria-label={`Camera ${media.camera ? 'on' : 'off'}`}
        aria-pressed={media.camera}
        title={`Camera ${media.camera ? 'on' : 'off'}`}
        tone={media.camera ? 'neutral' : 'off'}
        disabled={localMedia.pending.camera}
        aria-busy={localMedia.pending.camera}
        onClick={() => toggle('camera')}
        icon={
          media.camera ? (
            <Video width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <VideoOff width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
          )
        }
      >
        <span className="hidden md:inline">Camera {media.camera ? 'on' : 'off'}</span>
      </MeetingControl>
      <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" />
      <MeetingControl
        aria-label={media.sharing ? 'Stop sharing' : 'Share screen'}
        aria-pressed={media.sharing}
        title="Share your screen locally"
        tone={media.sharing ? 'success' : 'neutral'}
        disabled={localMedia.pending.screen}
        aria-busy={localMedia.pending.screen}
        onClick={() => toggle('sharing')}
        icon={<MonitorUp width={20} height={20} strokeWidth={1.5} aria-hidden="true" />}
      >
        <span className="hidden lg:inline">{media.sharing ? 'Sharing' : 'Share'}</span>
      </MeetingControl>
      <MeetingControl
        aria-label={media.hand ? 'Lower hand' : 'Raise hand'}
        aria-pressed={media.hand}
        title={media.hand ? 'Lower hand' : 'Raise hand'}
        tone={media.hand ? 'warning' : 'neutral'}
        onClick={() => toggle('hand')}
        icon={<Hand width={20} height={20} strokeWidth={1.5} aria-hidden="true" />}
      />
      <MeetingControl
        aria-label={media.captions ? 'Hide captions' : 'Show captions'}
        aria-pressed={media.captions}
        title="Captions"
        tone={media.captions ? 'primary' : 'neutral'}
        onClick={() => toggle('captions')}
        icon={<Captions width={20} height={20} strokeWidth={1.5} aria-hidden="true" />}
      />
      <button
        type="button"
        aria-label="Leave meeting preview"
        title="Leave meeting preview"
        onClick={() => {
          ai.stop();
          localMedia.stopAll();
          setEnded(true);
        }}
        className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-error px-2.5 text-xs font-medium text-white dark:text-canvas"
      >
        <PhoneOff width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}

function MicrophoneControl({ room }: { room: MeetingRoom }) {
  const { media, localMedia, toggle, microphoneLevel, microphoneMeterRef } = room;
  return (
    <MeetingControl
      aria-label={`Microphone ${media.microphone ? 'on' : 'off'}`}
      aria-pressed={media.microphone}
      title={`Microphone ${media.microphone ? 'on' : 'off'}`}
      tone={media.microphone ? 'neutral' : 'off'}
      disabled={localMedia.pending.microphone}
      aria-busy={localMedia.pending.microphone}
      onClick={() => toggle('microphone')}
      icon={
        media.microphone ? (
          <Mic width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <MicOff width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
        )
      }
    >
      <span className="hidden md:inline">Mic {media.microphone ? 'on' : 'off'}</span>
      {media.microphone && (
        <meter
          aria-label={
            microphoneLevel.unavailable
              ? 'Microphone captured, input meter unavailable'
              : 'Microphone input level'
          }
          min={0}
          max={0.15}
          ref={microphoneMeterRef}
          className="hidden h-2 w-8 accent-success sm:block"
        />
      )}
    </MeetingControl>
  );
}
