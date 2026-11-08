import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the Gold OrderBook Radar header and branding', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /^Gold Spot$/i })).toBeInTheDocument();
  });
});
