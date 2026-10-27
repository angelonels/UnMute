import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  CircleHelp,
  LayoutGrid,
  LogOut,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Plus,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { type authClient } from '../../../api/auth-client';
import { useAuthActions } from '../../auth';
import { Brand } from '../../../components/brand';
import { ThemeToggle } from '../../../components/theme-toggle';
import { Button } from '../../../components/arc/button/button';
import { Drawer, DrawerContent, DrawerTrigger } from '../../../components/arc/drawer/drawer';

type User = typeof authClient.$Infer.Session.user;

export function WorkspacePage({ user }: { user: User }) {
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { busy, failed, signOut } = useAuthActions(false);
  return (
    <div className="flex min-h-svh flex-col p-3 sm:p-4">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-3 sm:px-5">
        <div className="flex items-center gap-6">
          <Brand />
          <span className="hidden border-s border-border ps-6 text-sm text-muted sm:block">
            Your workspace
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="me-3 hidden rounded-full bg-accent/25 px-3 py-1 text-xs font-medium text-text sm:block">
            A little less noise.
          </span>
          <ThemeToggle />
          <span
            className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-label={`Signed in as ${user.name}`}
          >
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
      </header>
      <div className="relative mt-3 flex flex-1 gap-3">
        <aside
          className={`hidden shrink-0 flex-col rounded-3xl bg-surface p-3 shadow-shell lg:flex ${navigationOpen ? 'w-60' : 'w-18'}`}
          aria-label="Workspace navigation"
        >
          <div
            className={`flex h-12 items-center ${navigationOpen ? 'justify-between px-2' : 'justify-center'}`}
          >
            {navigationOpen && <span className="text-xs font-medium text-muted">Workspace</span>}
            <button
              type="button"
              aria-label={navigationOpen ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={navigationOpen}
              aria-controls="navigation-content"
              onClick={() => setNavigationOpen(!navigationOpen)}
              className="grid size-10 cursor-pointer place-items-center rounded-xl text-muted hover:bg-surface-muted hover:text-text"
            >
              {navigationOpen ? (
                <PanelLeftClose size={19} aria-hidden="true" />
              ) : (
                <PanelLeftOpen size={19} aria-hidden="true" />
              )}
            </button>
          </div>
          <nav id="navigation-content" className="mt-4 flex flex-1 flex-col">
            <a
              href="/"
              aria-current="page"
              aria-label="Overview"
              className={`flex h-11 items-center gap-3 rounded-xl bg-primary/9 text-sm font-medium text-primary ${navigationOpen ? 'px-3' : 'justify-center'}`}
            >
              <LayoutGrid size={18} aria-hidden="true" />
              {navigationOpen && 'Overview'}
            </a>
            {navigationOpen && (
              <div className="mt-10 px-3">
                <span className="text-xs text-muted">A space for what’s next</span>
                <div className="mt-4 space-y-3" aria-hidden="true">
                  <div className="h-1.5 w-24 rounded-full bg-border/50" />
                  <div className="h-1.5 w-16 rounded-full bg-border/35" />
                </div>
              </div>
            )}
          </nav>
          <div className="mt-8 border-t border-border/60 pt-3">
            <Help compact={!navigationOpen} />
            <button
              type="button"
              disabled={busy}
              onClick={() => void signOut()}
              aria-label="Sign out"
              className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl text-sm text-muted hover:bg-surface-muted hover:text-text disabled:cursor-wait ${navigationOpen ? 'px-3' : 'justify-center'}`}
            >
              <LogOut size={18} aria-hidden="true" />
              {navigationOpen && (busy ? 'Signing out…' : 'Sign out')}
            </button>
            {failed && (
              <p role="alert" className="px-2 text-xs text-error">
                Sign-out failed. Try again.
              </p>
            )}
          </div>
        </aside>
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-transparent bg-surface shadow-shell">
          <div className="flex min-h-20 items-center justify-between gap-3 px-5 sm:px-8">
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open navigation"
                      className="grid size-11 cursor-pointer place-items-center rounded-xl text-muted hover:bg-surface-muted"
                    >
                      <PanelLeftOpen size={19} aria-hidden="true" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent
                    title="Your workspace"
                    description="Workspace navigation"
                    side="left"
                  >
                    <a
                      href="/"
                      aria-current="page"
                      className="flex min-h-12 items-center gap-3 rounded-xl bg-primary/10 px-4 text-primary"
                    >
                      <LayoutGrid size={18} aria-hidden="true" />
                      Overview
                    </a>
                    <div className="mt-8">
                      <Help />
                      <button
                        disabled={busy}
                        onClick={() => void signOut()}
                        className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-3 text-muted"
                      >
                        <LogOut size={18} aria-hidden="true" />
                        Sign out
                      </button>
                      {failed && (
                        <p role="alert" className="text-error">
                          Sign-out failed. Try again.
                        </p>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
              <h1 className="text-sm font-medium">Overview</h1>
            </div>
            <Drawer modal={false}>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm text-muted hover:bg-surface-muted hover:text-text"
                >
                  <span className="hidden sm:inline">Side panel</span>
                  <PanelRightOpen size={19} aria-hidden="true" />
                  <span className="sr-only sm:hidden">Open side panel</span>
                </button>
              </DrawerTrigger>
              <DrawerContent
                title="Your side panel"
                description="A little extra space, when you need it."
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                <div className="flex min-h-80 flex-col items-center justify-center text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
                    <PanelRightOpen size={24} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-base font-medium">Room for more.</p>
                  <p className="mt-2 max-w-56 text-sm leading-relaxed text-muted">
                    Your workspace tools will live here.
                  </p>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-5 pt-12 pb-16 text-center sm:px-8 sm:pt-16 sm:pb-24">
            <div
              className="relative mb-9 grid size-28 place-items-center rounded-[2rem] bg-primary/7 text-primary shadow-[inset_0_1px_0_color-mix(in_oklab,var(--primary)_10%,transparent)]"
              aria-hidden="true"
            >
              <AudioLines size={48} strokeWidth={1.5} />
              <span className="absolute -right-2 -bottom-2 grid size-9 place-items-center rounded-xl border-4 border-surface bg-accent text-[#513512]">
                <Plus size={17} strokeWidth={2} />
              </span>
            </div>
            <p className="mb-3 text-sm text-muted">Your next good conversation</p>
            <h2 className="max-w-2xl text-[clamp(2.5rem,4.5vw,4rem)] leading-[1.07] font-medium tracking-[-0.055em]">
              A little more presence.
              <br />
              <span className="text-muted">A lot more possibility.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted sm:text-base">
              A clear space to meet, listen, and be heard.
              <br />
              It starts with a conversation.
            </p>
            <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
              <Dialog.Trigger asChild>
                <Button
                  size="lg"
                  className="mt-9 !min-h-14 !rounded-2xl !bg-primary !px-7 !text-on-primary"
                >
                  <Video size={20} strokeWidth={1.75} aria-hidden="true" />
                  Start meeting
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
              </Dialog.Trigger>
              <MeetingPreview user={user} />
            </Dialog.Root>
            <span className="mt-4 text-xs text-muted">Your space. Your pace.</span>
          </div>
          <footer className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-5 text-xs text-muted sm:mx-8">
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent" />
              Made for being here.
            </span>
            <span>UnMute © {new Date().getFullYear()}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Help({ compact = false }: { compact?: boolean }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="About this workspace"
          className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl text-sm text-muted hover:bg-surface-muted hover:text-text ${compact ? 'justify-center' : 'px-3'}`}
        >
          <CircleHelp size={18} aria-hidden="true" />
          {!compact && 'About this workspace'}
        </button>
      </DrawerTrigger>
      <DrawerContent
        title="A clearer space to connect"
        description="The beginning of your UnMute workspace."
      >
        <div className="space-y-5 leading-7 text-muted">
          <p>
            Start meeting opens a preview where you can set your microphone and camera preferences.
          </p>
          <p>Meeting connections, invitations, and workspace tools are coming in a later update.</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PreviewToggle({
  enabled,
  onClick,
  children,
  label,
}: {
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
      onClick={onClick}
      className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm ${enabled ? 'border-border bg-surface text-text' : 'border-primary/30 bg-primary/8 text-primary'}`}
    >
      {children}
    </button>
  );
}

function MeetingPreview({ user }: { user: User }) {
  const [microphone, setMicrophone] = useState(false);
  const [camera, setCamera] = useState(false);
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm motion-reduce:backdrop-blur-none" />
      <Dialog.Content
        className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-1/2 overflow-y-auto overscroll-contain rounded-[1.75rem] border border-transparent bg-surface p-6 shadow-floating sm:p-8"
        aria-describedby="preview-description"
      >
        <div className="flex items-center justify-between gap-4">
          <Dialog.Title className="text-xl font-medium tracking-tight">
            Before you meet
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close meeting preview"
            className="grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted"
          >
            <X size={20} aria-hidden="true" />
          </Dialog.Close>
        </div>
        <Dialog.Description id="preview-description" className="mt-2 text-sm text-muted">
          Make yourself comfortable.
        </Dialog.Description>
        <div className="relative mt-6 flex aspect-video items-center justify-center rounded-2xl bg-panel text-white">
          <span className="grid size-20 place-items-center rounded-full bg-white/15 text-3xl font-medium">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="absolute bottom-4 left-4 max-w-[80%] truncate text-sm">{user.name}</span>
          <span className="absolute top-4 right-4 rounded-full bg-black/20 px-3 py-1 text-xs">
            Preview
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <PreviewToggle
            label="Microphone"
            enabled={microphone}
            onClick={() => setMicrophone(!microphone)}
          >
            {microphone ? (
              <Mic size={18} aria-hidden="true" />
            ) : (
              <MicOff size={18} aria-hidden="true" />
            )}
            Mic {microphone ? 'on' : 'off'}
          </PreviewToggle>
          <PreviewToggle label="Camera" enabled={camera} onClick={() => setCamera(!camera)}>
            {camera ? (
              <Video size={18} aria-hidden="true" />
            ) : (
              <VideoOff size={18} aria-hidden="true" />
            )}
            Camera {camera ? 'on' : 'off'}
          </PreviewToggle>
        </div>
        <p role="status" className="mt-5 rounded-xl bg-primary/6 p-4 text-sm leading-6 text-muted">
          Preview only. Your devices are not active, and no meeting has started.
        </p>
        <Dialog.Close asChild>
          <Button variant="secondary" size="lg" className="mt-6 w-full">
            <ArrowLeft size={17} aria-hidden="true" />
            Back to workspace
          </Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
