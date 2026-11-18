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
  generateAngelEdisHtmlForm,
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
  type AngelGttCreateRuleRequest,
  type AngelGttCreateRuleResponse,
  type AngelGttModifyRuleRequest,
  type AngelGttCancelRuleRequest,
  type AngelGttRuleDetailsItem,
  type AngelGttRuleDetailsResponse,
  type AngelGttRuleListRequest,
  type AngelGttRuleListResponse,
  type AngelPlaceOrderRequest,
  type AngelPlaceOrderResponse,
  type AngelModifyOrderRequest,
  type AngelModifyOrderResponse,
  type AngelCancelOrderRequest,
  type AngelCancelOrderResponse,
  type AngelOrderItem,
  type AngelOrderBookResponse,
  type AngelTradeItem,
  type AngelTradeBookResponse,
  type AngelIndividualOrderResponse,
  type AngelPostbackPayload,
  type AngelPostbackRecord,
  type AngelPostbackStatusCategory,
  type AngelMarginPosition,
  type AngelMarginBatchResponse,
  ANGEL_LOGIN_URL,
  ANGEL_GENERATE_TOKENS_URL,
  ANGEL_GET_PROFILE_URL,
  ANGEL_GET_RMS_URL,
  ANGEL_LOGOUT_URL,
  ANGEL_GTT_CREATE_RULE_URL,
  ANGEL_GTT_MODIFY_RULE_URL,
  ANGEL_GTT_CANCEL_RULE_URL,
  ANGEL_GTT_RULE_DETAILS_URL,
  ANGEL_GTT_RULE_LIST_URL,
  ANGEL_GTT_ERROR_CODES,
  ANGEL_ORDER_PLACE_URL,
  ANGEL_ORDER_MODIFY_URL,
  ANGEL_ORDER_CANCEL_URL,
  ANGEL_ORDER_BOOK_URL,
  ANGEL_TRADE_BOOK_URL,
  ANGEL_ORDER_LTP_URL,
  ANGEL_ORDER_DETAILS_URL,
  ANGEL_POSTBACK_PATH,
  ANGEL_POSTBACK_DEFAULT_URL,
  ANGEL_MARGIN_BATCH_URL,
  ANGEL_OPTION_GREEK_URL,
  type AngelOptionGreekItem,
  type AngelOptionGreekRequest,
  type AngelOptionGreekResponse,
  parseOptionExpiryToYears,
  simulateAngelOptionGreeks,
  fetchAngelOptionGreeks,
  recordAngelPostback,
  getRecentAngelPostbacks,
  clearAngelPostbacks,
  classifyPostbackStatus,
  createSimulatedAngelPostback,
  simulateAngelBatchMargin,
  calculateAngelBatchMargin,
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

    // Validate AG1000 already registered response
    const alreadyRegisteredRes: AngelEdisVerifyResponse = {
      status: true,
      alreadyRegistered: true,
      message: 'You have already been registered with CDSL for today.',
      data: {
        ReqId: '0390624715013748',
        ReturnURL: null,
        DPId: null,
        BOID: null,
        TransDtls: null,
        version: '1.1',
      },
    };
    assert.equal(alreadyRegisteredRes.alreadyRegistered, true);
    assert.equal(alreadyRegisteredRes.data?.ReqId, '0390624715013748');

    // Validate CDSL HTML auto-submission form generator
    const htmlForm = generateAngelEdisHtmlForm({
      dpId: '33200',
      reqId: '8180722758077144',
      transDtls: 'fZ6jlmt9GosSO0kFdI9S9FCD+IYFvjUN94Bph46YMC1...',
      version: '1.1',
    });
    assert.ok(htmlForm.includes('action="https://edis.cdslindia.com/eDIS/VerifyDIS/"'));
    assert.ok(htmlForm.includes('name="DPId" value="33200"'));
    assert.ok(htmlForm.includes('name="ReqId" value="8180722758077144"'));
    assert.ok(htmlForm.includes('name="Version" value="1.1"'));
    assert.ok(htmlForm.includes('submitbtn'));

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

    // Status 0: not authorised to sell
    const pendingTranStatus: AngelEdisTranStatusResponse = {
      status: true,
      message: 'SUCCESS',
      authorized: false,
      reqId: '7650687246435520',
      details: {
        ReqId: '1278983622820067',
        RecordResDtls: [{ TxnReqId: '7659729424908225', Status: '0' }],
      },
    };
    assert.equal(pendingTranStatus.authorized, false);
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

  await t.test('validates Angel One GTT API endpoints and error code catalog', () => {
    assert.equal(ANGEL_GTT_CREATE_RULE_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/createRule');
    assert.equal(ANGEL_GTT_MODIFY_RULE_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/modifyRule');
    assert.equal(ANGEL_GTT_CANCEL_RULE_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/cancelRule');
    assert.equal(ANGEL_GTT_RULE_DETAILS_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/ruleDetails');
    assert.equal(ANGEL_GTT_RULE_LIST_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/gtt/v1/ruleList');

    assert.equal(ANGEL_GTT_ERROR_CODES['AB9000'], 'Internal Server Error');
    assert.equal(ANGEL_GTT_ERROR_CODES['AB9001'], 'Invalid Parameters');
    assert.equal(ANGEL_GTT_ERROR_CODES['AB9009'], 'Invalid Trigger Price');
    assert.equal(ANGEL_GTT_ERROR_CODES['AB9010'], 'Invalid Exchange Segment');
    assert.equal(ANGEL_GTT_ERROR_CODES['AB9015'], 'Invalid Product Type');
  });

  await t.test('validates Angel One GTT Create and Modify Rule contracts', () => {
    const createReq: AngelGttCreateRuleRequest = {
      tradingsymbol: 'SBIN-EQ',
      symboltoken: '3045',
      exchange: 'NSE',
      transactiontype: 'BUY',
      producttype: 'DELIVERY',
      price: '195',
      qty: '1',
      triggerprice: '196',
      disclosedqty: '10',
    };
    assert.equal(createReq.tradingsymbol, 'SBIN-EQ');
    assert.equal(createReq.exchange, 'NSE');
    assert.equal(createReq.producttype, 'DELIVERY');

    const createRes: AngelGttCreateRuleResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: { id: '1' },
    };
    assert.equal(createRes.status, true);
    assert.equal(createRes.data?.id, '1');

    const modifyReq: AngelGttModifyRuleRequest = {
      id: '1',
      symboltoken: '3045',
      exchange: 'NSE',
      price: '198',
      qty: '2',
      triggerprice: '199',
      disclosedqty: '10',
    };
    assert.equal(modifyReq.id, '1');
    assert.equal(modifyReq.triggerprice, '199');
  });

  await t.test('validates Angel One GTT Cancel, Details, and List contracts', () => {
    const cancelReq: AngelGttCancelRuleRequest = {
      id: '1',
      symboltoken: '3045',
      exchange: 'NSE',
    };
    assert.equal(cancelReq.id, '1');

    const detailsRes: AngelGttRuleDetailsResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        id: '1',
        status: 'NEW',
        createddate: '2020-11-16T14:19:51Z',
        updateddate: '2020-11-16T14:28:01Z',
        expirydate: '2021-11-16T14:19:51Z',
        clientid: '100',
        tradingsymbol: 'SBIN-EQ',
        symboltoken: '3045',
        exchange: 'NSE',
        transactiontype: 'BUY',
        producttype: 'DELIVERY',
        price: '195',
        qty: '1',
        triggerprice: '196',
        disclosedqty: '10',
      },
    };
    assert.equal(detailsRes.status, true);
    assert.equal(detailsRes.data?.status, 'NEW');
    assert.equal(detailsRes.data?.tradingsymbol, 'SBIN-EQ');

    const listReq: AngelGttRuleListRequest = {
      status: ['NEW', 'CANCELLED', 'ACTIVE', 'SENTTOEXCHANGE', 'FORALL'],
      page: 1,
      count: 10,
    };
    assert.equal(listReq.page, 1);
    assert.equal(listReq.count, 10);
    assert.ok(listReq.status?.includes('ACTIVE'));
  });

  await t.test('validates Angel One Orders API endpoints and order URLs', () => {
    assert.equal(ANGEL_ORDER_PLACE_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder');
    assert.equal(ANGEL_ORDER_MODIFY_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder');
    assert.equal(ANGEL_ORDER_CANCEL_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder');
    assert.equal(ANGEL_ORDER_BOOK_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook');
    assert.equal(ANGEL_TRADE_BOOK_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook');
    assert.equal(ANGEL_ORDER_LTP_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getLtpData');
    assert.equal(ANGEL_ORDER_DETAILS_URL, 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details');
  });

  await t.test('validates Angel One Place, Modify, and Cancel Order contracts', () => {
    const placeReq: AngelPlaceOrderRequest = {
      variety: 'NORMAL',
      tradingsymbol: 'SBIN-EQ',
      symboltoken: '3045',
      transactiontype: 'BUY',
      exchange: 'NSE',
      ordertype: 'MARKET',
      producttype: 'INTRADAY',
      duration: 'DAY',
      price: '194.50',
      squareoff: '0',
      stoploss: '0',
      quantity: '1',
      scripconsent: 'yes',
    };
    assert.equal(placeReq.tradingsymbol, 'SBIN-EQ');
    assert.equal(placeReq.symboltoken, '3045');
    assert.equal(placeReq.transactiontype, 'BUY');
    assert.equal(placeReq.ordertype, 'MARKET');
    assert.equal(placeReq.producttype, 'INTRADAY');
    assert.equal(placeReq.scripconsent, 'yes');

    const placeRes: AngelPlaceOrderResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        script: 'SBIN-EQ',
        orderid: '200910000000111',
        uniqueorderid: '34reqfachdfih',
      },
    };
    assert.equal(placeRes.status, true);
    assert.equal(placeRes.data?.orderid, '200910000000111');
    assert.equal(placeRes.data?.uniqueorderid, '34reqfachdfih');

    const modifyReq: AngelModifyOrderRequest = {
      variety: 'NORMAL',
      orderid: '201020000000080',
      ordertype: 'LIMIT',
      producttype: 'INTRADAY',
      duration: 'DAY',
      price: '194.00',
      quantity: '1',
      tradingsymbol: 'SBIN-EQ',
      symboltoken: '3045',
      exchange: 'NSE',
    };
    assert.equal(modifyReq.orderid, '201020000000080');
    assert.equal(modifyReq.price, '194.00');

    const modifyRes: AngelModifyOrderResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        orderid: '201020000000080',
        uniqueorderid: '34reqfachdfih',
      },
    };
    assert.equal(modifyRes.status, true);

    const cancelReq: AngelCancelOrderRequest = {
      variety: 'NORMAL',
      orderid: '201020000000080',
    };
    assert.equal(cancelReq.orderid, '201020000000080');
    assert.equal(cancelReq.variety, 'NORMAL');

    const cancelRes: AngelCancelOrderResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        orderid: '201020000000080',
        uniqueorderid: '34reqfachdfih',
      },
    };
    assert.equal(cancelRes.status, true);
  });

  await t.test('validates Angel One Order Book, Trade Book, and Individual Order Status contracts', () => {
    const orderItem: AngelOrderItem = {
      variety: 'NORMAL',
      ordertype: 'LIMIT',
      producttype: 'INTRADAY',
      duration: 'DAY',
      price: '194.00',
      triggerprice: '0',
      quantity: '1',
      disclosedquantity: '0',
      squareoff: '0',
      stoploss: '0',
      trailingstoploss: '0',
      tradingsymbol: 'SBIN-EQ',
      transactiontype: 'BUY',
      exchange: 'NSE',
      symboltoken: '3045',
      lotsize: '1',
      cancelsize: '1',
      averageprice: '0',
      filledshares: '0',
      unfilledshares: '1',
      orderid: '201020000000080',
      text: '',
      status: 'cancelled',
      orderstatus: 'cancelled',
      updatetime: '20-Oct-2020 13:10:59',
      uniqueorderid: '34reqfachdfih',
      exchangeorderid: '1100000000048358',
    };
    assert.equal(orderItem.orderid, '201020000000080');
    assert.equal(orderItem.orderstatus, 'cancelled');
    assert.equal(orderItem.uniqueorderid, '34reqfachdfih');

    const orderBookRes: AngelOrderBookResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: [orderItem],
    };
    assert.equal(orderBookRes.status, true);
    assert.ok(Array.isArray(orderBookRes.data));
    assert.equal(orderBookRes.data.length, 1);

    const tradeItem: AngelTradeItem = {
      exchange: 'NSE',
      producttype: 'DELIVERY',
      tradingsymbol: 'ITC-EQ',
      instrumenttype: '',
      symbolgroup: 'EQ',
      marketlot: '1',
      precision: '2',
      multiplier: '-1',
      tradevalue: '175.00',
      transactiontype: 'BUY',
      fillprice: '175.00',
      fillsize: '1',
      orderid: '201020000000095',
      fillid: '50005750',
      filltime: '13:27:53',
    };
    assert.equal(tradeItem.tradingsymbol, 'ITC-EQ');
    assert.equal(tradeItem.tradevalue, '175.00');
    assert.equal(tradeItem.orderid, '201020000000095');

    const tradeBookRes: AngelTradeBookResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: [tradeItem],
    };
    assert.equal(tradeBookRes.status, true);
    assert.ok(Array.isArray(tradeBookRes.data));
    assert.equal(tradeBookRes.data.length, 1);

    const indOrderRes: AngelIndividualOrderResponse = {
      status: true,
      message: 'SUCCESS',
      errorcode: '',
      data: {
        variety: 'NORMAL',
        ordertype: 'LIMIT',
        producttype: 'DELIVERY',
        duration: 'DAY',
        price: 2298.25,
        triggerprice: 0,
        quantity: '1',
        disclosedquantity: '0',
        squareoff: 0,
        stoploss: 0,
        trailingstoploss: 0,
        tradingsymbol: 'RELIANCE-EQ',
        transactiontype: 'BUY',
        exchange: 'NSE',
        symboltoken: '2885',
        orderid: '231010000000970',
        text: 'Your order has been rejected due to Insufficient Funds.',
        status: 'rejected',
        orderstatus: 'rejected',
        uniqueorderid: '05ebf91b-bea4-4a1d-b0f2-4259606570e3',
      },
    };
    assert.equal(indOrderRes.status, true);
    assert.equal(indOrderRes.data?.uniqueorderid, '05ebf91b-bea4-4a1d-b0f2-4259606570e3');
    assert.equal(indOrderRes.data?.orderstatus, 'rejected');
  });

  await t.test('validates Angel One SmartAPI Postback Webhook endpoint path and URL', () => {
    assert.equal(ANGEL_POSTBACK_PATH, '/api/orders/angel/postback');
    assert.equal(ANGEL_POSTBACK_DEFAULT_URL, 'https://pricealerter.com/api/orders/angel/postback');
  });

  await t.test('classifies postback status categories accurately across execution states', () => {
    assert.equal(classifyPostbackStatus('complete'), 'COMPLETE');
    assert.equal(classifyPostbackStatus('traded'), 'COMPLETE');
    assert.equal(classifyPostbackStatus('executed'), 'COMPLETE');
    assert.equal(classifyPostbackStatus('partially executed'), 'PARTIALLY_EXECUTED');
    assert.equal(classifyPostbackStatus('open'), 'OPEN');
    assert.equal(classifyPostbackStatus('trigger pending'), 'OPEN');
    assert.equal(classifyPostbackStatus('validation pending'), 'OPEN');
    assert.equal(classifyPostbackStatus('cancelled'), 'CANCELLED');
    assert.equal(classifyPostbackStatus('rejected'), 'REJECTED');
    assert.equal(classifyPostbackStatus('rms:check margin failed'), 'REJECTED');

    // Partial fill detection with numeric shares
    assert.equal(classifyPostbackStatus('open', 5, 5), 'PARTIALLY_EXECUTED');
    assert.equal(classifyPostbackStatus({ status: 'open', filledshares: 5, unfilledshares: 5, quantity: 10 }), 'PARTIALLY_EXECUTED');
    assert.equal(classifyPostbackStatus({ status: 'complete', filledshares: 10, unfilledshares: 0, quantity: 10 }), 'COMPLETE');
  });

  await t.test('validates Angel One SmartAPI Postback Webhook payload contract and record ingestion', () => {
    clearAngelPostbacks();

    const officialSamplePayload: AngelPostbackPayload = {
      variety: 'NORMAL',
      ordertype: 'LIMIT',
      producttype: 'INTRADAY',
      duration: 'DAY',
      price: 195.0,
      triggerprice: 0.0,
      quantity: 10,
      disclosedquantity: 0,
      squareoff: 0.0,
      stoploss: 0.0,
      trailingstoploss: 0.0,
      tradingsymbol: 'SBIN-EQ',
      transactiontype: 'BUY',
      exchange: 'NSE',
      symboltoken: '3045',
      ordertag: 'tag1',
      instrumenttype: '',
      strikeprice: -1.0,
      optiontype: '',
      expirydate: '',
      lotsize: 1,
      cancelsize: 0,
      averageprice: 194.8,
      filledshares: 10,
      unfilledshares: 0,
      orderid: '201020000000080',
      text: 'Traded',
      status: 'complete',
      orderstatus: 'complete',
      updatetime: '20-Oct-2020 14:20:10',
      exchtime: '20-Oct-2020 14:20:09',
      exchorderupdatetime: '20-Oct-2020 14:20:10',
      fillid: '112345',
      filltime: '20-Oct-2020 14:20:10',
      parentorderid: '',
      clientcode: 'A102934',
    };

    const record = recordAngelPostback(officialSamplePayload);
    assert.equal(record.orderid, '201020000000080');
    assert.equal(record.tradingsymbol, 'SBIN-EQ');
    assert.equal(record.statusCategory, 'COMPLETE');
    assert.equal(record.fillPercent, 100);
    assert.equal(record.numericPrice, 195.0);
    assert.equal(record.numericAvgPrice, 194.8);
    assert.equal(record.numericFilledShares, 10);
    assert.equal(record.numericUnfilledShares, 0);
    assert.ok(record.receivedAt);

    // Retrieve recent postbacks
    const recents = getRecentAngelPostbacks();
    assert.equal(recents.length, 1);
    assert.equal(recents[0].orderid, '201020000000080');
  });

  await t.test('supports postback querying, filtering, and simulated callback generation', () => {
    clearAngelPostbacks();

    // Ingest simulated partial fill
    const partialRecord = createSimulatedAngelPostback({
      orderid: 'SIM_ORD_101',
      tradingsymbol: 'TATASTEEL-EQ',
      symboltoken: '3499',
      exchange: 'NSE',
      transactiontype: 'BUY',
      quantity: 20,
      price: 155.0,
      event: 'PARTIAL',
      clientcode: 'TEST_USER_1',
    });
    assert.equal(partialRecord.statusCategory, 'PARTIALLY_EXECUTED');
    assert.equal(partialRecord.numericFilledShares, 10);
    assert.equal(partialRecord.fillPercent, 50);

    // Ingest simulated rejection
    const rejectRecord = createSimulatedAngelPostback({
      orderid: 'SIM_ORD_102',
      tradingsymbol: 'RELIANCE-EQ',
      symboltoken: '2885',
      exchange: 'NSE',
      transactiontype: 'SELL',
      quantity: 5,
      price: 2300.0,
      event: 'REJECTED',
      clientcode: 'TEST_USER_2',
      rejectionReason: 'RMS:Rule: Check Margin failed',
    });
    assert.equal(rejectRecord.statusCategory, 'REJECTED');
    assert.equal(rejectRecord.numericFilledShares, 0);
    assert.equal(rejectRecord.fillPercent, 0);

    // Filter by client code
    const user1List = getRecentAngelPostbacks({ clientcode: 'TEST_USER_1' });
    assert.equal(user1List.length, 1);
    assert.equal(user1List[0].tradingsymbol, 'TATASTEEL-EQ');

    // Filter by status category
    const rejectedList = getRecentAngelPostbacks({ statusCategory: 'REJECTED' });
    assert.equal(rejectedList.length, 1);
    assert.equal(rejectedList[0].tradingsymbol, 'RELIANCE-EQ');

    // Filter by order ID
    const orderList = getRecentAngelPostbacks({ orderid: 'SIM_ORD_101' });
    assert.equal(orderList.length, 1);

    // Filter by limit
    const limitedList = getRecentAngelPostbacks({ limit: 1 });
    assert.equal(limitedList.length, 1);

    // Clear postbacks
    clearAngelPostbacks();
    assert.equal(getRecentAngelPostbacks().length, 0);
  });

  await t.test('validates Angel One SmartAPI Margin Calculator URL and rate limits', () => {
    assert.equal(
      ANGEL_MARGIN_BATCH_URL,
      'https://apiconnect.angelone.in/rest/secure/angelbroking/margin/v1/batch'
    );
  });

  await t.test('validates Margin Calculator basket size limits (1 to 50 positions)', async () => {
    // Empty basket
    const emptyRes = await calculateAngelBatchMargin([]);
    assert.equal(emptyRes.status, false);
    assert.equal(emptyRes.errorcode, 'INVALID_BASKET');

    // More than 50 positions
    const oversizedBasket: AngelMarginPosition[] = Array.from({ length: 51 }, (_, i) => ({
      exchange: 'NSE',
      qty: 1,
      price: 100,
      productType: 'INTRADAY',
      token: String(1000 + i),
      tradeType: 'BUY',
    }));
    const overRes = await calculateAngelBatchMargin(oversizedBasket);
    assert.equal(overRes.status, false);
    assert.equal(overRes.errorcode, 'MAX_POSITIONS_EXCEEDED');
  });

  await t.test('calculates batch margin adhering to official SmartAPI documentation structure', async () => {
    // Official doc request: 2 NFO positions
    const officialDocBasket: AngelMarginPosition[] = [
      {
        exchange: 'NFO',
        qty: 50,
        price: 0,
        productType: 'INTRADAY',
        token: '67300',
        tradeType: 'BUY',
        orderType: 'LIMIT',
      },
      {
        exchange: 'NFO',
        qty: 50,
        price: 0,
        productType: 'INTRADAY',
        token: '67308',
        tradeType: 'SELL',
        orderType: 'MARKET',
      },
    ];

    const res = await calculateAngelBatchMargin(officialDocBasket);
    assert.equal(res.status, true);
    assert.equal(res.message, 'SUCCESS');
    assert.ok(res.data);
    assert.ok(res.data.totalMarginRequired > 0);

    const comp = res.data.marginComponents;
    assert.ok(comp);
    assert.ok(typeof comp.netPremium === 'number');
    assert.ok(typeof comp.spanMargin === 'number');
    assert.ok(typeof comp.marginBenefit === 'number');
    assert.ok(typeof comp.deliveryMargin === 'number');
    assert.ok(typeof comp.nonNFOMargin === 'number');
    assert.ok(typeof comp.totOptionsPremium === 'number');

    // Since basket has both BUY and SELL derivative legs, margin benefit is granted
    assert.ok(comp.marginBenefit > 0, 'Hedge benefit must be granted for opposing derivative legs');
  });

  await t.test('calculates equity delivery vs intraday leverage margins accurately', async () => {
    // Equity DELIVERY (CNC): 100% upfront margin
    const deliveryBasket: AngelMarginPosition[] = [
      {
        exchange: 'NSE',
        qty: 10,
        price: 2000,
        productType: 'DELIVERY',
        token: '2885',
        tradeType: 'BUY',
      },
    ];
    const delRes = await calculateAngelBatchMargin(deliveryBasket);
    assert.equal(delRes.status, true);
    assert.equal(delRes.data?.marginComponents.deliveryMargin, 20000);
    assert.equal(delRes.data?.totalMarginRequired, 20000);

    // Equity INTRADAY (MIS): ~20% margin (5x leverage)
    const intradayBasket: AngelMarginPosition[] = [
      {
        exchange: 'NSE',
        qty: 100,
        price: 200,
        productType: 'INTRADAY',
        token: '3045',
        tradeType: 'BUY',
      },
    ];
    const intraRes = await calculateAngelBatchMargin(intradayBasket);
    assert.equal(intraRes.status, true);
    assert.equal(intraRes.data?.marginComponents.nonNFOMargin, 4000);
    assert.equal(intraRes.data?.totalMarginRequired, 4000);
  });

  await t.test('validates Angel One SmartAPI Option Greeks API endpoint URL and request contract', () => {
    assert.equal(
      ANGEL_OPTION_GREEK_URL,
      'https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/optionGreek'
    );

    const officialSampleRequest: AngelOptionGreekRequest = {
      name: 'TCS',
      expirydate: '25JAN2024',
    };
    assert.equal(officialSampleRequest.name, 'TCS');
    assert.equal(officialSampleRequest.expirydate, '25JAN2024');
  });

  await t.test('parses option expiry dates and handles next Thursday defaulting', () => {
    // Explicit DDMMMYYYY format
    const parsedExplicit = parseOptionExpiryToYears('25JAN2024');
    assert.equal(parsedExplicit.formattedExpiry, '25JAN2024');
    assert.ok(parsedExplicit.daysToExpiry >= 1);
    assert.ok(parsedExplicit.yearsToExpiry > 0);

    // Empty/Default computes upcoming Thursday in DDMMMYYYY format
    const parsedDefault = parseOptionExpiryToYears();
    assert.match(parsedDefault.formattedExpiry, /^\d{2}[A-Z]{3}\d{4}$/);
    assert.ok(parsedDefault.daysToExpiry >= 1);
    assert.ok(parsedDefault.yearsToExpiry > 0);
  });

  await t.test('simulates Black-Scholes Option Greeks adhering to SmartAPI sample data shape', () => {
    const res = simulateAngelOptionGreeks('TCS', '25JAN2024', 3900);
    assert.equal(res.status, true);
    assert.equal(res.message, 'SUCCESS');
    assert.equal(res.errorcode, '');
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length > 0);

    // Verify first item matches official documentation sample keys
    const item = res.data[0];
    assert.equal(item.name, 'TCS');
    assert.equal(item.expiry, '25JAN2024');
    assert.ok(typeof item.strikePrice === 'string' && item.strikePrice.includes('.'));
    assert.ok(item.optionType === 'CE' || item.optionType === 'PE');
    assert.ok(typeof item.delta === 'string' && item.delta.includes('.'));
    assert.ok(typeof item.gamma === 'string' && item.gamma.includes('.'));
    assert.ok(typeof item.theta === 'string' && item.theta.includes('.'));
    assert.ok(typeof item.vega === 'string' && item.vega.includes('.'));
    assert.ok(typeof item.impliedVolatility === 'string' && item.impliedVolatility.includes('.'));
    assert.ok(typeof item.tradeVolume === 'string');
  });

  await t.test('verifies Black-Scholes mathematical properties and bounds across strikes', () => {
    const res = simulateAngelOptionGreeks('TCS', '25JAN2024', 3900);
    assert.ok(res.data);

    // Pair CE and PE by strike
    const ceItems = res.data.filter((i) => i.optionType === 'CE');
    const peItems = res.data.filter((i) => i.optionType === 'PE');
    assert.equal(ceItems.length, peItems.length);

    for (let idx = 0; idx < ceItems.length; idx++) {
      const ce = ceItems[idx];
      const pe = peItems[idx];

      const deltaCE = Number(ce.delta);
      const deltaPE = Number(pe.delta);
      const gammaCE = Number(ce.gamma);
      const gammaPE = Number(pe.gamma);
      const vegaCE = Number(ce.vega);
      const thetaCE = Number(ce.theta);
      const thetaPE = Number(pe.theta);
      const ivCE = Number(ce.impliedVolatility);

      // Call Delta must be strictly in (0, 1)
      assert.ok(deltaCE > 0 && deltaCE < 1, `Call Delta ${deltaCE} must be in (0, 1)`);
      // Put Delta must be strictly in (-1, 0)
      assert.ok(deltaPE > -1 && deltaPE < 0, `Put Delta ${deltaPE} must be in (-1, 0)`);
      // Put-Call Parity approximation: Delta(CE) - Delta(PE) ~ 1.0
      assert.ok(Math.abs(deltaCE - deltaPE - 1.0) < 0.05, 'Put-Call Parity Delta difference must be ~1');

      // Gamma must be strictly positive
      assert.ok(gammaCE > 0 && gammaPE > 0, 'Gamma must be strictly positive');
      // Vega must be strictly positive
      assert.ok(vegaCE > 0, 'Vega must be strictly positive');
      // Theta must be negative (time decay)
      assert.ok(thetaCE < 0 && thetaPE < 0, 'Theta must be negative showing time decay');
      // Implied Volatility must be positive percentage
      assert.ok(ivCE > 5 && ivCE < 80, 'IV must be a realistic positive percentage');
    }
  });

  await t.test('handles liquid Indian indices and equities with accurate strike intervals', () => {
    // NIFTY 50: 50-point strike steps
    const nifty = simulateAngelOptionGreeks('NIFTY');
    assert.ok(nifty.data);
    const niftyStrikes = Array.from(new Set(nifty.data.map((i) => Number(i.strikePrice)))).sort((a, b) => a - b);
    assert.equal(niftyStrikes[1] - niftyStrikes[0], 50, 'NIFTY strikes must increment by 50 points');

    // BANK NIFTY: 100-point strike steps
    const bankNifty = simulateAngelOptionGreeks('BANKNIFTY');
    assert.ok(bankNifty.data);
    const bnfStrikes = Array.from(new Set(bankNifty.data.map((i) => Number(i.strikePrice)))).sort((a, b) => a - b);
    assert.equal(bnfStrikes[1] - bnfStrikes[0], 100, 'BANKNIFTY strikes must increment by 100 points');

    // RELIANCE: 20-point strike steps
    const rel = simulateAngelOptionGreeks('RELIANCE');
    assert.ok(rel.data);
    const relStrikes = Array.from(new Set(rel.data.map((i) => Number(i.strikePrice)))).sort((a, b) => a - b);
    assert.equal(relStrikes[1] - relStrikes[0], 20, 'RELIANCE strikes must increment by 20 points');
  });

  await t.test('fetches or simulates Option Greeks reliably through fetchAngelOptionGreeks', async () => {
    const res = await fetchAngelOptionGreeks('INFY');
    assert.equal(res.status, true);
    assert.equal(res.message, 'SUCCESS');
    assert.ok(res.data && res.data.length > 0);
    assert.equal(res.data[0].name, 'INFY');
  });
});
