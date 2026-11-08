import React from 'react';
import { BigOrderSummary } from '../../services/orderBookEngine';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'spot' | 'call' | 'put';
  onTabChange: (tab: 'spot' | 'call' | 'put') => void;
  spotPrice: number;
  basis: number;
  nearestBigBuyer: BigOrderSummary | null;
  nearestBigSeller: BigOrderSummary | null;
  latencyMs: number;
  lastMinuteBought: number;
  lastMinuteSold: number;
  lastMinutePulled: number;
  onOpenHowToRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  spotPrice,
  basis,
  nearestBigBuyer,
  nearestBigSeller,
  latencyMs,
  lastMinuteBought,
  lastMinuteSold,
  lastMinutePulled,
  onOpenHowToRead,
}) => {
  return (
    <header className="border-b border-[#1b2234] bg-[#0d111a] text-white">
      {/* Risk Banner & Guide */}
      <div className="bg-[#121622] px-4 py-1.5 border-b border-[#1b2234] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Signals on this page are highly risky. For educational purposes only, not a trade recommendation.</span>
        </div>

        <button
          onClick={onOpenHowToRead}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors bg-[#1a2233] px-2.5 py-0.5 rounded border border-[#2b364e]"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>How to read this page</span>
        </button>
      </div>

      {/* Main Bar: Tabs, Live Latency, Last Minute Stats */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#151b29] p-1 rounded-lg border border-[#232c40]">
          <button
            onClick={() => onTabChange('spot')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'spot'
                ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gold Spot
          </button>
          <button
            onClick={() => onTabChange('call')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'call'
                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ATM Call
          </button>
          <button
            onClick={() => onTabChange('put')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'put'
                ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ATM Put
          </button>

          <span className="h-4 w-[1px] bg-slate-700 mx-1" />

          {['Desk', 'Charts', 'Chain & Greeks', 'Order Book'].map((tab) => (
            <button
              key={tab}
              className={`px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors ${
                tab === 'Order Book' ? 'text-blue-400 font-semibold' : ''
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="flex items-center gap-6 font-mono text-xs">
          {/* Last Minute Lots */}
          <div className="flex items-center gap-4 bg-[#141a27] px-3 py-1.5 rounded border border-[#20293d]">
            <span className="text-slate-400 text-[11px]">Last minute (lots):</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="text-[10px] text-slate-400">Bought</span>
              <span className="font-bold">{Math.round(lastMinuteBought)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400">
              <span className="text-[10px] text-slate-400">Sold</span>
              <span className="font-bold">{Math.round(lastMinuteSold)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400">
              <span className="text-[10px] text-slate-400">Pulled</span>
              <span className="font-bold">{Math.round(lastMinutePulled)}</span>
            </div>
          </div>

          {/* Live Ping Status */}
          <div className="flex items-center gap-2 bg-[#141a27] px-3 py-1.5 rounded border border-[#20293d]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-400">Updated</span>
            <span className="text-emerald-400 font-bold uppercase text-[11px]">live</span>
            <span className="text-[10px] text-slate-400">({latencyMs}ms)</span>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 pb-3">
        {/* Spot/Future Main Card */}
        <div className="bg-[#131724] border border-[#1e2538] rounded-lg p-3">
          <div className="text-xs text-slate-400 font-semibold mb-1">
            {activeTab === 'spot' ? 'GOLD SPOT (XAU/USD)' : activeTab === 'call' ? 'GOLD ATM CALL' : 'GOLD ATM PUT'}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              ${spotPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              basis {basis >= 0 ? `+${basis.toFixed(2)}` : basis.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>24h Gold Liquid Feed</span>
            <span>expires Daily</span>
          </div>
        </div>

        {/* Nearest Big Buyers Card */}
        <div className="bg-[#131724] border border-[#1e2538] rounded-lg p-3">
          <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center justify-between">
            <span>Nearest Big Buyers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {nearestBigBuyer ? nearestBigBuyer.priceRange : 'Scanning...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>
              {nearestBigBuyer
                ? `${nearestBigBuyer.distancePts} pts below spot`
                : 'No institutional buyers near spot'}
            </span>
            {nearestBigBuyer && (
              <span className="text-emerald-400 font-mono font-semibold">
                ({Math.round(nearestBigBuyer.size)} lots)
              </span>
            )}
          </div>
        </div>

        {/* Nearest Big Sellers Card */}
        <div className="bg-[#131724] border border-[#1e2538] rounded-lg p-3">
          <div className="text-xs text-orange-400 font-semibold mb-1 flex items-center justify-between">
            <span>Nearest Big Sellers</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {nearestBigSeller ? nearestBigSeller.priceRange : 'Scanning...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>
              {nearestBigSeller
                ? `${nearestBigSeller.distancePts} pts above spot`
                : 'No institutional sellers near spot'}
            </span>
            {nearestBigSeller && (
              <span className="text-orange-400 font-mono font-semibold">
                ({Math.round(nearestBigSeller.size)} lots)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bright Neon Green Divider Line matching video & screenshot */}
      <div className="h-1 bg-emerald-500 w-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
    </header>
  );
};
