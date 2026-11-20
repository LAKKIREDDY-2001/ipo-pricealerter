import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Growth, Virality & Lead Capture Suite', () => {
  it('calculates retail allotment odds accurately for oversubscribed IPOs', () => {
    const retailSubMultiple = 18.5;
    const nPans = 3;

    // Single PAN odds: 1 / 18.5 = 5.405%
    const singleOddsPct = (1 / retailSubMultiple) * 100;
    assert.ok(Math.abs(singleOddsPct - 5.405) < 0.01);

    // Combined odds for 3 PANs: 1 - (1 - 1/18.5)^3
    const combinedOddsPct = (1 - Math.pow(1 - 1 / retailSubMultiple, nPans)) * 100;
    assert.ok(combinedOddsPct > 15.0 && combinedOddsPct < 15.6);
  });

  it('calculates expected listing profit from lot size and GMP', () => {
    const lotSize = 75;
    const issuePrice = 195;
    const gmp = 45;

    const estProfit = lotSize * gmp;
    const estListingPrice = issuePrice + gmp;
    const estGainPct = (gmp / issuePrice) * 100;

    assert.equal(estProfit, 3375);
    assert.equal(estListingPrice, 240);
    assert.ok(Math.abs(estGainPct - 23.07) < 0.02);
  });

  it('validates quick-join subscriber input format for email and phone numbers', () => {
    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
    const isValidIndianPhone = (p: string) => /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(p.trim().replace(/[\s\-]/g, ''));

    assert.equal(isValidEmail('investor@gmail.com'), true);
    assert.equal(isValidEmail('invalid-email'), false);

    assert.equal(isValidIndianPhone('9876543210'), true);
    assert.equal(isValidIndianPhone('+91 9876543210'), true);
    assert.equal(isValidIndianPhone('+91-8888888888'), true);
    assert.equal(isValidIndianPhone('12345'), false);
  });

  it('generates properly encoded WhatsApp and Telegram sharing URLs', () => {
    const title = 'Crystal Crop Protection IPO';
    const summary = '🔥 Crystal Crop Protection IPO (Mainboard)\nGMP: +₹65\nPrice: ₹415';
    const url = 'https://pricealerter.in/ipo/crystal-crop-protection-ipo';

    const shareText = `${summary}\n\n👉 Track live on PriceAlerter: ${url}`;
    const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(summary)}`;

    assert.ok(whatsappHref.startsWith('https://api.whatsapp.com/send?text='));
    assert.ok(whatsappHref.includes(encodeURIComponent('Crystal Crop Protection IPO')));
    assert.ok(telegramHref.startsWith('https://t.me/share/url?'));
    assert.ok(telegramHref.includes(encodeURIComponent(url)));
  });
});
