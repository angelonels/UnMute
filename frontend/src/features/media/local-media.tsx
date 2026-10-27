import { syntheticCapture } from './demo-capture';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const resources = useRef<Streams>(emptyStreams());
  const generations = useRef({ camera: 0, microphone: 0, screen: 0 });
  const [streams, setStreams] = useState<Streams>(emptyStreams);
  const [pending, setPending] = useState({ camera: false, microphone: false, screen: false });
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const refreshDevices = useCallback(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    void Effect.runPromise(
      Effect.match(
        Effect.tryPromise(() => navigator.mediaDevices.enumerateDevices()),
        {
          onSuccess: setDevices,
          onFailure: () =>
            setError('Device list could not be refreshed. Default inputs are still available.'),
        },
      ),
    );
  }, []);
  const end = useCallback((source: MediaSource) => {
    generations.current[source]++;
    stop(resources.current[source]);
    resources.current[source] = null;
    setStreams((previous) => ({ ...previous, [source]: null }));
    setPending((previous) => ({ ...previous, [source]: false }));
  }, []);
  const start = useCallback(
    (source: MediaSource, deviceId?: string) => {
      const generation = ++generations.current[source];
      setPending((previous) => ({ ...previous, [source]: true }));
      setError('');
      void Effect.runPromise(
        Effect.match(capture(source, deviceId, mode), {
          onFailure: (message) => {
            if (generation !== generations.current[source]) return;
            setError(message);
            setPending((previous) => ({ ...previous, [source]: false }));
          },
          onSuccess: (stream) => {
            if (generation !== generations.current[source]) {
              stop(stream);
              return;
            }
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
  useEffect(() => {
    refreshDevices();
    const mediaDevices = navigator.mediaDevices;
    mediaDevices?.addEventListener('devicechange', refreshDevices);
    const ownedResources = resources.current;
    const ownedGenerations = generations.current;
    let active = true;
    // Capture is asynchronous; do not start a request for a discarded Strict Mode mount.
    queueMicrotask(() => {
      if (!active) return;
      if (initialCamera) start('camera');
      if (initialMicrophone) start('microphone');
    });
    return () => {
      active = false;
      mediaDevices?.removeEventListener('devicechange', refreshDevices);
      for (const source of ['camera', 'microphone', 'screen'] as const) {
        ownedGenerations[source]++;
        stop(ownedResources[source]);
        ownedResources[source] = null;
      }
    };
  }, [initialCamera, initialMicrophone, refreshDevices, start]);
  return {
    streams,
    pending,
    error,
    devices,
    start,
    end,
    stopAll,
    clearError: () => setError(''),
    toggle: (source: MediaSource) => (resources.current[source] ? end(source) : start(source)),
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
  const playbackRequest = useRef(0);
  const [blocked, setBlocked] = useState(false);
  const play = useCallback(() => {
    const element = video.current;
    if (element) {
      const request = ++playbackRequest.current;
      void element.play().then(
        () => {
          if (request === playbackRequest.current) setBlocked(false);
        },
        () => {
          if (request === playbackRequest.current) setBlocked(true);
        },
      );
    }
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.srcObject = stream;
    play();
    return () => {
      playbackRequest.current++;
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
        className={`absolute inset-0 size-full bg-black ${contain ? 'object-contain' : 'object-cover'} ${mirror ? '-scale-x-100' : ''}`}
      />
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
