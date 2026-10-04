import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { App } from '@/App';

// Mock global fetch for health check in tests
vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 42,
          environment: 'test',
        }),
    } as Response)
  )
);

describe('Frontend Technical Foundation Smoke Test', () => {
  it('renders application header and title without error', async () => {
    render(<App />);
    const heading = await screen.findByRole('link', { name: /Mandala Art Store/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders foundation status indicator', async () => {
    render(<App />);
    expect(await screen.findByText(/Phase: Technical Foundation/i)).toBeInTheDocument();
    expect(await screen.findByText(/Backend Connected/i)).toBeInTheDocument();
  });
});
