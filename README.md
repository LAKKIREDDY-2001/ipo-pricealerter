# Pricealerter

Pricealerter is a plain static website built with HTML, CSS and vanilla JavaScript. It has no Next.js, React, API server, database, login or signup flow.

## Open it

Serve this folder with any static file host. For local development, from this folder run:

```sh
python3 -m http.server 3000
```

Then open <http://localhost:3000>.

## IPO data

The website reads its dataset from `data/ipo-data.js`. It contains no sample IPOs. Add only verified issue records and set `updatedAt` to the snapshot time. A static site cannot refresh exchange data by itself; its display changes when this data file is replaced and the page is reloaded.

Each record can use these fields:

```js
{
  id: "",
  slug: "",
  companyName: "",
  shortName: "",
  initials: "",
  color: "",
  status: "UPCOMING", // UPCOMING, OPEN, CLOSED, LISTED
  board: "UNKNOWN", // MAINBOARD, SME, UNKNOWN
  exchange: "UNKNOWN", // NSE, BSE, BOTH, UNKNOWN
  issueType: "UNKNOWN",
  priceBandLow: null,
  priceBandHigh: null,
  issuePrice: null,
  issueSizeCr: null,
  lotSize: null,
  openDate: null,
  closeDate: null,
  allotDate: null,
  listingDate: null,
  gmp: null,
  gmpUpdatedAt: null,
  gmpHistory: [],
  subscriptionSummary: null,
  subscription: [],
  listingPrice: null,
  listingGain: null,
  sourceUrl: null,
  prospectusUrl: null,
  registrarUrl: null,
  officialLinks: []
}
```

Use `null` for unknown figures and dates. Minimum investment is calculated only from a valid upper price band and lot size. GMP percentage uses the upper price band. History charts only use observations entered in the record; they do not create points.

## Features

- Dashboard status tabs, board/exchange filters, search and sorting
- IPO details and source links
- Monthly issue calendar
- GMP table and history charts
- Device-local watchlist and status-change alerts

Watchlist alerts compare the current dataset with the last dataset opened in that browser. Browser notifications require permission. A static website cannot send background alerts or fetch new IPOs while it is closed.
