// C-038 (T-033): C-030 and C-031 again in six low-lying English places, against the Environment Agency's 1 m lidar DTM
// (heights in Ordnance Datum Newlyn), served keyless by WCS as plain text on the British National Grid.
//   node experiments/followups/dem-lowland-england.mjs   (needs .venv with pyproj: see requirements.txt)
// About 120 DEM tiles and 900 Tilequery requests to Mapbox; about 500 WCS requests (one 17 m square a point), one at a
// time and a second apart, cached in .cache/ea/. About 15 minutes the first time. Points go to the British National Grid through tools/osgb.py, which uses Ordnance Survey's OSTN15 grid.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { apiExperiment, fact } from '../lib.mjs';

// Set before any height was read. Boxes are [west, south, east, north].
const PLACES = [
  { name: 'Hull', box: [-0.42, 53.73, -0.28, 53.78] },
  { name: 'Boston', box: [-0.05, 52.96, 0.01, 52.99] },
  { name: 'Bridgwater', box: [-3.03, 51.11, -2.97, 51.14] },
  { name: 'Great Yarmouth', box: [1.7, 52.58, 1.75, 52.63] },
  { name: 'Canvey Island', box: [0.54, 51.51, 0.62, 51.53] },
  { name: 'York', box: [-1.12, 53.94, -1.05, 53.98] },
];
const PER_PLACE = 100, SEED = 38, Z = 14, TILE = 256, TOL = 0.5, BAR = 0.9, PAUSE_MS = 1000;
const WCS = 'https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wcs';
const COVERAGE = '13787b9a-26a4-4775-8523-806d13af58fc__Lidar_Composite_Elevation_DTM_1m';
const UA = 'dem-check/1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');
const CACHE = path.join(ROOT, '.cache/ea');

const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const pixelM = (lat) => (2 * Math.PI * R * Math.cos(rad(lat))) / (2 ** Z * TILE);
const tileXY = ([lng, lat], z) => {
  const n = 2 ** z;
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n];
};
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const quantile = (v, q) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const share = (v, ok) => (v.length ? r2(v.filter(ok).length / v.length) : null);
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pool = async (items, n, fn) => {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};


function toBNG(lnglats) {
  const r = spawnSync(path.join(ROOT, '.venv/bin/python'), ['-I', path.join(ROOT, 'tools/osgb.py')], { input: JSON.stringify(lnglats), encoding: 'utf8', env: { ...process.env, PROJ_NETWORK: 'ON' } });
  if (r.status !== 0) throw new Error('tools/osgb.py: ' + (r.stderr || r.error));
  return JSON.parse(r.stdout);
}
// the lidar's 1 m cells over a square `side` metres across centred on [e, n], as { x0, y0, dx, dy, cells[row][col] }
async function lidar([e, n], side) {
  fs.mkdirSync(CACHE, { recursive: true });
  const h = side / 2, file = path.join(CACHE, `${e}_${n}_${side.toFixed(2)}.txt`);
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (!text) {
    const url = `${WCS}?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${COVERAGE}&format=text/plain&subset=E(${(e - h).toFixed(2)},${(e + h).toFixed(2)})&subset=N(${(n - h).toFixed(2)},${(n + h).toFixed(2)})`;
    let last;
    for (let attempt = 0; attempt < 5 && !text; attempt++) {
      let status = 0;
      try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); status = r.status; const t = await r.text(); if (r.ok && t.includes('Band 0:')) text = t; else last = `${r.status} ${t.slice(0, 120)}`; } catch (err) { last = err.message; }
      // the service answers 429 when asked too fast (it did at four at a time on 2026-11-28): wait a minute, then retry
      if (!text) await new Promise((res) => setTimeout(res, status === 429 ? 60000 * (attempt + 1) : 2000 * (attempt + 1)));
      else await new Promise((res) => setTimeout(res, PAUSE_MS));
    }
    if (!text) throw new Error(`WCS ${e},${n}: ${last}`);
    fs.writeFileSync(file, text);
  }
  const num = (k, d) => { const m = new RegExp(`PARAMETER\\["${k}", (-?[\\d.eE+-]+)\\]`).exec(text); return m ? Number(m[1]) : d; };
  const cells = text.slice(text.indexOf('Band 0:') + 7).trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
  return { x0: num('elt_0_2'), y0: num('elt_1_2'), dx: num('elt_0_0', 1), dy: num('elt_1_1', 1), cells };
}
const valid = (v) => Number.isFinite(v) && v > -1000 && v < 10000;
function readGrid(g, [e, n], px) {
  let under = null, best = Infinity; const one = [], all = [];
  g.cells.forEach((row, j) => row.forEach((v, i) => {
    if (!valid(v)) return;
    const cx = g.x0 + i * g.dx, cy = g.y0 + j * g.dy;
    all.push(v);
    if (Math.abs(cx - e) <= px / 2 && Math.abs(cy - n) <= px / 2) one.push(v);
    const d = Math.hypot(cx - e, cy - n);
    if (d < best) { best = d; under = d <= 0.75 ? v : null; }
  }));
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  return { point: under, one: mean(one), three: mean(all), n_one: one.length, n_three: all.length, min_one: one.length ? Math.min(...one) : null, max_one: one.length ? Math.max(...one) : null };
}

