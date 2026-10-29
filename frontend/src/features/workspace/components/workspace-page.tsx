import { personInitials } from '../../../lib/person-initials';
import { useReducedMotion } from '../../../hooks/use-reduced-motion';
import { ModalSurface } from '../../../components/modal-surface';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { useTheme } from 'next-themes';
import { AICompanion } from '../../../components/ai-companion';
import { useLocalMedia, LocalVideo } from '../../media';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  ViewGrid as LayoutGrid,
  LogOut,
  Microphone as Mic,
  MicrophoneMute as MicOff,
  SidebarCollapse as PanelLeftClose,
  SidebarExpand as PanelLeftOpen,
  Settings,
  NavArrowUp,
  VideoCamera as Video,
  VideoCameraOff as VideoOff,
  Xmark as X,
} from 'iconoir-react';
import * as Dialog from '@radix-ui/react-dialog';
import { type authClient } from '../../../api/auth-client';
import { useAuthActions } from '../../auth';
import { Brand } from '../../../components/brand';
import { Button } from '../../../components/arc/button/button';
import { Drawer, DrawerContent, DrawerTrigger } from '../../../components/arc/drawer/drawer';

type User = typeof authClient.$Infer.Session.user;

export function WorkspacePage({ user }: { user: User }) {
  const reduced = useReducedMotion();
  const [keyboard, setKeyboard] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div
      className="flex min-h-svh flex-col p-3 sm:p-4"
      onKeyDownCapture={() => setKeyboard(true)}
      onPointerDownCapture={() => setKeyboard(false)}
    >
      <div className="relative flex flex-1 gap-3">
        <WorkspaceNavigation
          user={user}
          keyboard={keyboard}
          navigationOpen={navigationOpen}
          onToggle={() => setNavigationOpen(!navigationOpen)}
        />
        <m.main
          layout={reduced || keyboard ? false : 'position'}
          layoutDependency={navigationOpen}
          transition={{ type: 'spring', stiffness: 420, damping: 42 }}
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-transparent bg-surface shadow-shell"
        >
          <header className="flex min-h-18 items-center gap-3 border-b border-border/50 px-5 sm:px-8">
            <div className="lg:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open navigation"
                    className="grid size-11 cursor-pointer place-items-center rounded-xl text-muted hover:bg-surface-muted hover:text-text"
                  >
                    <PanelLeftOpen width={19} height={19} aria-hidden="true" />
                  </button>
                </DrawerTrigger>
                <DrawerContent
                  title="Your workspace"
                  description="Workspace navigation"
                  side="left"
                >
                  <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
                    <OverviewLink />
                    <div className="mt-auto pt-8">
                      <AccountControl user={user} keyboard={keyboard} />
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
            <span className="lg:hidden">
              <Brand compact />
            </span>
            <h1 className="text-sm font-medium">Overview</h1>
          </header>
          <m.div
            layout={reduced || keyboard ? false : 'position'}
            layoutDependency={navigationOpen}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16"
          >
            <div className="mb-6 rounded-full bg-secondary-soft p-4">
              <AICompanion size={112} pokeable label="Say hello to Mumo" />
            </div>
            <h2 className="max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.1] font-medium tracking-[-0.045em]">
              Ready when you are.
            </h2>
            <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
              <Dialog.Trigger asChild>
                <Button
                  size="lg"
                  className="mt-8 !min-h-14 !rounded-2xl !bg-primary !px-7 !text-on-primary hover:!bg-primary-hover"
                >
                  <Video width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
                  Start meeting
                  <ArrowRight width={18} height={18} aria-hidden="true" />
                </Button>
              </Dialog.Trigger>
              <MeetingPreview user={user} open={previewOpen} keyboard={keyboard} />
            </Dialog.Root>
            {import.meta.env.DEV && (
              <Link
                to="/meeting"
                search={{ demo: true, microphone: false, camera: false }}
                className="mt-5 inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4"
              >
                Open meeting playground
              </Link>
            )}
          </m.div>
        </m.main>
      </div>
    </div>
  );
}

