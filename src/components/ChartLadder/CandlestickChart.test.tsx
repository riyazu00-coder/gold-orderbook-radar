import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CandlestickChart } from './CandlestickChart';
import { CandleFootprint } from '../../services/footprintEngine';

describe('CandlestickChart Component', () => {
  const mockCandles: CandleFootprint[] = [
    {
      candle: { openTime: 1731000000000, open: 2680.0, high: 2683.0, low: 2679.5, close: 2682.5, volume: 120, isClosed: true },
      bins: [],
      totalBought: 70,
      totalSold: 50,
    },
    {
      candle: { openTime: 1731000060000, open: 2682.5, high: 2685.0, low: 2681.0, close: 2684.0, volume: 150, isClosed: true },
      bins: [],
      totalBought: 90,
      totalSold: 60,
    },
  ];

  const mockActiveCandle: CandleFootprint = {
    candle: { openTime: 1731000120000, open: 2684.0, high: 2686.0, low: 2683.5, close: 2684.8, volume: 80, isClosed: false },
    bins: [
      { price: 2684.5, buyVolume: 30, sellVolume: 10, buyDots: 5, sellDots: 1 },
    ],
    totalBought: 50,
    totalSold: 30,
  };

  it('renders SVG candles and active forming candle with footprint fill dots', () => {
    const { container } = render(
      <CandlestickChart
        candles={mockCandles}
        activeCandle={mockActiveCandle}
        currentPrice={2684.8}
        minPrice={2678.0}
        maxPrice={2688.0}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Verify candle bodies and wicks exist
    const candleRects = container.querySelectorAll('.candle-body');
    expect(candleRects.length).toBeGreaterThanOrEqual(3); // 2 historical + 1 active

    // Verify active price dashed line exists
    const priceLine = container.querySelector('.current-price-line');
    expect(priceLine).toBeInTheDocument();

    // Verify footprint dots exist inside active candle
    const footprintDots = container.querySelectorAll('.active-candle-dot');
    expect(footprintDots.length).toBeGreaterThan(0);
  });
});
