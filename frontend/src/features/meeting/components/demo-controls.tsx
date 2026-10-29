import { CompanionStudio } from './companion-studio';
import { useState } from 'react';
import { ModalSurface } from '../../../components/modal-surface';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Flask as FlaskConical,
  Undo as RotateCcw,
  Xmark as X,
  Computer as Monitor,
  Group as Users,
  Voice as AudioLines,
  Wifi,
} from 'iconoir-react';
import { SelectPicker } from '../../../components/select-picker';
import type { DemoAIScenario } from '../demo-data';
import type { Connection, Participant } from '../meeting-model';

export function DemoControls({
  keyboard,
  aiScenario,
  onAIScenario,
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
  aiScenario: DemoAIScenario;
  onAIScenario: (value: DemoAIScenario) => void;
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
  const [studio, setStudio] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Demo controls"
          className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 text-[11px] text-muted"
        >
          <FlaskConical width={13} height={13} aria-hidden="true" />
          <span className="hidden min-[420px]:inline">Playground</span>
        </button>
      </Dialog.Trigger>
      <ModalSurface open={open} instant={keyboard} className={studio ? 'max-w-2xl' : 'max-w-sm'}>
        <div className="flex items-center justify-between gap-3">
          <Dialog.Title className="text-lg font-medium tracking-tight">
            {studio ? 'Companion studio' : 'Meeting playground'}
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close demo controls"
            className="grid size-11 cursor-pointer place-items-center rounded-xl hover:bg-surface-muted"
          >
            <X width={18} height={18} aria-hidden="true" />
          </Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">Development controls</Dialog.Description>
        {studio ? (
          <>
            <CompanionStudio />
            <button
              type="button"
              className="mt-5 min-h-11 text-xs text-muted hover:text-text"
              onClick={() => setStudio(false)}
            >
              Back to playground
            </button>
          </>
        ) : (
          <>
            <div className="mt-6 space-y-5">
              <div>
                <p className="mb-2 text-xs font-medium">Capture source</p>
                <SelectPicker
                  label="Capture source"
                  icon={<Monitor width={17} height={17} />}
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
                  icon={<Users width={17} height={17} />}
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
                  icon={<AudioLines width={17} height={17} />}
                  value={speakerId}
                  options={people.map((person) => ({ value: person.id, label: person.name }))}
                  onValueChange={onSpeaker}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Connection</p>
                <SelectPicker
                  label="Demo connection"
                  icon={<Wifi width={17} height={17} />}
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
              <div>
                <p className="mb-2 text-xs font-medium">AI response</p>
                <SelectPicker
                  label="Demo AI response"
                  icon={<AudioLines width={17} height={17} />}
                  value={aiScenario}
                  options={[
                    { value: 'normal', label: 'Stream normally' },
                    { value: 'interrupted', label: 'Interrupt response' },
                    { value: 'empty', label: 'Empty response' },
                  ]}
                  onValueChange={(value) => {
                    if (value === 'normal' || value === 'interrupted' || value === 'empty')
                      onAIScenario(value);
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="mt-6 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-surface-muted text-sm"
            >
              <RotateCcw width={15} height={15} aria-hidden="true" />
              Reset playground
            </button>
            <button
              type="button"
              onClick={() => setStudio(true)}
              className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-sm hover:bg-surface-muted"
            >
              Open companion studio
            </button>
          </>
        )}
      </ModalSurface>
    </Dialog.Root>
  );
}
