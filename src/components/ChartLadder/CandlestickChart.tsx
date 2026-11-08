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
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  activeCandle,
  currentPrice,
  minPrice,
  maxPrice,
  height = 700,
  width = 460,
  timeframe = '1m',
  onTimeframeChange,
}) => {
  const priceRange = Math.max(0.5, maxPrice - minPrice);

  const getY = (price: number): number => {
    // Map highest price to 0 (top), lowest price to height (bottom)
    const ratio = (maxPrice - price) / priceRange;
    return Math.max(0, Math.min(height, ratio * height));
  };

  // Combine historical candles and active candle
  const allCandles = [...candles];
  if (activeCandle) {
    allCandles.push(activeCandle);
  }

  const numCandles = Math.max(allCandles.length, 1);
  const candleSpacing = width / (numCandles + 1);
  const candleWidth = Math.max(22, Math.min(36, candleSpacing * 0.72));

  const currentY = getY(currentPrice);

  return (
    <div className="flex flex-col bg-[#0b0f17] border-r border-[#1b2234] select-none" style={{ width }}>
      {/* Top Timeframe & Status Subheader */}
      <div className="px-3 py-1.5 border-b border-[#161d2d] bg-[#0d121c] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {['1m', '3m', '5m', '15m'].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                  : 'text-slate-400 hover:text-white bg-[#141a27]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">Active Candle</span>
          <span className="text-blue-400 font-bold">${currentPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative overflow-hidden flex-1" style={{ height }}>
        <svg width={width} height={height} className="block overflow-visible">
          {/* Horizontal Grid lines */}
          {Array.from({ length: 18 }).map((_, i) => {
            const y = (height / 17) * i;
            return (
              <line
                key={`grid-${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke="#141a26"
                strokeDasharray="2,3"
              />
            );
          })}

          {/* Render Candlesticks */}
          {allCandles.map((fp, idx) => {
            const c = fp.candle;
            const isBullish = c.close >= c.open;
            const color = isBullish ? '#10b981' : '#ef4444';
            const bodyFill = isBullish ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)';
            const wickColor = isBullish ? '#059669' : '#dc2626';

            const cx = candleSpacing * (idx + 1);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const yOpen = getY(c.open);
            const yClose = getY(c.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(4, Math.abs(yClose - yOpen));
            const isActive = activeCandle && fp === activeCandle;

            return (
              <g key={`candle-${c.openTime}-${idx}`}>
                {/* Upper and Lower Wick */}
                <line
                  x1={cx}
                  y1={yHigh}
                  x2={cx}
                  y2={yLow}
                  stroke={wickColor}
                  strokeWidth={2}
                  className="candle-wick"
                />

                {/* Solid Candlestick Body */}
                <rect
                  x={cx - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={bodyFill}
                  stroke={color}
                  strokeWidth={isActive ? 2 : 1.5}
                  rx={2}
                  className={`candle-body ${isActive ? 'filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}
                />

                {/* Candle Time / Label on bottom */}
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isActive ? 'LIVE' : `-${allCandles.length - 1 - idx}m`}
                </text>

                {/* Footprint Filling Influx Dots Directly Inside Active Candle */}
                {isActive && (
                  <g className="active-candle-footprint">
                    {/* Active Candle Pulsing Frame */}
                    <rect
                      x={cx - candleWidth / 2 - 2}
                      y={bodyTop - 2}
                      width={candleWidth + 4}
                      height={bodyHeight + 4}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      strokeDasharray="3,2"
                      rx={3}
                      className="animate-pulse"
                    />

                    {/* Green Buy Dots on Left, Red Sell Dots on Right inside candle */}
                    {fp.bins && fp.bins.length > 0 ? (
                      fp.bins.map((bin) => {
                        const binY = getY(bin.price);
                        if (binY < yHigh - 5 || binY > yLow + 5) return null;

                        return (
                          <g key={`dots-${bin.price}`}>
                            {Array.from({ length: bin.buyDots }).map((_, dIdx) => (
                              <circle
                                key={`bdot-${dIdx}`}
                                cx={cx - candleWidth / 2 + 4 + dIdx * 4}
                                cy={binY}
                                r={1.6}
                                fill="#34d399"
                                className="active-candle-dot shadow-[0_0_4px_rgba(52,211,153,1)]"
                              />
                            ))}

                            {Array.from({ length: bin.sellDots }).map((_, dIdx) => (
                              <circle
                                key={`sdot-${dIdx}`}
                                cx={cx + candleWidth / 2 - 4 - dIdx * 4}
                                cy={binY}
                                r={1.6}
                                fill="#f97316"
                                className="active-candle-dot shadow-[0_0_4px_rgba(249,115,22,1)]"
                              />
                            ))}
                          </g>
                        );
                      })
                    ) : (
                      // Subtle default active dots when candle starts
                      <g>
                        <circle cx={cx - 6} cy={bodyTop + bodyHeight / 2} r={2} fill="#34d399" className="active-candle-dot animate-ping" />
                        <circle cx={cx + 6} cy={bodyTop + bodyHeight / 2} r={2} fill="#f97316" className="active-candle-dot animate-ping" />
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Current Live Price Line extending all the way across */}
          <line
            x1={0}
            y1={currentY}
            x2={width}
            y2={currentY}
            stroke="#3b82f6"
            strokeWidth={1.8}
            strokeDasharray="4,3"
            className="current-price-line"
          />

          {/* Price badge pointing into the order book */}
          <g transform={`translate(${width - 70}, ${currentY - 11})`}>
            <polygon points="0,11 8,4 68,4 68,18 8,18" fill="#2563eb" />
            <text
              x={38}
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
    </div>
  );
};
