import { describe, it, expect, beforeEach } from 'vitest';
import { OrderBookEngine } from './orderBookEngine';

describe('OrderBookEngine', () => {
  let engine: OrderBookEngine;

  beforeEach(() => {
    engine = new OrderBookEngine({ tickSize: 0.5, bigOrderMultiplier: 2.5 });
  });

  it('updates bids and asks state from depth', () => {
    engine.applyDepth({
      lastUpdateId: 100,
      bids: [[2680.0, 10.0], [2679.5, 25.0]],
      asks: [[2680.5, 12.0], [2681.0, 18.0]],
      timestamp: Date.now(),
    });

    const ladder = engine.getLadder(2680.0, 5);
    const row2680 = ladder.find((r) => r.price === 2680.0);
    const row2680_5 = ladder.find((r) => r.price === 2680.5);

    expect(row2680?.bidSize).toBe(10.0);
    expect(row2680_5?.askSize).toBe(12.0);
  });

  it('detects pulled (cancelled) orders when size drops without a matching trade', () => {
    // Initial depth: 50 lots at 2680.0
    engine.applyDepth({
      lastUpdateId: 101,
      bids: [[2680.0, 50.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    // Size suddenly drops to 10.0 at 2680.0, but NO trade happened!
    engine.applyDepth({
      lastUpdateId: 102,
      bids: [[2680.0, 10.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    const pulled = engine.getPulledOrders();
    expect(pulled.length).toBeGreaterThan(0);
    expect(pulled[0].price).toBe(2680.0);
    expect(pulled[0].size).toBe(40.0); // 50 - 10 = 40 pulled lots
  });

  it('does NOT count executed trades as pulled orders', () => {
    // Initial depth: 50 lots at 2680.0
    engine.applyDepth({
      lastUpdateId: 201,
      bids: [[2680.0, 50.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    // Market sell trade consumes 30 lots at 2680.0
    engine.applyTrade({
      price: 2680.0,
      size: 30.0,
      side: 'sell',
      timestamp: Date.now(),
    });

    // Depth now reflects 20 lots (50 - 30 = 20)
    engine.applyDepth({
      lastUpdateId: 202,
      bids: [[2680.0, 20.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    const pulled = engine.getPulledOrders();
    // Since 30 lots were filled by trades, pulled should be 0
    expect(pulled.filter((p) => p.price === 2680.0).length).toBe(0);
  });

  it('identifies nearest big buyers and big sellers correctly', () => {
    engine.applyDepth({
      lastUpdateId: 301,
      bids: [
        [2680.0, 10.0],
        [2678.0, 100.0], // Big buyer (100 lots)
      ],
      asks: [
        [2681.0, 12.0],
        [2684.0, 95.0], // Big seller (95 lots)
      ],
      timestamp: Date.now(),
    });

    const nearestBuyer = engine.getNearestBigBuyers(2680.0);
    const nearestSeller = engine.getNearestBigSellers(2680.0);

    expect(nearestBuyer?.price).toBe(2678.0);
    expect(nearestBuyer?.size).toBe(100.0);
    expect(nearestSeller?.price).toBe(2684.0);
    expect(nearestSeller?.size).toBe(95.0);
  });
});
