import React from 'react';
import { LadderRow } from '../../services/orderBookEngine';
import { CandleFootprint } from '../../services/footprintEngine';
import { CandlestickChart } from './CandlestickChart';
import { OrderBookLadder } from './OrderBookLadder';

export interface ChartLadderProps {
  ladder: LadderRow[];
  activeCandle: CandleFootprint | null;
  historicalCandles?: CandleFootprint[];
  currentPrice: number;
  instrumentTitle?: string;
  stepDescription?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  secondsIntoMinute?: number;
}

export const ChartLadder: React.FC<ChartLadderProps> = ({
  ladder,
  activeCandle,
  historicalCandles = [],
  currentPrice,
  stepDescription = 'lots waiting, per $0.50 points',
  timeframe = '1m',
  onTimeframeChange,
  secondsIntoMinute = 0,
}) => {
  const ladderPrices = ladder.map((r) => r.price);
  const minPrice = ladderPrices.length > 0 ? Math.min(...ladderPrices) : currentPrice - 6;
  const maxPrice = ladderPrices.length > 0 ? Math.max(...ladderPrices) : currentPrice + 6;

  // Exact row height locked 1-to-1 between SVG candles and OrderBook rows
  const rowHeight = 28;
  const totalHeight = Math.max(560, ladder.length * rowHeight);

  return (
    <div className="bg-[#0b0e14] border border-[#1b2234] rounded-lg overflow-hidden flex flex-col shadow-2xl">
      {/* Legend & Header matching tradecartel screenshot */}
      <div className="px-4 py-2.5 border-b border-[#1b2234] flex flex-wrap items-center justify-between text-xs text-gray-400 bg-[#0d1017]">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">Live chart and order book</span>
          <span className="text-slate-400">({stepDescription})</span>
        </div>

        {/* Status Legend Pills */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>buyers waiting · bought</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            <span>sellers waiting · sold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
            <span>pulled (cancelled)</span>
          </div>
        </div>

        {/* Forming candle countdown timer */}
        <div className="font-mono text-xs text-slate-300 font-semibold">
          forming candle · <span className="text-emerald-400 font-bold">{secondsIntoMinute}s</span> into the minute
        </div>
      </div>

      {/* Main Grid: Candlestick Chart (Left) + Order Book Ladder (Right) */}
      <div className="flex overflow-x-auto overflow-y-auto max-h-[700px] divide-x divide-[#1b2234]">
        {/* Candlestick Chart (flush left, row-synchronized) */}
        <CandlestickChart
          candles={historicalCandles}
          activeCandle={activeCandle}
          currentPrice={currentPrice}
          minPrice={minPrice}
          maxPrice={maxPrice}
          height={totalHeight}
          width={240}
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
          rowHeight={rowHeight}
          ladderPrices={ladderPrices}
        />

        {/* Price Ladder & Order Book Depth (Center + Right) */}
        <OrderBookLadder
          ladder={ladder}
          currentPrice={currentPrice}
          activeCandle={activeCandle}
          rowHeight={rowHeight}
        />
      </div>
    </div>
  );
};

