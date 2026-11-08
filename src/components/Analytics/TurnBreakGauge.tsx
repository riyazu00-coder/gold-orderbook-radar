import React from 'react';
import { LevelReactionStat } from '../../types/market';

interface TurnBreakGaugeProps {
  stats: LevelReactionStat;
}

export const TurnBreakGauge: React.FC<TurnBreakGaugeProps> = ({ stats }) => {
  const turnedPct = stats.turnedPercent;
  const brokePct = stats.brokePercent;

  return (
    <div className="bg-[#131826] border border-[#1e263c] rounded-lg p-3">
      <div className="text-xs font-bold text-white mb-2">
        Big levels: did price turn or break?
      </div>

      <div className="flex items-center gap-4">
        {/* Donut Ring Gauge */}
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Circle */}
            <path
              className="text-orange-500"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Turned Arc */}
            <path
              className="text-emerald-500"
              strokeDasharray={`${turnedPct}, 100`}
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xs font-bold font-mono text-emerald-400">{turnedPct}%</span>
            <span className="text-[8px] text-slate-400">turned</span>
          </div>
        </div>

        {/* Stats Legend */}
        <div className="flex-1 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Turned {turnedPct}%</span>
            </div>
            <span className="text-slate-400 text-[11px]">({stats.turnedCount})</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Broke {brokePct}%</span>
            </div>
            <span className="text-slate-400 text-[11px]">({stats.brokeCount})</span>
          </div>

          <div className="text-[10px] text-slate-400 pt-1 border-t border-[#1d2438]">
            across {stats.totalTested} tested levels
          </div>
        </div>
      </div>
    </div>
  );
};
