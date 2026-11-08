export type OrderLevel = [number, number]; // [price, size]

export interface DepthUpdate {
  lastUpdateId: number;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}

export interface TradeEvent {
  price: number;
  size: number;
  side: 'buy' | 'sell'; // 'buy' = market buy (taker), 'sell' = market sell (taker)
  timestamp: number;
}

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface PulledOrder {
  price: number;
  size: number;
  side: 'bid' | 'ask';
  timestamp: number;
}

export interface BigOrderInfo {
  side: 'buyer' | 'seller';
  price: number;
  size: number;
  ratioVsNormal: number;
  waitingSeconds: number;
}

export interface LevelReactionStat {
  turnedPercent: number;
  brokePercent: number;
  turnedCount: number;
  brokeCount: number;
  totalTested: number;
}
