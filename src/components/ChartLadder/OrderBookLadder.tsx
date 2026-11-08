import React from 'react';
import { LadderRow } from '../../services/orderBookEngine';

interface OrderBookLadderProps {
  ladder: LadderRow[];
  currentPrice: number;
}

export const OrderBookLadder: React.FC<OrderBookLadderProps> = ({
  ladder,
  currentPrice,
}) => {
  const maxBid = Math.max(...ladder.map((r) => r.bidSize), 1);
  const maxAsk = Math.max(...ladder.map((r) => r.askSize), 1);
  const maxPulled = Math.max(...ladder.map((r) => r.pulledSize), 1);

  return (
    <div className="flex-1">
      {ladder.map((row, idx) => {
        const isCurrent = Math.abs(row.price - currentPrice) < 0.25;
        const bidWidth = (row.bidSize / maxBid) * 120;
        const askWidth = (row.askSize / maxAsk) * 120;
        const pulledWidth = row.pulledSize > 0 ? Math.min(100, (row.pulledSize / maxPulled) * 80) : 0;

        return (
          <div
            key={`${row.price}-${idx}`}
            className={`flex items-center h-7 text-xs font-mono border-b border-[#161d2d] transition-colors ${
              isCurrent ? 'bg-blue-500/10' : 'hover:bg-slate-800/20'
            }`}
          >
            {/* Center Price Column */}
            <div className="w-24 text-right pr-3 font-semibold relative">
              <span
                className={`${
                  isCurrent
                    ? 'text-white bg-blue-600 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                    : 'text-slate-300'
                }`}
              >
                {row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Depth Bars & Quantities Container */}
            <div className="flex-1 flex items-center gap-2 pl-2 relative overflow-hidden">
              {/* Buyers Waiting Bar (Green) */}
              {row.bidSize > 0 && (
                <div
                  className="h-4 bg-emerald-500/80 rounded-r flex items-center px-1 text-[10px] text-black font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all"
                  style={{ width: `${Math.max(16, bidWidth)}px` }}
                >
                  {Math.round(row.bidSize)}
                </div>
              )}

              {/* Sellers Waiting Bar (Orange) */}
              {row.askSize > 0 && (
                <div
                  className="h-4 bg-orange-500/80 rounded-r flex items-center px-1 text-[10px] text-black font-bold shadow-[0_0_8px_rgba(249,115,22,0.3)] transition-all"
                  style={{ width: `${Math.max(16, askWidth)}px` }}
                >
                  {Math.round(row.askSize)}
                </div>
              )}

              {/* Pulled / Cancelled Orders Bar (Yellow) */}
              {row.pulledSize > 0 && (
                <div
                  className="h-3.5 bg-yellow-400/90 rounded flex items-center px-1.5 text-[9px] text-black font-bold shadow-[0_0_6px_rgba(250,204,21,0.5)] transition-all"
                  style={{ width: `${Math.max(24, pulledWidth)}px` }}
                >
                  {Math.round(row.pulledSize)} pulled
                </div>
              )}

              {/* Badges for Big Buyers and Big Sellers */}
              {row.isBigBuyer && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-1 animate-pulse">
                  Big Buyers ({Math.round(row.bidSize)})
                </span>
              )}

              {row.isBigSeller && (
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-1 animate-pulse">
                  Big Sellers ({Math.round(row.askSize)})
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
