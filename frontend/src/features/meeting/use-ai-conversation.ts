import { useCallback, useEffect, useRef, useState } from 'react';
import { Effect } from 'effect';
import { consumeAIStream, type AIStreamSource } from './ai-stream';
import type { StateName } from '../../components/companion/dotty-engine';
import { companionBehavior } from './companion-behavior';
import type { MeetingMessage } from './meeting-model';

export type AIMessage = MeetingMessage & {
  state?: 'waiting' | 'streaming' | 'complete' | 'stopped' | 'error';
  error?: string;
};
/** Owns one response across panel closes; route unmount, leave and disconnect abort it. */
export function useAIConversation(source: AIStreamSource | undefined, enabled: boolean) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [composerFocused, setComposerAttentive] = useState(false);
  const attentionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const attendToComposer = (focused: boolean) => {
    clearTimeout(attentionTimer.current);
    setComposerAttentive(focused);
    if (focused) attentionTimer.current = setTimeout(() => setComposerAttentive(false), 5000);
  };
  const [readingHistory, setReadingHistory] = useState(false);
  const [companionState, setCompanionState] = useState<StateName>('idle');
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const active = useRef<{
    controller: AbortController;
    id: string;
    text: string;
    flush: ReturnType<typeof setTimeout> | undefined;
    timeout: ReturnType<typeof setTimeout> | undefined;
  } | null>(null);
  const stop = useCallback(() => {
    const current = active.current;
    if (!current) return;
    clearTimeout(reactionTimer.current);
    setCompanionState('listening');
    reactionTimer.current = setTimeout(() => setCompanionState('idle'), 900);
    active.current = null;
    clearTimeout(current.flush);
    clearTimeout(current.timeout);
    current.controller.abort();
    setMessages((previous) =>
      previous.map((message) =>
        message.id === current.id ? { ...message, text: current.text, state: 'stopped' } : message,
      ),
    );
    setBusy(false);
  }, []);
  useEffect(() => {
    if (!enabled) stop();
    return stop;
  }, [enabled, source, stop]);
  useEffect(
    () => () => {
      clearTimeout(reactionTimer.current);
      clearTimeout(attentionTimer.current);
    },
    [],
  );
  const run = (history: AIMessage[]) => {
    if (!source || !enabled || active.current) return;
    const id = crypto.randomUUID();
    const current = {
      controller: new AbortController(),
      id,
      text: '',
      flush: undefined as ReturnType<typeof setTimeout> | undefined,
      timeout: undefined as ReturnType<typeof setTimeout> | undefined,
    };
    active.current = current;
    setMessages([
      ...history,
      {
        id,
        authorId: 'assistant',
        text: '',
        createdAt: new Date().toISOString(),
        state: 'waiting',
      },
    ]);
    clearTimeout(reactionTimer.current);
    setCompanionState('thinking');
    setBusy(true);
    const publish = () => {
      current.flush = undefined;
      if (active.current !== current) return;
      setCompanionState('working');
      setMessages((previous) =>
        previous.map((message) =>
          message.id === id ? { ...message, text: current.text, state: 'streaming' } : message,
        ),
      );
    };
    const finish = (error?: string) => {
      if (active.current !== current) return;
      active.current = null;
      clearTimeout(current.flush);
      clearTimeout(current.timeout);
      setMessages((previous) =>
        previous.map((message) =>
          message.id === id
            ? { ...message, text: current.text, state: error ? 'error' : 'complete', error }
            : message,
        ),
      );
      setBusy(false);
      setCompanionState(error ? 'alert' : 'celebrating');
      reactionTimer.current = setTimeout(() => setCompanionState('idle'), 2400);
    };
    const armTimeout = () => {
      clearTimeout(current.timeout);
      current.timeout = setTimeout(() => {
        finish('Response timed out. Try again.');
        current.controller.abort();
      }, 45000);
    };
    armTimeout();
    void Effect.runPromise(
      consumeAIStream(
        source,
        {
          signal: current.controller.signal,
          messages: history
            .filter((message) => message.text)
            .map((message) => ({
              role: message.authorId === 'self' ? 'user' : 'assistant',
              content: message.text,
            })),
        },
        (chunk) => {
          if (active.current !== current) return;
          current.text += chunk;
          armTimeout();
          // Network chunks are batched, while the user's own message appears immediately.
          current.flush ??= setTimeout(publish, 40);
        },
      ).pipe(
        Effect.match({ onSuccess: () => finish(), onFailure: (error) => finish(error.message) }),
      ),
    );
  };
  return {
    messages,
    companionState: enabled ? companionState : ('idle' as StateName),
    companion: companionBehavior({
      response: enabled ? companionState : 'idle',
      busy,
      focused: composerFocused,
      draft,
      reading: readingHistory,
    }),
    setComposerFocused: attendToComposer,
    setReadingHistory,
    draft,
    setDraft: (text: string) => {
      setDraft(text);
      attendToComposer(true);
    },
    busy,
    stop,
    available: !!source,
    send: (prompt = draft) => {
      const text = prompt.trim().slice(0, 2000);
      if (!text || !source || !enabled || active.current) return;
      setDraft('');
      run(
        [
          ...messages,
          { id: crypto.randomUUID(), authorId: 'self', text, createdAt: new Date().toISOString() },
        ].slice(-39),
      );
    },
    retry: () => {
      if (messages.at(-1)?.authorId === 'assistant') run(messages.slice(0, -1));
    },
  };
}
