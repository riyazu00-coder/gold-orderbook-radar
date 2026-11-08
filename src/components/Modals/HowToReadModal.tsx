import React from 'react';
import { X, CheckCircle, Info } from 'lucide-react';

interface HowToReadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToReadModal: React.FC<HowToReadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111522] border border-[#232c42] rounded-xl max-w-xl w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold">How to Read This Order Book Radar</h2>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="bg-[#161c2d] p-3 rounded-lg border border-[#20293d]">
            <h3 className="font-bold text-white flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              1. Candle Footprint (Green & Red Dots)
            </h3>
            <p>
              Inside the forming candle on the left, executed market buy orders fill up as{' '}
              <strong className="text-emerald-400">green dots</strong>, while market sell orders fill up as{' '}
              <strong className="text-orange-400">red dots</strong>. This reveals micro-order flow in real time.
            </p>
          </div>

          <div className="bg-[#161c2d] p-3 rounded-lg border border-[#20293d]">
            <h3 className="font-bold text-white flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              2. Pulled Orders (Yellow Bars - Spoofing Detection)
            </h3>
            <p>
              When institutional traders place huge orders and cancel them right before the market price touches that
              level, our diff engine flags them as <strong className="text-yellow-400">yellow pulled bars</strong>.
            </p>
          </div>

          <div className="bg-[#161c2d] p-3 rounded-lg border border-[#20293d]">
            <h3 className="font-bold text-white flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              3. Nearest Big Buyers / Sellers & ATM Options
            </h3>
            <p>
              The top cards identify the nearest large liquidity walls above and below spot price. Toggle between{' '}
              <strong className="text-white">Gold Spot</strong>, <strong className="text-emerald-400">ATM Call</strong>, and{' '}
              <strong className="text-orange-400">ATM Put</strong> to trade directional momentum with zero delay.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Got it
          </button>
        </div>
      </div>
    </div>
  );
};