await apiExperiment({
  file: import.meta.url,
  question: "On low-lying ground in six English places, how close are Mapbox's DEM heights to the Environment Agency's 1 m lidar, at the point and averaged over Mapbox's pixel?",
  run: async (api) => {
    const tiles = new Map();
    const tile = async (x, y) => {
      const key = `${x}/${y}`;
      if (!tiles.has(key)) tiles.set(key, api.get(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/${Z}/${x}/${y}.pngraw`).then((r) => {
        if (!r.ok) throw new Error(`tile ${key}: ${r.status} ${r.message}`);
        const png = PNG.sync.read(r.buffer);
        const h = new Float32Array(png.width * png.height);
        for (let i = 0; i < h.length; i++) h[i] = -10000 + (png.data[i * 4] * 65536 + png.data[i * 4 + 1] * 256 + png.data[i * 4 + 2]) * 0.1;
        return { size: png.width, h };
      }));
      return tiles.get(key);
    };
    // at the coordinate, bilinear, as Mapbox's MCP elevation tool reads it (C-009, C-010, C-030)
    const mapboxAt = async (lnglat) => {
      const [cx, cy] = tileXY(lnglat, Z);
      const t = await tile(Math.floor(cx), Math.floor(cy));
      const px = Math.max(0, Math.min(t.size - 1, (cx - Math.floor(cx)) * t.size - 0.5)), py = Math.max(0, Math.min(t.size - 1, (cy - Math.floor(cy)) * t.size - 0.5));
      const x0 = Math.floor(px), y0 = Math.floor(py), x1 = Math.min(t.size - 1, x0 + 1), y1 = Math.min(t.size - 1, y0 + 1), fx = px - x0, fy = py - y0;
      const H = (x, y) => t.h[y * t.size + x];
      return (H(x0, y0) * (1 - fx) + H(x1, y0) * fx) * (1 - fy) + (H(x0, y1) * (1 - fx) + H(x1, y1) * fx) * fy;
    };
    const under = async ([lng, lat]) => {
      const r = await api.get(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?radius=0&layers=water,building&limit=5`);
      if (!r.ok) throw new Error(`tilequery ${lng},${lat}: ${r.status} ${r.message}`);
      const layers = new Set((r.json?.features || []).map((f) => f.properties?.tilequery?.layer));
      return { water: layers.has('water'), building: layers.has('building') };
    };

    const points = [], places = [];
    for (const [k, p] of PLACES.entries()) {
      const rand = rng(SEED + k), [w, s, e, n] = p.box;
      const kept = []; let drawn = 0, water = 0;
      while (kept.length < PER_PLACE) {
        const batch = Array.from({ length: 8 }, () => [Math.round((w + rand() * (e - w)) * 1e6) / 1e6, Math.round((s + rand() * (n - s)) * 1e6) / 1e6]);
        const found = await pool(batch, 4, under);
        for (const [i, lnglat] of batch.entries()) {
          if (kept.length >= PER_PLACE) break;
          drawn++;
          if (found[i].water) { water++; continue; }
          kept.push({ lnglat, building: found[i].building });
        }
      }
      const off = kept.filter((q) => !q.building), bng = toBNG(off.map((q) => q.lnglat));
      // one WCS request at a time, a second apart
      const rows = await pool(off.map((q, i) => ({ ...q, bng: bng[i] })), 1, async (q) => {
        const px = pixelM(q.lnglat[1]), g = readGrid(await lidar(q.bng, 3 * px), q.bng, px), mb = await mapboxAt(q.lnglat);
        const usable = g.point != null && g.one != null && g.three != null;
        return { place: p.name, lng: q.lnglat[0], lat: q.lnglat[1], easting: q.bng[0], northing: q.bng[1], mapbox_m: r2(mb), ea_point_m: r2(g.point), pixel_m: r2(px),
          ea_1px: { mean: r2(g.one), min: r2(g.min_one), max: r2(g.max_one), cells: g.n_one }, ea_3px: { mean: r2(g.three), cells: g.n_three }, usable,
          diff_point_m: usable ? r2(mb - g.point) : null, diff_1px_m: usable ? r2(mb - g.one) : null, diff_3px_m: usable ? r2(mb - g.three) : null };
      });
      points.push(...rows);
      const use = rows.filter((r) => r.usable), d0 = use.map((r) => r.diff_point_m), offset = median(d0);
      places.push({
        place: p.name, box: p.box, drawn, water_redrawn: water, kept: kept.length, on_buildings: kept.length - off.length, no_lidar: off.length - use.length, n: use.length,
        ea_m_median: r2(median(use.map((r) => r.ea_point_m))), median_diff_m: r2(offset), p90_abs_diff_m: r2(quantile(d0.map(Math.abs), 0.9)),
        within_0_5: { point: share(d0, (d) => Math.abs(d) <= TOL), one_pixel: share(use.map((r) => r.diff_1px_m), (d) => Math.abs(d) <= TOL), three_pixels: share(use.map((r) => r.diff_3px_m), (d) => Math.abs(d) <= TOL) },
        within_1_point: share(d0, (d) => Math.abs(d) <= 1),
        within_0_5_median_removed: share(d0, (d) => Math.abs(d - offset) <= TOL),
      });
    }
    const use = points.filter((r) => r.usable), d0 = use.map((r) => r.diff_point_m);
    return {
      facts: [
        fact('Every place kept at least 60 points with a lidar cell under them', places.every((p) => p.n >= 60), Object.fromEntries(places.map((p) => [p.place, p.n]))),
        fact(`Every place has ${BAR * 100}% of points within ${TOL} m at the point, as read`, places.every((p) => p.within_0_5.point >= BAR), Object.fromEntries(places.map((p) => [p.place, p.within_0_5.point]))),
        fact(`Every place has ${BAR * 100}% within ${TOL} m once its median difference is removed`, places.every((p) => p.within_0_5_median_removed >= BAR), Object.fromEntries(places.map((p) => [p.place, [p.median_diff_m, p.within_0_5_median_removed]]))),
        fact(`Every place has ${BAR * 100}% within ${TOL} m with the lidar averaged over one pixel`, places.every((p) => p.within_0_5.one_pixel >= BAR), Object.fromEntries(places.map((p) => [p.place, p.within_0_5.one_pixel]))),
      ],
      numbers: {
        tolerance_m: TOL, bar: BAR, seed: SEED, tiles_read: tiles.size,
        all: { n: use.length, median_diff_m: r2(median(d0)), within_0_5_point: share(d0, (d) => Math.abs(d) <= TOL), within_1_point: share(d0, (d) => Math.abs(d) <= 1),
          within_0_5_one_pixel: share(use.map((r) => r.diff_1px_m), (d) => Math.abs(d) <= TOL), within_0_5_three_pixels: share(use.map((r) => r.diff_3px_m), (d) => Math.abs(d) <= TOL),
          place_medians_m: [Math.min(...places.map((p) => p.median_diff_m)), Math.max(...places.map((p) => p.median_diff_m))] },
        places, points,
      },
    };
  },
});
