import { describe, it, expect, beforeEach } from 'vitest';
import { FootprintEngine } from './footprintEngine';

describe('FootprintEngine', () => {
  let engine: FootprintEngine;

  beforeEach(() => {
    engine = new FootprintEngine({ tickSize: 0.5, dotLotUnit: 2.0, maxDotsPerRow: 10 });
  });

  it('aggregates buy trades as green dots and sell trades as red dots in the active candle', () => {
    const now = Date.now();
    engine.initCandle({
      openTime: now,
      open: 2680.0,
      high: 2680.0,
      low: 2680.0,
      close: 2680.0,
      volume: 0,
      isClosed: false,
    });

    // Market buy of 6 lots at 2680.50 -> 6 / 2 = 3 green dots
    engine.applyTrade({
      price: 2680.5,
      size: 6.0,
      side: 'buy',
      timestamp: now + 500,
    });

    // Market sell of 8 lots at 2680.00 -> 8 / 2 = 4 red dots
    engine.applyTrade({
      price: 2680.0,
      size: 8.0,
      side: 'sell',
      timestamp: now + 1000,
    });

    const active = engine.getActiveCandleFootprint();
    expect(active).toBeDefined();

    const bin2680_5 = active?.bins.find((b) => b.price === 2680.5);
    const bin2680_0 = active?.bins.find((b) => b.price === 2680.0);

    expect(bin2680_5?.buyVolume).toBe(6.0);
    expect(bin2680_5?.buyDots).toBe(3);

    expect(bin2680_0?.sellVolume).toBe(8.0);
    expect(bin2680_0?.sellDots).toBe(4);
  });

  it('tracks forming candle running stats (bought, sold, seconds into minute)', () => {
    const candleTime = Date.now() - 35000; // 35 seconds ago
    engine.initCandle({
      openTime: candleTime,
      open: 2680.0,
      high: 2680.0,
      low: 2680.0,
      close: 2680.0,
      volume: 0,
      isClosed: false,
    });

    engine.applyTrade({ price: 2680.0, size: 10.0, side: 'buy', timestamp: candleTime + 1000 });
    engine.applyTrade({ price: 2680.0, size: 5.0, side: 'sell', timestamp: candleTime + 2000 });

    const stats = engine.getFormingCandleStats();
    expect(stats.boughtLots).toBe(10.0);
    expect(stats.soldLots).toBe(5.0);
    expect(stats.secondsIntoMinute).toBeGreaterThanOrEqual(30);
  });
});
