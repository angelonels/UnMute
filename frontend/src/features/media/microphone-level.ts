import { useEffect, useState, type RefObject } from 'react';
import { Effect } from 'effect';
import { createFrameEmitter } from '../../lib/audio/frame-source';
import { bandsFromSpectrum, logBandEdges } from '../../lib/audio/bands';
import type { FrameSource, VisualFrame } from '../../lib/audio/types';

export type AudioVisualSource = FrameSource<VisualFrame>;

/** Local voice activity only. The analyser is never connected to speakers. */
export function useMicrophoneLevel(
  stream: MediaStream | null,
  meter: RefObject<HTMLMeterElement | null>,
) {
  const [visual] = useState(createFrameEmitter<VisualFrame>);
  const [speaking, setSpeaking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!stream) return;
    let active = true;
    let context: AudioContext | undefined;
    let frame = 0;
    let lastUpdate = 0;
    let lastMeter = 0;
    const bands = new Float32Array(9);
    const history = new Float32Array(0);
    const emit = (peakDb: number) =>
      visual.emit({ bands, history, historyStart: 0, historyLength: 0, peakDb });
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
      const spectrum = new Float32Array(analyser.frequencyBinCount);
      const edges = logBandEdges(9, 100, Math.min(8000, audio.sampleRate / 2));
      setUnavailable(false);
      const sample = (now: number) => {
        if (!active) return;
        if (now - lastUpdate >= 1000 / 30) {
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce((sum, value) => sum + value * value, 0) / samples.length,
          );
          analyser.getFloatFrequencyData(spectrum);
          bandsFromSpectrum(spectrum, audio.sampleRate, edges, bands, { minDb: -80, maxDb: -25 });
          if (rms < 0.008) bands.fill(0);
          emit(rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY);
          if (rms > 0.025) lastVoice = now;
          if (meter.current) meter.current.value = rms;
          if (now - lastMeter >= 100) {
            setSpeaking(now - lastVoice < 400);
            lastMeter = now;
          }
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
      bands.fill(0);
      emit(Number.NEGATIVE_INFINITY);
      if (context && context.state !== 'closed') {
        void context.close().catch(() => console.error('microphone_analyser_cleanup_failed'));
      }
    };
  }, [stream, meter, visual]);
  return { speaking: !!stream && speaking, unavailable: !!stream && unavailable, visual };
}
