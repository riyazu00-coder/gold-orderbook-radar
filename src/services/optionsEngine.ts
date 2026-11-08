import { LadderRow } from './orderBookEngine';

// Cumulative normal distribution approximation (Abramowitz & Stegun)
function normalCDF(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0.0) {
    const k = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * k *
      (k * (k * (k * (k * b5 + b4) + b3) + b2) + b1);
  } else {
    const k = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * k *
      (k * (k * (k * (k * b5 + b4) + b3) + b2) + b1);
  }
}

export function computeATMStrike(spotPrice: number, strikeInterval: number = 5): number {
  return Math.round(spotPrice / strikeInterval) * strikeInterval;
}

export function computeOptionPrice(
  type: 'call' | 'put',
  spot: number,
  strike: number,
  daysToExpiry: number = 5,
  impliedVol: number = 0.16,
  riskFreeRate: number = 0.04
): number {
  const T = Math.max(0.001, daysToExpiry / 365);
  const sigma = Math.max(0.01, impliedVol);
  const r = riskFreeRate;

  const d1 = (Math.log(spot / strike) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  if (type === 'call') {
    const price = spot * normalCDF(d1) - strike * Math.exp(-r * T) * normalCDF(d2);
    return Math.max(0.05, Number(price.toFixed(2)));
  } else {
    const price = strike * Math.exp(-r * T) * normalCDF(-d2) - spot * normalCDF(-d1);
    return Math.max(0.05, Number(price.toFixed(2)));
  }
}

export function deriveOptionLadder(
  type: 'call' | 'put',
  spotLadder: LadderRow[],
  spotPrice: number,
  strike: number,
  baseOptionPrice: number
): LadderRow[] {
  const delta = type === 'call' ? 0.52 : -0.48;
  const optionTick = 0.10; // Option price step, e.g. 10 cents

  return spotLadder.map((spotRow) => {
    const spotDiff = spotRow.price - spotPrice;
    const optionDiff = spotDiff * delta;
    const optionPrice = Math.max(0.05, Number((baseOptionPrice + optionDiff).toFixed(2)));
    const roundedOptionPrice = Math.round(optionPrice / optionTick) * optionTick;

    // For Calls: spot buyers = call buyers, spot sellers = call sellers
    // For Puts: spot buyers = put sellers (since market goes up, put drops), spot sellers = put buyers
    if (type === 'call') {
      return {
        price: Number(roundedOptionPrice.toFixed(2)),
        bidSize: spotRow.bidSize,
        askSize: spotRow.askSize,
        pulledSize: spotRow.pulledSize,
        isBigBuyer: spotRow.isBigBuyer,
        isBigSeller: spotRow.isBigSeller,
        ratioVsNormal: spotRow.ratioVsNormal,
      };
    } else {
      return {
        price: Number(roundedOptionPrice.toFixed(2)),
        bidSize: spotRow.askSize, // Put buyers correspond to spot sellers
        askSize: spotRow.bidSize,
        pulledSize: spotRow.pulledSize,
        isBigBuyer: spotRow.isBigSeller,
        isBigSeller: spotRow.isBigBuyer,
        ratioVsNormal: spotRow.ratioVsNormal,
      };
    }
  });
}
