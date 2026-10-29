import { Effect } from 'effect';

export type AIStreamMessage = { role: 'user' | 'assistant'; content: string };
export type AIStreamRequest = { messages: readonly AIStreamMessage[]; signal: AbortSignal };
/** Application-facing text chunks. A future transport owns decoding its wire protocol. */
export type AIStreamSource = (request: AIStreamRequest) => Promise<ReadableStream<string>>;
export class AIStreamError extends Error {
  readonly _tag = 'AIStreamError';
}

// A vendor's cancellation must never hold the UI or the reader lock open.
function cancelStream(cancel: () => Promise<void>) {
  void cancel().catch(() => console.error('ai_stream_cleanup_failed', { phase: 'cancel' }));
}

export function consumeAIStream(
  source: AIStreamSource,
  request: AIStreamRequest,
  onChunk: (chunk: string) => void,
) {
  return Effect.tryPromise({
    try: async () => {
      if (request.signal.aborted) throw new AIStreamError('Response stopped.');
      let abortRead = () => {};
      const aborted = new Promise<never>((_, reject) => {
        abortRead = () => reject(new AIStreamError('Response stopped.'));
        request.signal.addEventListener('abort', abortRead, { once: true });
      });
      let reader: ReadableStreamDefaultReader<string> | undefined;
      let complete = false;
      let readerFailed = false;
      try {
        const acquired = source(request).then((stream) => {
          if (request.signal.aborted) {
            cancelStream(() => stream.cancel());
            throw new AIStreamError('Response stopped.');
          }
          return stream;
        });
        const stream = await Promise.race([acquired, aborted]);
        reader = stream.getReader();
        let length = 0;
        while (!request.signal.aborted) {
          const read = reader.read().catch((error: unknown) => {
            readerFailed = true;
            throw error;
          });
          const result = await Promise.race([read, aborted]);
          if (request.signal.aborted) throw new AIStreamError('Response stopped.');
          if (result.done) {
            complete = true;
            break;
          }
          length += result.value.length;
          if (length > 100000)
            throw new AIStreamError('Response is too long. Try a narrower question.');
          onChunk(result.value);
        }
        if (request.signal.aborted) throw new AIStreamError('Response stopped.');
        if (!length) throw new AIStreamError('No answer received. Try again.');
      } finally {
        request.signal.removeEventListener('abort', abortRead);
        if (reader) {
          const ownedReader = reader;
          if (!complete && !readerFailed) cancelStream(() => ownedReader.cancel());
          ownedReader.releaseLock();
        }
      }
    },
    catch: (error: unknown) =>
      error instanceof AIStreamError
        ? error
        : new AIStreamError('Response interrupted. Try again.'),
  });
}
