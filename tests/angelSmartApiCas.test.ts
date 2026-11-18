import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANGEL_CAS_EFFECTIVE_DATE,
  ANGEL_CAS_DURATION_MINUTES,
  ANGEL_CAS_START_TIME,
  ANGEL_CAS_END_TIME,
  ANGEL_CAS_PRICE_BAND_PCT,
  ANGEL_CAS_FO_CLOSE_TIME,
  ANGEL_CAS_OFFICIAL_CIRCULARS,
  ANGEL_CAS_PHASES,
  getAngelCasPhase,
  getAngelCasPhases,
  getAngelAutoSquareOffSchedules,
  isAngelCasScrip,
  validateAngelCasOrder,
  calculateAngelCasReferencePrice,
  discoverAngelCasEquilibriumPrice,
  getAngelCasStatus,
} from '../server/providers/angelSmartApiProvider';

test('Angel One SmartAPI Closing Auction Session (CAS) Suite Provider', async (t) => {
  await t.test('catalog constants conform to official SEBI and SmartAPI documentation', () => {
    assert.equal(ANGEL_CAS_EFFECTIVE_DATE, '2026-08-03');
    assert.equal(ANGEL_CAS_DURATION_MINUTES, 20);
    assert.equal(ANGEL_CAS_START_TIME, '15:15');
    assert.equal(ANGEL_CAS_END_TIME, '15:35');
    assert.equal(ANGEL_CAS_PRICE_BAND_PCT, 3.0);
    assert.equal(ANGEL_CAS_FO_CLOSE_TIME, '15:40');

    assert.ok(ANGEL_CAS_OFFICIAL_CIRCULARS.length >= 4);
    const sebi = ANGEL_CAS_OFFICIAL_CIRCULARS.find((c) => c.authority === 'SEBI');
    assert.ok(sebi);
    assert.equal(sebi.date, '16 Jan 2026');

    const nse = ANGEL_CAS_OFFICIAL_CIRCULARS.find((c) => c.authority === 'NSE');
    assert.ok(nse);
    assert.ok(nse.title.includes('CMTR74466'));

    const bse = ANGEL_CAS_OFFICIAL_CIRCULARS.find((c) => c.authority === 'BSE');
    assert.ok(bse);
    assert.ok(bse.title.includes('20260610-41'));
  });

  await t.test('accurately classifies all 6 CAS phases and market states across timestamps', () => {
    // 1. Continuous Trading (10:30 am)
    const pContinuous = getAngelCasPhase('10:30');
    assert.equal(pContinuous.phase, 'CONTINUOUS_TRADING');
    assert.equal(pContinuous.isOrderEntryAllowed, true);
    assert.equal(pContinuous.priceType, 'LTP');

    // 2. Phase 1: Transition to CAS (3:17 pm)
    const pTransition = getAngelCasPhase('15:17');
    assert.equal(pTransition.phase, 'TRANSITION_TO_CAS');
    assert.equal(pTransition.timeRange, '3.15 - 3.20 pm');
    assert.equal(pTransition.isOrderEntryAllowed, false);
    assert.equal(pTransition.priceType, 'REFERENCE_LIMIT_PRICE');

    // 3. Phase 2: Order Entry and Modification (3:22 pm)
    const pEntry = getAngelCasPhase('15:22');
    assert.equal(pEntry.phase, 'ORDER_ENTRY_AND_MODIFICATION');
    assert.equal(pEntry.timeRange, '3.20 - 3.25 pm');
    assert.equal(pEntry.isOrderEntryAllowed, true);
    assert.equal(pEntry.canModifyMarketOrders, true);
    assert.equal(pEntry.isStopLossAllowed, false);

    // 4. Phase 3: Limit Orders Only (3:27 pm)
    const pLimit = getAngelCasPhase('15:27');
    assert.equal(pLimit.phase, 'LIMIT_ORDERS_ONLY');
    assert.equal(pLimit.timeRange, '3.25 - 3.30 pm');
    assert.equal(pLimit.isOrderEntryAllowed, true);
    assert.equal(pLimit.canModifyMarketOrders, false);
    assert.deepEqual(pLimit.allowedOrderTypes, ['LIMIT']);

    // 5. Phase 4: Order Matching (3:32 pm)
    const pMatching = getAngelCasPhase('15:32');
    assert.equal(pMatching.phase, 'ORDER_MATCHING');
    assert.equal(pMatching.timeRange, '3.30 - 3.35 pm');
    assert.equal(pMatching.isOrderEntryAllowed, false);
    assert.equal(pMatching.priceType, 'EQUILIBRIUM_PRICE');

    // 6. Phase 5: Buffer Period with F&O active (3:38 pm)
    const pBufferFoActive = getAngelCasPhase('15:38');
    assert.equal(pBufferFoActive.phase, 'BUFFER_PERIOD');
    assert.equal(pBufferFoActive.timeRange, '3.35 - 3.50 pm');
    assert.equal(pBufferFoActive.isFoTradingActive, true);

    // 7. Phase 5: Buffer Period after F&O close (3:45 pm)
    const pBufferFoClosed = getAngelCasPhase('15:45');
    assert.equal(pBufferFoClosed.phase, 'BUFFER_PERIOD');
    assert.equal(pBufferFoClosed.isFoTradingActive, false);

    // 8. Phase 6: Post-closing Session (3:55 pm)
    const pPostClosing = getAngelCasPhase('15:55');
    assert.equal(pPostClosing.phase, 'POST_CLOSING_SESSION');
    assert.equal(pPostClosing.timeRange, '3.50 - 4.00 pm');
    assert.equal(pPostClosing.isOrderEntryAllowed, true);
    assert.equal(pPostClosing.priceType, 'EQUILIBRIUM_PRICE');

    // 9. Market Closed (4:15 pm)
    const pClosed = getAngelCasPhase('16:15');
    assert.equal(pClosed.phase, 'MARKET_CLOSED');
    assert.equal(pClosed.isOrderEntryAllowed, false);
  });

  await t.test('identifies CAS-eligible F&O scrips reliably', () => {
    assert.equal(isAngelCasScrip('RELIANCE-EQ'), true);
    assert.equal(isAngelCasScrip('TCS-EQ'), true);
    assert.equal(isAngelCasScrip('INFY'), true);
    assert.equal(isAngelCasScrip('HDFCBANK'), true);
    assert.equal(isAngelCasScrip('NIFTY'), true);
    assert.equal(isAngelCasScrip('SBIN'), true);
    assert.equal(isAngelCasScrip('TATAMOTORS'), true);

    // Explicit flag
    assert.equal(isAngelCasScrip('SOMEUNKNOWN', true), true);

    // Non-F&O micro-cap stock
    assert.equal(isAngelCasScrip('PENNYSTOCK-SM'), false);
  });

  await t.test('calculates Reference Price (VWAP 3:00-3:15 pm) and ±3% price band accurately', () => {
    const trades = [
      { price: 100.0, volume: 1000 },
      { price: 102.0, volume: 3000 },
      { price: 104.0, volume: 1000 },
    ];
    // Total value: (100*1000) + (102*3000) + (104*1000) = 100000 + 306000 + 104000 = 510000
    // Total volume: 5000
    // VWAP: 510000 / 5000 = 102.0
    const result = calculateAngelCasReferencePrice({
      symbol: 'RELIANCE',
      trades,
    });

    assert.equal(result.referencePrice, 102.0);
    assert.equal(result.calculationMethod, 'VWAP_1500_1515');
    assert.equal(result.priceBandLow, 98.95); // 102 * 0.97 = 98.94 -> rounded to 98.95
    assert.equal(result.priceBandHigh, 105.05); // 102 * 1.03 = 105.06 -> rounded to 105.05
    assert.equal(result.totalVolume, 5000);
    assert.equal(result.tradesCount, 3);
  });

  await t.test('falls back to LTP or previous close if no trades occurred between 3:00-3:15 pm', () => {
    const fallbackResult = calculateAngelCasReferencePrice({
      symbol: 'ILLIQUID',
      trades: [],
      fallbackLtp: 250.0,
      previousClose: 245.0,
    });

    assert.equal(fallbackResult.referencePrice, 250.0);
    assert.equal(fallbackResult.calculationMethod, 'LTP_FALLBACK');
    assert.equal(fallbackResult.priceBandLow, 242.5); // 250 * 0.97
    assert.equal(fallbackResult.priceBandHigh, 257.5); // 250 * 1.03
  });

  await t.test('enforces SmartAPI order rejection during Phase 1 Transition (3:15-3:20 pm)', () => {
    const res = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'LIMIT',
      action: 'PLACE',
      price: 1280.0,
      referencePrice: 1280.0,
      time: '15:18',
    });

    assert.equal(res.allowed, false);
    assert.equal(res.errorCode, 'AB_CAS_TRANSITION_REJECT');
    assert.ok(res.reason?.includes('Order entry via SmartAPI is rejected'));
  });

  await t.test('disallows Stop-loss and Iceberg orders for CAS scrips between 3:15-3:40 pm', () => {
    // 3:22 pm: Order entry is open, but SL orders are blocked for CAS scrips
    const slRes = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'STOPLOSS_LIMIT',
      action: 'PLACE',
      price: 1280.0,
      referencePrice: 1280.0,
      time: '15:22',
    });

    assert.equal(slRes.allowed, false);
    assert.equal(slRes.errorCode, 'AB_CAS_DISALLOWED_ORDER_TYPE');
    assert.ok(slRes.reason?.includes('Stop-loss and Iceberg orders'));

    // Iceberg order test
    const icebergRes = validateAngelCasOrder({
      symbol: 'TCS',
      orderType: 'LIMIT',
      isIceberg: true,
      action: 'PLACE',
      price: 3950.0,
      referencePrice: 3950.0,
      time: '15:24',
    });

    assert.equal(icebergRes.allowed, false);
    assert.equal(icebergRes.errorCode, 'AB_CAS_DISALLOWED_ORDER_TYPE');
  });

  await t.test('blocks Market order modification and cancellation after 3:25 pm (Phase 3)', () => {
    const modRes = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'MARKET',
      action: 'MODIFY',
      time: '15:27',
    });

    assert.equal(modRes.allowed, false);
    assert.equal(modRes.errorCode, 'AB_CAS_MARKET_MODIFICATION_BLOCKED');
    assert.ok(modRes.reason?.includes('After 3:25 pm, Market orders can no longer be modified'));

    // Limit order modification is still allowed
    const limitModRes = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'LIMIT',
      action: 'MODIFY',
      price: 1282.0,
      referencePrice: 1280.0,
      time: '15:27',
    });

    assert.equal(limitModRes.allowed, true);
  });

  await t.test('enforces strict ±3% price band during CAS order entry (3:20-3:30 pm)', () => {
    const refPrice = 100.0;
    // Allowed band: 97.00 to 103.00

    // Within band: 102.50
    const validRes = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'LIMIT',
      action: 'PLACE',
      price: 102.5,
      referencePrice: refPrice,
      time: '15:23',
    });
    assert.equal(validRes.allowed, true);

    // Below -3%: 95.00
    const lowBreach = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'LIMIT',
      action: 'PLACE',
      price: 95.0,
      referencePrice: refPrice,
      time: '15:23',
    });
    assert.equal(lowBreach.allowed, false);
    assert.equal(lowBreach.errorCode, 'AB_CAS_PRICE_BAND_BREACH');

    // Above +3%: 105.00
    const highBreach = validateAngelCasOrder({
      symbol: 'RELIANCE',
      orderType: 'LIMIT',
      action: 'PLACE',
      price: 105.0,
      referencePrice: refPrice,
      time: '15:23',
    });
    assert.equal(highBreach.allowed, false);
    assert.equal(highBreach.errorCode, 'AB_CAS_PRICE_BAND_BREACH');
  });

  await t.test('discovers Equilibrium Price using SEBI volume maximisation matching algorithm', () => {
    const referencePrice = 190.0;
    // Bids willing to buy at or above price
    const buyOrders = [
      { price: 195.0, quantity: 1000 },
      { price: 192.0, quantity: 2000 },
      { price: 191.0, quantity: 4000 },
      { price: 190.0, quantity: 3000 },
    ];
    // Asks willing to sell at or below price
    const sellOrders = [
      { price: 188.0, quantity: 1500 },
      { price: 190.0, quantity: 2500 },
      { price: 191.0, quantity: 3500 },
      { price: 193.0, quantity: 2000 },
    ];

    const result = discoverAngelCasEquilibriumPrice({
      symbol: 'NIFTY50',
      referencePrice,
      buyOrders,
      sellOrders,
    });

    assert.equal(result.isDiscovered, true);
    assert.equal(result.equilibriumPrice, 191.0);
    assert.equal(result.matchedVolume, 7000);
    assert.ok(result.priceStepAnalysis.length > 0);
  });

  await t.test('validates revised auto-square off schedules effective 03 Aug 2026', () => {
    const schedules = getAngelAutoSquareOffSchedules();
    assert.equal(schedules.length, 3);

    const robo = schedules.find((s) => s.orderType === 'ROBO');
    assert.ok(robo);
    assert.equal(robo.cutoffTime, '15:05');
    assert.equal(robo.cutoffFormatted, '3:05 pm');

    const mis = schedules.find((s) => s.orderType === 'MIS');
    assert.ok(mis);
    assert.equal(mis.cutoffTime, '15:10');
    assert.equal(mis.cutoffFormatted, '3:10 pm');

    const fo = schedules.find((s) => s.segment === 'Equity F&O Orders');
    assert.ok(fo);
    assert.equal(fo.cutoffTime, '15:20');
    assert.equal(fo.cutoffFormatted, '3:20 pm');
  });

  await t.test('validates getAngelCasStatus summary payload shape', () => {
    const status = getAngelCasStatus('15:22');
    assert.equal(status.status, true);
    assert.equal(status.effectiveDate, '2026-08-03');
    assert.equal(status.currentPhase.phase, 'ORDER_ENTRY_AND_MODIFICATION');
    assert.equal(status.allPhases.length, 8);
    assert.equal(status.autoSquareOffSchedules.length, 3);
    assert.equal(status.rulesSummary.durationMinutes, 20);
    assert.equal(status.rulesSummary.priceBandPct, '±3%');
  });
});
