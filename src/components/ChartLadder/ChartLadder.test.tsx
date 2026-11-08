import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartLadder } from './ChartLadder';
import { LadderRow } from '../../services/orderBookEngine';
import { CandleFootprint } from '../../services/footprintEngine';

describe('ChartLadder Component', () => {
  const mockLadder: LadderRow[] = [
    { price: 2682.0, bidSize: 0, askSize: 55, pulledSize: 12, isBigBuyer: false, isBigSeller: true, ratioVsNormal: 3.5 },
    { price: 2681.5, bidSize: 0, askSize: 15, pulledSize: 0, isBigBuyer: false, isBigSeller: false, ratioVsNormal: 1.0 },
    { price: 2680.0, bidSize: 120, askSize: 0, pulledSize: 45, isBigBuyer: true, isBigSeller: false, ratioVsNormal: 4.8 },
  ];

  const mockActiveCandle: CandleFootprint = {
    candle: {
      openTime: 1731000000000,
      open: 2680.0,
      high: 2682.0,
      low: 2679.5,
      close: 2681.5,
      volume: 190,
      isClosed: false,
    },
    bins: [
      { price: 2681.5, buyVolume: 35, sellVolume: 10, buyDots: 6, sellDots: 2 },
      { price: 2680.0, buyVolume: 50, sellVolume: 5, buyDots: 8, sellDots: 1 },
    ],
    totalBought: 85,
    totalSold: 15,
  };

  it('renders the order book legend and price rows', () => {
    render(
      <ChartLadder
        ladder={mockLadder}
        activeCandle={mockActiveCandle}
        currentPrice={2681.5}
        instrumentTitle="Gold Spot"
      />
    );

    expect(screen.getByText(/buyers waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/sellers waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/pulled \(cancelled\)/i)).toBeInTheDocument();
    expect(screen.getByText('2,680.00')).toBeInTheDocument();
  });

  it('renders Big Buyers and Big Sellers badges on threshold levels', () => {
    render(
      <ChartLadder
        ladder={mockLadder}
        activeCandle={mockActiveCandle}
        currentPrice={2681.5}
        instrumentTitle="Gold Spot"
      />
    );

    expect(screen.getByText(/Big Buyers/i)).toBeInTheDocument();
    expect(screen.getByText(/Big Sellers/i)).toBeInTheDocument();
  });
});
