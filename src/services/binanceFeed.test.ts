import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BinanceGoldFeed } from './binanceFeed';

describe('BinanceGoldFeed', () => {
  let feed: BinanceGoldFeed;

  beforeEach(() => {
    feed = new BinanceGoldFeed({ autoConnect: false });
  });

  afterEach(() => {
    feed.disconnect();
  });

  it('correctly parses raw Binance trade events', () => {
    // When m is false, buyer is taker (market buy)
    const rawBuy = {
      e: 'aggTrade',
      p: '2684.50',
      q: '12.5',
      m: false,
      T: 1731000000000,
    };
    const parsedBuy = feed.parseTrade(rawBuy);
    expect(parsedBuy).toEqual({
      price: 2684.5,
      size: 12.5,
      side: 'buy',
      timestamp: 1731000000000,
    });

    // When m is true, buyer is maker (market sell)
    const rawSell = {
      e: 'aggTrade',
      p: '2684.00',
      q: '5.0',
      m: true,
      T: 1731000001000,
    };
    const parsedSell = feed.parseTrade(rawSell);
    expect(parsedSell).toEqual({
      price: 2684.0,
      size: 5.0,
      side: 'sell',
      timestamp: 1731000001000,
    });
  });

  it('correctly parses raw depth snapshots', () => {
    const rawDepth = {
      lastUpdateId: 1234567,
      bids: [['2684.00', '15.5'], ['2683.50', '22.0']],
      asks: [['2684.50', '8.0'], ['2685.00', '35.2']],
    };
    const parsed = feed.parseDepth(rawDepth);
    expect(parsed.lastUpdateId).toBe(1234567);
    expect(parsed.bids).toEqual([[2684.0, 15.5], [2683.5, 22.0]]);
    expect(parsed.asks).toEqual([[2684.5, 8.0], [2685.0, 35.2]]);
  });

  it('correctly parses kline 1m updates', () => {
    const rawKline = {
      e: 'kline',
      k: {
        t: 1731000000000,
        o: '2680.00',
        h: '2686.00',
        l: '2679.50',
        c: '2685.20',
        v: '150.8',
        x: false,
      },
    };
    const parsed = feed.parseKline(rawKline);
    expect(parsed).toEqual({
      openTime: 1731000000000,
      open: 2680.0,
      high: 2686.0,
      low: 2679.5,
      close: 2685.2,
      volume: 150.8,
      isClosed: false,
    });
  });
});
