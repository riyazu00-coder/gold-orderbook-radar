import React from 'react';
import { CandleFootprint } from '../../services/footprintEngine';

interface CandlestickChartProps {
  candles: CandleFootprint[];
  activeCandle: CandleFootprint | null;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  height?: number;
  width?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  activeCandle,
  currentPrice,
  minPrice,
  maxPrice,
  height = 924,
  width = 380,
}) => {
  const priceRange = Math.max(0.1, maxPrice - minPrice);

  const getY = (price: number): number => {
    // Map highest price to top (0), lowest price to bottom (height)
    return height - ((price - minPrice) / priceRange) * height;
  };

  // Combine historical candles and active candle
  const allCandles = [...candles];
  if (activeCandle) {
    allCandles.push(activeCandle);
  }

  const numCandles = Math.max(allCandles.length, 1);
  const candleSpacing = width / (numCandles + 1);
  const candleWidth = Math.max(14, Math.min(32, candleSpacing * 0.7));

  const currentY = getY(currentPrice);

  return (
    <div className="relative bg-[#0c0f17] border-r border-[#1b2234] select-none" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible block">
        {/* Subtle Horizontal Grid lines matching ticks */}
        {Array.from({ length: 15 }).map((_, i) => {
          const y = (height / 14) * i;
          return (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke="#151b27"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Render Candles */}
        {allCandles.map((fp, idx) => {
          const c = fp.candle;
          const isBullish = c.close >= c.open;
          const color = isBullish ? '#10b981' : '#ef4444';
          const wickColor = isBullish ? '#059669' : '#dc2626';

          const cx = candleSpacing * (idx + 1);
          const yHigh = getY(c.high);
          const yLow = getY(c.low);
          const yOpen = getY(c.open);
          const yClose = getY(c.close);

          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));
          const isActive = activeCandle && fp === activeCandle;

          return (
            <g key={`candle-${c.openTime}-${idx}`}>
              {/* High-Low Wick */}
              <line
                x1={cx}
                y1={yHigh}
                x2={cx}
                y2={yLow}
                stroke={wickColor}
                strokeWidth={1.5}
                className="candle-wick"
              />

              {/* Candle Body */}
              <rect
                x={cx - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isBullish ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
                stroke={color}
                strokeWidth={1.5}
                rx={1.5}
                className={`candle-body ${isActive ? 'stroke-2 shadow-lg' : ''}`}
              />

              {/* Inside Active Candle: Render Green & Red Micro Footprint Dots */}
              {isActive && fp.bins && fp.bins.length > 0 && (
                <g className="active-candle-footprint">
                  {fp.bins.map((bin) => {
                    const binY = getY(bin.price);
                    if (binY < yHigh - 5 || binY > yLow + 5) return null;

                    return (
                      <g key={`dots-${bin.price}`}>
                        {/* Green Buy Dots on Left Half */}
                        {Array.from({ length: bin.buyDots }).map((_, dIdx) => (
                          <circle
                            key={`bdot-${dIdx}`}
                            cx={cx - candleWidth / 2 + 3 + dIdx * 3.5}
                            cy={binY}
                            r={1.3}
                            fill="#34d399"
                            className="active-candle-dot"
                          />
                        ))}

                        {/* Red Sell Dots on Right Half */}
                        {Array.from({ length: bin.sellDots }).map((_, dIdx) => (
                          <circle
                            key={`sdot-${dIdx}`}
                            cx={cx + candleWidth / 2 - 3 - dIdx * 3.5}
                            cy={binY}
                            r={1.3}
                            fill="#f97316"
                            className="active-candle-dot"
                          />
                        ))}
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}

        {/* Current Live Price Line extending all the way across to the ladder */}
        <line
          x1={0}
          y1={currentY}
          x2={width}
          y2={currentY}
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4,3"
          className="current-price-line"
        />

        {/* Price tag on the right edge */}
        <g transform={`translate(${width - 65}, ${currentY - 10})`}>
          <rect
            width={62}
            height={20}
            rx={3}
            fill="#2563eb"
            className="shadow-md"
          />
          <text
            x={31}
            y={14}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {currentPrice.toFixed(2)}
          </text>
        </g>
      </svg>
    </div>
  );
};
