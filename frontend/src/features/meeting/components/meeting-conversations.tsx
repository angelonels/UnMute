import { useMemo, useState, type KeyboardEvent, type Ref } from 'react';
import { ArrowUp, Group as Users } from 'iconoir-react';
import { ChatThread } from '../../../components/arc/chat-thread/chat-thread';
import { formatCount, initials, type MeetingMessage, type Participant } from '../meeting-model';

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
          className="block max-h-36 min-h-11 [field-sizing:content] w-full resize-none bg-transparent text-base sm:text-sm leading-6 text-text outline-none! placeholder:text-muted disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">
            Local only
            {value.length > 0 && <span className="ms-2 tabular-nums">{value.length}/2000</span>}
          </span>
          <button
            type="button"
            aria-label="Send message"
            disabled={!value.trim() || disabled}
            onClick={onSend}
            className="grid size-11 cursor-pointer place-items-center rounded-full bg-text text-surface disabled:cursor-default disabled:opacity-30 motion-safe:transition-transform motion-safe:duration-160 motion-safe:ease-out-expo motion-safe:[&:enabled:active:not(:focus-visible)]:scale-[0.97]"
          >
            <ArrowUp width={17} height={17} aria-hidden="true" />
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
        <Users width={13} height={13} aria-hidden="true" />
        Everyone
      </div>
      <div className="min-h-36 flex-1 [--accent:var(--primary)] [--accent-foreground:var(--on-primary)]">
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
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      people
        .filter((person) => person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
        .sort((left, right) => Number(right.hand) - Number(left.hand)),
    [people, search],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 50));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * 50, (currentPage + 1) * 50);
  return (
    <div className="flex min-h-48 flex-1 flex-col px-4 pb-4">
      <input
        type="search"
        aria-label="Find a participant"
        placeholder="Find someone"
        value={search}
        onChange={(event) => {
          setPage(0);
          onSearch(event.target.value);
        }}
        className="mb-4 min-h-11 w-full rounded-xl border border-input bg-transparent px-3 text-base sm:text-sm"
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="space-y-2">
          {visible.map((person) => (
            <li key={person.id} className="flex items-center gap-3 rounded-xl p-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-medium">
                {initials(person.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  title={person.name}
                  dir="auto"
                  className="text-xs font-medium [overflow-wrap:anywhere]"
                >
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
                className="min-h-11 shrink-0 cursor-pointer px-2 text-xs text-primary"
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
      {pageCount > 1 && (
        <nav
          aria-label="People pages"
          className="flex shrink-0 items-center justify-between gap-2 pt-3 text-xs tabular-nums"
        >
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            className="min-h-11 rounded-lg px-2 disabled:opacity-35"
          >
            Previous
          </button>
          <span>
            {formatCount(currentPage + 1)} / {formatCount(pageCount)}
          </span>
          <button
            type="button"
            disabled={currentPage === pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
            className="min-h-11 rounded-lg px-2 disabled:opacity-35"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
