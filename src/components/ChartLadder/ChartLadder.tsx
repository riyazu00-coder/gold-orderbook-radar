import React from 'react';
import { LadderRow } from '../../services/orderBookEngine';
import { CandleFootprint } from '../../services/footprintEngine';
import { FootprintCandle } from './FootprintCandle';
import { OrderBookLadder } from './OrderBookLadder';

interface ChartLadderProps {
  ladder: LadderRow[];
  activeCandle: CandleFootprint | null;
  currentPrice: number;
  instrumentTitle?: string;
  stepDescription?: string;
}

export const ChartLadder: React.FC<ChartLadderProps> = ({
  ladder,
  activeCandle,
  currentPrice,
  instrumentTitle = 'Gold Spot',
  stepDescription = 'lots waiting, per $0.50 points',
}) => {
  return (
    <div className="bg-[#111520] border border-[#1b2234] rounded-lg overflow-hidden flex flex-col shadow-xl">
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

      {/* Main Interactive Center Ladder */}
      <div className="flex overflow-y-auto max-h-[640px] divide-x divide-[#1b2234]">
        {/* Footprint Candle Influx Column (Left) */}
        <div className="w-32 bg-[#0c0f17] flex flex-col pt-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center py-1 border-b border-[#161d2d]">
            Footprint Influx
          </div>
          {ladder.map((row) => (
            <FootprintCandle
              key={`footprint-${row.price}`}
              candleFootprint={activeCandle}
              targetPrice={row.price}
            />
          ))}
        </div>

        {/* Price & Order Book Ladder (Center & Right) */}
        <OrderBookLadder ladder={ladder} currentPrice={currentPrice} />
      </div>
    </div>
  );
};