function PreviewToggle({
  enabled,
  onClick,
  children,
  label,
  pending = false,
}: {
  pending?: boolean;
  enabled: boolean;
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      aria-busy={pending}
      disabled={pending}
      onClick={onClick}
      className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-xs disabled:cursor-progress disabled:opacity-50 sm:px-4 sm:text-sm motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:[&:enabled:active:not(:focus-visible)]:scale-[0.96] ${enabled ? 'border-border bg-surface text-text' : 'border-error/35 bg-error/10 text-error'}`}
    >
      {children}
    </button>
  );
}

function MeetingPreview({
  user,
  open,
  keyboard,
}: {
  user: User;
  open: boolean;
  keyboard: boolean;
}) {
  const localMedia = useLocalMedia();
  const { stopAll } = localMedia;
  useEffect(() => {
    if (!open) stopAll();
  }, [open, stopAll]);
  const microphone = !!localMedia.streams.microphone;
  const camera = !!localMedia.streams.camera;
  return (
    <ModalSurface
      open={open}
      instant={keyboard}
      className="max-w-xl rounded-[1.75rem] sm:p-8"
      aria-describedby="preview-description"
    >
      <div className="flex items-center justify-between gap-4">
        <Dialog.Title className="text-xl font-medium tracking-tight">Before you meet</Dialog.Title>
        <Dialog.Close
          aria-label="Close meeting preview"
          className="grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted"
        >
          <X width={20} height={20} aria-hidden="true" />
        </Dialog.Close>
      </div>
      <Dialog.Description id="preview-description" className="sr-only">
        Camera and microphone preview.
      </Dialog.Description>
      <div className="relative mt-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-panel text-white">
        <span className="grid size-20 place-items-center rounded-full bg-white/15 text-3xl font-medium">
          {personInitials(user.name)}
        </span>
        {localMedia.streams.camera && (
          <LocalVideo stream={localMedia.streams.camera} label="Your camera video" mirror />
        )}
        <span className="absolute bottom-4 left-4 max-w-[80%] truncate text-sm">{user.name}</span>
        <span className="absolute top-4 right-4 rounded-full bg-black/20 px-3 py-1 text-xs">
          Preview
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <PreviewToggle
          label="Microphone"
          pending={localMedia.pending.microphone}
          enabled={microphone}
          onClick={() => localMedia.toggle('microphone')}
        >
          {microphone ? (
            <Mic width={18} height={18} aria-hidden="true" />
          ) : (
            <MicOff width={18} height={18} aria-hidden="true" />
          )}
          Mic {microphone ? 'on' : 'off'}
        </PreviewToggle>
        <PreviewToggle
          pending={localMedia.pending.camera}
          label="Camera"
          enabled={camera}
          onClick={() => localMedia.toggle('camera')}
        >
          {camera ? (
            <Video width={18} height={18} aria-hidden="true" />
          ) : (
            <VideoOff width={18} height={18} aria-hidden="true" />
          )}
          Camera {camera ? 'on' : 'off'}
        </PreviewToggle>
      </div>
      <p
        role="status"
        className="mt-5 rounded-xl bg-surface-muted p-4 text-sm leading-6 text-muted"
      >
        {localMedia.pending.camera || localMedia.pending.microphone
          ? 'Waiting for device access…'
          : 'Local preview'}
      </p>
      {localMedia.error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {localMedia.error}
        </p>
      )}
      <Link
        to="/meeting"
        search={{ demo: false, microphone, camera }}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-on-primary"
      >
        Enter meeting preview
        <ArrowRight width={17} height={17} aria-hidden="true" />
      </Link>
      <Dialog.Close asChild>
        <Button variant="secondary" size="lg" className="mt-6 w-full">
          <ArrowLeft width={17} height={17} aria-hidden="true" />
          Back to workspace
        </Button>
      </Dialog.Close>
    </ModalSurface>
  );
}

function OverviewLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      search={{ error: undefined }}
      aria-current="page"
      aria-label="Overview"
      title={compact ? 'Overview' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-xl bg-primary/9 text-sm font-medium text-primary ${compact ? 'justify-center' : 'px-3'}`}
    >
      <LayoutGrid width={18} height={18} aria-hidden="true" />
      {!compact && 'Overview'}
    </Link>
  );
}

