// C-036 (T-028, candidate 3): 500 random official addresses in each of New Orleans and New York, sent to Mapbox's
// Geocoding v6 forward endpoint, and how far its first result lies from the city's own point.
//   node experiments/followups/geocode-addresses.mjs
// Temporary geocoding, whose results "are not allowed to be cached" (Mapbox's docs): each result is compared in memory
// and dropped, and only counts are written. 1,000 geocoding requests; about 1,000 single-row requests to the cities'
// open-data portals (keyless).
import { apiExperiment, fact, metres } from '../lib.mjs';

const PER_CITY = 500, SEED = 36, BAR = 0.9, AT_ONCE = 4;
const UA = 'dem-check/1.0';
const BUCKETS = [[10, 'within 10 m'], [50, '10 to 50 m'], [100, '50 to 100 m'], [500, '100 to 500 m'], [Infinity, 'beyond 500 m']];
const BOROUGH = { 1: 'Manhattan', 2: 'Bronx', 3: 'Brooklyn', 4: 'Queens', 5: 'Staten Island' };
const CITIES = [
  { name: 'New Orleans', url: 'https://data.nola.gov/resource/hfvu-md72.json',
    keep: (r) => r.status === 'Current' && r.fulladdr && r.the_geom?.coordinates,
    line: (r) => `${r.fulladdr}, New Orleans, Louisiana` },
  { name: 'New York', url: 'https://data.cityofnewyork.us/resource/uf93-f8nk.json',
    keep: (r) => r.house_number && r.full_street_name && BOROUGH[r.boroughcode] && r.the_geom?.coordinates,
    line: (r) => `${r.house_number} ${r.full_street_name}, ${BOROUGH[r.boroughcode]}, New York${r.zipcode ? ' ' + r.zipcode : ''}` },
];

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pool = async (items, n, fn) => {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};
const getJSON = async (url) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.ok) return await r.json(); } catch {}
    await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
  }
  throw new Error(`no answer from ${url.slice(0, 80)}`);
};

await apiExperiment({
  file: import.meta.url,
  question: "How often does Mapbox's geocoder put a city's own addresses more than 50 m from the city's point?",
  run: async (api) => {
    const cities = [];
    for (const [k, c] of CITIES.entries()) {
      const total = Number((await getJSON(`${c.url}?$select=count(*)`))[0].count);
      const rand = rng(SEED + k), picked = [], seen = new Set();
      let skipped = 0;
      while (picked.length < PER_CITY) {
        const offsets = Array.from({ length: AT_ONCE * 2 }, () => Math.floor(rand() * total)).filter((o) => !seen.has(o));
        offsets.forEach((o) => seen.add(o));
        const rows = await pool(offsets, AT_ONCE, async (o) => (await getJSON(`${c.url}?$order=:id&$limit=1&$offset=${o}`))[0]);
        for (const r of rows) { if (picked.length >= PER_CITY) break; if (r && c.keep(r)) picked.push(r); else skipped++; }
      }
      // compare in memory; only these counts leave this function
      const counts = Object.fromEntries(BUCKETS.map(([, label]) => [label, 0])); counts['no result'] = 0;
      const byConfidence = {}, byAccuracy = {}, farByConfidence = {};
      await pool(picked, AT_ONCE, async (r) => {
        const q = encodeURIComponent(c.line(r));
        const res = await api.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${q}&types=address&limit=1&country=us`);
        if (!res.ok) throw new Error(`geocoding: ${res.status} ${res.message}`);
        const f = res.json?.features?.[0];
        if (!f) { counts['no result']++; return; }
        const d = metres(f.geometry.coordinates, r.the_geom.coordinates);
        const label = BUCKETS.find(([max]) => d <= max)[1];
        counts[label]++;
        const conf = f.properties?.match_code?.confidence || 'none', acc = f.properties?.coordinates?.accuracy || 'none';
        byConfidence[conf] = (byConfidence[conf] || 0) + 1;
        byAccuracy[acc] = (byAccuracy[acc] || 0) + 1;
        if (d > 50) farByConfidence[conf] = (farByConfidence[conf] || 0) + 1;
      });
      const within50 = (counts['within 10 m'] + counts['10 to 50 m']) / PER_CITY;
      cities.push({ city: c.name, addresses_in_list: total, sampled: PER_CITY, rows_skipped: skipped, counts, within_50_m: Math.round(within50 * 100) / 100,
        beyond_500_m: Math.round((counts['beyond 500 m'] / PER_CITY) * 100) / 100, by_confidence: byConfidence, by_accuracy: byAccuracy, beyond_50_m_by_confidence: farByConfidence });
    }
    return {
      facts: [
        fact(`Every city has at least ${BAR * 100}% of addresses within 50 m of its own point`, cities.every((c) => c.within_50_m >= BAR), Object.fromEntries(cities.map((c) => [c.city, c.within_50_m]))),
        fact(`Each city's sample has ${PER_CITY} addresses from its own list`, cities.every((c) => Object.values(c.counts).reduce((a, b) => a + b, 0) === PER_CITY), Object.fromEntries(cities.map((c) => [c.city, c.rows_skipped]))),
      ],
      numbers: { per_city: PER_CITY, seed: SEED, cities, kept: 'counts only; no geocoding result or per-address distance is stored' },
    };
  },
});
