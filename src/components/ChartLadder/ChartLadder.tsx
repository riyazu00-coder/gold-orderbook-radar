import React from 'react';
import { LadderRow } from '../../services/orderBookEngine';
import { CandleFootprint } from '../../services/footprintEngine';
import { CandlestickChart } from './CandlestickChart';
import { OrderBookLadder } from './OrderBookLadder';

interface ChartLadderProps {
  ladder: LadderRow[];
  activeCandle: CandleFootprint | null;
  historicalCandles?: CandleFootprint[];
  currentPrice: number;
  instrumentTitle?: string;
  stepDescription?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

export const ChartLadder: React.FC<ChartLadderProps> = ({
  ladder,
  activeCandle,
  historicalCandles = [],
  currentPrice,
  instrumentTitle = 'Gold Spot',
  stepDescription = 'lots waiting, per $0.50 points',
  timeframe = '1m',
  onTimeframeChange,
}) => {
  const ladderPrices = ladder.map((r) => r.price);
  const minPrice = ladderPrices.length > 0 ? Math.min(...ladderPrices) : currentPrice - 8;
  const maxPrice = ladderPrices.length > 0 ? Math.max(...ladderPrices) : currentPrice + 8;
  const rowHeight = 32;
  const totalHeight = Math.max(580, ladder.length * rowHeight);

  return (
    <div className="bg-[#111520] border border-[#1b2234] rounded-lg overflow-hidden flex flex-col shadow-2xl">
      {/* Legend & Header */}
      <div className="px-4 py-2.5 border-b border-[#1b2234] flex flex-wrap items-center justify-between text-xs text-gray-400 bg-[#0d1017]">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{instrumentTitle}</span>
          <span className="text-slate-400">({stepDescription})</span>
        </div>

        {/* Status Legend Pills */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>buyers waiting · bought</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
            <span>sellers waiting · sold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
            <span>pulled (cancelled)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Center Area: Candlestick Chart (Left) + Order Book Ladder (Right) */}
      <div className="flex overflow-y-auto max-h-[660px] divide-x divide-[#1b2234]">
        {/* Candlestick Chart with live footprint fill dots (Left) */}
        <CandlestickChart
          candles={historicalCandles}
          activeCandle={activeCandle}
          currentPrice={currentPrice}
          minPrice={minPrice}
          maxPrice={maxPrice}
          height={totalHeight}
          width={440}
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
        />

        {/* Price Ladder & Order Book Depth (Right) */}
        <OrderBookLadder
          ladder={ladder}
          currentPrice={currentPrice}
          activeCandle={activeCandle}
        />
      </div>
    </div>
  );
};
