import React, { useMemo } from 'react';
import { CandleFootprint } from '../../services/footprintEngine';

interface FootprintCandleProps {
  candleFootprint: CandleFootprint | null;
  targetPrice: number;
}

export const FootprintCandle: React.FC<FootprintCandleProps> = ({
  candleFootprint,
  targetPrice,
}) => {
  const binMap = useMemo(() => {
    const map = new Map<number, { buyDots: number; sellDots: number }>();
    if (candleFootprint) {
      for (const b of candleFootprint.bins) {
        map.set(b.price, { buyDots: b.buyDots, sellDots: b.sellDots });
      }
    }
    return map;
  }, [candleFootprint]);

  if (!candleFootprint) return <div className="w-28 h-7" />;

  const bin = binMap.get(targetPrice);
  const buyDots = bin ? bin.buyDots : 0;
  const sellDots = bin ? bin.sellDots : 0;

  return (
    <div className="flex items-center justify-end gap-1 px-2 h-7 w-28 overflow-hidden select-none">
      {/* Green buy dots entering from left */}
      <div className="flex items-center gap-0.5 justify-end">
        {Array.from({ length: buyDots }).map((_, i) => (
          <span
            key={`buy-${i}`}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_rgba(52,211,153,0.7)]"
          />
        ))}
      </div>

      {/* Red/Orange sell dots */}
      <div className="flex items-center gap-0.5 justify-end">
        {Array.from({ length: sellDots }).map((_, i) => (
          <span
            key={`sell-${i}`}
            className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block shadow-[0_0_4px_rgba(249,115,22,0.7)]"
          />
        ))}
      </div>
    </div>
  );
};
