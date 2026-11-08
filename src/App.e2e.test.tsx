import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('Gold OrderBook Radar End-to-End', () => {
  it('renders full trading cockpit with header, chart ladder, and right panel', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /^Gold Spot$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ATM Call$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ATM Put$/i })).toBeInTheDocument();

    expect(screen.getByText(/Nearest Big Buyers/i)).toBeInTheDocument();
    expect(screen.getByText(/Nearest Big Sellers/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Forming candle/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Big orders right now/i)).toBeInTheDocument();
    expect(screen.getByText(/Big levels: did price turn or break\?/i)).toBeInTheDocument();
  });

  it('switches tabs to ATM Call and ATM Put seamlessly', () => {
    render(<App />);

    const callTab = screen.getByRole('button', { name: /^ATM Call$/i });
    fireEvent.click(callTab);
    expect(screen.getAllByText(/Gold ATM Call/i).length).toBeGreaterThan(0);

    const putTab = screen.getByRole('button', { name: /^ATM Put$/i });
    fireEvent.click(putTab);
    expect(screen.getAllByText(/Gold ATM Put/i).length).toBeGreaterThan(0);
  });

  it('opens and closes the How To Read modal', () => {
    render(<App />);

    const guideBtn = screen.getByRole('button', { name: /How to read this page/i });
    fireEvent.click(guideBtn);

    expect(screen.getByText(/How to Read This Order Book Radar/i)).toBeInTheDocument();
    expect(screen.getByText(/Candle Footprint \(Green & Red Dots\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Pulled Orders \(Yellow Bars - Spoofing Detection\)/i)).toBeInTheDocument();

    const gotItBtn = screen.getByRole('button', { name: /Got it/i });
    fireEvent.click(gotItBtn);

    expect(screen.queryByText(/How to Read This Order Book Radar/i)).not.toBeInTheDocument();
  });
});
