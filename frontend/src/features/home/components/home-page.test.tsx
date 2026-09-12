import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { HomePage } from './home-page';

vi.stubGlobal(
  'fetch',
  vi.fn(async () =>
    Response.json({
      status: 'ok',
      service: 'unmute-api',
    }),
  ),
);

describe('HomePage', () => {
  it('renders the product name', () => {
    render(<HomePage />, { wrapper: createQueryWrapper() });
    expect(screen.getByRole('heading', { name: 'UnMute' })).toBeInTheDocument();
  });
});
