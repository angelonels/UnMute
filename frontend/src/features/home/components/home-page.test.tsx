import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { HomePage } from './home-page';

vi.stubGlobal(
  'fetch',
  vi.fn(async () => Response.json(null)),
);

describe('HomePage', () => {
  it('renders the sign-in heading', () => {
    render(<HomePage />, { wrapper: createQueryWrapper() });
    expect(
      screen.getByRole('heading', { name: 'Make room for the conversation.' }),
    ).toBeInTheDocument();
  });
});
