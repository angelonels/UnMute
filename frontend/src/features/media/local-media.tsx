import { LoadingIndicator } from '../../components/loading-indicator';
import { syntheticCapture } from './demo-capture';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Effect } from 'effect';

export type MediaSource = 'camera' | 'microphone' | 'screen';
type Streams = Record<MediaSource, MediaStream | null>;
const emptyStreams = (): Streams => ({ camera: null, microphone: null, screen: null });
const stop = (stream: MediaStream | null) => stream?.getTracks().forEach((track) => track.stop());

function capture(source: MediaSource, deviceId?: string, mode = 'native') {
  return Effect.tryPromise({
    try: () => {
      if (import.meta.env.DEV && mode === 'synthetic') return syntheticCapture(source);
      if (import.meta.env.DEV && mode === 'denied')
        throw new DOMException('Denied', 'NotAllowedError');
      if (!navigator.mediaDevices) throw new DOMException('Unavailable', 'NotSupportedError');
      const device = deviceId ? { deviceId: { exact: deviceId } } : true;
      return source === 'screen'
        ? navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : navigator.mediaDevices.getUserMedia({
            video: source === 'camera' ? device : false,
            audio: source === 'microphone' ? device : false,
          });
    },
    catch: (error: unknown) => {
      const name = error instanceof DOMException ? error.name : 'UnknownError';
      const label =
        source === 'screen' ? 'Screen sharing' : source === 'camera' ? 'Camera' : 'Microphone';
      if (name === 'NotAllowedError')
        return `${label} permission was not granted. Allow access in your browser and try again.`;
      if (name === 'NotFoundError' || name === 'OverconstrainedError')
        return `${label} is unavailable. Connect a device or choose another input.`;
      if (name === 'NotReadableError' || name === 'AbortError')
        return `${label} could not start. Check whether another app is using it and try again.`;
      if (name === 'NotSupportedError' || error instanceof TypeError)
        return `${label} is not supported in this browser. Use a supported browser on HTTPS or localhost.`;
      return `${label} could not start. Please try again.`;
    },
  });
}

