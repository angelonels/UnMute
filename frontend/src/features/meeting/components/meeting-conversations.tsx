import { AnimatePresence, m } from 'motion/react';
import { AICompanion } from '../../../components/ai-companion';
import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { ArrowDown, ArrowUp, Users } from 'lucide-react';
import { ChatThread } from '../../../components/arc/chat-thread/chat-thread';
import { initials, type MeetingMessage, type Participant } from '../meeting-model';

export function MessageComposer({
  value,
  onChange,
  onSend,
  label,
  disabled = false,
  inputRef,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  label: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLTextAreaElement>;
}) {
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }
  return (
    <div className="shrink-0 border-t border-border/70 p-4">
      <div className="rounded-[1.25rem] border border-border/80 bg-surface-muted/40 p-3 transition-[border-color,background-color] duration-150 ease-out-expo focus-within:border-input focus-within:bg-surface motion-reduce:transition-none">
        <textarea
          ref={inputRef}
          aria-label={label}
          placeholder={disabled ? 'Reconnect to send' : label}
          value={value}
          maxLength={2000}
          rows={1}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={keyDown}
          className="block max-h-36 min-h-11 [field-sizing:content] w-full resize-none bg-transparent text-sm leading-6 text-text outline-none! placeholder:text-muted disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">
            Local only
            {value.length > 0 && <span className="ms-2 tabular-nums">{value.length}/2000</span>}
          </span>
          <button
            type="button"
            aria-label={label === 'Ask UnMute AI' ? 'Send AI prompt' : 'Send message'}
            disabled={!value.trim() || disabled}
            onClick={onSend}
            className="grid size-11 cursor-pointer place-items-center rounded-full bg-text text-surface disabled:cursor-default disabled:opacity-30 motion-safe:transition-transform motion-safe:duration-160 motion-safe:ease-out-expo motion-safe:[&:enabled:active:not(:focus-visible)]:scale-[0.97]"
          >
            <ArrowUp size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MeetingChat({
  people,
  messages,
  draft,
  onDraft,
  onSend,
  disabled,
}: {
  people: Participant[];
  messages: MeetingMessage[];
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="mx-5 mb-1 flex items-center gap-2 py-1 text-[11px] text-muted">
        <Users size={13} aria-hidden="true" />
        Everyone
      </div>
      <div className="min-h-0 flex-1 [--accent:var(--primary)] [--accent-foreground:var(--on-primary)]">
        {messages.length ? (
          <ChatThread
            participants={people}
            currentUserId="self"
            messages={messages}
            composer={false}
            allowAttachments={false}
            reactions={[]}
            label="Meeting messages"
            labels={{ sent: 'Stored locally', delivered: 'Stored locally', read: 'Stored locally' }}
          />
        ) : (
          <div
            role="log"
            aria-label="Meeting messages"
            className="flex h-full flex-col items-center justify-center p-6 text-center"
          >
            <span className="text-sm font-medium">No messages yet</span>
          </div>
        )}
      </div>
      <MessageComposer
        value={draft}
        onChange={onDraft}
        onSend={onSend}
        label="Message everyone"
        disabled={disabled}
      />
    </>
  );
}

export function AIConversation({
  keyboard,
  messages,
  draft,
  onDraft,
  onSend,
  onSuggestion,
  demo,
  disabled,
}: {
  keyboard: boolean;
  messages: MeetingMessage[];
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  onSuggestion: (prompt: string) => void;
  demo: boolean;
  disabled: boolean;
}) {
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (messages.length > 0 && following.current)
      bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [messages]);
  return (
    <>
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          following.current = node.scrollHeight - node.scrollTop - node.clientHeight < 60;
          setAway(!following.current);
        }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-width:thin]"
      >
        <AnimatePresence mode="popLayout" custom={keyboard}>
          {messages.length === 0 ? (
            <m.div
              key="welcome"
              className="my-auto shrink-0 py-6"
              initial={false}
              custom={keyboard}
              variants={{
                out: (instant: boolean) => ({
                  opacity: 0,
                  transition: { duration: instant ? 0 : 0.12 },
                }),
              }}
              exit="out"
            >
              <AICompanion
                size={104}
                active={false}
                label="UnMute AI companion"
                className="mb-4 -ms-2"
              />
              <h2 className="text-2xl leading-tight font-medium tracking-[-0.04em]">
                A little room
                <br />
                to think.
              </h2>
              <p className="mt-3 max-w-60 text-xs leading-6 text-muted">
                {demo ? 'Sample discussion' : 'AI is not connected.'}
              </p>
              <div className="mt-7 flex flex-col">
                {['Summarize the discussion', 'List action items', 'What did I miss?'].map(
                  (prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      disabled={disabled}
                      onClick={() => {
                        onSuggestion(prompt);
                        composerRef.current?.focus();
                      }}
                      className="group flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg py-2 text-left text-xs text-muted transition-colors duration-150 hover:text-text disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {prompt}
                      <ArrowUp
                        size={14}
                        strokeWidth={1.5}
                        className="shrink-0 rotate-45 opacity-50 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </button>
                  ),
                )}
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
        <m.div
          initial={false}
          animate={{ opacity: messages.length ? 1 : 0 }}
          transition={{ duration: keyboard ? 0 : 0.16 }}
          role="log"
          aria-label="Private AI conversation"
          aria-live="polite"
          aria-relevant="additions"
          className="space-y-6"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.authorId === 'self' ? 'ms-7 rounded-2xl bg-surface-muted px-4 py-3' : ''
              }
            >
              <span className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted">
                {message.authorId === 'self' ? (
                  'You'
                ) : (
                  <>
                    <AICompanion size={24} />
                    UnMute AI{' '}
                    <span className="font-normal opacity-65">{demo ? 'Sample' : 'Preview'}</span>
                  </>
                )}
              </span>
              <p className="text-sm leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {message.text}
              </p>
            </div>
          ))}
        </m.div>
        <div ref={bottomRef} />
      </div>
      {messages.length > 0 && away && (
        <button
          type="button"
          className="mx-auto mb-2 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-surface-muted px-3 text-xs text-muted"
          onClick={() => {
            following.current = true;
            setAway(false);
            bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          }}
        >
          <ArrowDown size={12} aria-hidden="true" />
          Latest answer
        </button>
      )}
      <MessageComposer
        value={draft}
        onChange={onDraft}
        onSend={onSend}
        label="Ask UnMute AI"
        inputRef={composerRef}
        disabled={disabled}
      />
    </>
  );
}

