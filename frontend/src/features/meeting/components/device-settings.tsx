import { LoadingIndicator } from '../../../components/loading-indicator';
import { useState } from 'react';
import { ModalSurface } from '../../../components/modal-surface';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Settings as Settings2,
  Xmark as X,
  Microphone as Mic,
  VideoCamera as Video,
} from 'iconoir-react';
import { SelectPicker } from '../../../components/select-picker';
import type { MediaSource } from '../../media';

export function DeviceSettings({
  keyboard,
  error,
  devices,
  selectedDevices,
  streams,
  pending,
  onSelect,
}: {
  keyboard: boolean;
  error: string;
  devices: MediaDeviceInfo[];
  selectedDevices: Partial<Record<MediaSource, string>>;
  streams: Record<MediaSource, MediaStream | null>;
  pending: Record<MediaSource, boolean>;
  onSelect: (source: MediaSource, deviceId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Device settings"
        title="Device settings"
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted"
      >
        <Settings2 width={18} height={18} aria-hidden="true" />
      </Dialog.Trigger>
      <ModalSurface open={open} instant={keyboard} className="max-w-md">
        <div className="flex items-center justify-between gap-3">
          <Dialog.Title className="text-lg font-medium">Device settings</Dialog.Title>
          <Dialog.Close
            aria-label="Close device settings"
            className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-surface-muted"
          >
            <X width={18} height={18} />
          </Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">Audio and video preferences</Dialog.Description>
        {(['microphone', 'camera'] as const).map((source) => {
          const inputs = devices.filter(
            (device) => device.kind === (source === 'camera' ? 'videoinput' : 'audioinput'),
          );
          const track = streams[source]?.getTracks()[0];
          const options = [
            { value: 'system-default', label: 'System default' },
            ...inputs
              .filter((device) => device.deviceId && device.deviceId !== 'default')
              .map((device, index) => ({
                value: device.deviceId,
                label:
                  device.label || `${source === 'camera' ? 'Camera' : 'Microphone'} ${index + 1}`,
              })),
          ];
          const deviceId = selectedDevices[source];
          const selected =
            options.find((option) => option.value === deviceId)?.value ?? 'system-default';
          const label = source === 'camera' ? 'Camera' : 'Microphone';
          return (
            <div key={source} className="mt-6 min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium">{label}</span>
                <span
                  role="status"
                  className={`inline-flex items-center gap-1.5 text-[11px] ${pending[source] ? 'text-muted' : track ? 'text-success' : 'text-error'}`}
                >
                  {pending[source] && <LoadingIndicator className="size-3" />}
                  {pending[source] ? 'Connecting…' : track ? 'On' : 'Off'}
                </span>
              </div>
              <SelectPicker
                label={`${label.toLowerCase()} input`}
                icon={
                  source === 'camera' ? (
                    <Video width={17} height={17} strokeWidth={1.5} />
                  ) : (
                    <Mic width={17} height={17} strokeWidth={1.5} />
                  )
                }
                disabled={pending[source]}
                value={selected}
                options={options}
                onValueChange={(value) =>
                  onSelect(source, value === 'system-default' ? undefined : value)
                }
              />
            </div>
          );
        })}
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-error/10 p-3 text-xs leading-6 text-error">
            {error}
          </p>
        )}
      </ModalSurface>
    </Dialog.Root>
  );
}
