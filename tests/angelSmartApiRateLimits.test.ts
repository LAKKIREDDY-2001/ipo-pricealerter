import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANGEL_OFFICIAL_RATE_LIMITS,
  ANGEL_RATE_LIMIT_ERROR_CODE,
  ANGEL_RATE_LIMIT_ERROR_MESSAGE,
  ANGEL_RATE_LIMIT_STATUS_CODE,
  CUMULATIVE_ORDER_LIMIT_PER_SEC,
  checkAngelRateLimit,
  recordAngelRateLimitRequest,
  simulateAngelRateLimitBurst,
  resetAngelRateLimits,
  getAngelRateLimitTelemetry,
} from '../server/providers/angelSmartApiProvider.ts';

describe('Angel One SmartAPI Rate Limit Suite Provider', () => {
  test('official catalog contains all 26 endpoints with Sr. No 1 to 26', () => {
    assert.equal(ANGEL_OFFICIAL_RATE_LIMITS.length, 26);
    for (let i = 0; i < 26; i++) {
      assert.equal(ANGEL_OFFICIAL_RATE_LIMITS[i].srNo, i + 1);
      assert.ok(ANGEL_OFFICIAL_RATE_LIMITS[i].apiName.length > 0);
      assert.ok(ANGEL_OFFICIAL_RATE_LIMITS[i].limitPerSecond > 0);
    }
  });

  test('constants match official SmartAPI error code AB1004 and cumulative limit 9 req/s', () => {
    assert.equal(ANGEL_RATE_LIMIT_ERROR_CODE, 'AB1004');
    assert.equal(ANGEL_RATE_LIMIT_ERROR_MESSAGE, 'Access denied because of exceeding rate limit');
    assert.equal(ANGEL_RATE_LIMIT_STATUS_CODE, 403);
    assert.equal(CUMULATIVE_ORDER_LIMIT_PER_SEC, 9);
  });

  test('allows up to 9 cumulative order requests per second and throttles the 10th with AB1004', () => {
    const testClient = 'TEST_CLIENT_ORDER_POOL';
    resetAngelRateLimits(testClient);

    // First 9 order calls should be allowed
    for (let i = 0; i < 9; i++) {
      const res = recordAngelRateLimitRequest('Place Order', testClient);
      assert.equal(res.allowed, true, `Call #${i + 1} should be allowed`);
      assert.equal(res.statusCode, 200);
      assert.equal(res.errorcode, null);
    }

    // 10th order call must breach the 9 req/s cumulative pool limit
    const breach = recordAngelRateLimitRequest('Place Order', testClient);
    assert.equal(breach.allowed, false, '10th call must be throttled');
    assert.equal(breach.statusCode, 403);
    assert.equal(breach.errorcode, 'AB1004');
    assert.equal(breach.message, ANGEL_RATE_LIMIT_ERROR_MESSAGE);

    resetAngelRateLimits(testClient);
  });

  test('simulates high-frequency bursts accurately with exact allowed and throttled counts', () => {
    const testClient = 'TEST_CLIENT_BURST';
    resetAngelRateLimits(testClient);

    const burst = simulateAngelRateLimitBurst('Place Order', 12, testClient);
    assert.equal(burst.totalBurst, 12);
    assert.equal(burst.allowedCount, 9, 'Exactly 9 allowed under cumulative order pool');
    assert.equal(burst.throttledCount, 3, 'Exactly 3 throttled');
    assert.equal(burst.throttleRatePct, 25);
    assert.equal(burst.firstThrottledIndex, 9); // 0-indexed, 10th request
    assert.equal(burst.results.length, 12);

    // Verify throttled calls carry AB1004
    for (let i = 9; i < 12; i++) {
      assert.equal(burst.results[i].allowed, false);
      assert.equal(burst.results[i].statusCode, 403);
      assert.equal(burst.results[i].errorcode, 'AB1004');
    }

    resetAngelRateLimits(testClient);
  });

  test('resets sliding window counters cleanly', () => {
    const testClient = 'TEST_CLIENT_RESET';
    resetAngelRateLimits(testClient);

    // Make 9 calls
    for (let i = 0; i < 9; i++) {
      recordAngelRateLimitRequest('Place Order', testClient);
    }

    let check = checkAngelRateLimit('Place Order', testClient);
    assert.equal(check.currentRps, 9);
    assert.equal(check.cumulativePool?.currentRps, 9);

    // Reset
    resetAngelRateLimits(testClient);
    check = checkAngelRateLimit('Place Order', testClient);
    assert.equal(check.currentRps, 0);
    assert.equal(check.cumulativePool?.currentRps, 0);
    assert.equal(check.allowed, true);
  });
});
