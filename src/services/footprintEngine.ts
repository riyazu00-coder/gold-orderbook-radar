import { Candle, TradeEvent } from '../types/market';

export interface PriceBin {
  price: number;
  buyVolume: number;
  sellVolume: number;
  buyDots: number;
  sellDots: number;
}

export interface CandleFootprint {
  candle: Candle;
  bins: PriceBin[];
  totalBought: number;
  totalSold: number;
}

export interface FormingCandleStats {
  secondsIntoMinute: number;
  boughtLots: number;
  soldLots: number;
  pulledLots: number;
}

export interface FootprintOptions {
  tickSize?: number;
  dotLotUnit?: number;     // e.g. 1.0 or 2.0 lots per dot
  maxDotsPerRow?: number;  // max dots to render per row
}

export function generateSeedCandles(basePrice: number, count: number = 6): CandleFootprint[] {
  const candles: CandleFootprint[] = [];
  const now = Date.now();
  let currentOpen = Number((basePrice - 2.0).toFixed(2));

  for (let i = count; i >= 1; i--) {
    const openTime = now - i * 60000;
    const isUp = i % 2 === 0;
    const delta = Number(((Math.random() * 1.5 + 0.5) * (isUp ? 1 : -1)).toFixed(2));
    const close = Number((currentOpen + delta).toFixed(2));
    const high = Number((Math.max(currentOpen, close) + Math.random() * 0.8 + 0.2).toFixed(2));
    const low = Number((Math.min(currentOpen, close) - Math.random() * 0.8 - 0.2).toFixed(2));
    const vol = Math.round(Math.random() * 80 + 40);

    candles.push({
      candle: {
        openTime,
        open: currentOpen,
        high,
        low,
        close,
        volume: vol,
        isClosed: true,
      },
      bins: [],
      totalBought: Math.round(vol * 0.55),
      totalSold: Math.round(vol * 0.45),
    });

    currentOpen = close;
  }

  return candles;
}

export class FootprintEngine {
  private tickSize: number;
  private dotLotUnit: number;
  private maxDotsPerRow: number;
  private activeCandle: Candle | null = null;
  private binMap: Map<number, { buyVolume: number; sellVolume: number }> = new Map();
  private totalBought = 0;
  private totalSold = 0;
  private historicalCandles: CandleFootprint[] = [];

  constructor(options: FootprintOptions = {}) {
    this.tickSize = options.tickSize || 0.5;
    this.dotLotUnit = options.dotLotUnit || 1.5;
    this.maxDotsPerRow = options.maxDotsPerRow || 10;
  }

  public roundToTick(price: number): number {
    return Math.round(price / this.tickSize) * this.tickSize;
  }

  public setHistoricalCandles(candles: CandleFootprint[]): void {
    this.historicalCandles = candles;
  }

  public initCandle(candle: Candle): void {
    if (this.activeCandle && this.activeCandle.openTime !== candle.openTime) {
      const snapshot = this.getActiveCandleFootprint();
      if (snapshot) {
        this.historicalCandles.push(snapshot);
        if (this.historicalCandles.length > 30) {
          this.historicalCandles.shift();
        }
      }
      this.binMap.clear();
      this.totalBought = 0;
      this.totalSold = 0;
    }

    this.activeCandle = { ...candle };
  }

  public applyTrade(trade: TradeEvent): void {
    const now = Date.now();
    if (!this.activeCandle) {
      const currentMinute = Math.floor(now / 60000) * 60000;
      this.initCandle({
        openTime: currentMinute,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.size,
        isClosed: false,
      });
    }

    const price = this.roundToTick(trade.price);
    const existing = this.binMap.get(price) || { buyVolume: 0, sellVolume: 0 };

    if (trade.side === 'buy') {
      existing.buyVolume += trade.size;
      this.totalBought += trade.size;
    } else {
      existing.sellVolume += trade.size;
      this.totalSold += trade.size;
    }
    this.binMap.set(price, existing);

    if (this.activeCandle) {
      this.activeCandle.high = Math.max(this.activeCandle.high, trade.price);
      this.activeCandle.low = Math.min(this.activeCandle.low, trade.price);
      this.activeCandle.close = trade.price;
      this.activeCandle.volume += trade.size;
    }
  }

  public getActiveCandleFootprint(): CandleFootprint | null {
    if (!this.activeCandle) return null;

    const bins: PriceBin[] = [];
    for (const [price, { buyVolume, sellVolume }] of this.binMap.entries()) {
      const buyDots = Math.min(
        this.maxDotsPerRow,
        Math.max(1, Math.floor(buyVolume / this.dotLotUnit))
      );
      const sellDots = Math.min(
        this.maxDotsPerRow,
        Math.max(1, Math.floor(sellVolume / this.dotLotUnit))
      );

      bins.push({
        price,
        buyVolume: Number(buyVolume.toFixed(2)),
        sellVolume: Number(sellVolume.toFixed(2)),
        buyDots: buyVolume > 0 ? buyDots : 0,
        sellDots: sellVolume > 0 ? sellDots : 0,
      });
    }

    bins.sort((a, b) => b.price - a.price);

    return {
      candle: { ...this.activeCandle },
      bins,
      totalBought: Number(this.totalBought.toFixed(2)),
      totalSold: Number(this.totalSold.toFixed(2)),
    };
  }

  public getHistoricalCandles(): CandleFootprint[] {
    return this.historicalCandles;
  }

  public getFormingCandleStats(pulledLots: number = 0): FormingCandleStats {
    const now = Date.now();
    const openTime = this.activeCandle ? this.activeCandle.openTime : Math.floor(now / 60000) * 60000;
    const secondsIntoMinute = Math.min(59, Math.max(0, Math.floor((now - openTime) / 1000)));

    return {
      secondsIntoMinute,
      boughtLots: Number(this.totalBought.toFixed(1)),
      soldLots: Number(this.totalSold.toFixed(1)),
      pulledLots: Number(pulledLots.toFixed(1)),
    };
  }
}
