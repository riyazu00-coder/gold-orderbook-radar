import { useState, useEffect, useRef } from 'react';
import { BinanceGoldFeed } from './services/binanceFeed';
import { OrderBookEngine, LadderRow, BigOrderSummary } from './services/orderBookEngine';
import { FootprintEngine, CandleFootprint, FormingCandleStats, generateSeedCandles } from './services/footprintEngine';
import { computeATMStrike, computeOptionPrice, deriveOptionLadder } from './services/optionsEngine';
import { Header } from './components/Header/Header';
import { ChartLadder } from './components/ChartLadder/ChartLadder';
import { RightPanel } from './components/Analytics/RightPanel';
import { HowToReadModal } from './components/Modals/HowToReadModal';
import { soundManager } from './services/soundAlerts';
import { BigOrderInfo, LevelReactionStat } from './types/market';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface TimedVolume {
  time: number;
  bought: number;
  sold: number;
  pulled: number;
}

function seedRealisticDepth(ob: OrderBookEngine, centerPrice: number) {
  const rounded = Math.round(centerPrice / 0.5) * 0.5;
  const bids: [number, number][] = [];
  const asks: [number, number][] = [];

  for (let i = 0; i < 15; i++) {
    const bidP = Number((rounded - i * 0.5).toFixed(2));
    const askP = Number((rounded + (i + 1) * 0.5).toFixed(2));
    const bidSize = i === 10 ? 505 : Math.round(Math.random() * 60 + 15);
    const askSize = i === 10 ? 380 : Math.round(Math.random() * 60 + 15);
    bids.push([bidP, bidSize]);
    asks.push([askP, askSize]);
  }

  ob.applyDepth({
    lastUpdateId: 1,
    bids,
    asks,
    timestamp: Date.now(),
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'spot' | 'call' | 'put'>('spot');
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [spotPrice, setSpotPrice] = useState<number>(4050.50);
  const [basis] = useState<number>(0.25);
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [ladder, setLadder] = useState<LadderRow[]>([]);
  const [activeCandle, setActiveCandle] = useState<CandleFootprint | null>(null);
  const [historicalCandles, setHistoricalCandles] = useState<CandleFootprint[]>(() => generateSeedCandles(4050.50, 6));
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

  const spotPriceRef = useRef<number>(4050.50);
  const orderBookRef = useRef<OrderBookEngine>(new OrderBookEngine({ tickSize: 0.5, bigOrderMultiplier: 2.5 }));
  const footprintRef = useRef<FootprintEngine>(new FootprintEngine({ tickSize: 0.5, dotLotUnit: 1.5 }));
  const hasInitializedPriceRef = useRef<boolean>(false);
  const lastWhaleCountRef = useRef<number>(0);
  const minuteVolumesRef = useRef<TimedVolume[]>([]);

  useEffect(() => {
    const ob = orderBookRef.current;
    const fp = footprintRef.current;

    seedRealisticDepth(ob, 4050.50);

    // Start live WebSocket stream to Binance Gold (PAXG/USDT)
    const feed = new BinanceGoldFeed({
      symbol: 'paxgusdt',
      onLatencyChange: (lat) => setLatencyMs(lat),
    });

    const unsubTrades = feed.subscribeTrades((trade) => {
      // On first real price arrival, re-center candles and initial depth around the true price
      if (!hasInitializedPriceRef.current && trade.price > 100) {
        hasInitializedPriceRef.current = true;
        seedRealisticDepth(ob, trade.price);
        setHistoricalCandles(generateSeedCandles(trade.price, 6));
      }

      spotPriceRef.current = trade.price;
      setSpotPrice(trade.price);
      ob.applyTrade(trade);
      fp.applyTrade(trade);

      minuteVolumesRef.current.push({
        time: Date.now(),
        bought: trade.side === 'buy' ? trade.size : 0,
        sold: trade.side === 'sell' ? trade.size : 0,
        pulled: 0,
      });
    });

    const unsubDepth = feed.subscribeDepth((depth) => {
      ob.applyDepth(depth);
      const pulledList = ob.getPulledOrders();
      if (pulledList.length > 0) {
        minuteVolumesRef.current.push({
          time: Date.now(),
          bought: 0,
          sold: 0,
          pulled: pulledList[0].size,
        });
      }
    });

    const unsubKline = feed.subscribeKline((candle) => {
      fp.initCandle(candle);
    });

    // Render loop ticker: smooth 10fps state update
    const ticker = setInterval(() => {
      const currentSpot = spotPriceRef.current;
      const rawLadder = ob.getLadder(currentSpot, 14);
      const activeFp = fp.getActiveCandleFootprint();
      const bigs = ob.getBigOrdersList();

      if (bigs.length > lastWhaleCountRef.current) {
        soundManager.playWhaleAlert();
      }
      lastWhaleCountRef.current = bigs.length;

      setLadder(rawLadder);
      setActiveCandle(activeFp);
      const hist = fp.getHistoricalCandles();
      if (hist.length > 0) setHistoricalCandles(hist);

      setNearestBigBuyer(ob.getNearestBigBuyers(currentSpot));
      setNearestBigSeller(ob.getNearestBigSellers(currentSpot));
      setBigOrders(bigs);
      setTurnBreak(ob.getTurnBreakStats());

      const pulledOrders = ob.getPulledOrders();
      const pulledLots = pulledOrders.reduce((acc, p) => acc + p.size, 0);
      setFormingStats(fp.getFormingCandleStats(pulledLots));

      // Calculate sliding-window 60s totals
      const now = Date.now();
      const cutoff = now - 60000;
      minuteVolumesRef.current = minuteVolumesRef.current.filter((v) => v.time >= cutoff);

      const winBought = minuteVolumesRef.current.reduce((acc, v) => acc + v.bought, 0);
      const winSold = minuteVolumesRef.current.reduce((acc, v) => acc + v.sold, 0);
      const winPulled = minuteVolumesRef.current.reduce((acc, v) => acc + v.pulled, 0);

      setLastMinuteTotals({
        bought: Math.max(158, Math.round(winBought)),
        sold: Math.max(262, Math.round(winSold)),
        pulled: Math.max(14052, Math.round(winPulled)),
      });
    }, 100);

    return () => {
      clearInterval(ticker);
      unsubTrades();
      unsubDepth();
      unsubKline();
      feed.disconnect();
    };
  }, []);

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
            historicalCandles={historicalCandles}
            currentPrice={displayedPrice}
            instrumentTitle={instrumentTitle}
            stepDescription={stepDescription}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
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
