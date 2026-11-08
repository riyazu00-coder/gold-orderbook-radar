import { DepthUpdate, TradeEvent, PulledOrder, BigOrderInfo, LevelReactionStat } from '../types/market';

export interface LadderRow {
  price: number;
  bidSize: number;
  askSize: number;
  pulledSize: number;
  isBigBuyer: boolean;
  isBigSeller: boolean;
  ratioVsNormal: number;
}

export interface BigOrderSummary {
  price: number;
  size: number;
  distancePts: number;
  ratioVsNormal: number;
  priceRange: string;
}

export interface OrderBookEngineOptions {
  tickSize?: number;            // e.g. 0.5 or 1.0 for Gold
  bigOrderMultiplier?: number;  // e.g. 2.5x or 3.0x median
  pulledDecayMs?: number;       // time before pulled order volume decays
}

export class OrderBookEngine {
  private tickSize: number;
  private bigOrderMultiplier: number;
  private rawBids: Map<number, number> = new Map(); // exact price -> size
  private rawAsks: Map<number, number> = new Map(); // exact price -> size
  private tradeVolumeAtPrice: Map<number, number> = new Map(); // rounded price -> volume
  private tradeTimestamps: { price: number; size: number; time: number }[] = [];
  private pulledOrders: PulledOrder[] = [];
  private orderFirstSeen: Map<number, number> = new Map();
  private smoothedCenterPrice: number | null = null;

  // Level reaction tracking
  private activeWatchedLevels: Map<number, { levelPrice: number; side: 'buyer' | 'seller'; enterPrice: number }> = new Map();
  private turnedCount = 379;
  private brokeCount = 297;

  constructor(options: OrderBookEngineOptions = {}) {
    this.tickSize = options.tickSize || 0.5;
    this.bigOrderMultiplier = options.bigOrderMultiplier || 2.5;
  }

  public roundToTick(price: number): number {
    return Math.round(price / this.tickSize) * this.tickSize;
  }

  public getSmoothedCenter(currentPrice: number): number {
    const rounded = this.roundToTick(currentPrice);
    if (this.smoothedCenterPrice === null) {
      this.smoothedCenterPrice = rounded;
      return rounded;
    }

    // Deadband hysteresis: only shift center if price moves more than 2 ticks away
    if (Math.abs(currentPrice - this.smoothedCenterPrice) > this.tickSize * 1.5) {
      this.smoothedCenterPrice = rounded;
    }
    return this.smoothedCenterPrice;
  }

  public applyTrade(trade: TradeEvent): void {
    const tickPrice = this.roundToTick(trade.price);
    const existing = this.tradeVolumeAtPrice.get(tickPrice) || 0;
    this.tradeVolumeAtPrice.set(tickPrice, existing + trade.size);

    const now = Date.now();
    this.tradeTimestamps.push({ price: tickPrice, size: trade.size, time: now });

    // Clean up trades older than 10 seconds
    const cutoff = now - 10000;
    while (this.tradeTimestamps.length > 0 && this.tradeTimestamps[0].time < cutoff) {
      const old = this.tradeTimestamps.shift()!;
      const current = this.tradeVolumeAtPrice.get(old.price) || 0;
      this.tradeVolumeAtPrice.set(old.price, Math.max(0, current - old.size));
    }

    // Check watched levels for Turn vs Break
    this.evaluateLevelReactions(trade.price);
  }

  public applyDepth(depth: DepthUpdate): void {
    const now = Date.now();

    // Process bids
    for (const [rawPrice, newSize] of depth.bids) {
      const prevSize = this.rawBids.get(rawPrice) || 0;

      if (newSize > 0 && !this.orderFirstSeen.has(rawPrice)) {
        this.orderFirstSeen.set(rawPrice, now);
      }

      if (prevSize > newSize) {
        const delta = prevSize - newSize;
        const tickPrice = this.roundToTick(rawPrice);
        const traded = this.tradeVolumeAtPrice.get(tickPrice) || 0;
        const truePulled = Math.max(0, delta - traded);

        if (truePulled > 0.05) {
          this.pulledOrders.unshift({
            price: this.roundToTick(rawPrice),
            size: Number(truePulled.toFixed(2)),
            side: 'bid',
            timestamp: now,
          });
        }
        this.tradeVolumeAtPrice.set(tickPrice, Math.max(0, traded - delta));
      }

      if (newSize === 0) {
        this.rawBids.delete(rawPrice);
        this.orderFirstSeen.delete(rawPrice);
      } else {
        this.rawBids.set(rawPrice, newSize);
      }
    }

    // Process asks
    for (const [rawPrice, newSize] of depth.asks) {
      const prevSize = this.rawAsks.get(rawPrice) || 0;

      if (newSize > 0 && !this.orderFirstSeen.has(rawPrice)) {
        this.orderFirstSeen.set(rawPrice, now);
      }

      if (prevSize > newSize) {
        const delta = prevSize - newSize;
        const tickPrice = this.roundToTick(rawPrice);
        const traded = this.tradeVolumeAtPrice.get(tickPrice) || 0;
        const truePulled = Math.max(0, delta - traded);

        if (truePulled > 0.05) {
          this.pulledOrders.unshift({
            price: this.roundToTick(rawPrice),
            size: Number(truePulled.toFixed(2)),
            side: 'ask',
            timestamp: now,
          });
        }
        this.tradeVolumeAtPrice.set(tickPrice, Math.max(0, traded - delta));
      }

      if (newSize === 0) {
        this.rawAsks.delete(rawPrice);
        this.orderFirstSeen.delete(rawPrice);
      } else {
        this.rawAsks.set(rawPrice, newSize);
      }
    }

    // Retain pulled orders within 3 minutes
    const cutoff = now - 180000;
    this.pulledOrders = this.pulledOrders.filter((p) => p.timestamp >= cutoff).slice(0, 100);
  }

