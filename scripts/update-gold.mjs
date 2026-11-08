// Builds gold.json: today's international gold and silver prices in Saudi riyals per gram.
// Run by .github/workflows/gold-price.yml once a day. Needs Node 22 (built-in fetch). No API key.
//
// gold.json is served from GitHub Pages and read by the app's zakat calculator (assets/js/gold.js).
// If every price source fails, the old gold.json is left untouched; the script only exits with an error
// when that file is more than 3 days old (or missing), so a single bad day does not send a failure email.

import { readFile, writeFile } from "node:fs/promises";

const OUT = "gold.json";
const USD_SAR = 3.75; // the riyal is pegged to the dollar
const GRAMS_PER_TROY_OUNCE = 31.1034768;

// Sanity limits for USD per troy ounce; anything outside is treated as bad data.
const LIMITS = { gold: [800, 20000], silver: [5, 500] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Browser-like headers: some price sites answer 403 to bare script requests.
const HEADERS = {
  accept: "application/json",
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

// One request, retried up to 3 times with a pause (a single network hiccup should not fail the day).
async function getJson(url) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      const cause = err && err.cause && err.cause.code ? ` (${err.cause.code})` : "";
      console.warn(`  attempt ${attempt} failed for ${url}: ${err.message}${cause}`);
      if (attempt < 3) await sleep(attempt * 5000);
    }
  }
  throw lastErr;
}

// Swissquote's public quote feed returns a list of bid/ask pairs; use the middle of the first pair.
async function swissquote(symbol) {
  const data = await getJson(`https://forex-data-feed.swissquote.com/public-quote/feeds/instrument/${symbol}/USD`);
  const prices = data && data[0] && data[0].spreadProfilePrices && data[0].spreadProfilePrices[0];
  if (!prices) throw new Error("unexpected Swissquote response");
  return (Number(prices.bid) + Number(prices.ask)) / 2;
}

const SOURCES = [
  {
    name: "gold-api.com",
    async fetch() {
      const [xau, xag] = await Promise.all([getJson("https://api.gold-api.com/price/XAU"), getJson("https://api.gold-api.com/price/XAG").catch(() => null)]);
      return { gold: Number(xau.price), silver: xag ? Number(xag.price) : null };
    },
  },
  {
    name: "swissquote.com",
    async fetch() {
      const gold = await swissquote("XAU");
      const silver = await swissquote("XAG").catch(() => null);
      return { gold, silver };
    },
  },
  {
    name: "goldprice.org",
    async fetch() {
      const data = await getJson("https://data-asg.goldprice.org/dbXRates/USD");
      const item = data.items && data.items[0];
      return { gold: Number(item.xauPrice), silver: item.xagPrice ? Number(item.xagPrice) : null };
    },
  },
];

const inRange = (v, [lo, hi]) => Number.isFinite(v) && v >= lo && v <= hi;
const perGramSar = (usdPerOunce) => Math.round((usdPerOunce / GRAMS_PER_TROY_OUNCE) * USD_SAR * 100) / 100;

let previous = null;
try {
  previous = JSON.parse(await readFile(OUT, "utf8"));
} catch (_) {}

let result = null;
const errors = [];
for (const source of SOURCES) {
  try {
    const { gold, silver } = await source.fetch();
    if (!inRange(gold, LIMITS.gold)) throw new Error(`gold price out of range: ${gold}`);
    const goldSar = perGramSar(gold);
    const silverSar = inRange(silver, LIMITS.silver) ? perGramSar(silver) : null;

    // A jump of more than 25% in a day is more likely bad data than a real move.
    if (previous && previous.gold24 > 0 && Math.abs(goldSar - previous.gold24) / previous.gold24 > 0.25) {
      throw new Error(`gold price jumped from ${previous.gold24} to ${goldSar}`);
    }

    result = { source: source.name, gold24: goldSar, silver: silverSar, goldUsdPerOunce: gold };
    console.log(`OK from ${source.name}:`, result);
    break;
  } catch (err) {
    errors.push(`${source.name}: ${err.message}`);
    console.warn(`Source ${source.name} failed: ${err.message}`);
  }
}

if (!result) {
  console.error("All price sources failed:\n" + errors.join("\n"));
  // One bad day is harmless: the app keeps showing the last price (with its date). Only fail loudly
  // (which sends an email) when the saved price is more than 3 days old or missing.
  const ageDays = previous && previous.updated ? (Date.now() - new Date(previous.updated).getTime()) / 86400000 : Infinity;
  if (ageDays <= 3) {
    console.warn(`Keeping the existing gold.json (${ageDays.toFixed(1)} days old). Will try again tomorrow.`);
    process.exit(0);
  }
  process.exit(1);
}

const out = {
  updated: new Date().toISOString(),
  currency: "SAR",
  source: result.source,
  gold24: result.gold24, // SAR per gram, 24 carat
  silver: result.silver, // SAR per gram, may be null
};
await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
console.log("Wrote", OUT, out);
