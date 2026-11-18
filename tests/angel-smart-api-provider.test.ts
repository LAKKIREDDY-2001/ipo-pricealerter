import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAngelDateTime,
  mapTimeframeToAngelRequest,
  isAngelSmartApiConfigured,
  formatAngelCandlesForChart,
  convertAngelQuoteToStandard,
  convertAngelHoldingsToPortfolio,
  classifyPcrSentiment,
  classifyCautionaryMessage,
  resolveAngelSymbolToken,
  generateTOTP,
  KNOWN_ANGEL_TOKENS,
  ANGEL_INTERVAL_MAX_DAYS,
  SCRIP_MASTER_URL,
  ANGEL_SMARTAPI_ROOT_URL,
  CDSL_EDIS_FORM_ACTION,
  type AngelCandlePoint,
  type AngelLiveQuoteItem,
  type AngelGainerLoserItem,
  type AngelOIBuildupItem,
  type AngelHoldingItem,
  type AngelLtpQuote,
  type AngelCautionaryScrip,
  type AngelConvertPositionRequest,
  type AngelPositionItem,
  type AngelEdisVerifyResponse,
  type AngelEdisTranStatusResponse,
  type AngelLoginRequest,
  type AngelLoginResponse,
  type AngelGenerateTokenResponse,
  type AngelUserProfile,
  type AngelRMSFunds,
  type AngelLogoutResponse,
  ANGEL_LOGIN_URL,
  ANGEL_GENERATE_TOKENS_URL,
  ANGEL_GET_PROFILE_URL,
  ANGEL_GET_RMS_URL,
  ANGEL_LOGOUT_URL,
  clearCachedAngelSession,
  getCachedAngelSession,
} from '../server/providers/angelSmartApiProvider.ts';