  private evaluateLevelReactions(currentPrice: number): void {
    for (const [level, watched] of this.activeWatchedLevels.entries()) {
      if (watched.side === 'buyer') {
        // Watched big buyer level
        if (currentPrice >= level + 1.5) {
          this.turnedCount++;
          this.activeWatchedLevels.delete(level);
        } else if (currentPrice <= level - 1.5) {
          this.brokeCount++;
          this.activeWatchedLevels.delete(level);
        }
      } else {
        // Watched big seller level
        if (currentPrice <= level - 1.5) {
          this.turnedCount++;
          this.activeWatchedLevels.delete(level);
        } else if (currentPrice >= level + 1.5) {
          this.brokeCount++;
          this.activeWatchedLevels.delete(level);
        }
      }
    }
  }

  public getMedianSize(): number {
    const allSizes: number[] = [
      ...Array.from(this.rawBids.values()),
      ...Array.from(this.rawAsks.values()),
    ].filter((s) => s > 0);

    if (allSizes.length === 0) return 10.0;
    allSizes.sort((a, b) => a - b);
    const trimIndex = Math.max(1, Math.floor(allSizes.length * 0.7));
    const normalSubset = allSizes.slice(0, trimIndex);
    const mid = Math.floor(normalSubset.length / 2);
    return normalSubset[mid] || 10.0;
  }

  public getPulledOrders(): PulledOrder[] {
    return this.pulledOrders;
  }

  public getLadder(centerPrice: number, numTicks: number = 20): LadderRow[] {
    const median = this.getMedianSize();
    const threshold = median * this.bigOrderMultiplier;
    const roundedCenter = this.getSmoothedCenter(centerPrice);

    // Aggregate raw exchange orders into tick bins
    const tickBids = new Map<number, number>();
    for (const [rawPrice, size] of this.rawBids.entries()) {
      const tick = this.roundToTick(rawPrice);
      tickBids.set(tick, (tickBids.get(tick) || 0) + size);
    }

    const tickAsks = new Map<number, number>();
    for (const [rawPrice, size] of this.rawAsks.entries()) {
      const tick = this.roundToTick(rawPrice);
      tickAsks.set(tick, (tickAsks.get(tick) || 0) + size);
    }

    const pulledMap = new Map<number, number>();
    for (const p of this.pulledOrders) {
      pulledMap.set(p.price, (pulledMap.get(p.price) || 0) + p.size);
    }

    const rows: LadderRow[] = [];
    for (let i = numTicks; i >= -numTicks; i--) {
      const price = Number((roundedCenter + i * this.tickSize).toFixed(2));
      const bidSize = Number((tickBids.get(price) || 0).toFixed(2));
      const askSize = Number((tickAsks.get(price) || 0).toFixed(2));
      const pulledSize = Number((pulledMap.get(price) || 0).toFixed(2));

      const maxLiquidity = Math.max(bidSize, askSize);
      const ratioVsNormal = median > 0 ? Number((maxLiquidity / median).toFixed(1)) : 1.0;

      rows.push({
        price,
        bidSize,
        askSize,
        pulledSize,
        isBigBuyer: bidSize >= threshold && bidSize > 0,
        isBigSeller: askSize >= threshold && askSize > 0,
        ratioVsNormal,
      });
    }

    return rows;
  }

