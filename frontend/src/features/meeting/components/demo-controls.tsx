import { useState } from 'react';
import { ModalSurface } from '../../../components/modal-surface';
import * as Dialog from '@radix-ui/react-dialog';
import { FlaskConical, RotateCcw, X, Monitor, Users, AudioLines, Wifi } from 'lucide-react';
import { SelectPicker } from '../../../components/select-picker';
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
        <Dialog.Description className="sr-only">Development controls</Dialog.Description>
        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium">Capture source</p>
            <SelectPicker
              label="Capture source"
              icon={<Monitor size={17} />}
              value={captureMode}
              options={[
                { value: 'native', label: 'Real browser devices' },
                { value: 'synthetic', label: 'Synthetic test devices' },
                { value: 'denied', label: 'Simulate permission denial' },
              ]}
              onValueChange={onCaptureMode}
            />
          </div>
          {captureMode === 'synthetic' && (
            <button
              type="button"
              onClick={onEndShare}
              className="min-h-11 w-full rounded-xl bg-surface-muted px-3 text-xs"
            >
              Simulate browser ending share
            </button>
          )}

          <div>
            <p className="mb-2 text-xs font-medium">Participants</p>
            <SelectPicker
              label="Participants in demo"
              icon={<Users size={17} />}
              value={String(count)}
              options={[1, 2, 6, 12, 24, 48].map((value) => ({
                value: String(value),
                label: `${value} ${value === 1 ? 'person' : 'people'}`,
              }))}
              onValueChange={(value) => onCount(Number(value))}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium">Active speaker</p>
            <SelectPicker
              label="Active demo speaker"
              icon={<AudioLines size={17} />}
              value={speakerId}
              options={people.map((person) => ({ value: person.id, label: person.name }))}
              onValueChange={onSpeaker}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium">Connection</p>
            <SelectPicker
              label="Demo connection"
              icon={<Wifi size={17} />}
              value={connection}
              options={[
                { value: 'ready', label: 'Ready' },
                { value: 'reconnecting', label: 'Reconnecting' },
                { value: 'offline', label: 'Disconnected' },
              ]}
              onValueChange={(value) => {
                if (value === 'ready' || value === 'reconnecting' || value === 'offline')
                  onConnection(value);
              }}
            />
          </div>
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
