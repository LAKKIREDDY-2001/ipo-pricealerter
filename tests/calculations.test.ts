import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCurrentReturnPct,
  calculateGMPEstimate,
  calculateIPOInvestment,
  calculateListingGainPct,
  calculateStockReturn,
  formatCrores,
  formatINR,
  formatPercent,
} from '../src/utils/calculations.ts';

describe('PriceAlerter Financial Calculations', () => {
  it('computes hypothetical GMP listing estimate and gain % accurately', () => {
    const res = calculateGMPEstimate(500, 75);
    assert.equal(res.estimatedListingPrice, 575);
    assert.equal(res.estimatedGainPct, 15);
  });

  it('handles negative GMP without fabricating nulls', () => {
    const res = calculateGMPEstimate(400, -20);
    assert.equal(res.estimatedListingPrice, 380);
    assert.equal(res.estimatedGainPct, -5);
  });

  it('returns null when GMP or upper issue price is unavailable or invalid', () => {
    assert.deepEqual(calculateGMPEstimate(null, 50), {
      estimatedListingPrice: null,
      estimatedGainPct: null,
    });
    assert.deepEqual(calculateGMPEstimate(0, 50), {
      estimatedListingPrice: null,
      estimatedGainPct: null,
    });
    assert.deepEqual(calculateGMPEstimate(500, null), {
      estimatedListingPrice: null,
      estimatedGainPct: null,
    });
  });

  it('computes Listing Gain % strictly against actual listing price vs issue price', () => {
    assert.equal(calculateListingGainPct(645, 842), 30.54);
    assert.equal(calculateListingGainPct(500, 450), -10);
    assert.equal(calculateListingGainPct(0, 500), null);
    assert.equal(calculateListingGainPct(500, null), null);
  });

  it('computes Current Return % accurately', () => {
    assert.equal(calculateCurrentReturnPct(500, 625), 25);
    assert.equal(calculateCurrentReturnPct(500, 400), -20);
    assert.equal(calculateCurrentReturnPct(null, 400), null);
  });

  it('computes IPO lot investment math with floor safety', () => {
    assert.deepEqual(calculateIPOInvestment(435, 34, 2), {
      sharesApplied: 68,
      totalAmount: 29580,
    });
    assert.deepEqual(calculateIPOInvestment(-100, 34, 1.8), {
      sharesApplied: 34,
      totalAmount: 0,
    });
  });

  it('computes Stock Return math cleanly', () => {
    assert.deepEqual(calculateStockReturn(1200, 50, 1320), {
      investment: 60000,
      currentValue: 66000,
      profitLoss: 6000,
      returnPct: 10,
    });
    assert.deepEqual(calculateStockReturn(0, 50, 1320), {
      investment: 0,
      currentValue: 66000,
      profitLoss: 66000,
      returnPct: null,
    });
  });

  it('formats unavailable values explicitly instead of showing dashes or fake zeros', () => {
    assert.equal(formatINR(null), 'Unavailable');
    assert.equal(formatCrores(undefined), 'Unavailable');
    assert.equal(formatPercent(null), 'Unavailable');
    assert.equal(formatPercent(12.345), '+12.35%');
  });
});