export function PeopleList({
  people,
  pinnedId,
  onPin,
  search,
  onSearch,
}: {
  people: Participant[];
  pinnedId: string | null;
  onPin: (id: string) => void;
  search: string;
  onSearch: (text: string) => void;
}) {
  const filtered = people
    .filter((person) => person.name.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => Number(right.hand) - Number(left.hand));
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
      <input
        type="search"
        aria-label="Find a participant"
        placeholder="Find someone"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        className="mb-4 min-h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="space-y-2">
          {filtered.map((person) => (
            <li key={person.id} className="flex items-center gap-3 rounded-xl p-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-medium">
                {initials(person.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {person.name}
                  {person.self ? ' (you)' : ''}
                </p>
                <span className={`text-[10px] ${person.hand ? 'text-warning' : 'text-muted'}`}>
                  {person.hand ? 'Hand raised' : person.role}
                </span>
              </div>
              <button
                type="button"
                aria-label={`${pinnedId === person.id ? 'Unpin' : 'Pin'} ${person.name}`}
                aria-pressed={pinnedId === person.id}
                onClick={() => onPin(person.id)}
                className="min-h-11 cursor-pointer px-2 text-xs text-primary"
              >
                {pinnedId === person.id ? 'Unpin' : 'Pin'}
              </button>
            </li>
          ))}
        </ul>
        {!filtered.length && (
          <p className="py-8 text-center text-xs text-muted">No matching participants.</p>
        )}
      </div>
    </div>
  );
}