function WorkspaceNavigation({
  user,
  navigationOpen,
  onToggle,
  keyboard,
}: {
  user: User;
  navigationOpen: boolean;
  onToggle: () => void;
  keyboard: boolean;
}) {
  return (
    <aside
      className={`hidden shrink-0 flex-col rounded-3xl border border-transparent bg-surface p-3 shadow-shell lg:flex ${navigationOpen ? 'w-64' : 'w-18'}`}
      aria-label="Workspace navigation"
    >
      <div
        className={`flex items-center gap-2 ${navigationOpen ? 'min-h-12 justify-between px-1' : 'flex-col py-1'}`}
      >
        <Brand compact={!navigationOpen} />
        <button
          type="button"
          aria-label={navigationOpen ? 'Collapse navigation' : 'Expand navigation'}
          title={navigationOpen ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={navigationOpen}
          aria-controls="navigation-content"
          onClick={onToggle}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-border/60 text-muted hover:bg-surface-muted hover:text-text"
        >
          {navigationOpen ? (
            <PanelLeftClose width={19} height={19} aria-hidden="true" />
          ) : (
            <PanelLeftOpen width={19} height={19} aria-hidden="true" />
          )}
        </button>
      </div>
      <nav id="navigation-content" className="mt-5 flex-1">
        <OverviewLink compact={!navigationOpen} />
      </nav>
      <div className="mt-8 border-t border-border/60 pt-3">
        <AccountControl user={user} compact={!navigationOpen} keyboard={keyboard} />
      </div>
    </aside>
  );
}

function AccountControl({
  user,
  compact = false,
  keyboard,
}: {
  user: User;
  compact?: boolean;
  keyboard: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ left: 12, bottom: 12 });
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 252)),
        bottom: Math.max(12, window.innerHeight - rect.top + 8),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);
  const { busy, failed, signOut } = useAuthActions(false);
  return (
    <div className="relative">
      <Dialog.Root modal={false} open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            ref={trigger}
            type="button"
            aria-label={`Account: ${user.name}`}
            title={compact ? user.name : undefined}
            className={`flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl text-left hover:bg-surface-muted data-[state=open]:bg-surface-muted ${compact ? 'justify-center' : 'px-2'}`}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-soft text-xs font-medium text-secondary-ink"
              aria-hidden="true"
            >
              {personInitials(user.name)}
            </span>
            {!compact && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>
                <NavArrowUp
                  width={15}
                  height={15}
                  className="shrink-0 text-muted"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content
            style={position}
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              if (settingsOpen) event.preventDefault();
            }}
            className="fixed z-60 w-60 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-surface-raised p-1.5 shadow-floating"
          >
            <Dialog.Title className="sr-only">Account</Dialog.Title>
            <p
              className="truncate border-b border-border/60 px-3 pt-2 pb-3 text-xs text-muted"
              title={user.email}
            >
              {user.email}
            </p>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(true);
                setOpen(false);
              }}
              className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm hover:bg-surface-muted"
            >
              <Settings width={18} height={18} aria-hidden="true" />
              Settings
            </button>
            <button
              type="button"
              disabled={busy}
              aria-busy={busy}
              onClick={() => void signOut()}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-surface-muted hover:text-text disabled:cursor-wait disabled:opacity-50"
            >
              <LogOut width={18} height={18} aria-hidden="true" />
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
            {failed && (
              <p role="alert" className="px-3 py-2 text-xs leading-5 text-error">
                Sign-out failed. Try again.
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
        <ModalSurface
          open={settingsOpen}
          instant={keyboard}
          className="max-w-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-xl font-medium tracking-tight">Settings</Dialog.Title>
            <Dialog.Close
              aria-label="Close settings"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted"
            >
              <X width={20} height={20} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Your account and appearance preferences.
          </Dialog.Description>
          <dl className="mt-6 space-y-4 border-b border-border/60 pb-6 text-sm">
            <div>
              <dt className="text-xs text-muted">Name</dt>
              <dd className="mt-1 [overflow-wrap:anywhere]">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd className="mt-1 [overflow-wrap:anywhere]">{user.email}</dd>
            </div>
          </dl>
          <AppearanceSetting />
        </ModalSurface>
      </Dialog.Root>
    </div>
  );
}

function AppearanceSetting() {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium">Appearance</legend>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(['light', 'dark', 'system'] as const).map((value) => (
          <label
            key={value}
            className="relative flex min-h-12 min-w-0 cursor-pointer items-center justify-center rounded-xl border border-input px-2 py-2 text-center text-sm capitalize has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name="appearance"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