/** Owns local capture resources. Late permission responses never outlive their owner. */
export function useLocalMedia(initialMicrophone = false, initialCamera = false, mode = 'native') {
  const [ownedStreams] = useState(emptyStreams);
  const resources = useRef(ownedStreams);
  const selected = useRef<Partial<Record<MediaSource, string>>>({});
  const [selectedDevices, setSelectedDevices] = useState<Partial<Record<MediaSource, string>>>({});
  const generations = useRef({ camera: 0, microphone: 0, screen: 0 });
  const [streams, setStreams] = useState<Streams>(emptyStreams);
  const requesting = useRef({ camera: false, microphone: false, screen: false });
  const [pending, setPending] = useState({ camera: false, microphone: false, screen: false });
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const refreshDevices = useCallback(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    void Effect.runPromise(
      Effect.match(
        Effect.tryPromise(() => navigator.mediaDevices.enumerateDevices()),
        {
          onSuccess: (available) => {
            setDevices(available);
            for (const source of ['camera', 'microphone'] as const) {
              const id = selected.current[source];
              if (id && !available.some((device) => device.deviceId === id)) {
                delete selected.current[source];
                setSelectedDevices((previous) => ({ ...previous, [source]: undefined }));
                setError(
                  `${source === 'camera' ? 'Camera' : 'Microphone'} disconnected. System default will be used next.`,
                );
              }
            }
          },
          onFailure: () =>
            setError('Device list could not be refreshed. Default inputs are still available.'),
        },
      ),
    );
  }, []);
  const end = useCallback((source: MediaSource) => {
    generations.current[source]++;
    requesting.current[source] = false;
    stop(resources.current[source]);
    resources.current[source] = null;
    setStreams((previous) => ({ ...previous, [source]: null }));
    setPending((previous) => ({ ...previous, [source]: false }));
  }, []);
  const start = useCallback(
    (source: MediaSource, deviceId?: string) => {
      if (requesting.current[source]) return;
      requesting.current[source] = true;
      const generation = ++generations.current[source];
      setPending((previous) => ({ ...previous, [source]: true }));
      setError('');
      void Effect.runPromise(
        Effect.match(capture(source, deviceId, mode), {
          onFailure: (message) => {
            if (generation !== generations.current[source]) return;
            requesting.current[source] = false;
            setError(message);
            setPending((previous) => ({ ...previous, [source]: false }));
          },
          onSuccess: (stream) => {
            if (generation !== generations.current[source]) {
              stop(stream);
              return;
            }
            requesting.current[source] = false;
            selected.current[source] = deviceId;
            setSelectedDevices((previous) => ({ ...previous, [source]: deviceId }));
            stop(resources.current[source]);
            resources.current[source] = stream;
            setStreams((previous) => ({ ...previous, [source]: stream }));
            setPending((previous) => ({ ...previous, [source]: false }));
            const primary =
              source === 'microphone' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            (primary ?? stream.getTracks()[0])?.addEventListener(
              'ended',
              () => {
                if (resources.current[source] === stream) end(source);
              },
              { once: true },
            );
            refreshDevices();
          },
        }),
      );
    },
    [end, refreshDevices, mode],
  );
  const stopAll = useCallback(() => {
    for (const source of ['camera', 'microphone', 'screen'] as const) end(source);
  }, [end]);
  const captureInitial = useEffectEvent(() => {
    if (initialCamera) start('camera');
    if (initialMicrophone) start('microphone');
  });
  useEffect(() => {
    refreshDevices();
    const mediaDevices = navigator.mediaDevices;
    mediaDevices?.addEventListener('devicechange', refreshDevices);
    const ownedResources = resources.current;
    const ownedGenerations = generations.current;
    const ownedRequests = requesting.current;
    let active = true;
    // Capture is asynchronous; do not start a request for a discarded Strict Mode mount.
    queueMicrotask(() => {
      if (!active) return;
      captureInitial();
    });
    return () => {
      active = false;
      mediaDevices?.removeEventListener('devicechange', refreshDevices);
      for (const source of ['camera', 'microphone', 'screen'] as const) {
        ownedGenerations[source]++;
        ownedRequests[source] = false;
        stop(ownedResources[source]);
        ownedResources[source] = null;
      }
    };
  }, [refreshDevices]);
  return {
    streams,
    selectedDevices,
    pending,
    error,
    devices,
    start,
    end,
    stopAll,
    clearError: () => setError(''),
    toggle: (source: MediaSource) =>
      resources.current[source] ? end(source) : start(source, selected.current[source]),
  };
}

export function LocalVideo({
  stream,
  label,
  mirror = false,
  contain = false,
}: {
  stream: MediaStream;
  label: string;
  mirror?: boolean;
  contain?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const playbackRequest = useRef({ value: 0 });
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState<MediaStream | null>(null);
  const loading = playing !== stream && !blocked;
  const play = useCallback(() => {
    const element = video.current;
    if (element) {
      const requests = playbackRequest.current;
      const request = ++requests.value;
      void element.play().then(
        () => {
          if (request === requests.value) setBlocked(false);
        },
        () => {
          if (request === requests.value) setBlocked(true);
        },
      );
    }
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const requests = playbackRequest.current;
    element.srcObject = stream;
    play();
    return () => {
      requests.value++;
      element.srcObject = null;
    };
  }, [stream, play]);
  return (
    <>
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        aria-label={label}
        aria-busy={loading}
        onPlaying={() => setPlaying(stream)}
        onWaiting={() => setPlaying(null)}
        className={`absolute inset-0 size-full bg-black ${contain ? 'object-contain' : 'object-cover'} ${mirror ? '-scale-x-100' : ''}`}
      />
      {loading && (
        <span
          role="status"
          className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20 text-white"
        >
          <LoadingIndicator className="size-6" />
          <span className="sr-only">Loading video</span>
        </span>
      )}
      {blocked && (
        <button
          type="button"
          onClick={play}
          className="absolute inset-0 z-10 m-auto h-11 w-fit rounded-xl bg-surface px-4 text-sm text-text"
        >
          Play local video
        </button>
      )}
    </>
  );
}
