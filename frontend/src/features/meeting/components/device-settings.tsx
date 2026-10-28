import { useState } from 'react';
import { ModalSurface } from '../../../components/modal-surface';
import { useCompanionMotion } from '../../../components/companion/motion-preference';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings2, X } from 'lucide-react';
import type { MediaSource } from '../../media';

export function DeviceSettings({
  keyboard,
  error,
  devices,
  streams,
  pending,
  onSelect,
}: {
  keyboard: boolean;
  error: string;
  devices: MediaDeviceInfo[];
  streams: Record<MediaSource, MediaStream | null>;
  pending: Record<MediaSource, boolean>;
  onSelect: (source: MediaSource, deviceId?: string) => void;
}) {
  const [companionMotion, setCompanionMotion] = useCompanionMotion();
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Device settings"
        title="Device settings"
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted"
      >
        <Settings2 size={18} aria-hidden="true" />
      </Dialog.Trigger>
      <ModalSurface open={open} instant={keyboard} className="max-w-md">
        <div className="flex items-center justify-between gap-3">
          <Dialog.Title className="text-lg font-medium">Device settings</Dialog.Title>
          <Dialog.Close
            aria-label="Close device settings"
            className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-surface-muted"
          >
            <X size={18} />
          </Dialog.Close>
        </div>
        <Dialog.Description className="mt-1 text-xs leading-6 text-muted">
          Inputs are captured locally. Device names appear after you allow access.
        </Dialog.Description>
        {(['microphone', 'camera'] as const).map((source) => {
          const inputs = devices.filter(
            (device) => device.kind === (source === 'camera' ? 'videoinput' : 'audioinput'),
          );
          const track = streams[source]?.getTracks()[0];
          return (
            <label key={source} className="mt-5 block text-xs font-medium capitalize">
              {source}
              <select
                aria-label={`${source} input`}
                disabled={pending[source]}
                value={track?.getSettings().deviceId ?? ''}
                onChange={(event) => onSelect(source, event.target.value || undefined)}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface-muted px-3 text-sm text-text disabled:opacity-50"
              >
                <option value="">Default input</option>
                {inputs.map(
                  (device, index) =>
                    device.deviceId && (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${source} ${index + 1}`}
                      </option>
                    ),
                )}
              </select>
            </label>
          );
        })}
        <label className="mt-6 flex min-h-11 cursor-pointer items-center justify-between gap-4 border-t border-border pt-4 text-sm">
          Companion animation
          <input
            type="checkbox"
            checked={companionMotion}
            onChange={(event) => setCompanionMotion(event.target.checked)}
            className="size-4 accent-primary"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-error/10 p-3 text-xs leading-6 text-error">
            {error}
          </p>
        )}
        <p className="mt-5 text-xs leading-6 text-muted">
          Choosing an input turns it on. Changing an active input keeps the current device until its
          replacement is ready.
        </p>
      </ModalSurface>
    </Dialog.Root>
  );
}
