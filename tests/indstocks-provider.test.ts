import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapToIndstocksInterval,
  computeRangeTimestamps,
  formatCandleTimestamp,
} from '../server/providers/indstocksProvider';

test('INDstocks API Suite - Historical Data Provider', async (t) => {
  await t.test('maps intervals to exact INDstocks API values', () => {
    assert.equal(mapToIndstocksInterval('1d'), '1day');
    assert.equal(mapToIndstocksInterval('1day'), '1day');
    assert.equal(mapToIndstocksInterval('15m'), '15minute');
    assert.equal(mapToIndstocksInterval('15minute'), '15minute');
    assert.equal(mapToIndstocksInterval('5m'), '5minute');
    assert.equal(mapToIndstocksInterval('1h'), '60minute');
    assert.equal(mapToIndstocksInterval('60m'), '60minute');
    assert.equal(mapToIndstocksInterval('1w'), '1week');
    assert.equal(mapToIndstocksInterval('1mo'), '1month');
  });

  await t.test('computes valid epoch millisecond range boundaries', () => {
    const { startTime, endTime } = computeRangeTimestamps('1mo');
    assert.ok(startTime > 0);
    assert.ok(endTime > startTime);
    const diffDays = Math.round((endTime - startTime) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 30);
  });

  await t.test('formats candle open timestamps properly', () => {
    // 1782877500 -> 2026-07-01T03:45:00.000Z
    const ts = 1782877500;
    const daily = formatCandleTimestamp(ts, '1day');
    assert.match(daily, /^\d{4}-\d{2}-\d{2}$/);

    const intraday = formatCandleTimestamp(ts, '5minute');
    assert.match(intraday, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
