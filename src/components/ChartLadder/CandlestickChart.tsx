import React from 'react';
import { CandleFootprint } from '../../services/footprintEngine';

export interface CandlestickChartProps {
  candles: CandleFootprint[];
  activeCandle: CandleFootprint | null;
  currentPrice: number;
  minPrice?: number;
  maxPrice?: number;
  height?: number;
  width?: number;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  rowHeight?: number;
  ladderPrices?: number[];
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  activeCandle,
  currentPrice,
  minPrice,
  maxPrice,
  height = 680,
  width = 250,
  timeframe = '1m',
  onTimeframeChange,
  rowHeight = 28,
  ladderPrices,
}) => {
  const effectiveMinPrice = minPrice ?? (ladderPrices ? Math.min(...ladderPrices) : currentPrice - 6);
  const effectiveMaxPrice = maxPrice ?? (ladderPrices ? Math.max(...ladderPrices) : currentPrice + 6);

  const getY = (price: number): number => {
    if (ladderPrices && ladderPrices.length > 1) {
      const topPrice = ladderPrices[0];
      const bottomPrice = ladderPrices[ladderPrices.length - 1];
      if (topPrice !== bottomPrice) {
        const ratio = (topPrice - price) / (topPrice - bottomPrice);
        return ratio * (ladderPrices.length - 1) * rowHeight + rowHeight / 2;
      }
    }
    const priceRange = Math.max(0.5, effectiveMaxPrice - effectiveMinPrice);
    const ratio = (effectiveMaxPrice - price) / priceRange;
    return Math.max(0, Math.min(height, ratio * height));
  };

  // Keep latest 3 historical candles + active candle for a focused 4-candle chart directly adjacent to ladder
  const historicalToShow = candles.slice(-3);
  const allCandles = [...historicalToShow];
  if (activeCandle) {
    allCandles.push(activeCandle);
  }

  const numCandles = Math.max(allCandles.length, 1);
  const candleSpacing = width / (numCandles + 1);
  const candleWidth = 20;

  const currentY = getY(currentPrice);
  const activeCandleY = activeCandle ? getY(activeCandle.candle.close) : currentY;
  const activeCandleX = candleSpacing * allCandles.length;

  // Curved influx arc path from orderbook right edge directly into the active candle
  const influxArcD = `M ${width} ${currentY} C ${width - 25} ${currentY}, ${activeCandleX + 25} ${activeCandleY}, ${activeCandleX} ${activeCandleY}`;

  return (
    <div className="flex flex-col bg-[#0b0e14] border-r border-[#1b2234] select-none shrink-0" style={{ width }}>
      {/* Top Timeframe bar */}
      <div className="px-3 py-1.5 border-b border-[#161d2d] bg-[#0c1018] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {['1m', '3m', '5m'].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white bg-[#141a27]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Candlestick SVG Container */}
      <div className="relative overflow-hidden flex-1" style={{ height }}>
        <svg width={width} height={height} className="block overflow-visible">
          {/* Subtle horizontal grid lines */}
          {ladderPrices
            ? ladderPrices.map((p) => {
                const y = getY(p);
                return (
                  <line
                    key={`grid-${p}`}
                    x1={0}
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke="#141926"
                    strokeDasharray="2,4"
                  />
                );
              })
            : Array.from({ length: 16 }).map((_, i) => {
                const y = (height / 15) * i;
                return (
                  <line
                    key={`grid-${i}`}
                    x1={0}
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke="#141926"
                    strokeDasharray="2,4"
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
                  className={`candle-body ${
                    isActive ? 'filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''
                  }`}
                />

                {/* Candle Time Label on bottom */}
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

                {/* Active Candle Footprint Influx Dots Inside Candle Body */}
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

                        return (
                          <g key={`dots-${bin.price}`}>
                            {Array.from({ length: bin.buyDots }).map((_, dIdx) => (
                              <circle
                                key={`bdot-${dIdx}`}
                                cx={cx - candleWidth / 2 + 4 + dIdx * 3.5}
                                cy={binY}
                                r={1.6}
                                fill="#34d399"
                                className="active-candle-dot shadow-[0_0_4px_rgba(52,211,153,1)]"
                              />
                            ))}

                            {Array.from({ length: bin.sellDots }).map((_, dIdx) => (
                              <circle
                                key={`sdot-${dIdx}`}
                                cx={cx + candleWidth / 2 - 4 - dIdx * 3.5}
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
                      <g>
                        <circle
                          cx={cx - 4}
                          cy={bodyTop + bodyHeight / 2}
                          r={1.8}
                          fill="#34d399"
                          className="active-candle-dot animate-ping"
                        />
                        <circle
                          cx={cx + 4}
                          cy={bodyTop + bodyHeight / 2}
                          r={1.8}
                          fill="#f97316"
                          className="active-candle-dot animate-ping"
                        />
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Dotted Horizontal Active Price Guide Line */}
          <line
            x1={0}
            y1={currentY}
            x2={width}
            y2={currentY}
            stroke="#3b82f6"
            strokeWidth={1.6}
            strokeDasharray="3,3"
            className="current-price-line"
          />

          {/* Animated Curved Influx Arc Connecting Order Book into Active Candle */}
          <g className="influx-trail">
            {/* Dashed guide arc */}
            <path
              d={influxArcD}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              opacity="0.65"
            />

            {/* Influx streaming particle 1: Buy (Green) */}
            <circle r="2.6" fill="#34d399" className="shadow-[0_0_6px_rgba(52,211,153,1)]">
              <animateMotion path={influxArcD} dur="1.1s" repeatCount="indefinite" begin="0s" />
            </circle>

            {/* Influx streaming particle 2: Sell (Orange) */}
            <circle r="2.6" fill="#fb923c" className="shadow-[0_0_6px_rgba(251,146,60,1)]">
              <animateMotion path={influxArcD} dur="1.1s" repeatCount="indefinite" begin="0.38s" />
            </circle>

            {/* Influx streaming particle 3: Pulled/Spoof (Yellow) */}
            <circle r="2.2" fill="#facc15" className="shadow-[0_0_6px_rgba(250,204,21,1)]">
              <animateMotion path={influxArcD} dur="1.1s" repeatCount="indefinite" begin="0.75s" />
            </circle>
          </g>

          {/* Cyan/Blue Price Pill Badge over active candle pointing rightwards into the ladder */}
          <g transform={`translate(${activeCandleX - 5}, ${currentY - 10})`}>
            <rect
              x={0}
              y={0}
              width={54}
              height={20}
              rx={3}
              fill="#2563eb"
              className="filter drop-shadow-[0_0_6px_rgba(37,99,235,0.8)]"
            />
            <text
              x={25}
              y={14}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {currentPrice.toFixed(2)}
            </text>
            <polygon points="54,10 49,6 49,14" fill="#2563eb" />
          </g>
        </svg>
      </div>
    </div>
  );
};

