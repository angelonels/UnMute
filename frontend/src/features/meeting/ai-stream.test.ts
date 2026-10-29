import { describe, expect, it } from 'vitest';
import { Effect } from 'effect';
import { consumeAIStream, type AIStreamSource } from './ai-stream';

// Failure cases: empty response, mid-stream failure, cancellation during a pending read,
// late source resolution, oversized output, and loss of chunk ordering.
describe('AI stream resource contract', () => {
  const request = { messages: [], signal: new AbortController().signal };
  it('preserves ordered chunks and releases the reader', async () => {
    const stream = new ReadableStream<string>({
      start(c) {
        c.enqueue('Hello ');
        c.enqueue('world');
        c.close();
      },
    });
    const chunks: string[] = [];
    await Effect.runPromise(
      consumeAIStream(
        async () => stream,
        request,
        (chunk) => chunks.push(chunk),
      ),
    );
    expect(chunks.join('')).toBe('Hello world');
    expect(stream.locked).toBe(false);
  });
  it('rejects an empty answer', async () => {
    await expect(
      Effect.runPromise(
        consumeAIStream(
          async () =>
            new ReadableStream({
              start(c) {
                c.close();
              },
            }),
          request,
          () => {},
        ),
      ),
    ).rejects.toThrow();
  });
  it('keeps partial output when the source fails', async () => {
    let pulls = 0;
    const chunks: string[] = [];
    const source: AIStreamSource = async () =>
      new ReadableStream({
        pull(c) {
          if (pulls++ === 0) c.enqueue('Partial');
          else c.error(new Error('Lost connection'));
        },
      });
    await expect(
      Effect.runPromise(consumeAIStream(source, request, (chunk) => chunks.push(chunk))),
    ).rejects.toThrow();
    expect(chunks.join('')).toBe('Partial');
  });
  it('cancels a pending read and unlocks the stream', async () => {
    const controller = new AbortController();
    let cancelled = false;
    const stream = new ReadableStream<string>({
      cancel() {
        cancelled = true;
      },
    });
    const work = Effect.runPromise(
      consumeAIStream(
        async () => stream,
        { ...request, signal: controller.signal },
        () => {},
      ),
    );
    await Promise.resolve();
    controller.abort();
    await expect(work).rejects.toThrow();
    expect(cancelled).toBe(true);
    expect(stream.locked).toBe(false);
  });
  it('cancels a source that resolves after its owner aborts', async () => {
    const controller = new AbortController();
    let cancelled = false;
    const stream = new ReadableStream<string>({
      cancel() {
        cancelled = true;
      },
    });
    const work = Effect.runPromise(
      consumeAIStream(
        async () => {
          controller.abort();
          return stream;
        },
        { ...request, signal: controller.signal },
        () => {},
      ),
    );
    await expect(work).rejects.toThrow();
    expect(cancelled).toBe(true);
  });
  it('bounds output and cancels an oversized source', async () => {
    const stream = new ReadableStream<string>({
      start(c) {
        c.enqueue('x'.repeat(100001));
      },
    });
    await expect(
      Effect.runPromise(
        consumeAIStream(
          async () => stream,
          request,
          () => {},
        ),
      ),
    ).rejects.toThrow();
    expect(stream.locked).toBe(false);
  });
  it('settles when acquisition ignores abort and cancels its late result', async () => {
    const controller = new AbortController();
    let resolveSource: ((stream: ReadableStream<string>) => void) | undefined;
    const work = Effect.runPromise(
      consumeAIStream(
        () =>
          new Promise((resolve) => {
            resolveSource = resolve;
          }),
        { ...request, signal: controller.signal },
        () => {},
      ),
    );
    await Promise.resolve();
    controller.abort();
    await expect(work).rejects.toThrow();
    let cancelled = false;
    resolveSource?.(
      new ReadableStream({
        cancel() {
          cancelled = true;
        },
      }),
    );
    await Promise.resolve();
    expect(cancelled).toBe(true);
  });
  it('does not wait for an uncooperative cancellation to settle', async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<string>({
      cancel() {
        return new Promise(() => {});
      },
    });
    const work = Effect.runPromise(
      consumeAIStream(
        async () => stream,
        { ...request, signal: controller.signal },
        () => {},
      ),
    );
    await Promise.resolve();
    await Promise.resolve();
    controller.abort();
    await expect(work).rejects.toThrow();
    expect(stream.locked).toBe(false);
  });
});
