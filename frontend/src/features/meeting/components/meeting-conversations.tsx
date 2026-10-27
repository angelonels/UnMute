import { useEffect, useRef, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, LockKeyhole, Sparkles, Users } from 'lucide-react';
import { ChatThread } from '../../../components/arc/chat-thread/chat-thread';
import { initials, type MeetingMessage, type Participant } from '../meeting-model';

export function MessageComposer({
  value,
  onChange,
  onSend,
  label,
  disabled = false,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  label: string;
  disabled?: boolean;
}) {
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }
  return (
    <div className="shrink-0 border-t border-border/70 p-4">
      <div className="rounded-2xl border border-input bg-surface p-3 focus-within:ring-2 focus-within:ring-focus/20">
        <textarea
          aria-label={label}
          placeholder={disabled ? 'Reconnect to send' : label}
          value={value}
          maxLength={2000}
          rows={2}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={keyDown}
          className="block max-h-36 min-h-14 w-full resize-none bg-transparent text-sm leading-6 text-text outline-none! placeholder:text-muted disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">Local preview · {value.length}/2000</span>
          <button
            type="button"
            aria-label={label === 'Ask UnMute AI' ? 'Send AI prompt' : 'Send message'}
            disabled={!value.trim() || disabled}
            onClick={onSend}
            className="grid size-9 cursor-pointer place-items-center rounded-xl bg-text text-surface disabled:cursor-default disabled:opacity-30"
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
      <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-[11px] text-muted">
        <Users size={13} aria-hidden="true" />
        Everyone in this preview
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
            <span className="text-sm font-medium">Keep the conversation going.</span>
            <p className="mt-2 text-xs leading-6 text-muted">
              Messages you write here stay in this local preview.
            </p>
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
  messages,
  draft,
  onDraft,
  onSend,
  onSuggestion,
  demo,
  disabled,
}: {
  messages: MeetingMessage[];
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  onSuggestion: (prompt: string) => void;
  demo: boolean;
  disabled: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  useEffect(() => {
    if (following.current)
      bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [messages]);
  return (
    <>
      <div className="mx-4 flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-[11px] text-muted">
        <LockKeyhole size={13} aria-hidden="true" />
        Only visible to you
      </div>
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          following.current = node.scrollHeight - node.scrollTop - node.clientHeight < 60;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6"
      >
        <div className="mb-6">
          <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Sparkles size={21} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="text-xl leading-tight font-medium tracking-[-0.035em]">
            A little help.
            <br />
            More room to listen.
          </h2>
          <p className="mt-3 text-xs leading-6 text-muted">
            {demo
              ? 'Explore sample answers from the demo discussion.'
              : 'Your private assistant will live here. AI is not connected in this preview.'}
          </p>
        </div>
        <div className="mb-6 flex flex-col gap-2">
          {['Summarize the discussion', 'List action items', 'What did I miss?'].map((prompt) => (
            <button
              type="button"
              disabled={disabled}
              key={prompt}
              onClick={() => onSuggestion(prompt)}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border border-border px-3 text-left text-xs hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
              <ArrowUp className="shrink-0 rotate-45 text-muted" size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div
          role="log"
          aria-label="Private AI conversation"
          aria-live="polite"
          aria-relevant="additions"
          className="space-y-5"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.authorId === 'self' ? 'ms-4 rounded-2xl bg-surface-muted p-3' : ''}
            >
              <span className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted">
                {message.authorId === 'self' ? (
                  'You'
                ) : (
                  <>
                    <Sparkles size={12} aria-hidden="true" />
                    UnMute AI · {demo ? 'sample' : 'preview'}
                  </>
                )}
              </span>
              <p className="text-xs leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {message.text}
              </p>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>
      {messages.length > 0 && (
        <button
          type="button"
          className="mx-auto mb-2 flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full bg-surface-muted px-3 text-[10px] text-muted"
          onClick={() => {
            following.current = true;
            bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          }}
        >
          <ArrowDown size={11} aria-hidden="true" />
          Latest answer
        </button>
      )}
      <MessageComposer
        value={draft}
        onChange={onDraft}
        onSend={onSend}
        label="Ask UnMute AI"
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
