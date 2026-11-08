import React from 'react';
import { LadderRow } from '../../services/orderBookEngine';
import { CandleFootprint } from '../../services/footprintEngine';

export interface OrderBookLadderProps {
  ladder: LadderRow[];
  currentPrice: number;
  activeCandle?: CandleFootprint | null;
  rowHeight?: number;
}

export const OrderBookLadder: React.FC<OrderBookLadderProps> = ({
  ladder,
  currentPrice,
  activeCandle,
  rowHeight = 28,
}) => {
  const maxBid = Math.max(...ladder.map((r) => r.bidSize), 1);
  const maxAsk = Math.max(...ladder.map((r) => r.askSize), 1);

  // Map active candle per-level trades
  const tradeBinMap = new Map<number, { buyVol: number; sellVol: number }>();
  if (activeCandle && activeCandle.bins) {
    for (const b of activeCandle.bins) {
      tradeBinMap.set(b.price, { buyVol: b.buyVolume, sellVol: b.sellVolume });
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b0e14] min-w-0">
      <div className="flex-1">
        {ladder.map((row, idx) => {
          const isCurrent = Math.abs(row.price - currentPrice) < 0.25;
          const bidWidth = (row.bidSize / maxBid) * 95;
          const askWidth = (row.askSize / maxAsk) * 95;
          const tradeInfo = tradeBinMap.get(row.price);

          return (
            <div
              key={`${row.price}-${idx}`}
              style={{ height: rowHeight }}
              className={`flex items-center text-xs font-mono border-b border-[#141926] transition-colors ${
                isCurrent ? 'bg-blue-600/20 border-y border-blue-500/40' : 'hover:bg-slate-800/25'
              }`}
            >
              {/* Left Column: Buyers Waiting (Green bar extending LEFTWARDS) */}
              <div className="w-36 flex items-center justify-end pr-2 gap-1.5 shrink-0 overflow-hidden">
                {/* Yellow dot if orders were pulled at this level */}
                {row.pulledSize > 0 && (
                  <span
                    className="w-2 h-2 rounded-full bg-yellow-400 inline-block shadow-[0_0_6px_rgba(250,204,21,0.9)] shrink-0"
                    title={`${Math.round(row.pulledSize)} pulled`}
                  />
                )}

                {/* Green Bid Bar */}
                {row.bidSize > 0 && (
                  <div
                    className="h-4 bg-emerald-500/90 rounded-l flex items-center justify-end pr-1.5 text-[10px] text-black font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all shrink-0"
                    style={{ width: `${Math.max(20, bidWidth)}px` }}
                  >
                    {Math.round(row.bidSize)}
                  </div>
                )}
              </div>

              {/* Center Price Column */}
              <div className="w-24 text-center shrink-0 font-bold select-none">
                <span
                  className={`${
                    isCurrent
                      ? 'text-white bg-blue-600 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.8)] font-extrabold flex items-center justify-center gap-1 mx-auto'
                      : 'text-slate-200'
                  }`}
                >
                  <span>{row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {isCurrent && <span className="text-white text-[10px]">◄</span>}
                </span>
              </div>

              {/* Right Column: Sellers Waiting (Orange bar extending RIGHTWARDS) */}
              <div className="w-36 flex items-center justify-start pl-2 gap-1.5 shrink-0 overflow-hidden">
                {/* Orange Ask Bar */}
                {row.askSize > 0 && (
                  <div
                    className="h-4 bg-orange-500/90 rounded-r flex items-center justify-start pl-1.5 text-[10px] text-black font-extrabold shadow-[0_0_8px_rgba(249,115,22,0.3)] transition-all shrink-0"
                    style={{ width: `${Math.max(20, askWidth)}px` }}
                  >
                    {Math.round(row.askSize)}
                  </div>
                )}

                {/* Yellow dot if orders were pulled at this level */}
                {row.pulledSize > 0 && (
                  <span
                    className="w-2 h-2 rounded-full bg-yellow-400 inline-block shadow-[0_0_6px_rgba(250,204,21,0.9)] shrink-0"
                    title={`${Math.round(row.pulledSize)} pulled`}
                  />
                )}
              </div>

              {/* Forming Candle Flow Column (matching exact video & screenshot badges) */}
              <div className="flex-1 flex items-center gap-2 pl-4 pr-3 text-[11px] font-mono shrink-0 overflow-hidden">
                {/* Whale Badges */}
                {row.isBigBuyer && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.2 rounded font-sans font-bold shrink-0 animate-pulse">
                    Big Buyers
                  </span>
                )}

                {row.isBigSeller && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.2 rounded font-sans font-bold shrink-0 animate-pulse">
                    Big Sellers
                  </span>
                )}

                {/* Bought Lots */}
                {tradeInfo && tradeInfo.buyVol > 0 && (
                  <span className="text-emerald-400 font-bold shrink-0">
                    {Math.round(tradeInfo.buyVol)} bought
                  </span>
                )}

                {/* Sold Lots */}
                {tradeInfo && tradeInfo.sellVol > 0 && (
                  <span className="text-orange-400 font-bold shrink-0">
                    {Math.round(tradeInfo.sellVol)} sold
                  </span>
                )}

                {/* Pulled Lots */}
                {row.pulledSize > 0 && (
                  <span className="text-yellow-400/95 flex items-center gap-1 font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
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

