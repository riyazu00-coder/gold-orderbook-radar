# Design Specification: Gold OrderBook & Candlestick Radar (XAU/USD)

- **Date**: 2026-11-08
- **Project Directory**: `/Users/mac/.gemini/antigravity/scratch/gold-orderbook-radar`
- **Reference**: Live Order Book & Footprint Candle UX from `thetradecartel.in`
- **Asset**: XAU/USD (Gold) via Binance PAXG/USDT Real-Time Feeds

---

## 1. Overview & Objective

The goal is to build an institutional-grade, clean, intuitive web-based trading dashboard for **Gold (XAU/USD)** inspired by the UX seen on `thetradecartel.in`. Unlike dense, confusing institutional heatmaps (such as Bookmap), this dashboard presents market depth, order flow, and spoofing/order pulling in an immediate, readable format.

The system operates **100% free with real live exchange data** (using Binance's public WebSocket feeds for PAXG/USDT — physical gold tokens tracking London Gold 1:1), with zero backend server costs and millisecond-level responsiveness.

---

## 2. Key Features & Visual Layout

### 2.1 Header & Metric Strip
- **Navigation Tabs**:
  - `Gold Spot (Main)`
  - `ATM Call`
  - `ATM Put`
  - Additional operational tabs: `Desk`, `Charts`, `Order Book`
- **Real-Time Health Status**:
  - Live pulse indicator (Green dot, latency in ms)
  - Last minute order flow stats: `Bought` (green lots), `Sold` (red lots), `Pulled` (yellow lots)
- **Top Summary Cards**:
  - **Main Instrument Card**: Current Gold Spot Price, 24h change, session high/low.
  - **Nearest Big Buyers**: Price level range, distance below spot in points ($), total resting lots.
  - **Nearest Big Sellers**: Price level range, distance above spot in points ($), total resting lots.

### 2.2 Center Chart Area: Micro-Footprint Candlestick & Order Book Ladder
- **Candlestick Footprint (Left Side)**:
  - 1-minute (and selectable 3m/5m) candlesticks.
  - **Live Dot Influx**: As market trades execute, individual price levels within the forming candle fill from the left side:
    - 🟢 **Green dots/segments**: Aggressor buy orders executed at ask (`bought`).
    - 🔴 **Red/orange dots/segments**: Aggressor sell orders executed at bid (`sold`).
- **Vertical Price Ladder (Center Column)**:
  - High-density price ticks formatted for Gold (e.g., $0.50 or $1.00 step intervals).
  - Dynamic viewport centering on the active market price.
- **Order Book Depth & Pull Bars (Right Side of Ladder)**:
  - 🟢 **Green horizontal bars**: Buyers waiting (limit bids resting on the book).
  - 🟠 **Orange horizontal bars**: Sellers waiting (limit asks resting on the book).
  - 🟡 **Yellow horizontal bars (Pulled / Cancelled)**: Orders that were resting at a price level and pulled/cancelled before the price reached them (spoofing detection).
  - **"Big Buyers" / "Big Sellers" Flags**: Distinct visual badges highlighting levels where resting volume exceeds threshold multiples (e.g. 3x normal liquidity).

### 2.3 Right-Side Analytics Panel
- **Forming Candle Live Card**:
  - Seconds elapsed into the current minute (e.g., `45s into the minute`).
  - Running counts of: `Pulled lots`, `Sold lots`, `Bought lots`.
- **Big Orders Right Now Table**:
  - List of detected institutional-sized orders:
    - Side (Big Buyer / Big Seller)
    - Strike / Price level
    - Lot quantity
    - Multiplier vs average (e.g. `3.8x normal`)
    - Waiting duration (e.g. `waiting 28s`)
- **Level Reaction Gauge ("Did Price Turn or Break?")**:
  - Donut / percentage meter showing historical outcome when price tested identified major liquidity levels:
    - **Turned %** (Price respected the level and reversed)
    - **Broke %** (Price sliced through the liquidity level)

### 2.4 ATM Call & ATM Put Option Simulation Engine
- For Gold Spot, the system dynamically calculates the At-The-Money (ATM) strike based on current spot price rounded to nearest $5/$10 boundary.
- Derives Black-Scholes theoretical option prices and implied order book liquidity directly from the live spot depth.
- Allows switching seamlessly between Main Gold, ATM Call, and ATM Put views with the exact same visual structure.

---

## 3. System Architecture & Tech Stack

- **Framework**: React with Vite & TypeScript for speed, type safety, and fast HMR.
- **Styling**: Tailwind CSS with custom institutional dark mode color palette (matches `#0d1117`, `#161b22`, `#238636`, `#da3633`, `#e3b341`).
- **Rendering**: HTML5 Canvas + High-DPI optimized SVG for micro-order footprint dots and ladder bars (guaranteeing 60fps rendering without DOM bottlenecks).
- **Icons**: Lucide-React.

---

## 4. Algorithms & Logic

### 4.1 Order Pull / Cancellation Detection
1. Maintain resting depth map `Map<Price, Size>` for both bid and ask sides.
2. When receiving an updated depth snapshot/delta:
   - For a price level $P$, calculate $\Delta S = S_{previous} - S_{current}$.
   - Check trade tape within the same interval: did market orders consume $V_{trade}$ at price $P$?
   - If $\Delta S > 0$ and $\Delta S > V_{trade}$, the difference $S_{pulled} = \Delta S - V_{trade}$ is registered as a **Pulled / Cancelled Order**.
3. Accumulate $S_{pulled}$ at price $P$ to render the yellow bar.

### 4.2 Footprint Dot Influx
1. Each 1-minute candle contains a discrete price bin array.
2. For each bin:
   - Store `buyVol` and `sellVol`.
   - Render horizontal rows of green dots (proportional to `buyVol`) and red dots (proportional to `sellVol`) within the candle bounds.

### 4.3 Level Reaction Tracker ("Turn vs Break")
1. Tag high-volume levels as "Significant Levels" if size $> 3.5 \times \text{median depth}$.
2. When current price approaches within $1.00 of the level:
   - If price bounces off by $\ge \$3.00$, mark as `Turned`.
   - If price pushes through the level by $\ge \$3.00$, mark as `Broke`.
3. Update dynamic % meter in the right panel.

---

## 5. Verification & Testing Plan

1. **WebSocket Connectivity Test**:
   - Verify connection to Binance `paxgusdt` depth, aggTrade, and kline streams.
   - Verify auto-reconnect on simulated network interruption.
2. **Order Flow & Ladder Validation**:
   - Inspect live order book updates; verify Bids (green) and Asks (orange) match actual exchange DOM.
   - Test cancellation detection by observing order pulls before price impact (yellow bars appear).
   - Test footprint dot filling: verify market buys trigger green dots and market sells trigger red dots.
3. **ATM Options Projection**:
   - Verify ATM Call and ATM Put tabs display corresponding strikes and synthetic order books.
4. **UI Performance**:
   - Ensure constant 60fps rendering during market volatility without memory leaks.
