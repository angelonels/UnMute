import { useCallback, useEffect, useRef, useState } from 'react';
import { Effect } from 'effect';
import { consumeAIStream, type AIStreamSource } from './ai-stream';
import type { MeetingMessage } from './meeting-model';

export type AIMessage = MeetingMessage & {
  state?: 'waiting' | 'streaming' | 'complete' | 'stopped' | 'error';
  error?: string;
};
/** Owns one response across panel closes; route unmount, leave and disconnect abort it. */
export function useAIConversation(source: AIStreamSource | undefined, enabled: boolean) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [draft, setDraft] = useState('');
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
    setBusy(true);
    const publish = () => {
      current.flush = undefined;
      if (active.current !== current) return;
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
    draft,
    setDraft,
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
