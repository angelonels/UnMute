import { ModalSurface } from '../../../components/modal-surface';
import { useEffect } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { AICompanion } from '../../../components/ai-companion';
import { useLocalMedia, LocalVideo } from '../../media';
import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  LayoutGrid,
  LogOut,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
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
  const reduced = useReducedMotion();
  const [keyboard, setKeyboard] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const { busy, failed, signOut } = useAuthActions(false);
  return (
    <div
      className="flex min-h-svh flex-col p-3 sm:p-4"
      onKeyDownCapture={() => setKeyboard(true)}
      onPointerDownCapture={() => setKeyboard(false)}
    >
      <div className="relative flex flex-1 gap-3">
        <aside
          className={`hidden shrink-0 flex-col rounded-3xl bg-surface p-3 shadow-shell lg:flex ${navigationOpen ? 'w-60' : 'w-18'}`}
          aria-label="Workspace navigation"
        >
          <div
            className={`flex h-12 items-center ${navigationOpen ? 'justify-between px-2' : 'justify-center'}`}
          >
            {navigationOpen && <Brand />}
            <button
              type="button"
              aria-label={navigationOpen ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={navigationOpen}
              aria-controls="navigation-content"
              onClick={() => setNavigationOpen(!navigationOpen)}
              className="grid size-11 cursor-pointer place-items-center rounded-xl text-muted transition-colors duration-150 ease-out-expo hover:bg-surface-muted motion-reduce:transition-none hover:text-text"
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
        <m.main
          layout={reduced || keyboard ? false : 'position'}
          layoutDependency={`${navigationOpen}:${sidePanelOpen}`}
          transition={{ type: 'spring', stiffness: 420, damping: 42 }}
          className={`relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-transparent bg-surface shadow-shell ${sidePanelOpen ? 'xl:mr-84' : ''}`}
        >
          <div className="flex min-h-16 items-center justify-between gap-3 px-5 sm:px-8">
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open navigation"
                      className="grid size-11 cursor-pointer place-items-center rounded-xl text-muted transition-colors duration-150 ease-out-expo hover:bg-surface-muted motion-reduce:transition-none"
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
              <span className="lg:hidden">
                <Brand compact />
              </span>
              <h1 className="hidden text-sm font-medium sm:block">Overview</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <span
                className="me-2 grid size-8 place-items-center rounded-full bg-surface-muted text-xs font-medium"
                aria-label={`Signed in as ${user.name}`}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <Drawer modal={false} open={sidePanelOpen} onOpenChange={setSidePanelOpen}>
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
                  className="xl:top-4! xl:right-4! xl:bottom-4! xl:w-80! xl:rounded-[1.75rem]!"
                >
                  <div className="flex min-h-80 flex-col items-center justify-center text-center">
                    <PanelRightOpen
                      size={28}
                      strokeWidth={1.35}
                      className="text-muted/60"
                      aria-hidden="true"
                    />
                    <p className="mt-5 text-base font-medium">Room for more.</p>
                    <p className="mt-2 max-w-56 text-sm leading-relaxed text-muted">
                      Your workspace tools will live here.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
          <m.div
            layout={reduced || keyboard ? false : 'position'}
            layoutDependency={`${navigationOpen}:${sidePanelOpen}`}
            transition={{ type: 'spring', stiffness: 420, damping: 42 }}
            className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-14"
            onPointerEnter={() => setGreeting(true)}
            onPointerLeave={() => setGreeting(false)}
          >
            <AICompanion size={112} active={greeting} className="mb-6" />
            <p className="mb-3 text-sm text-muted">Your next good conversation</p>
            <h2 className="max-w-2xl text-[clamp(2rem,4.5vw,4rem)] leading-[1.07] font-medium tracking-[-0.055em]">
              A little more presence.
              <br />
              <span className="text-muted">A lot more possibility.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted sm:text-base">
              A clear space to meet, listen, and be heard.
            </p>
            <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
              <Dialog.Trigger asChild>
                <Button
                  size="lg"
                  className="mt-8 !min-h-14 !rounded-2xl !bg-primary !px-7 !text-on-primary hover:!bg-primary-hover"
                >
                  <Video size={20} strokeWidth={1.75} aria-hidden="true" />
                  Start meeting
                  <ArrowRight size={18} aria-hidden="true" />
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
          <footer className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-5 text-xs text-muted sm:mx-8">
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-muted/50" />
              Made for being here.
            </span>
            <span>UnMute © {new Date().getFullYear()}</span>
          </footer>
        </m.main>
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
      className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm disabled:cursor-progress disabled:opacity-50 motion-safe:transition-transform motion-safe:duration-[160ms] motion-safe:ease-out-expo motion-safe:[&:enabled:active:not(:focus-visible)]:scale-[0.97] ${enabled ? 'border-border bg-surface text-text' : 'border-error/35 bg-error/10 text-error'}`}
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
          <X size={20} aria-hidden="true" />
        </Dialog.Close>
      </div>
      <Dialog.Description id="preview-description" className="mt-2 text-sm text-muted">
        Make yourself comfortable.
      </Dialog.Description>
      <div className="relative mt-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-panel text-white">
        <span className="grid size-20 place-items-center rounded-full bg-white/15 text-3xl font-medium">
          {user.name.slice(0, 1).toUpperCase()}
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
            <Mic size={18} aria-hidden="true" />
          ) : (
            <MicOff size={18} aria-hidden="true" />
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
            <Video size={18} aria-hidden="true" />
          ) : (
            <VideoOff size={18} aria-hidden="true" />
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
          : 'Your preview stays on this device.'}
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
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
      <Dialog.Close asChild>
        <Button variant="secondary" size="lg" className="mt-6 w-full">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to workspace
        </Button>
      </Dialog.Close>
    </ModalSurface>
  );
}
