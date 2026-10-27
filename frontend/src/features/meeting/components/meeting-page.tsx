import SegmentedControl from '../../../components/arc/segmented-control/segmented-control';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AudioLines,
  Captions,
  Hand,
  LockKeyhole,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Pin,
  Sparkles,
  Users,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useLocalMedia } from '../../media';
import { Brand } from '../../../components/brand';
import { ThemeToggle } from '../../../components/theme-toggle';
import {
  initialMedia,
  type Connection,
  type MediaPreferences,
  type MeetingMessage,
  type Participant,
} from '../meeting-model';
import { demoAnswer, demoMessages, demoParticipants } from '../demo-data';
import { MeetingControl } from './meeting-control';
import { MeetingStage } from './meeting-stage';
import { MeetingPanel } from './meeting-panel';
import { AIConversation, MeetingChat, PeopleList } from './meeting-conversations';
import { DeviceSettings } from './device-settings';
import { DemoControls } from './demo-controls';

const subscribe = (notify: () => void) => {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};
const snapshot = () => window.innerWidth;
const serverSnapshot = () => 1024;

export function MeetingPage({
  userName,
  demo,
  onRestart,
  initialMicrophone,
  initialCamera,
}: {
  userName: string;
  demo: boolean;
  onRestart: () => void;
  initialMicrophone: boolean;
  initialCamera: boolean;
}) {
  const width = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [captureMode, setCaptureMode] = useState('native');
  const localMedia = useLocalMedia(
    initialMicrophone,
    initialCamera,
    import.meta.env.DEV && demo ? captureMode : 'native',
  );
  const [preferences, setPreferences] = useState(initialMedia);
  const media = {
    ...preferences,
    microphone: !!localMedia.streams.microphone,
    camera: !!localMedia.streams.camera,
    sharing: !!localMedia.streams.screen,
  };
  const [count, setCount] = useState(6);
  const [speaker, setSpeaker] = useState('demo-1');
  const [connection, setConnection] = useState<Connection>('ready');
  const [pin, setPin] = useState<string | null>(null);
  const [layout, setLayout] = useState<'gallery' | 'focus'>('gallery');
  const [panels, setPanels] = useState({ left: false, right: false });
  const [rightTab, setRightTab] = useState<'chat' | 'people'>('chat');
  const [keyboard, setKeyboard] = useState(false);
  const [messages, setMessages] = useState<MeetingMessage[]>(() =>
    import.meta.env.DEV && demo ? demoMessages : [],
  );
  const [aiMessages, setAiMessages] = useState<MeetingMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [ended, setEnded] = useState(false);
  const [notice] = useState('');
  const aiTrigger = useRef<HTMLButtonElement>(null);
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
  const base = import.meta.env.DEV && demo ? demoParticipants(count, self) : [self];
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
  function sendAI(prompt = aiDraft) {
    const text = prompt.trim();
    if (!text || connection !== 'ready') return;
    const now = new Date().toISOString();
    const answer =
      import.meta.env.DEV && demo
        ? demoAnswer(text)
        : 'AI is not connected in this preview. Your prompt stays in this browser.';
    setAiMessages((previous) =>
      [
        ...previous,
        { id: crypto.randomUUID(), authorId: 'self', text, createdAt: now },
        { id: crypto.randomUUID(), authorId: 'assistant', text: answer, createdAt: now },
      ].slice(-100),
    );
    setAiDraft('');
  }
  if (ended)
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <main className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-shell">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface-muted text-muted">
            <PhoneOff size={26} strokeWidth={1.5} aria-hidden="true" />
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
  return (
    <div
      className="flex h-svh flex-col overflow-hidden bg-canvas p-3 sm:p-4"
      onKeyDownCapture={() => setKeyboard(true)}
      onPointerDownCapture={() => setKeyboard(false)}
    >
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 pb-3 sm:gap-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <div className="hidden sm:block">
            <Brand compact />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium tracking-tight">
              {demo ? 'Design sync' : 'Your meeting'}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
              <LockKeyhole size={10} aria-hidden="true" />
              {import.meta.env.DEV && demo && captureMode === 'synthetic'
                ? 'Synthetic devices'
                : 'Local meeting'}
              <span className="hidden md:inline"> · not connected</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {import.meta.env.DEV && demo && (
            <DemoControls
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
          <span
            role="status"
            aria-label="Connection status"
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:inline-flex ${connection === 'ready' ? 'text-muted' : connection === 'reconnecting' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}
          >
            {connection === 'offline' ? (
              <WifiOff size={12} aria-hidden="true" />
            ) : (
              <Wifi size={12} aria-hidden="true" />
            )}
            {connection === 'ready'
              ? 'Local preview'
              : connection === 'reconnecting'
                ? 'Reconnecting…'
                : 'Disconnected'}
          </span>
          <DeviceSettings
            devices={localMedia.devices}
            streams={localMedia.streams}
            pending={localMedia.pending}
            onSelect={localMedia.start}
          />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex min-h-10 shrink-0 items-center justify-between gap-2 pb-3">
        <MeetingControl
          ref={aiTrigger}
          aria-label="Open UnMute AI"
          aria-expanded={showLeft}
          aria-controls="meeting-ai"
          tone={showLeft ? 'primary' : 'neutral'}
          onClick={() => openPanel('left', !showLeft)}
          icon={<Sparkles size={16} aria-hidden="true" />}
        >
          <span className="hidden min-[420px]:inline">UnMute AI</span>
        </MeetingControl>
        <SegmentedControl
          label="Meeting layout"
          options={[
            { value: 'gallery', label: 'Gallery' },
            { value: 'focus', label: 'Focus' },
          ]}
          value={layout}
          onValueChange={(value) => setLayout(value === 'focus' ? 'focus' : 'gallery')}
        />
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
            icon={<Users size={16} aria-hidden="true" />}
          >
            <span className="tabular-nums">{people.length}</span>
          </MeetingControl>
          <MeetingControl
            ref={chatTrigger}
            aria-label="Open meeting chat"
            aria-expanded={panels.right}
            aria-controls="meeting-chat"
            tone={panels.right ? 'primary' : 'neutral'}
            onClick={() => {
              setRightOpener('chat');
              setRightTab('chat');
              openPanel('right', !panels.right);
            }}
            icon={<MessageCircle size={16} aria-hidden="true" />}
          >
            <span className="hidden min-[420px]:inline">Chat</span>
          </MeetingControl>
        </div>
      </div>
      {connection !== 'ready' && (
        <p
          className={`mb-3 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs ${connection === 'offline' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}
          role="alert"
        >
          {connection === 'offline' ? (
            <WifiOff size={14} aria-hidden="true" />
          ) : (
            <Wifi size={14} aria-hidden="true" />
          )}
          {connection === 'offline'
            ? 'Disconnected. Chat is paused.'
            : 'Reconnecting. Chat will be available when the connection returns.'}
          <span className="ms-auto text-[10px]">Demo state</span>
        </p>
      )}
      <div className="flex min-h-0 flex-1 gap-3">
        <MeetingPanel
          open={showLeft}
          onOpenChange={(open) => openPanel('left', open)}
          side="left"
          title="UnMute AI"
          description="A private space to think along."
          modal={width < 1024}
          trigger={aiTrigger}
          keyboard={keyboard}
          onKeyboard={() => setKeyboard(true)}
        >
          <div id="meeting-ai" className="flex min-h-0 flex-1 flex-col">
            <AIConversation
              messages={aiMessages}
              draft={aiDraft}
              onDraft={setAiDraft}
              onSend={() => sendAI()}
              onSuggestion={sendAI}
              demo={demo}
              disabled={connection !== 'ready'}
            />
          </div>
        </MeetingPanel>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <MeetingStage
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
        </main>
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
                  if (
                    event.key === 'ArrowRight' ||
                    event.key === 'ArrowLeft' ||
                    event.key === 'End'
                  ) {
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
                  if (
                    event.key === 'ArrowRight' ||
                    event.key === 'ArrowLeft' ||
                    event.key === 'Home'
                  ) {
                    event.preventDefault();
                    setRightTab('chat');
                    document.getElementById('meeting-chat-tab')?.focus();
                  }
                }}
                onClick={() => setRightTab('people')}
                className={`min-h-9 flex-1 cursor-pointer rounded-lg text-xs ${rightTab === 'people' ? 'bg-surface font-medium shadow-sm' : 'text-muted'}`}
              >
                People · {people.length}
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
      <footer className="flex shrink-0 flex-col pt-3">
        <div
          className="flex min-h-6 items-center justify-center gap-2 px-2 text-center text-[10px] text-muted"
          role="status"
        >
          {notice ||
            (pinnedId ? (
              <>
                <Pin size={11} aria-hidden="true" />
                Your pin changes only your view.
              </>
            ) : (
              <>
                <AudioLines size={12} aria-hidden="true" />A little less noise. A little more you.
              </>
            ))}
        </div>
        <div className="mx-auto mt-2 flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-transparent bg-surface p-1 shadow-shell sm:gap-3 sm:p-2 sm:px-3">
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
                <Mic size={19} aria-hidden="true" />
              ) : (
                <MicOff size={19} aria-hidden="true" />
              )
            }
          >
            <span className="hidden md:inline">Mic {media.microphone ? 'on' : 'off'}</span>
          </MeetingControl>
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
                <Video size={19} aria-hidden="true" />
              ) : (
                <VideoOff size={19} aria-hidden="true" />
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
            icon={<MonitorUp size={19} aria-hidden="true" />}
          >
            <span className="hidden lg:inline">{media.sharing ? 'Sharing' : 'Share'}</span>
          </MeetingControl>
          <MeetingControl
            aria-label={media.hand ? 'Lower hand' : 'Raise hand'}
            aria-pressed={media.hand}
            title={media.hand ? 'Lower hand' : 'Raise hand'}
            tone={media.hand ? 'warning' : 'neutral'}
            onClick={() => toggle('hand')}
            icon={<Hand size={19} aria-hidden="true" />}
          />
          <MeetingControl
            aria-label={media.captions ? 'Hide captions' : 'Show captions'}
            aria-pressed={media.captions}
            title="Captions"
            tone={media.captions ? 'primary' : 'neutral'}
            onClick={() => toggle('captions')}
            icon={<Captions size={19} aria-hidden="true" />}
          />
          <button
            type="button"
            aria-label="Leave meeting preview"
            title="Leave meeting preview"
            onClick={() => {
              localMedia.stopAll();
              setEnded(true);
            }}
            className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-error px-2.5 text-xs font-medium text-white dark:text-canvas"
          >
            <PhoneOff size={19} aria-hidden="true" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
