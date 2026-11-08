# Gold OrderBook & Candlestick Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-cost, high-performance real-time Gold (XAU/USD) order book and candlestick trading dashboard replicating the tradecartel.in UX with live Binance WebSocket data, footprint dot candles, and spoofing/pulled order tracking.

**Architecture:** A standalone React + Vite + TypeScript application running client-side. Directly connects to Binance public WebSockets for PAXG/USDT (Gold), computes real-time order book diffs to spot order cancellations (pulled orders), models synthetic ATM Call and ATM Put options, and renders 60fps canvas/SVG footprint candles with filling green/red dots and price depth bars.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-08-gold-orderbook-radar-design.md`

## Global Constraints
- Target directory: `/Users/mac/.gemini/antigravity/scratch/gold-orderbook-radar`
- Zero subscription cost: uses Binance public free WebSocket feeds (`wss://stream.binance.com:9443/ws`)
- Real-time performance: handles 100ms L2 updates without UI lock or memory leaks
- Exact visual matching with video: Green (buyers/bought), Orange/Red (sellers/sold), Yellow (pulled/cancelled), center price ladder, right-side analytics panel

## Review Focus
1. WebSocket disconnects/reconnects during high market volume — must automatically resume and resync order book without stale state.
2. Rapid price changes shifting viewport — center price ladder must smoothly track current price without jitter.
3. Order pull calculation accuracy — ensure executed trades are not falsely categorized as pulled/cancelled orders.
4. Footprint dot rendering overhead — high volume bars must not drop frame rate below 60fps.
5. ATM Options strike calculation — strike boundary changes as spot price moves must recalculate smoothly.

---

### Task 1: Project Scaffolding & Setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/index.css`, `src/App.tsx`, `src/main.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: Base React + Vite + Tailwind application structure with Vitest configured.

- [ ] **Step 1: Write test to verify app mounts successfully**
- [ ] **Step 2: Scaffold Vite project and dependencies (`npm install`)**
- [ ] **Step 3: Configure Tailwind CSS with tradecartel dark theme colors**
- [ ] **Step 4: Run test to verify scaffolding passes**
- [ ] **Step 5: Commit scaffolding**

---

### Task 2: Real-Time Binance Gold WebSocket Feed Engine

**Files:**
- Create: `src/services/binanceFeed.ts`
- Create: `src/types/market.ts`
- Test: `src/services/binanceFeed.test.ts`

**Interfaces:**
- Consumes: Binance public WebSocket streams (`paxgusdt@depth@100ms`, `paxgusdt@aggTrade`, `paxgusdt@kline_1m`)
- Produces: `BinanceGoldFeed` class emitting normalized depth snapshots, trade tape events, and 1m candle updates with auto-reconnect.

- [ ] **Step 1: Write unit tests for feed parser, event handlers, and reconnection logic**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement `BinanceGoldFeed` in `src/services/binanceFeed.ts`**
- [ ] **Step 4: Run unit tests and verify pass**
- [ ] **Step 5: Commit feed engine**

---

### Task 3: Order Book Diff & Pulled/Cancelled Order Engine

**Files:**
- Create: `src/services/orderBookEngine.ts`
- Test: `src/services/orderBookEngine.test.ts`

**Interfaces:**
- Consumes: Bids/Asks depth updates and executed trades from Task 2
- Produces: `OrderBookEngine` that maintains resting liquidity per price step, calculates delta size minus trade volume to detect pulled/cancelled orders (yellow bars), and identifies big buyer/seller levels.

- [ ] **Step 1: Write unit tests for order book state management and pulled order detection**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement `OrderBookEngine` in `src/services/orderBookEngine.ts`**
- [ ] **Step 4: Run unit tests and verify pass**
- [ ] **Step 5: Commit order book engine**

---

### Task 4: Footprint Candlestick & Influx Dot Engine

**Files:**
- Create: `src/services/footprintEngine.ts`
- Test: `src/services/footprintEngine.test.ts`

