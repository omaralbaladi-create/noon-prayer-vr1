// Builds gold.json: today's international gold and silver prices in Saudi riyals per gram.
// Run by .github/workflows/gold-price.yml once a day. Needs Node 22 (built-in fetch). No API key.
//
// gold.json is served from GitHub Pages and read by the app's zakat calculator (assets/js/gold.js).
// If every price source fails, this script exits with an error and leaves the old gold.json untouched.

import { readFile, writeFile } from "node:fs/promises";

const OUT = "gold.json";
const USD_SAR = 3.75; // the riyal is pegged to the dollar
const GRAMS_PER_TROY_OUNCE = 31.1034768;

// Sanity limits for USD per troy ounce; anything outside is treated as bad data.
const LIMITS = { gold: [800, 20000], silver: [5, 500] };

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "noorprayer-gold-updater" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
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
