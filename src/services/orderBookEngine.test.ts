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
    engine.applyDepth({
      lastUpdateId: 101,
      bids: [[2680.0, 50.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    engine.applyDepth({
      lastUpdateId: 102,
      bids: [[2680.0, 10.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    const pulled = engine.getPulledOrders();
    expect(pulled.length).toBeGreaterThan(0);
    expect(pulled[0].price).toBe(2680.0);
    expect(pulled[0].size).toBe(40.0);
  });

  it('does NOT count executed trades as pulled orders', () => {
    engine.applyDepth({
      lastUpdateId: 201,
      bids: [[2680.0, 50.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    engine.applyTrade({
      price: 2680.0,
      size: 30.0,
      side: 'sell',
      timestamp: Date.now(),
    });

    engine.applyDepth({
      lastUpdateId: 202,
      bids: [[2680.0, 20.0]],
      asks: [[2685.0, 10.0]],
      timestamp: Date.now(),
    });

    const pulled = engine.getPulledOrders();
    expect(pulled.filter((p) => p.price === 2680.0).length).toBe(0);
  });

  it('identifies nearest big buyers and big sellers correctly', () => {
    engine.applyDepth({
      lastUpdateId: 301,
      bids: [
        [2680.0, 10.0],
        [2678.0, 100.0],
      ],
      asks: [
        [2681.0, 12.0],
        [2684.0, 95.0],
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

  it('preserves exact raw sub-tick orders without overwriting or false pull triggers', () => {
    engine.applyDepth({
      lastUpdateId: 401,
      bids: [
        [2684.10, 15.0],
        [2684.20, 25.0],
      ],
      asks: [],
      timestamp: Date.now(),
    });

    engine.applyDepth({
      lastUpdateId: 402,
      bids: [
        [2684.10, 15.0],
      ],
      asks: [],
      timestamp: Date.now(),
    });

    const ladder = engine.getLadder(2684.0, 3);
    const tickRow = ladder.find((r) => r.price === 2684.0);
    expect(tickRow?.bidSize).toBe(40.0);
  });

  it('computes deadband smoothed center price to prevent ladder jitter', () => {
    const center1 = engine.getSmoothedCenter(2684.24);
    const center2 = engine.getSmoothedCenter(2684.26);
    expect(center1).toBe(center2);

    const center3 = engine.getSmoothedCenter(2686.00);
    expect(center3).toBe(2686.0);
  });
});
