import { afterEach, describe, expect, it, vi } from 'vitest';
import { createObjectUrlOwner } from './object-urls';

// Failure cases: a newly created URL missed by cleanup, double revocation,
// retained sent attachments revoked too early, and repeated cleanup leaking resources.
afterEach(() => vi.unstubAllGlobals());
describe('object URL ownership', () => {
  it('owns URLs immediately and releases each one exactly once', () => {
    const revoke = vi.fn();
    let next = 0;
    vi.stubGlobal('URL', { createObjectURL: () => `blob:${++next}`, revokeObjectURL: revoke });
    const owner = createObjectUrlOwner();
    const first = owner.create(new Blob(['first']));
    const second = owner.create(new Blob(['second']));
    owner.release(first);
    expect(revoke).toHaveBeenCalledExactlyOnceWith(first);
    owner.release(first);
    expect(revoke).toHaveBeenCalledTimes(1);
    owner.clear();
    expect(revoke).toHaveBeenLastCalledWith(second);
    owner.clear();
    expect(revoke).toHaveBeenCalledTimes(2);
  });
});
