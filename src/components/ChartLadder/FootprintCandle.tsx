import React from 'react';
import { CandleFootprint, PriceBin } from '../../services/footprintEngine';

interface FootprintCandleProps {
  candleFootprint: CandleFootprint | null;
  targetPrice: number;
}

export const FootprintCandle: React.FC<FootprintCandleProps> = ({
  candleFootprint,
  targetPrice,
}) => {
  if (!candleFootprint) return <div className="w-24 h-6" />;

  const bin = candleFootprint.bins.find((b) => Math.abs(b.price - targetPrice) < 0.25);
  const buyDots = bin ? bin.buyDots : 0;
  const sellDots = bin ? bin.sellDots : 0;

  return (
    <div className="flex items-center justify-end gap-1 px-2 h-7 w-28 overflow-hidden">
      {/* Green buy dots entering from left */}
      <div className="flex items-center gap-0.5 justify-end">
        {Array.from({ length: buyDots }).map((_, i) => (
          <span
            key={`buy-${i}`}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"
          />
        ))}
      </div>

      {/* Red/Orange sell dots */}
      <div className="flex items-center gap-0.5 justify-end">
        {Array.from({ length: sellDots }).map((_, i) => (
          <span
            key={`sell-${i}`}
            className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};
