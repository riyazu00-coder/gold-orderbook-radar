import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RightPanel } from './RightPanel';
import { BigOrderInfo, LevelReactionStat } from '../../types/market';
import { FormingCandleStats } from '../../services/footprintEngine';

describe('RightPanel Component', () => {
  const mockFormingStats: FormingCandleStats = {
    secondsIntoMinute: 45,
    boughtLots: 120.5,
    soldLots: 85.0,
    pulledLots: 1420.0,
  };

  const mockBigOrders: BigOrderInfo[] = [
    { side: 'buyer', price: 2680.0, size: 505.0, ratioVsNormal: 3.8, waitingSeconds: 28 },
    { side: 'seller', price: 2690.0, size: 380.0, ratioVsNormal: 2.9, waitingSeconds: 15 },
  ];

  const mockTurnBreak: LevelReactionStat = {
    turnedPercent: 56,
    brokePercent: 44,
    turnedCount: 379,
    brokeCount: 297,
    totalTested: 676,
  };

  it('renders forming candle live counter and volume stats', () => {
    render(
      <RightPanel
        formingStats={mockFormingStats}
        bigOrders={mockBigOrders}
        turnBreak={mockTurnBreak}
      />
    );

    expect(screen.getByText(/45s into the minute/i)).toBeInTheDocument();
    expect(screen.getByText(/Big orders right now/i)).toBeInTheDocument();
  });

  it('renders big orders list and turn/break statistics', () => {
    render(
      <RightPanel
        formingStats={mockFormingStats}
        bigOrders={mockBigOrders}
        turnBreak={mockTurnBreak}
      />
    );

    expect(screen.getByText(/505 lots/i)).toBeInTheDocument();
    expect(screen.getByText(/3.8x normal/i)).toBeInTheDocument();
    expect(screen.getByText(/Turned 56%/i)).toBeInTheDocument();
    expect(screen.getByText(/Broke 44%/i)).toBeInTheDocument();
  });
});
