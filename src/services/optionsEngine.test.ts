import { describe, it, expect } from 'vitest';
import { computeATMStrike, computeOptionPrice, deriveOptionLadder } from './optionsEngine';

describe('optionsEngine', () => {
  it('correctly rounds spot price to nearest ATM strike', () => {
    expect(computeATMStrike(2684.2, 5)).toBe(2685.0);
    expect(computeATMStrike(2681.8, 5)).toBe(2680.0);
    expect(computeATMStrike(2682.5, 5)).toBe(2685.0);
  });

  it('computes sensible Black-Scholes ATM option prices', () => {
    const spot = 2680.0;
    const strike = 2680.0;
    const callPremium = computeOptionPrice('call', spot, strike, 5, 0.16);
    const putPremium = computeOptionPrice('put', spot, strike, 5, 0.16);

    // Call and Put ATM premiums with 0 risk-free rate should be positive and roughly equal
    expect(callPremium).toBeGreaterThan(5.0);
    expect(putPremium).toBeGreaterThan(5.0);
    expect(Math.abs(callPremium - putPremium)).toBeLessThan(2.0);
  });

  it('derives option ladder from spot depth', () => {
    const spotLadder = [
      { price: 2681.0, bidSize: 0, askSize: 20, pulledSize: 0, isBigBuyer: false, isBigSeller: true, ratioVsNormal: 2.0 },
      { price: 2680.0, bidSize: 30, askSize: 0, pulledSize: 5, isBigBuyer: true, isBigSeller: false, ratioVsNormal: 3.0 },
    ];

    const optionLadder = deriveOptionLadder('call', spotLadder, 2680.0, 2680.0, 25.0);
    expect(optionLadder.length).toBeGreaterThan(0);
    expect(optionLadder[0].price).toBeGreaterThan(0);
  });
});

  it('ensures Put ladder is sorted descending from highest price to lowest price', () => {
    const spotLadder = [
      { price: 2685.0, bidSize: 0, askSize: 50, pulledSize: 0, isBigBuyer: false, isBigSeller: true, ratioVsNormal: 3.0 },
      { price: 2684.5, bidSize: 0, askSize: 20, pulledSize: 0, isBigBuyer: false, isBigSeller: false, ratioVsNormal: 1.0 },
      { price: 2684.0, bidSize: 40, askSize: 0, pulledSize: 5, isBigBuyer: true, isBigSeller: false, ratioVsNormal: 2.5 },
    ];

    const putLadder = deriveOptionLadder('put', spotLadder, 2684.0, 2685.0, 15.0);
    // Highest price must be at index 0, lowest at the end
    for (let i = 0; i < putLadder.length - 1; i++) {
      expect(putLadder[i].price).toBeGreaterThanOrEqual(putLadder[i + 1].price);
    }
  });
