import React from 'react';
import { FormingCandleStats } from '../../services/footprintEngine';
import { BigOrderInfo, LevelReactionStat } from '../../types/market';
import { BigOrdersTable } from './BigOrdersTable';
import { TurnBreakGauge } from './TurnBreakGauge';
import { Clock } from 'lucide-react';

interface RightPanelProps {
  formingStats: FormingCandleStats;
  bigOrders: BigOrderInfo[];
  turnBreak: LevelReactionStat;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  formingStats,
  bigOrders,
  turnBreak,
}) => {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-3">
      {/* Forming Candle Card */}
      <div className="bg-[#131826] border border-[#1e263c] rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-white">Forming candle</span>
          <div className="flex items-center gap-1 text-blue-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formingStats.secondsIntoMinute}s into the minute</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="bg-[#0e121d] p-2 rounded border border-[#1b2234]">
            <div className="text-[10px] text-slate-400">Bought</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">
              {Math.round(formingStats.boughtLots)}
            </div>
          </div>
          <div className="bg-[#0e121d] p-2 rounded border border-[#1b2234]">
            <div className="text-[10px] text-slate-400">Sold</div>
            <div className="text-orange-400 font-bold text-sm mt-0.5">
              {Math.round(formingStats.soldLots)}
            </div>
          </div>
          <div className="bg-[#0e121d] p-2 rounded border border-[#1b2234]">
            <div className="text-[10px] text-slate-400">Pulled</div>
            <div className="text-yellow-400 font-bold text-sm mt-0.5">
              {Math.round(formingStats.pulledLots)}
            </div>
          </div>
        </div>
      </div>

      {/* Big Orders Right Now */}
      <BigOrdersTable bigOrders={bigOrders} />

      {/* Turn vs Break Gauge */}
      <TurnBreakGauge stats={turnBreak} />
    </div>
  );
};
