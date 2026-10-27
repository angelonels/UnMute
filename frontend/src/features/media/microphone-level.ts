import { useEffect, useState, type RefObject } from 'react';
import { Effect } from 'effect';

/** Local voice activity only. The analyser is never connected to speakers. */
export function useMicrophoneLevel(
  stream: MediaStream | null,
  meter: RefObject<HTMLMeterElement | null>,
) {
  const [speaking, setSpeaking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!stream) return;
    let active = true;
    let context: AudioContext | undefined;
    let frame = 0;
    let lastUpdate = 0;
    let lastVoice = Number.NEGATIVE_INFINITY;
    const operation = Effect.tryPromise(async () => {
      const audio = new AudioContext();
      context = audio;
      await audio.resume();
      if (!active) return;
      const analyser = audio.createAnalyser();
      analyser.fftSize = 512;
      audio.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      setUnavailable(false);
      const sample = (now: number) => {
        if (!active) return;
        if (now - lastUpdate >= 100) {
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce((sum, value) => sum + value * value, 0) / samples.length,
          );
          if (rms > 0.025) lastVoice = now;
          if (meter.current) meter.current.value = rms;
          setSpeaking(now - lastVoice < 400);
          lastUpdate = now;
        }
        frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
    });
    void Effect.runPromise(
      Effect.match(operation, {
        onSuccess: () => undefined,
        onFailure: () => {
          if (active) setUnavailable(true);
        },
      }),
    );
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      if (context && context.state !== 'closed') {
        void context.close().catch(() => console.error('microphone_analyser_cleanup_failed'));
      }
    };
  }, [stream, meter]);
  return { speaking: !!stream && speaking, unavailable: !!stream && unavailable };
}
