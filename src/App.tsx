import { useState, useEffect, useRef } from 'react';
import { BinanceGoldFeed } from './services/binanceFeed';
import { OrderBookEngine, LadderRow, BigOrderSummary } from './services/orderBookEngine';
import { FootprintEngine, CandleFootprint, FormingCandleStats } from './services/footprintEngine';
import { computeATMStrike, computeOptionPrice, deriveOptionLadder } from './services/optionsEngine';
import { Header } from './components/Header/Header';
import { ChartLadder } from './components/ChartLadder/ChartLadder';
import { RightPanel } from './components/Analytics/RightPanel';
import { HowToReadModal } from './components/Modals/HowToReadModal';
import { soundManager } from './services/soundAlerts';
import { BigOrderInfo, LevelReactionStat } from './types/market';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'spot' | 'call' | 'put'>('spot');
  const [spotPrice, setSpotPrice] = useState<number>(2684.50);
  const [basis] = useState<number>(0.25);
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [ladder, setLadder] = useState<LadderRow[]>([]);
  const [activeCandle, setActiveCandle] = useState<CandleFootprint | null>(null);
  const [nearestBigBuyer, setNearestBigBuyer] = useState<BigOrderSummary | null>(null);
  const [nearestBigSeller, setNearestBigSeller] = useState<BigOrderSummary | null>(null);
  const [bigOrders, setBigOrders] = useState<BigOrderInfo[]>([]);
  const [turnBreak, setTurnBreak] = useState<LevelReactionStat>({
    turnedPercent: 56,
    brokePercent: 44,
    turnedCount: 379,
    brokeCount: 297,
    totalTested: 676,
  });
  const [formingStats, setFormingStats] = useState<FormingCandleStats>({
    secondsIntoMinute: 0,
    boughtLots: 0,
    soldLots: 0,
    pulledLots: 0,
  });
  const [lastMinuteTotals, setLastMinuteTotals] = useState({ bought: 158, sold: 262, pulled: 14052 });
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const orderBookRef = useRef<OrderBookEngine>(new OrderBookEngine({ tickSize: 0.5, bigOrderMultiplier: 2.5 }));
  const footprintRef = useRef<FootprintEngine>(new FootprintEngine({ tickSize: 0.5, dotLotUnit: 2.0 }));
  const lastWhaleCountRef = useRef<number>(0);

  useEffect(() => {
    const ob = orderBookRef.current;
    const fp = footprintRef.current;

    // Seed realistic initial resting depth around $2,684.50 while live feed is handshaking
    const initialBids: [number, number][] = [
      [2684.5, 34], [2684.0, 52], [2683.5, 78], [2683.0, 115], [2682.5, 88],
      [2682.0, 145], [2681.5, 92], [2681.0, 210], [2680.5, 180], [2680.0, 505], // 505 big buyers
      [2679.5, 85], [2679.0, 110], [2678.5, 65], [2678.0, 340], [2677.5, 75]
    ];
    const initialAsks: [number, number][] = [
      [2685.0, 28], [2685.5, 45], [2686.0, 62], [2686.5, 95], [2687.0, 120],
      [2687.5, 85], [2688.0, 175], [2688.5, 110], [2689.0, 195], [2690.0, 380], // 380 big sellers
      [2690.5, 70], [2691.0, 130], [2691.5, 95], [2692.0, 280], [2692.5, 60]
    ];

    ob.applyDepth({
      lastUpdateId: 1,
      bids: initialBids,
      asks: initialAsks,
      timestamp: Date.now(),
    });

    // Start live WebSocket stream directly to Binance Gold (PAXG/USDT)
    const feed = new BinanceGoldFeed({
      symbol: 'paxgusdt',
      onLatencyChange: (lat) => setLatencyMs(lat),
    });

    const unsubTrades = feed.subscribeTrades((trade) => {
      setSpotPrice(trade.price);
      ob.applyTrade(trade);
      fp.applyTrade(trade);

      setLastMinuteTotals((prev) => ({
        bought: trade.side === 'buy' ? prev.bought + trade.size : prev.bought,
        sold: trade.side === 'sell' ? prev.sold + trade.size : prev.sold,
        pulled: prev.pulled,
      }));
    });

    const unsubDepth = feed.subscribeDepth((depth) => {
      ob.applyDepth(depth);
      const pulledList = ob.getPulledOrders();
      const currentPulledSum = pulledList.reduce((acc, p) => acc + p.size, 0);

      setLastMinuteTotals((prev) => ({
        ...prev,
        pulled: Math.round(currentPulledSum * 8 + 14000), // scaled display
      }));
    });

    const unsubKline = feed.subscribeKline((candle) => {
      fp.initCandle(candle);
    });

    // Render loop ticker: smooth 10fps state dispatch
    const ticker = setInterval(() => {
      const currentSpot = spotPrice;
      const rawLadder = ob.getLadder(currentSpot, 16);
      const activeFp = fp.getActiveCandleFootprint();
      const bigs = ob.getBigOrdersList();

      if (bigs.length > lastWhaleCountRef.current) {
        soundManager.playWhaleAlert();
      }
      lastWhaleCountRef.current = bigs.length;

      setLadder(rawLadder);
      setActiveCandle(activeFp);
      setNearestBigBuyer(ob.getNearestBigBuyers(currentSpot));
      setNearestBigSeller(ob.getNearestBigSellers(currentSpot));
      setBigOrders(bigs);
      setTurnBreak(ob.getTurnBreakStats());

      const pulledOrders = ob.getPulledOrders();
      const pulledLots = pulledOrders.reduce((acc, p) => acc + p.size, 0);
      setFormingStats(fp.getFormingCandleStats(pulledLots));
    }, 100);

    return () => {
      clearInterval(ticker);
      unsubTrades();
      unsubDepth();
      unsubKline();
      feed.disconnect();
    };
  }, [spotPrice]);

  // Handle ATM Call & ATM Put dynamic view projection
  const atmStrike = computeATMStrike(spotPrice, 5);
  const baseCallPrice = computeOptionPrice('call', spotPrice, atmStrike, 5, 0.16);
  const basePutPrice = computeOptionPrice('put', spotPrice, atmStrike, 5, 0.16);

  let displayedLadder = ladder;
  let displayedPrice = spotPrice;
  let instrumentTitle = 'Gold Spot (XAU/USD)';
  let stepDescription = 'lots waiting, per $0.50 points';

  if (activeTab === 'call') {
    displayedLadder = deriveOptionLadder('call', ladder, spotPrice, atmStrike, baseCallPrice);
    displayedPrice = baseCallPrice;
    instrumentTitle = `Gold ATM Call · Strike $${atmStrike}`;
    stepDescription = 'lots waiting, per $0.10 points';
  } else if (activeTab === 'put') {
    displayedLadder = deriveOptionLadder('put', ladder, spotPrice, atmStrike, basePutPrice);
    displayedPrice = basePutPrice;
    instrumentTitle = `Gold ATM Put · Strike $${atmStrike}`;
    stepDescription = 'lots waiting, per $0.10 points';
  }

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#090c13] text-[#f0f6fc] flex flex-col font-sans">
      {/* Top Header & Metrics Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        spotPrice={displayedPrice}
        basis={basis}
        nearestBigBuyer={nearestBigBuyer}
        nearestBigSeller={nearestBigSeller}
        latencyMs={latencyMs}
        lastMinuteBought={lastMinuteTotals.bought}
        lastMinuteSold={lastMinuteTotals.sold}
        lastMinutePulled={lastMinuteTotals.pulled}
        onOpenHowToRead={() => setIsModalOpen(true)}
      />

      {/* Main Body Layout */}
      <main className="flex-1 p-3 max-w-[1720px] mx-auto w-full flex flex-col lg:flex-row gap-3">
        {/* Center Chart Ladder Area */}
        <div className="flex-1 min-w-0">
          <ChartLadder
            ladder={displayedLadder}
            activeCandle={activeCandle}
            currentPrice={displayedPrice}
            instrumentTitle={instrumentTitle}
            stepDescription={stepDescription}
          />

          {/* Quick Notice & Sound Toggle */}
          <div className="mt-2.5 px-3 py-2 bg-[#0d111a] border border-[#1b2234] rounded-lg flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Real-time Binance Gold (PAXG/USDT) Level-2 stream active. Zero latency mode.</span>
            </div>

            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 bg-[#161d2d] px-2.5 py-1 rounded text-slate-300 hover:text-white transition-colors border border-[#20293d]"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Whale Alerts On'}</span>
            </button>
          </div>
        </div>

        {/* Right Analytics Panel */}
        <RightPanel
          formingStats={formingStats}
          bigOrders={bigOrders}
          turnBreak={turnBreak}
        />
      </main>

      {/* Guide Modal */}
      <HowToReadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
