/* Combined fallback security directory.
   Loaded after ipo-data.js and listed-gains-data.js. */
(function (window) {
  "use strict";
  const listed = window.ListedGainsData && Array.isArray(window.ListedGainsData.records)
    ? window.ListedGainsData.records : [];
  const ipos = window.IpoData && Array.isArray(window.IpoData.records)
    ? window.IpoData.records : [];
  window.SecuritiesMaster = {
    source: "PriceAlerter merged listed-company and IPO directory",
    records: listed.concat(ipos)
  };
})(window);
