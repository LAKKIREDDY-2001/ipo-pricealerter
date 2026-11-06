#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..", "_site");
const fail = (message) => { console.error("AdSense preflight failed: " + message); process.exitCode = 1; };
const read = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { fail("Missing required file: " + file); return ""; }
  return fs.readFileSync(full, "utf8");
};
const required = [
  "index.html","about.html","contact.html","privacy.html","terms.html",
  "disclaimer.html","editorial-policy.html","ads.txt","robots.txt","sitemap.xml",
  "blog/index.html","app.js","subscribers.js"
];
for (const file of required) read(file);
const home = read("index.html");
const privacy = read("privacy.html");
const contact = read("contact.html");
const editorial = read("editorial-policy.html");
const app = read("app.js");
const subscribers = read("subscribers.js");
const ads = read("ads.txt");
const sitemap = read("sitemap.xml");

if (!home.includes('<meta name="google-adsense-account" content="ca-pub-1181608933401999">')) fail("Homepage AdSense publisher verification meta tag is missing.");
if (home.includes("adsbygoogle.js")) fail("Auto ads should not load on interactive app routes; AdSense code is reserved for editorial content pages.");
if (!ads.split(/\r?\n/).some(line => /^google\.com, pub-1181608933401999, DIRECT, f08c47fec0942fa0$/.test(line.trim()))) fail("ads.txt publisher declaration is missing or malformed.");
if (!privacy.includes("Google AdSense") || !privacy.includes("Google Analytics 4") || !privacy.includes("FormSubmit") || !privacy.toLowerCase().includes("third parties may place")) fail("Privacy policy is missing an actual service/data disclosure.");
if (!contact.includes("mailto:lakkistudy@gmail.com") || !contact.includes("Your message has not been sent until you send it")) fail("Contact page must clearly explain the email handoff.");
if (/contact@pricealerter\.in|privacy@pricealerter\.in|legal@pricealerter\.in/.test([home,privacy,contact,editorial].join("\n"))) fail("An unverified mailbox is still published.");
if (/(Accept All|Essential Only)/.test([home, ...fs.readdirSync(path.join(root,"blog")).filter(x=>x.endsWith(".html")).map(x=>read("blog/"+x))].join("\n"))) fail("A cosmetic consent button is still presented as a consent choice.");
if (home.includes("infolinks") || app.toLowerCase().includes("infolinks") || ads.toLowerCase().includes("infolinks")) fail("Unused Infolinks integration remains.");
if (app.includes("renderAdSenseUnit") || app.includes("adsense-slot-card")) fail("Affiliate placement is still named as an AdSense unit.");
if (/href="https:\/\/mdeal\.in\/[^"]+"[^>]*rel="noopener noreferrer"/.test(home + "\n" + app)) fail("An affiliate URL is missing rel=sponsored.");
if (!editorial.includes("affiliate tracking") || !editorial.includes("Sponsored")) fail("Editorial standards do not disclose affiliate relationships.");
if (!sitemap.includes("https://pricealerter.in/editorial-policy.html")) fail("Editorial standards page is absent from sitemap.");
if (sitemap.includes("https://pricealerter.in/blog/what-is-ipo.html") || sitemap.includes("https://pricealerter.in/blog/how-to-apply-ipo-upi.html")) fail("Duplicate canonical articles are still in sitemap.");
if (!read("blog/what-is-ipo.html").includes('content="noindex,follow"') || !read("blog/how-to-apply-ipo-upi.html").includes('content="noindex,follow"')) fail("Duplicate articles must be noindexed.");
if (!subscribers.includes("Never turn an unsubscribe request into a new subscription.") || !subscribers.includes("Automatic unsubscribe is temporarily unavailable")) fail("Subscription/unsubscribe fallback safeguards are missing.");

const legalPages = ["about.html","contact.html","privacy.html","terms.html","disclaimer.html","editorial-policy.html"];
for (const file of legalPages) {
  const html = read(file);
  if (html.includes("adsbygoogle.js")) fail("Auto ads code must not be loaded on the non-content page " + file);
  if (!html.includes("privacy.html") && file !== "privacy.html") fail("Missing privacy-policy navigation on " + file);
}
const articles = [
  "what-is-an-ipo.html","how-to-apply-for-ipo.html","understanding-grey-market-premium-gmp.html",
  "ipo-vs-fpo-vs-ofs.html","how-ipo-allotment-works.html","top-10-ipo-investing-tips.html",
  "how-to-check-ipo-allotment-status.html","what-is-book-building-process.html",
  "mainboard-vs-sme-ipo.html","how-to-open-demat-account-for-ipo.html"
];
for (const file of articles) {
  const html = read("blog/"+file);
  if (!html.includes('name="description"') || !html.includes('rel="canonical"')) fail("Missing SEO metadata in blog/"+file);
  if (!html.includes("adsbygoogle.js")) fail("AdSense content-page code missing in blog/"+file);
  if (!html.includes("PriceAlerter Editorial Desk") || html.includes("Lead Financial Analyst")) fail("Unverified author credential in blog/"+file);
  if (!html.includes("Official sources and verification")) fail("Missing official verification links in blog/"+file);
  if (!html.includes("editorial-policy.html")) fail("Missing editorial standards link in blog/"+file);
}
if (process.exitCode) process.exit(process.exitCode);
console.log("AdSense preflight passed: policy pages, privacy disclosures, ads.txt, canonical articles, affiliate labels and navigation.");
