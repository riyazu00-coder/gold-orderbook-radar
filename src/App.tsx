import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <header className="border-b border-[#1b2234] px-4 py-3 bg-[#111520] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Gold OrderBook Radar <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">XAU/USD</span>
          </h1>
        </div>
      </header>
      <main className="p-4">
        <p className="text-gray-400 font-mono text-sm">Engine initializing...</p>
      </main>
    </div>
  );
}