test('Angel One SmartAPI Suite Provider', async (t) => {
  await t.test('formats dates strictly to yyyy-MM-dd HH:mm as required by SmartAPI', () => {
    const fixedDate = new Date(2023, 8, 6, 11, 15); // Sept 6, 2023, 11:15
    const formatted = formatAngelDateTime(fixedDate);
    assert.equal(formatted, '2023-09-06 11:15');
  });

  await t.test('maps known tokens for Indian indices, commodities and liquid stocks', () => {
    assert.equal(KNOWN_ANGEL_TOKENS['NIFTY'].token, '99926000');
    assert.equal(KNOWN_ANGEL_TOKENS['BANKNIFTY'].token, '99926009');
    assert.equal(KNOWN_ANGEL_TOKENS['SENSEX'].token, '99919000');
    assert.equal(KNOWN_ANGEL_TOKENS['RELIANCE'].token, '2885');
    assert.equal(KNOWN_ANGEL_TOKENS['GOLD'].exchange, 'MCX');
    assert.equal(KNOWN_ANGEL_TOKENS['CRUDEOIL'].exchange, 'MCX');
    assert.equal(KNOWN_ANGEL_TOKENS['USDINR'].exchange, 'CDS');
  });

  await t.test('maps timeframe ranges to valid intervals within Angel max limits', () => {
    const req1D = mapTimeframeToAngelRequest('RELIANCE', '1D');
    assert.ok(req1D);
    assert.equal(req1D.interval, 'FIVE_MINUTE');
    assert.equal(req1D.symboltoken, '2885');

    const req1Y = mapTimeframeToAngelRequest('NIFTY', '1Y');
    assert.ok(req1Y);
    assert.equal(req1Y.interval, 'ONE_DAY');
    assert.equal(req1Y.symboltoken, '99926000');

    // Confirm interval maximum days lookup matches Angel One documentation
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['ONE_MINUTE'], 30);
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['FIVE_MINUTE'], 100);
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['ONE_HOUR'], 400);
    assert.equal(ANGEL_INTERVAL_MAX_DAYS['ONE_DAY'], 2000);
  });

  await t.test('generates valid RFC 6238 TOTP codes matching official test vectors', async () => {
    // Standard RFC 6238 test secret "12345678901234567890" in base32
    const testSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    assert.equal(await generateTOTP(testSecret, 59), '287082');
    assert.equal(await generateTOTP(testSecret, 1111111109), '081804');
    assert.equal(await generateTOTP(testSecret, 1234567890), '005924');
  });

  await t.test('detects Angel SmartAPI configuration reliably with ANGELONE_API_KEY', () => {
    const originalOne = process.env.ANGELONE_API_KEY;
    const originalKey = process.env.ANGEL_API_KEY;
    const originalToken = process.env.ANGEL_AUTH_TOKEN;
    try {
      delete process.env.ANGELONE_API_KEY;
      delete process.env.ANGEL_API_KEY;
      delete process.env.SMARTAPI_API_KEY;
      delete process.env.ANGEL_AUTH_TOKEN;
      delete process.env.SMARTAPI_AUTH_TOKEN;
      assert.equal(isAngelSmartApiConfigured(), false);

      // Cloudflare Pages secret format
      process.env.ANGELONE_API_KEY = 'test_cloudflare_encrypted_key';
      assert.equal(isAngelSmartApiConfigured(), true);

      // Custom Cloudflare env object
      assert.equal(isAngelSmartApiConfigured({ ANGELONE_API_KEY: 'cf_key_123' }), true);
      assert.equal(isAngelSmartApiConfigured({}), false);
    } finally {
      if (originalOne) process.env.ANGELONE_API_KEY = originalOne;
      else delete process.env.ANGELONE_API_KEY;
      if (originalKey) process.env.ANGEL_API_KEY = originalKey;
      else delete process.env.ANGEL_API_KEY;
      if (originalToken) process.env.ANGEL_AUTH_TOKEN = originalToken;
      else delete process.env.ANGEL_AUTH_TOKEN;
    }
  });

  await t.test('formats raw candle data into PriceAlerter chart series', () => {
    const rawCandles: AngelCandlePoint[] = [
      {
        timestamp: '2023-09-06T11:15:00+05:30',
        open: 19571.2,
        high: 19573.35,
        low: 19534.4,
        close: 19552.05,
        volume: 125000,
      },
    ];

    const chartPoints = formatAngelCandlesForChart(rawCandles);
    assert.equal(chartPoints.length, 1);
    assert.equal(chartPoints[0].time, '2023-09-06T11:15:00+05:30');
    assert.equal(chartPoints[0].open, 19571.2);
    assert.equal(chartPoints[0].high, 19573.35);
    assert.equal(chartPoints[0].low, 19534.4);
    assert.equal(chartPoints[0].close, 19552.05);
    assert.equal(chartPoints[0].value, 19552.05);
  });

  await t.test('converts full live market data quote into standard PriceAlerter format with depth and circuits', () => {
    const sampleFullQuote: AngelLiveQuoteItem = {
      exchange: 'NSE',
      tradingSymbol: 'SBIN-EQ',
      symbolToken: '3045',
      ltp: 568.2,
      open: 567.4,
      high: 569.35,
      low: 566.1,
      close: 567.4,
      lastTradeQty: 1,
      exchFeedTime: '21-Jun-2023 10:46:10',
      exchTradeTime: '21-Jun-2023 10:46:09',
      netChange: 0.8,
      percentChange: 0.14,
      avgPrice: 567.83,
      tradeVolume: 3556150,
      opnInterest: 0,
      lowerCircuit: 510.7,
      upperCircuit: 624.1,
      totBuyQuan: 839549,
      totSellQuan: 1284767,
      week52High: 629.55,
      week52Low: 430.7,
      depth: {
        buy: [
          { price: 568.2, quantity: 511, orders: 2 },
          { price: 568.15, quantity: 411, orders: 2 },
        ],
        sell: [{ price: 568.25, quantity: 3348, orders: 5 }],
      },
    };

    const standard = convertAngelQuoteToStandard(sampleFullQuote);
    assert.equal(standard.symbol, 'SBIN');
    assert.equal(standard.exchange, 'NSE');
    assert.equal(standard.currentPrice, 568.2);
    assert.equal(standard.dayChange, 0.8);
    assert.equal(standard.dayChangePercent, 0.14);
    assert.equal(standard.vwap, 567.83);
    assert.equal(standard.upperCircuit, 624.1);
    assert.equal(standard.lowerCircuit, 510.7);
    assert.equal(standard.week52High, 629.55);
    assert.equal(standard.week52Low, 430.7);
    assert.equal(standard.lastTradeTime, '21-Jun-2023 10:46:10');
    assert.ok(standard.depth);
    assert.equal(standard.depth.buy.length, 2);
    assert.equal(standard.depth.sell.length, 1);
  });

  await t.test('classifies Put-Call Ratio (PCR) market sentiment accurately', () => {
    assert.equal(classifyPcrSentiment(1.45).label, 'Extremely Bullish');
    assert.equal(classifyPcrSentiment(1.45).bias, 'bullish');

    assert.equal(classifyPcrSentiment(1.12).label, 'Mildly Bullish');
    assert.equal(classifyPcrSentiment(1.12).bias, 'bullish');

    assert.equal(classifyPcrSentiment(0.85).label, 'Neutral / Rangebound');
    assert.equal(classifyPcrSentiment(0.85).bias, 'neutral');

    assert.equal(classifyPcrSentiment(0.62).label, 'Bearish / Oversold');
    assert.equal(classifyPcrSentiment(0.62).bias, 'bearish');
  });

  await t.test('validates shapes of OI Gainers and OI Buildup contracts', () => {
    const sampleGainer: AngelGainerLoserItem = {
      tradingSymbol: 'HDFCBANK25JAN24FUT',
      percentChange: 20.02,
      symbolToken: 55394,
      opnInterest: 118861600,
      netChangeOpnInterest: 19825300,
    };
    assert.equal(sampleGainer.tradingSymbol, 'HDFCBANK25JAN24FUT');
    assert.ok(sampleGainer.percentChange > 0);

    const sampleBuildup: AngelOIBuildupItem = {
      symbolToken: '55424',
      ltp: 723.8,
      netChange: -28.25,
      percentChange: -3.76,
      opnInterest: 24982.5,
      netChangeOpnInterest: -76.25,
      tradingSymbol: 'JINDALSTEL25JAN24FUT',
    };
    assert.equal(sampleBuildup.tradingSymbol, 'JINDALSTEL25JAN24FUT');
    assert.equal(sampleBuildup.ltp, 723.8);
  });

  await t.test('converts Angel One Demat holdings into PriceAlerter PortfolioHolding records', () => {
    const sampleAngelHoldings: AngelHoldingItem[] = [
      {
        tradingsymbol: 'TATASTEEL-EQ',
        exchange: 'NSE',
        isin: 'INE081A01020',
        t1quantity: 0,
        realisedquantity: 2,
        quantity: 2,
        authorisedquantity: 0,
        product: 'DELIVERY',
        collateralquantity: null,
        collateraltype: null,
        haircut: 0,
        averageprice: 111.87,
        ltp: 130.15,
        symboltoken: '3499',
        close: 129.6,
        profitandloss: 37,
        pnlpercentage: 16.34,
      },
    ];

    const portfolioHoldings = convertAngelHoldingsToPortfolio(sampleAngelHoldings);
    assert.equal(portfolioHoldings.length, 1);
    assert.equal(portfolioHoldings[0].symbol, 'TATASTEEL');
    assert.equal(portfolioHoldings[0].quantity, 2);
    assert.equal(portfolioHoldings[0].buyPrice, 111.87);
    assert.equal(portfolioHoldings[0].currentPrice, 130.15);
    assert.equal(portfolioHoldings[0].pnl, 37);
    assert.equal(portfolioHoldings[0].pnlPercent, 16.34);
    assert.equal(portfolioHoldings[0].assetType, 'Equity');
  });

  await t.test('classifies exchange cautionary and surveillance messages accurately', () => {
    assert.equal(
      classifyCautionaryMessage('Stage 1 Long Term ASM scrip. PE is greater than 50'),
      'ASM'
    );
    assert.equal(
      classifyCautionaryMessage('GSM Stage 2 security with 100% margin required'),
      'GSM'
    );
    assert.equal(
      classifyCautionaryMessage('Security is under Gross settlement (Trade for Trade)'),
      'TRADE_FOR_TRADE'
    );
    assert.equal(
      classifyCautionaryMessage('T2T settlement active for next 10 trading sessions'),
      'TRADE_FOR_TRADE'
    );
    assert.equal(
      classifyCautionaryMessage('Average daily number of unique Clients/PAN traded is less than 100'),
      'CAUTIONARY'
    );
  });

  await t.test('resolves known and cached Angel symbol tokens instantly', async () => {
    assert.equal(await resolveAngelSymbolToken('SBIN'), '3045');
    assert.equal(await resolveAngelSymbolToken('RELIANCE'), '2885');
    assert.equal(await resolveAngelSymbolToken('TCS.NS'), '11536');
    assert.equal(await resolveAngelSymbolToken('NSE_INFY'), '1594');
  });

  await t.test('validates shapes of Angel LTP quote and Cautionary scrips', () => {
    const ltpQuote: AngelLtpQuote = {
      exchange: 'NSE',
      tradingsymbol: 'SBIN-EQ',
      symboltoken: '3045',
      open: 567.4,
      high: 569.35,
      low: 566.1,
      close: 567.4,
      ltp: 568.2,
    };
    assert.equal(ltpQuote.tradingsymbol, 'SBIN-EQ');
    assert.equal(ltpQuote.ltp, 568.2);

    const cautionaryItem: AngelCautionaryScrip = {
      token: '532083',
      symbol: 'SHKALYN',
      message: 'Security is under Gross settlement (Trade for Trade)',
      category: classifyCautionaryMessage('Security is under Gross settlement (Trade for Trade)'),
    };
    assert.equal(cautionaryItem.symbol, 'SHKALYN');
    assert.equal(cautionaryItem.category, 'TRADE_FOR_TRADE');

    assert.equal(ANGEL_SMARTAPI_ROOT_URL, 'https://apiconnect.angelone.in');
    assert.ok(SCRIP_MASTER_URL.includes('OpenAPIScripMaster.json'));
  });

  await t.test('validates Angel One position item and position conversion payload contract', () => {
    const samplePosition: AngelPositionItem = {
      exchange: 'NSE',
      symboltoken: '2885',
      producttype: 'DELIVERY',
      tradingsymbol: 'RELIANCE-EQ',
      symbolname: 'RELIANCE',
      buyqty: '1',
      sellqty: '0',
      buyamount: '2235.80',
      sellamount: '0',
      netqty: '1',
      netvalue: '-2235.80',
      buyavgprice: '2235.80',
      sellavgprice: '0',
      netprice: '2235.80',
      totalbuyvalue: '2235.80',
      totalsellvalue: '0',
    };
    assert.equal(samplePosition.tradingsymbol, 'RELIANCE-EQ');
    assert.equal(samplePosition.producttype, 'DELIVERY');

    const conversionReq: AngelConvertPositionRequest = {
      exchange: 'NSE',
      symboltoken: '2885',
      oldproducttype: 'DELIVERY',
      newproducttype: 'INTRADAY',
      tradingsymbol: 'RELIANCE-EQ',
      symbolname: 'RELIANCE',
      buyqty: '1',
      sellqty: '0',
      buyamount: '2235.80',
      sellamount: '0',
      transactiontype: 'BUY',
      quantity: 1,
      type: 'DAY',
    };
    assert.equal(conversionReq.newproducttype, 'INTRADAY');
    assert.equal(conversionReq.quantity, 1);
  });

  await t.test('validates CDSL eDIS verification and transaction status contracts', () => {
    assert.equal(CDSL_EDIS_FORM_ACTION, 'https://edis.cdslindia.com/eDIS/VerifyDIS/');

    const sampleEdisVerify: AngelEdisVerifyResponse = {
      status: true,
      message: 'SUCCESS',
      alreadyRegistered: false,
      data: {
        ReqId: '8180722758077144',
        ReturnURL: 'https://trade.angelbroking.com/cdslpoa/response',
        DPId: '33200',
        BOID: '1203320015222472',
        TransDtls: 'fZ6jlmt9GosSO0kFdI9S9FCD+IYFvjUN94Bph46YMC1...',
        version: '1.1',
      },
    };
    assert.equal(sampleEdisVerify.data?.DPId, '33200');
    assert.equal(sampleEdisVerify.data?.version, '1.1');
    assert.equal(sampleEdisVerify.alreadyRegistered, false);

    const sampleTranStatus: AngelEdisTranStatusResponse = {
      status: true,
      message: 'SUCCESS',
      authorized: true,
      reqId: '7650687246435520',
      details: {
        ReqId: '1278983622820067',
        RecordResDtls: [{ TxnReqId: '7659729424908225', Status: '1' }],
      },
    };
    assert.equal(sampleTranStatus.authorized, true);
    assert.equal(sampleTranStatus.reqId, '7650687246435520');
  });

  await t.test('validates Angel One User API endpoints and URL configurations', () => {
    assert.equal(ANGEL_LOGIN_URL, 'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword');
    assert.equal(ANGEL_GENERATE_TOKENS_URL, 'https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens');
    assert.equal(ANGEL_GET_PROFILE_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile');
    assert.equal(ANGEL_GET_RMS_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS');
    assert.equal(ANGEL_LOGOUT_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/logout');
  });

  await t.test('validates Angel One User Login and Token Renewal contracts', () => {
    const loginReq: AngelLoginRequest = {
      clientcode: 'AABF820686',
      password: '2001',
      totp: '543210',
      state: 'live',
    };
    assert.equal(loginReq.clientcode, 'AABF820686');
    assert.equal(loginReq.password, '2001');

    const sampleLoginRes: AngelLoginResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        jwtToken: 'eyJhbGciOiJIUzUxMiJ9.eyJuYW1lIjoiQW5nZWwiLCJpYXQiOjE2ODAwMDAwMDB9...',
        refreshToken: 'eyJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE2ODAwMDAwMDB9...',
        feedToken: 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjoiQUFCRjgyMDY4NiJ9...',
        state: 'live',
      },
    };
    assert.equal(sampleLoginRes.status, true);
    assert.ok(sampleLoginRes.data?.jwtToken?.startsWith('eyJ'));
    assert.equal(sampleLoginRes.data?.state, 'live');

    const sampleRenewRes: AngelGenerateTokenResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        jwtToken: 'eyJhbGciOiJIUzUxMiJ9.eyJuZXdUb2tlbiI6dHJ1ZX0...',
        refreshToken: 'eyJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE2ODAwMDAwMDF9...',
        feedToken: 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjoiQUFCRjgyMDY4NiJ9...',
      },
    };
    assert.equal(sampleRenewRes.status, true);
    assert.ok(sampleRenewRes.data?.jwtToken);
  });

  await t.test('validates Angel One User Profile contract', () => {
    const sampleProfile: AngelUserProfile = {
      clientcode: 'AABF820686',
      name: 'LAKKIREDDY VENKATA MADHAVA REDDY',
      email: 'user@example.com',
      mobileno: '9876543210',
      exchanges: ['NSE', 'BSE', 'MCX', 'CDS', 'NCDEX', 'NFO'],
      products: ['DELIVERY', 'INTRADAY', 'MARGIN'],
      lastlogintime: '18-11-2026 09:15:00',
      brokerid: 'B2C',
    };

    assert.equal(sampleProfile.clientcode, 'AABF820686');
    assert.equal(sampleProfile.brokerid, 'B2C');
    assert.ok(sampleProfile.exchanges.includes('NSE'));
    assert.ok(sampleProfile.exchanges.includes('MCX'));
    assert.ok(sampleProfile.products.includes('DELIVERY'));
  });

  await t.test('validates Angel One RMS Funds and Margins contract', () => {
    const sampleFunds: AngelRMSFunds = {
      net: '10000000.00',
      availablecash: '750000.50',
      availableintradaypayin: '0',
      availablelimitmargin: '0',
      collateral: '250000.00',
      m2munrealized: '1500.25',
      m2mrealized: '3200.00',
      utiliseddebits: '0',
      utilisedspan: '120000.00',
      utilisedoptionpremium: '0',
      utilisedholdingsales: '0',
      utilisedexposure: '25000.00',
      utilisedturnover: '0',
      utilisedpayout: '0',
    };

    assert.equal(sampleFunds.net, '10000000.00');
    assert.equal(sampleFunds.availablecash, '750000.50');
    assert.equal(sampleFunds.collateral, '250000.00');
    assert.equal(sampleFunds.utilisedspan, '120000.00');
  });

  await t.test('validates Angel One Logout response and cache invalidation', () => {
    const sampleLogout: AngelLogoutResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: '',
    };
    assert.equal(sampleLogout.status, true);
    assert.equal(sampleLogout.message, 'SUCCESS');

    // Test clearCachedAngelSession
    clearCachedAngelSession();
    assert.equal(getCachedAngelSession(), null);
  });
});
