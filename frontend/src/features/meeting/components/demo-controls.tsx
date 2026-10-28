import { useState } from 'react';
import { ModalSurface } from '../../../components/modal-surface';
import * as Dialog from '@radix-ui/react-dialog';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import type { Connection, Participant } from '../meeting-model';

export function DemoControls({
  keyboard,
  captureMode,
  onCaptureMode,
  onEndShare,
  count,
  onCount,
  speakerId,
  onSpeaker,
  people,
  connection,
  onConnection,
  onReset,
}: {
  keyboard: boolean;
  captureMode: string;
  onCaptureMode: (value: string) => void;
  onEndShare: () => void;
  count: number;
  onCount: (count: number) => void;
  speakerId: string;
  onSpeaker: (id: string) => void;
  people: Participant[];
  connection: Connection;
  onConnection: (value: Connection) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Demo controls"
          className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-warning/25 bg-warning/8 px-3 text-[11px] text-warning"
        >
          <FlaskConical size={13} aria-hidden="true" />
          <span className="hidden min-[420px]:inline">Playground</span>
        </button>
      </Dialog.Trigger>
      <ModalSurface open={open} instant={keyboard} className="max-w-sm">
        <div className="flex items-center justify-between gap-3">
          <Dialog.Title className="text-lg font-medium tracking-tight">
            Meeting playground
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close demo controls"
            className="grid size-11 cursor-pointer place-items-center rounded-xl hover:bg-surface-muted"
          >
            <X size={18} aria-hidden="true" />
          </Dialog.Close>
        </div>
        <Dialog.Description className="mt-2 text-xs leading-6 text-muted">
          Development only. Change the room to stress-test the interface.
        </Dialog.Description>
        <div className="mt-6 space-y-5">
          <label className="block text-xs font-medium">
            Capture source
            <select
              value={captureMode}
              onChange={(event) => onCaptureMode(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm"
            >
              <option value="native">Real browser devices</option>
              <option value="synthetic">Synthetic test devices</option>
              <option value="denied">Simulate permission denial</option>
            </select>
          </label>
          {captureMode === 'synthetic' && (
            <button
              type="button"
              onClick={onEndShare}
              className="min-h-11 w-full rounded-xl bg-surface-muted px-3 text-xs"
            >
              Simulate browser ending share
            </button>
          )}

          <label className="block text-xs font-medium">
            Participants in demo
            <select
              value={count}
              onChange={(event) => onCount(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm"
            >
              {[1, 2, 6, 12, 24, 48].map((value) => (
                <option key={value} value={value}>
                  {value} {value === 1 ? 'person' : 'people'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Active demo speaker
            <select
              value={speakerId}
              onChange={(event) => onSpeaker(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm"
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Demo connection
            <select
              value={connection}
              onChange={(event) => onConnection(event.target.value as Connection)}
              className="mt-2 min-h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm"
            >
              <option value="ready">Ready</option>
              <option value="reconnecting">Reconnecting</option>
              <option value="offline">Disconnected</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-surface-muted text-sm"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Reset playground
        </button>
      </ModalSurface>
    </Dialog.Root>
  );
}
