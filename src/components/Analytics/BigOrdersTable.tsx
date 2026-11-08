import React from 'react';
import { BigOrderInfo } from '../../types/market';

interface BigOrdersTableProps {
  bigOrders: BigOrderInfo[];
}

export const BigOrdersTable: React.FC<BigOrdersTableProps> = ({ bigOrders }) => {
  return (
    <div className="bg-[#131826] border border-[#1e263c] rounded-lg p-3">
      <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
        <span>Big orders right now</span>
        <span className="text-[10px] text-slate-400 font-normal">Active liquidity</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {bigOrders.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 text-center">No outsized orders detected</div>
        ) : (
          bigOrders.map((order, idx) => {
            const isBuyer = order.side === 'buyer';
            return (
              <div
                key={`${order.price}-${idx}`}
                className="bg-[#0e121d] border border-[#192133] rounded p-2 text-xs font-mono flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isBuyer ? 'bg-emerald-400' : 'bg-orange-400'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-white">
                      {isBuyer ? 'Big Buyers' : 'Big Sellers'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ${order.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-bold">
                    {Math.round(order.size)} lots
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      · {order.ratioVsNormal}x normal
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    waiting {order.waitingSeconds}s
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
