import { DepthUpdate, TradeEvent, Candle, OrderLevel } from '../types/market';

export interface BinanceFeedOptions {
  symbol?: string; // default: 'paxgusdt'
  autoConnect?: boolean;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  onLatencyChange?: (latencyMs: number) => void;
}

export type DepthCallback = (depth: DepthUpdate) => void;
export type TradeCallback = (trade: TradeEvent) => void;
export type KlineCallback = (candle: Candle) => void;

export class BinanceGoldFeed {
  private symbol: string;
  private ws: WebSocket | null = null;
  private depthCallbacks: Set<DepthCallback> = new Set();
  private tradeCallbacks: Set<TradeCallback> = new Set();
  private klineCallbacks: Set<KlineCallback> = new Set();
  private onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  private onLatencyChange?: (latencyMs: number) => void;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isDestroyed = false;

  constructor(options: BinanceFeedOptions = {}) {
    this.symbol = (options.symbol || 'paxgusdt').toLowerCase();
    this.onStatusChange = options.onStatusChange;
    this.onLatencyChange = options.onLatencyChange;

    if (options.autoConnect !== false && typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect(): void {
    if (this.isDestroyed || typeof WebSocket === 'undefined') return;

    this.onStatusChange?.('connecting');

    // Combined stream URL for depth, aggTrade, and 1m kline
    const streamNames = [
      `${this.symbol}@depth@100ms`,
      `${this.symbol}@aggTrade`,
      `${this.symbol}@kline_1m`,
    ].join('/');

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.onStatusChange?.('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.handleCombinedMessage(raw);
        } catch (err) {
          console.error('[BinanceGoldFeed] JSON parse error', err);
        }
      };

      this.ws.onclose = () => {
        this.onStatusChange?.('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[BinanceGoldFeed] WebSocket error', err);
        this.onStatusChange?.('error');
      };
    } catch (err) {
      console.error('[BinanceGoldFeed] Connect error', err);
      this.scheduleReconnect();
    }
  }

  private handleCombinedMessage(msg: any): void {
    if (!msg || !msg.stream || !msg.data) return;
    const stream = msg.stream;
    const data = msg.data;

    if (stream.includes('@aggTrade')) {
      const trade = this.parseTrade(data);
      if (this.onLatencyChange && trade.timestamp) {
        const latency = Math.max(0, Date.now() - trade.timestamp);
        this.onLatencyChange(latency);
      }
      this.tradeCallbacks.forEach((cb) => cb(trade));
    } else if (stream.includes('@depth')) {
      const depth = this.parseDepth(data);
      this.depthCallbacks.forEach((cb) => cb(depth));
    } else if (stream.includes('@kline')) {
      const candle = this.parseKline(data);
      this.klineCallbacks.forEach((cb) => cb(candle));
    }
  }

  public parseTrade(raw: any): TradeEvent {
    return {
      price: parseFloat(raw.p),
      size: parseFloat(raw.q),
      side: raw.m ? 'sell' : 'buy', // m: true = buyer maker -> seller taker (market sell)
      timestamp: raw.T || Date.now(),
    };
  }

  public parseDepth(raw: any): DepthUpdate {
    const parseLevel = (level: [string, string]): OrderLevel => [
      parseFloat(level[0]),
      parseFloat(level[1]),
    ];

    return {
      lastUpdateId: raw.lastUpdateId || raw.u || 0,
      bids: (raw.bids || raw.b || []).map(parseLevel),
      asks: (raw.asks || raw.a || []).map(parseLevel),
      timestamp: raw.E || Date.now(),
    };
  }

  public parseKline(raw: any): Candle {
    const k = raw.k || raw;
    return {
      openTime: k.t,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      isClosed: !!k.x,
    };
  }

  public subscribeDepth(cb: DepthCallback): () => void {
    this.depthCallbacks.add(cb);
    return () => this.depthCallbacks.delete(cb);
  }

  public subscribeTrades(cb: TradeCallback): () => void {
    this.tradeCallbacks.add(cb);
    return () => this.tradeCallbacks.delete(cb);
  }

  public subscribeKline(cb: KlineCallback): () => void {
    this.klineCallbacks.add(cb);
    return () => this.klineCallbacks.delete(cb);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectTimer) return;
    this.stopHeartbeat();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  public disconnect(): void {
    this.isDestroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.depthCallbacks.clear();
    this.tradeCallbacks.clear();
    this.klineCallbacks.clear();
  }
}