**Interfaces:**
- Consumes: Kline updates and aggregate trade flow from Task 2
- Produces: `FootprintEngine` tracking price bins per candle with discrete `buyVolume` (green dots) and `sellVolume` (red dots) filling from the left.

- [ ] **Step 1: Write unit tests for footprint price binning and dot allocation**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement `FootprintEngine` in `src/services/footprintEngine.ts`**
- [ ] **Step 4: Run unit tests and verify pass**
- [ ] **Step 5: Commit footprint engine**

---

### Task 5: Dynamic Synthetic ATM Call & Put Options Engine

**Files:**
- Create: `src/services/optionsEngine.ts`
- Test: `src/services/optionsEngine.test.ts`

**Interfaces:**
- Consumes: Current Gold spot price and order book depth from Task 3
- Produces: `computeATMOptions(spotPrice, depth)` returning ATM Call & ATM Put strikes, theoretical option prices, and mirrored option order books.

- [ ] **Step 1: Write unit tests for ATM strike calculation and option depth projection**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement `optionsEngine.ts`**
- [ ] **Step 4: Run unit tests and verify pass**
- [ ] **Step 5: Commit options engine**

---

### Task 6: Chart & Order Book Ladder Component

**Files:**
- Create: `src/components/ChartLadder/ChartLadder.tsx`
- Create: `src/components/ChartLadder/FootprintCandle.tsx`
- Create: `src/components/ChartLadder/OrderBookLadder.tsx`
- Test: `src/components/ChartLadder/ChartLadder.test.tsx`

**Interfaces:**
- Consumes: Data hooks from Tasks 2, 3, 4, 5
- Produces: Center visualization combining interactive candlestick footprint (with filling green/red dots) and vertically aligned price ladder with green/orange/yellow depth bars and "Big Buyers/Sellers" badges.

- [ ] **Step 1: Write component tests for rendering candle footprint dots and depth bars**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement `FootprintCandle.tsx`, `OrderBookLadder.tsx`, and `ChartLadder.tsx`**
- [ ] **Step 4: Run component tests and verify pass**
- [ ] **Step 5: Commit chart and ladder components**

---

### Task 7: Header Metric Strip & Right-Side Analytics Panel

**Files:**
- Create: `src/components/Header/Header.tsx`
- Create: `src/components/Analytics/RightPanel.tsx`
- Create: `src/components/Analytics/BigOrdersTable.tsx`
- Create: `src/components/Analytics/TurnBreakGauge.tsx`
- Test: `src/components/Analytics/RightPanel.test.tsx`

**Interfaces:**
- Consumes: Market analytics, nearest big orders, and forming candle stats
- Produces:
  - Top header with tabs (Gold Spot, ATM Call, ATM Put), live pulse, Nearest Big Buyers & Sellers cards
  - Right panel with Forming Candle seconds and lot totals, Big Orders Right Now list, and Turned vs Broke gauge chart.

- [ ] **Step 1: Write component tests for header metrics and right panel widgets**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement `Header.tsx`, `RightPanel.tsx`, `BigOrdersTable.tsx`, and `TurnBreakGauge.tsx`**
- [ ] **Step 4: Run component tests and verify pass**
- [ ] **Step 5: Commit header and analytics panel**

---

### Task 8: End-to-End Integration, Audio Alerts & Final Verification

**Files:**
- Modify: `src/App.tsx`
- Create: `src/services/soundAlerts.ts`
- Create: `src/components/Modals/HowToReadModal.tsx`
- Test: `src/App.e2e.test.tsx`

**Interfaces:**
- Produces: Fully integrated application with tab switching, sound alerts for whale orders, "How to read this page" modal, and live WebSocket verification.

- [ ] **Step 1: Write integration test verifying full UI and live tab switching**
- [ ] **Step 2: Connect all state engines to `App.tsx` with audio alerts and modal guide**
- [ ] **Step 3: Run full test suite and build verification (`npm run build`)**
- [ ] **Step 4: Commit complete application**
