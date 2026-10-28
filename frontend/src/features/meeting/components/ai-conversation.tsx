import { m } from 'motion/react';
import { useReducedMotion } from '../../../hooks/use-reduced-motion';
import Markdown from 'react-markdown';
import { memo, useDeferredValue, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, List, Refresh, Square, Text, Lock } from 'iconoir-react';
import { AICompanion } from '../../../components/ai-companion';
import type { useAIConversation } from '../use-ai-conversation';

type Conversation = ReturnType<typeof useAIConversation>;
const suggestions = [
  {
    title: 'Catch me up',
    prompt: 'Summarize the discussion',
    detail: 'The decisions, without the noise',
    icon: Text,
  },
  {
    title: 'Find the next steps',
    prompt: 'List action items',
    detail: 'Turn this conversation into action',
    icon: List,
  },
];

const Answer = memo(function Answer({ text }: { text: string }) {
  const visibleText = useDeferredValue(text);
  return (
    <div className="space-y-3 text-sm leading-7 [overflow-wrap:anywhere] [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-medium [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:ps-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:ps-4 [&_li]:ps-1 [&_li::marker]:text-muted [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:text-muted [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface-muted [&_pre]:p-3 [&_pre]:text-xs [&_code]:font-mono [&_code]:text-[0.9em] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_hr]:my-4 [&_hr]:border-border">
      <Markdown
        skipHtml
        disallowedElements={['img']}
        components={{
          h1: 'h3',
          h2: 'h3',
          h4: 'h3',
          h5: 'h3',
          h6: 'h3',
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {visibleText}
      </Markdown>
    </div>
  );
});

function CopyAnswer({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const timer = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <button
      type="button"
      aria-label="Copy answer"
      onClick={() => {
        if (!navigator.clipboard) {
          setState('error');
          return;
        }
        void navigator.clipboard.writeText(text).then(
          () => setState('copied'),
          () => setState('error'),
        );
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[11px] text-muted hover:bg-surface-muted hover:text-text"
    >
      {state === 'copied' ? <Check width={14} height={14} /> : <Copy width={14} height={14} />}
      <span role="status">
        {state === 'copied' ? 'Copied' : state === 'error' ? 'Copy unavailable' : 'Copy'}
      </span>
    </button>
  );
}

export function AIConversation({
  conversation: ai,
  demo,
  disabled,
  keyboard,
}: {
  keyboard: boolean;
  conversation: Conversation;
  demo: boolean;
  disabled: boolean;
}) {
  const reduced = useReducedMotion();
  const input = useRef<HTMLTextAreaElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [away, setAway] = useState(false);
  const unavailable = !ai.available;
  const lastAnswer = ai.messages.at(-1);
  const announcement = ai.busy
    ? 'AI is responding'
    : lastAnswer?.authorId === 'assistant'
      ? `${lastAnswer.state === 'stopped' ? 'Response stopped.' : lastAnswer.state === 'error' ? lastAnswer.error : 'UnMute AI.'} ${lastAnswer.text}`
      : '';
  useEffect(() => {
    const node = viewport.current;
    const body = content.current;
    if (!node || !body) return;
    const follow = () => {
      if (following.current) node.scrollTop = node.scrollHeight;
    };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);
  const send = (prompt?: string) => {
    following.current = true;
    setAway(false);
    ai.send(prompt);
    input.current?.focus();
  };
  return (
    <>
      <div className="mx-5 flex shrink-0 items-center gap-1.5 border-b border-border/60 pb-3 text-[11px] text-muted">
        <Lock width={12} height={12} aria-hidden="true" /> Private conversation
        <span className="ms-auto rounded-md bg-surface-muted px-2 py-1">
          {demo ? 'Sample meeting' : unavailable ? 'Not connected' : 'This meeting'}
        </span>
      </div>
      <div
        ref={viewport}
        onScroll={(event) => {
          const node = event.currentTarget;
          following.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
          setAway(!following.current);
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 [scrollbar-width:thin]"
      >
        <div ref={content} className="flex min-h-full flex-col py-6">
          {!ai.messages.length ? (
            <div className="my-auto py-2">
              <AICompanion
                size={96}
                dimensional
                className="-ms-3 mb-3"
                label="UnMute AI companion"
              />
              <h2 className="text-[28px] leading-[1.15] font-medium tracking-[-0.045em]">
                More clarity.
                <br />
                <span className="text-muted">Less catching up.</span>
              </h2>
              <p className="mt-4 max-w-64 text-sm leading-6 text-muted">
                {unavailable
                  ? 'AI will be available when your meeting is connected.'
                  : 'A thought partner for the conversation you’re in.'}
              </p>
              <div className="mt-6 space-y-2">
                {suggestions.map(({ title, detail, prompt, icon: Icon }) => (
                  <button
                    key={title}
                    type="button"
                    aria-label={prompt}
                    disabled={disabled || unavailable}
                    onClick={() => send(prompt)}
                    className="group flex min-h-18 w-full cursor-pointer items-center gap-3 rounded-2xl border border-border/70 px-3 py-3 text-left hover:bg-surface-muted disabled:cursor-default disabled:opacity-45 motion-safe:transition-[background-color,transform] motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:active:not-focus-visible:scale-[0.98]"
                  >
                    <Icon
                      width={19}
                      height={19}
                      className="shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{title}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-muted">{detail}</span>
                    </span>
                    <ArrowUp
                      width={14}
                      height={14}
                      className="rotate-45 text-muted"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              role="log"
              aria-label="Private AI conversation"
              aria-live="off"
              aria-busy={ai.busy}
              className="space-y-7"
            >
              {ai.messages.map((message, index) =>
                message.authorId === 'self' ? (
                  <div
                    key={message.id}
                    className="ms-8 rounded-[1.125rem] rounded-br-md bg-surface-muted px-4 py-3 text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]"
                  >
                    {message.text}
                  </div>
                ) : (
                  <article key={message.id} aria-label="AI answer">
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                      <AICompanion size={28} /> UnMute AI
                    </div>
                    {message.state === 'waiting' ? (
                      <p className="text-sm text-muted" role="status">
                        Thinking…
                      </p>
                    ) : (
                      <m.div
                        key="answer"
                        initial={{ opacity: keyboard || reduced ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <Answer text={message.text} />
                      </m.div>
                    )}
                    {message.state === 'streaming' && (
                      <span
                        className="mt-2 block h-1 w-5 rounded-full bg-primary/50"
                        aria-hidden="true"
                      />
                    )}
                    {message.state === 'stopped' && (
                      <p className="mt-2 text-xs text-muted">Stopped</p>
                    )}
                    {message.error && (
                      <p role="alert" className="mt-3 text-xs leading-5 text-error">
                        {message.error}
                      </p>
                    )}
                    {!ai.busy && (
                      <div className="-ms-2 mt-2 flex items-center gap-1">
                        {message.text && <CopyAnswer text={message.text} />}
                        {index === ai.messages.length - 1 && (
                          <button
                            type="button"
                            disabled={disabled || unavailable}
                            onClick={ai.retry}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[11px] text-muted hover:bg-surface-muted hover:text-text disabled:opacity-40"
                          >
                            <Refresh width={14} height={14} aria-hidden="true" /> Try again
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      </div>
      <span className="sr-only" role="status" aria-atomic="true">
        {announcement}
      </span>
      {away && (
        <button
          type="button"
          onClick={() => {
            following.current = true;
            setAway(false);
            const node = viewport.current;
            if (node) node.scrollTop = node.scrollHeight;
          }}
          className="mx-auto mb-2 inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs shadow-sm"
        >
          <ArrowDown width={13} height={13} /> Latest answer
        </button>
      )}
      <div className="shrink-0 p-4 pt-3">
        <div className="rounded-[1.25rem] border border-border bg-surface-muted/35 p-3 focus-within:border-input">
          <textarea
            ref={input}
            aria-label="Ask UnMute AI"
            placeholder={unavailable ? 'AI not connected' : 'Ask about this meeting…'}
            value={ai.draft}
            onChange={(event) => ai.setDraft(event.target.value)}
            maxLength={2000}
            disabled={disabled || unavailable}
            rows={1}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (!ai.busy) send();
              }
            }}
            className="block max-h-32 min-h-11 w-full resize-none bg-transparent text-sm leading-6 outline-none! [field-sizing:content] placeholder:text-muted disabled:opacity-50"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted">
              {ai.busy ? 'Responding' : demo ? 'Sample discussion' : 'UnMute AI'}
              {ai.draft.length > 1600 && ` · ${ai.draft.length}/2000`}
            </span>
            <button
              type="button"
              aria-label={ai.busy ? 'Stop response' : 'Send AI prompt'}
              disabled={!ai.busy && (unavailable || disabled || !ai.draft.trim())}
              onClick={() => (ai.busy ? ai.stop() : send())}
              className="grid size-11 cursor-pointer place-items-center rounded-full bg-text text-surface disabled:cursor-default disabled:opacity-25 motion-safe:transition-transform motion-safe:duration-150 motion-safe:active:not-focus-visible:scale-[0.96]"
            >
              {ai.busy ? (
                <Square width={15} height={15} strokeWidth={2} aria-hidden="true" />
              ) : (
                <ArrowUp width={18} height={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