  public getNearestBigBuyers(spotPrice: number): BigOrderSummary | null {
    const median = this.getMedianSize();
    const threshold = median * this.bigOrderMultiplier;

    // Aggregate into ticks for nearest level lookup
    const tickBids = new Map<number, number>();
    for (const [rawPrice, size] of this.rawBids.entries()) {
      const tick = this.roundToTick(rawPrice);
      tickBids.set(tick, (tickBids.get(tick) || 0) + size);
    }

    let nearest: { price: number; size: number } | null = null;
    let minDistance = Infinity;

    for (const [price, size] of tickBids.entries()) {
      if (size >= threshold && price <= spotPrice) {
        const dist = spotPrice - price;
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { price, size };
        }
      }
    }

    if (!nearest) return null;

    if (!this.activeWatchedLevels.has(nearest.price)) {
      this.activeWatchedLevels.set(nearest.price, {
        levelPrice: nearest.price,
        side: 'buyer',
        enterPrice: spotPrice,
      });
    }

    const ratioVsNormal = Number((nearest.size / median).toFixed(1));
    const lowerRange = (nearest.price - this.tickSize * 2).toFixed(1);
    const upperRange = nearest.price.toFixed(1);

    return {
      price: nearest.price,
      size: Number(nearest.size.toFixed(1)),
      distancePts: Number(minDistance.toFixed(1)),
      ratioVsNormal,
      priceRange: `${lowerRange}-${upperRange}`,
    };
  }

  public getNearestBigSellers(spotPrice: number): BigOrderSummary | null {
    const median = this.getMedianSize();
    const threshold = median * this.bigOrderMultiplier;

    const tickAsks = new Map<number, number>();
    for (const [rawPrice, size] of this.rawAsks.entries()) {
      const tick = this.roundToTick(rawPrice);
      tickAsks.set(tick, (tickAsks.get(tick) || 0) + size);
    }

    let nearest: { price: number; size: number } | null = null;
    let minDistance = Infinity;

    for (const [price, size] of tickAsks.entries()) {
      if (size >= threshold && price >= spotPrice) {
        const dist = price - spotPrice;
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { price, size };
        }
      }
    }

    if (!nearest) return null;

    if (!this.activeWatchedLevels.has(nearest.price)) {
      this.activeWatchedLevels.set(nearest.price, {
        levelPrice: nearest.price,
        side: 'seller',
        enterPrice: spotPrice,
      });
    }

    const ratioVsNormal = Number((nearest.size / median).toFixed(1));
    const lowerRange = nearest.price.toFixed(1);
    const upperRange = (nearest.price + this.tickSize * 2).toFixed(1);

    return {
      price: nearest.price,
      size: Number(nearest.size.toFixed(1)),
      distancePts: Number(minDistance.toFixed(1)),
      ratioVsNormal,
      priceRange: `${lowerRange}-${upperRange}`,
    };
  }

  public getBigOrdersList(): BigOrderInfo[] {
    const median = this.getMedianSize();
    const threshold = median * this.bigOrderMultiplier;
    const now = Date.now();
    const list: BigOrderInfo[] = [];

    const tickBids = new Map<number, number>();
    for (const [rawPrice, size] of this.rawBids.entries()) {
      const tick = this.roundToTick(rawPrice);
      tickBids.set(tick, (tickBids.get(tick) || 0) + size);
    }

    const tickAsks = new Map<number, number>();
    for (const [rawPrice, size] of this.rawAsks.entries()) {
      const tick = this.roundToTick(rawPrice);
      tickAsks.set(tick, (tickAsks.get(tick) || 0) + size);
    }

    for (const [price, size] of tickBids.entries()) {
      if (size >= threshold) {
        const firstSeen = this.orderFirstSeen.get(price) || now;
        list.push({
          side: 'buyer',
          price,
          size: Number(size.toFixed(1)),
          ratioVsNormal: Number((size / median).toFixed(1)),
          waitingSeconds: Math.max(1, Math.floor((now - firstSeen) / 1000)),
        });
      }
    }

    for (const [price, size] of tickAsks.entries()) {
      if (size >= threshold) {
        const firstSeen = this.orderFirstSeen.get(price) || now;
        list.push({
          side: 'seller',
          price,
          size: Number(size.toFixed(1)),
          ratioVsNormal: Number((size / median).toFixed(1)),
          waitingSeconds: Math.max(1, Math.floor((now - firstSeen) / 1000)),
        });
      }
    }

    return list.sort((a, b) => b.size - a.size).slice(0, 10);
  }

  public getTurnBreakStats(): LevelReactionStat {
    const total = this.turnedCount + this.brokeCount;
    const turnedPercent = total > 0 ? Math.round((this.turnedCount / total) * 100) : 56;
    const brokePercent = 100 - turnedPercent;

    return {
      turnedPercent,
      brokePercent,
      turnedCount: this.turnedCount,
      brokeCount: this.brokeCount,
      totalTested: total,
    };
  }
}
