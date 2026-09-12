import { describe, expect, it } from 'vitest';
import { getHealth } from './get-health';

describe('getHealth', () => {
  it('reports a healthy API', () => {
    expect(getHealth()).toEqual({
      status: 'ok',
      service: 'unmute-api',
    });
  });
});
