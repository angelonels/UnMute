import type { MediaSource } from './local-media';

/** Explicit development fixture. It never opens a physical input or audio output. */
export function syntheticCapture(source: MediaSource): Promise<MediaStream> {
  if (source === 'microphone') {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    const track = destination.stream.getAudioTracks()[0];
    const originalStop = track?.stop.bind(track);
    if (track && originalStop)
      track.stop = () => {
        originalStop();
        void context
          .close()
          .catch((error: unknown) =>
            console.error(
              'demo_audio_cleanup_failed',
              error instanceof Error ? error.name : 'UnknownError',
            ),
          );
      };
    return Promise.resolve(destination.stream);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new DOMException('Unavailable', 'NotSupportedError'));
  context.fillStyle = source === 'screen' ? '#e4e9e1' : '#355346';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = source === 'screen' ? '#355346' : '#e4e9e1';
  context.font = '44px system-ui';
  context.fillText(
    source === 'screen' ? 'A clearer space to connect.' : 'Your camera preview',
    100,
    320,
  );
  context.font = '24px system-ui';
  context.fillText('Synthetic capture · no physical device is active', 100, 390);
  return Promise.resolve(canvas.captureStream(5));
}
