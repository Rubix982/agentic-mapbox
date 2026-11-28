// C-034 (T-032): for each of C-030's 468 low-lying US points, USGS's lidar averaged over squares 50 m and 100 m across,
// against Mapbox's height from C-030, beside C-031's point, 8 m and 25 m. No Mapbox requests; 936 requests to USGS's
// 3DEP elevation service (free, no key), cached in .cache/usgs-stats/.
//   node experiments/followups/dem-lowland-wide.mjs   (needs C-030's and C-031's results)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiExperiment, fact } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C031 = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-lowland-pixel.json'), 'utf8'));
const SERVICE = 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/computeStatisticsHistograms';
const UA = 'dem-check/1.0';
const CACHE = path.join(HERE, '../../.cache/usgs-stats');
const TOL = 0.5, BAR = 0.9, SIDES = [50, 100];
const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const share = (v, ok) => (v.length ? r2(v.filter(ok).length / v.length) : null);
const pool = async (items, n, fn) => {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};

// the lidar's statistics over a square `side` metres across, centred on [lng, lat]
async function stats([lng, lat], side) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${lng}_${lat}_${side.toFixed(2)}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const h = side / 2, dLat = h / 111320, dLng = h / (111320 * Math.cos(rad(lat)));
  const ring = [[lng - dLng, lat - dLat], [lng + dLng, lat - dLat], [lng + dLng, lat + dLat], [lng - dLng, lat + dLat], [lng - dLng, lat - dLat]];
  const url = `${SERVICE}?geometry=${encodeURIComponent(JSON.stringify({ rings: [ring], spatialReference: { wkid: 4326 } }))}&geometryType=esriGeometryPolygon&f=json`;
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const j = await r.json();
        const s = j.statistics?.[0];
        if (s) {
          const out = { mean: s.mean, min: s.min, max: s.max, count: s.count };
          fs.writeFileSync(file, JSON.stringify(out) + '\n');
          return out;
        }
        last = 'no statistics: ' + JSON.stringify(j).slice(0, 120);
      } else last = `status ${r.status}`;
    } catch (e) { last = e.message; }
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  throw new Error(`USGS stats ${lng},${lat} (${side} m): ${last}`);
}

await apiExperiment({
  file: import.meta.url,
  question: "Averaged over 50 m or 100 m, does USGS's lidar agree with Mapbox's height at C-030's 468 US points?",
  run: async () => {
    const pts = C031.numbers.points;
    const rows = await pool(pts, 4, async (p) => {
      const wide = {};
      for (const side of SIDES) { const s = await stats([p.lng, p.lat], side); wide[side] = { mean: r2(s.mean), min: r2(s.min), max: r2(s.max), count: s.count }; }
      return { place: p.place, lng: p.lng, lat: p.lat, mapbox_m: p.mapbox_m, diff_point_m: p.diff_point_m, diff_8m_m: p.diff_1px_m, diff_25m_m: p.diff_3px_m,
        lidar_50m: wide[50], lidar_100m: wide[100], diff_50m_m: r2(p.mapbox_m - wide[50].mean), diff_100m_m: r2(p.mapbox_m - wide[100].mean) };
    });
    const scales = [['point', 'diff_point_m'], ['8 m', 'diff_8m_m'], ['25 m', 'diff_25m_m'], ['50 m', 'diff_50m_m'], ['100 m', 'diff_100m_m']];
    const summarise = (rs) => ({ n: rs.length, within_0_5: Object.fromEntries(scales.map(([k, f]) => [k, share(rs.map((r) => r[f]), (d) => Math.abs(d) <= TOL)])),
      within_1: Object.fromEntries(scales.map(([k, f]) => [k, share(rs.map((r) => r[f]), (d) => Math.abs(d) <= 1)])),
      median_m: Object.fromEntries(scales.map(([k, f]) => [k, r2(median(rs.map((r) => r[f])))])) });
    const places = [...new Set(rows.map((r) => r.place))].map((place) => ({ place, ...summarise(rows.filter((r) => r.place === place)) }));
    return {
      facts: [
        fact('Every 50 m and 100 m square came back with lidar cells', rows.every((r) => r.lidar_50m.count > 0 && r.lidar_100m.count > 0),
          { counts_50m: [...new Set(rows.map((r) => r.lidar_50m.count))].slice(0, 5), counts_100m: [...new Set(rows.map((r) => r.lidar_100m.count))].slice(0, 5) }),
        fact(`Every place has ${BAR * 100}% of points within ${TOL} m with lidar averaged over 50 m`, places.every((p) => p.within_0_5['50 m'] >= BAR), Object.fromEntries(places.map((p) => [p.place, p.within_0_5['50 m']]))),
        fact(`Every place has ${BAR * 100}% of points within ${TOL} m with lidar averaged over 100 m`, places.every((p) => p.within_0_5['100 m'] >= BAR), Object.fromEntries(places.map((p) => [p.place, p.within_0_5['100 m']]))),
      ],
      numbers: { tolerance_m: TOL, bar: BAR, all: summarise(rows), places, points: rows },
    };
  },
});
