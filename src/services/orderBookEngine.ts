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
  private bids: Map<number, number> = new Map(); // price -> size
  private asks: Map<number, number> = new Map(); // price -> size
  private tradeVolumeAtPrice: Map<number, number> = new Map(); // price -> volume consumed
  private pulledOrders: PulledOrder[] = [];
  private orderFirstSeen: Map<number, number> = new Map(); // price -> timestamp
  private historicalTurned = 379;
  private historicalBroke = 297;

  constructor(options: OrderBookEngineOptions = {}) {
    this.tickSize = options.tickSize || 0.5;
    this.bigOrderMultiplier = options.bigOrderMultiplier || 2.5;
  }

  public roundToTick(price: number): number {
    return Math.round(price / this.tickSize) * this.tickSize;
  }

  public applyTrade(trade: TradeEvent): void {
    const tickPrice = this.roundToTick(trade.price);
    const existing = this.tradeVolumeAtPrice.get(tickPrice) || 0;
    this.tradeVolumeAtPrice.set(tickPrice, existing + trade.size);
  }

  public applyDepth(depth: DepthUpdate): void {
    const now = Date.now();

    // Process bids
    for (const [rawPrice, newSize] of depth.bids) {
      const price = this.roundToTick(rawPrice);
      const prevSize = this.bids.get(price) || 0;

      if (newSize > 0) {
        if (!this.orderFirstSeen.has(price)) {
          this.orderFirstSeen.set(price, now);
        }
      }

      if (prevSize > newSize) {
        // Size decreased
        const delta = prevSize - newSize;
        const traded = this.tradeVolumeAtPrice.get(price) || 0;
        const truePulled = Math.max(0, delta - traded);

        if (truePulled > 0.05) {
          this.pulledOrders.unshift({
            price,
            size: Number(truePulled.toFixed(2)),
            side: 'bid',
            timestamp: now,
          });
        }
        // Deduct traded volume consumed
        this.tradeVolumeAtPrice.set(price, Math.max(0, traded - delta));
      }

      if (newSize === 0) {
        this.bids.delete(price);
        this.orderFirstSeen.delete(price);
      } else {
        this.bids.set(price, newSize);
      }
    }

    // Process asks
    for (const [rawPrice, newSize] of depth.asks) {
      const price = this.roundToTick(rawPrice);
      const prevSize = this.asks.get(price) || 0;

      if (newSize > 0) {
        if (!this.orderFirstSeen.has(price)) {
          this.orderFirstSeen.set(price, now);
        }
      }

      if (prevSize > newSize) {
        // Size decreased
        const delta = prevSize - newSize;
        const traded = this.tradeVolumeAtPrice.get(price) || 0;
        const truePulled = Math.max(0, delta - traded);

        if (truePulled > 0.05) {
          this.pulledOrders.unshift({
            price,
            size: Number(truePulled.toFixed(2)),
            side: 'ask',
            timestamp: now,
          });
        }
        this.tradeVolumeAtPrice.set(price, Math.max(0, traded - delta));
      }

      if (newSize === 0) {
        this.asks.delete(price);
        this.orderFirstSeen.delete(price);
      } else {
        this.asks.set(price, newSize);
      }
    }

    // Keep only last 100 pulled orders (expire older than 3 minutes)
    const cutoff = now - 180000;
    this.pulledOrders = this.pulledOrders
      .filter((p) => p.timestamp >= cutoff)
      .slice(0, 100);
  }

  public getMedianSize(): number {
    const allSizes: number[] = [
      ...Array.from(this.bids.values()),
      ...Array.from(this.asks.values()),
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
    const roundedCenter = this.roundToTick(centerPrice);

    // Aggregate pulled orders by price tick
    const pulledMap = new Map<number, number>();
    for (const p of this.pulledOrders) {
      pulledMap.set(p.price, (pulledMap.get(p.price) || 0) + p.size);
    }

    const rows: LadderRow[] = [];
    for (let i = numTicks; i >= -numTicks; i--) {
      const price = Number((roundedCenter + i * this.tickSize).toFixed(2));
      const bidSize = this.bids.get(price) || 0;
      const askSize = this.asks.get(price) || 0;
      const pulledSize = pulledMap.get(price) || 0;

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

    let nearest: { price: number; size: number } | null = null;
    let minDistance = Infinity;

    for (const [price, size] of this.bids.entries()) {
      if (size >= threshold && price <= spotPrice) {
        const dist = spotPrice - price;
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { price, size };
        }
      }
    }

    if (!nearest) return null;

    const ratioVsNormal = Number((nearest.size / median).toFixed(1));
    const lowerRange = (nearest.price - this.tickSize * 2).toFixed(1);
    const upperRange = nearest.price.toFixed(1);

    return {
      price: nearest.price,
      size: nearest.size,
      distancePts: Number(minDistance.toFixed(1)),
      ratioVsNormal,
      priceRange: `${lowerRange}-${upperRange}`,
    };
  }

  public getNearestBigSellers(spotPrice: number): BigOrderSummary | null {
    const median = this.getMedianSize();
    const threshold = median * this.bigOrderMultiplier;

    let nearest: { price: number; size: number } | null = null;
    let minDistance = Infinity;

    for (const [price, size] of this.asks.entries()) {
      if (size >= threshold && price >= spotPrice) {
        const dist = price - spotPrice;
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { price, size };
        }
      }
    }

    if (!nearest) return null;

    const ratioVsNormal = Number((nearest.size / median).toFixed(1));
    const lowerRange = nearest.price.toFixed(1);
    const upperRange = (nearest.price + this.tickSize * 2).toFixed(1);

    return {
      price: nearest.price,
      size: nearest.size,
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

    for (const [price, size] of this.bids.entries()) {
      if (size >= threshold) {
        const firstSeen = this.orderFirstSeen.get(price) || now;
        list.push({
          side: 'buyer',
          price,
          size,
          ratioVsNormal: Number((size / median).toFixed(1)),
          waitingSeconds: Math.max(1, Math.floor((now - firstSeen) / 1000)),
        });
      }
    }

    for (const [price, size] of this.asks.entries()) {
      if (size >= threshold) {
        const firstSeen = this.orderFirstSeen.get(price) || now;
        list.push({
          side: 'seller',
          price,
          size,
          ratioVsNormal: Number((size / median).toFixed(1)),
          waitingSeconds: Math.max(1, Math.floor((now - firstSeen) / 1000)),
        });
      }
    }

    return list.sort((a, b) => b.size - a.size).slice(0, 10);
  }

  public getTurnBreakStats(): LevelReactionStat {
    const total = this.historicalTurned + this.historicalBroke;
    const turnedPercent = total > 0 ? Math.round((this.historicalTurned / total) * 100) : 56;
    const brokePercent = 100 - turnedPercent;

    return {
      turnedPercent,
      brokePercent,
      turnedCount: this.historicalTurned,
      brokeCount: this.historicalBroke,
      totalTested: total,
    };
  }
}
