import React from 'react';
import { LadderRow } from '../../services/orderBookEngine';
import { CandleFootprint } from '../../services/footprintEngine';

interface OrderBookLadderProps {
  ladder: LadderRow[];
  currentPrice: number;
  activeCandle?: CandleFootprint | null;
}

export const OrderBookLadder: React.FC<OrderBookLadderProps> = ({
  ladder,
  currentPrice,
  activeCandle,
}) => {
  const maxBid = Math.max(...ladder.map((r) => r.bidSize), 1);
  const maxAsk = Math.max(...ladder.map((r) => r.askSize), 1);
  const maxPulled = Math.max(...ladder.map((r) => r.pulledSize), 1);

  // Map active candle per-level trades
  const tradeBinMap = new Map<number, { buyVol: number; sellVol: number }>();
  if (activeCandle && activeCandle.bins) {
    for (const b of activeCandle.bins) {
      tradeBinMap.set(b.price, { buyVol: b.buyVolume, sellVol: b.sellVolume });
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0d111a]">
      {/* Subheader matching video */}
      <div className="px-3 py-1.5 border-b border-[#161d2d] bg-[#0d121c] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="w-24 text-right pr-3 font-semibold text-slate-300">Price ($)</span>
        <span className="flex-1 pl-2">Resting Liquidity & Pulled Orders</span>
        <span className="w-36 text-right pr-2 text-slate-300">Forming Candle Flow</span>
      </div>

      <div className="flex-1">
        {ladder.map((row, idx) => {
          const isCurrent = Math.abs(row.price - currentPrice) < 0.25;
          const bidWidth = (row.bidSize / maxBid) * 110;
          const askWidth = (row.askSize / maxAsk) * 110;
          const pulledWidth = row.pulledSize > 0 ? Math.min(90, (row.pulledSize / maxPulled) * 75) : 0;

          const tradeInfo = tradeBinMap.get(row.price);

          return (
            <div
              key={`${row.price}-${idx}`}
              className={`flex items-center h-8 text-xs font-mono border-b border-[#161d2d] transition-colors ${
                isCurrent ? 'bg-blue-600/15' : 'hover:bg-slate-800/30'
              }`}
            >
              {/* Center Price Column */}
              <div className="w-24 text-right pr-3 font-semibold relative shrink-0">
                <span
                  className={`${
                    isCurrent
                      ? 'text-white bg-blue-600 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(59,130,246,0.6)] font-bold'
                      : 'text-slate-200'
                  }`}
                >
                  {row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Depth Bars & Quantities Container */}
              <div className="flex-1 flex items-center gap-1.5 pl-2 relative overflow-hidden">
                {/* Buyers Waiting Bar (Green) */}
                {row.bidSize > 0 && (
                  <div
                    className="h-4 bg-emerald-500/85 rounded-r flex items-center px-1 text-[10px] text-black font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all shrink-0"
                    style={{ width: `${Math.max(16, bidWidth)}px` }}
                  >
                    {Math.round(row.bidSize)}
                  </div>
                )}

                {/* Sellers Waiting Bar (Orange) */}
                {row.askSize > 0 && (
                  <div
                    className="h-4 bg-orange-500/85 rounded-r flex items-center px-1 text-[10px] text-black font-bold shadow-[0_0_8px_rgba(249,115,22,0.3)] transition-all shrink-0"
                    style={{ width: `${Math.max(16, askWidth)}px` }}
                  >
                    {Math.round(row.askSize)}
                  </div>
                )}

                {/* Pulled / Cancelled Orders Bar (Yellow) */}
                {row.pulledSize > 0 && (
                  <div
                    className="h-3.5 bg-yellow-400/95 rounded flex items-center px-1.5 text-[9px] text-black font-bold shadow-[0_0_6px_rgba(250,204,21,0.5)] transition-all shrink-0"
                    style={{ width: `${Math.max(22, pulledWidth)}px` }}
                  >
                    {Math.round(row.pulledSize)} pulled
                  </div>
                )}

                {/* Badges for Big Buyers and Big Sellers */}
                {row.isBigBuyer && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-1 animate-pulse shrink-0">
                    Big Buyers ({Math.round(row.bidSize)})
                  </span>
                )}

                {row.isBigSeller && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-1 animate-pulse shrink-0">
                    Big Sellers ({Math.round(row.askSize)})
                  </span>
                )}
              </div>

              {/* Forming Candle Micro-Flow Column (matching video column!) */}
              <div className="w-36 text-right pr-3 shrink-0 flex items-center justify-end gap-1.5 font-mono text-[11px]">
                {tradeInfo && tradeInfo.buyVol > 0 && (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded">
                    {Math.round(tradeInfo.buyVol)} bought
                  </span>
                )}
                {tradeInfo && tradeInfo.sellVol > 0 && (
                  <span className="text-orange-400 font-bold bg-orange-500/10 px-1 py-0.5 rounded">
                    {Math.round(tradeInfo.sellVol)} sold
                  </span>
                )}
                {row.pulledSize > 0 && (
                  <span className="text-yellow-400 font-semibold bg-yellow-500/10 px-1 py-0.5 rounded">
                    {Math.round(row.pulledSize)} pulled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
