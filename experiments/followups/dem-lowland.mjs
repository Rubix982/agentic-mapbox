// C-030 (T-028): Mapbox's DEM on low-lying ground, against USGS's 1 m lidar-derived bare-earth DEM (3DEP), at 100
// random land points in each of six flood-prone US places.
//   node experiments/followups/dem-lowland.mjs
// About 80 zoom-14 DEM tiles and 900 Tilequery requests to Mapbox, and 600 requests to USGS's Elevation Point Query
// Service (free, no key), which are cached in .cache/usgs-epqs/ so a second run sends none.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { apiExperiment, fact } from '../lib.mjs';

// Set before any height was read. Boxes are [west, south, east, north].
const PLACES = [
  { name: 'New Orleans, LA', box: [-90.13, 29.93, -90.03, 30.0] },
  { name: 'Miami Beach, FL', box: [-80.145, 25.77, -80.118, 25.86] },
  { name: 'Norfolk, VA', box: [-76.33, 36.84, -76.25, 36.9] },
  { name: 'Galveston, TX', box: [-94.85, 29.27, -94.77, 29.31] },
  { name: 'Charleston, SC', box: [-79.96, 32.77, -79.925, 32.81] },
  { name: 'Sacramento, CA', box: [-121.55, 38.48, -121.47, 38.56] },
];
const PER_PLACE = 100, SEED = 30, Z = 14, TOL = 0.5, BAR = 0.9;
const USGS = 'https://epqs.nationalmap.gov/v1/json';
const UA = 'dem-check/1.0';
const CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.cache/usgs-epqs');

const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const tileXY = ([lng, lat], z) => {
  const n = 2 ** z;
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n];
};
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const quantile = (v, q) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const share = (v, ok) => (v.length ? r2(v.filter(ok).length / v.length) : null);
// mulberry32: the same points on every run
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pool = async (items, n, fn) => {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};

async function usgs([lng, lat]) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${lng}_${lat}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const url = `${USGS}?x=${lng}&y=${lat}&wkid=4326&units=Meters&includeDate=true`;
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const j = await r.json();
        const out = { value: j.value == null ? null : Number(j.value), resolution: j.resolution ?? null, date: j.attributes?.AcquisitionDate ?? null };
        fs.writeFileSync(file, JSON.stringify(out) + '\n');
        return out;
      }
      last = `status ${r.status}`;
    } catch (e) { last = e.message; }
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  throw new Error(`USGS ${lng},${lat}: ${last}`);
}

await apiExperiment({
  file: import.meta.url,
  question: "On low-lying ground in six flood-prone US places, how close are Mapbox's DEM heights to USGS's 1 m lidar-derived DEM?",
  run: async (api) => {
    const tiles = new Map();
    const tile = async (x, y) => {
      const key = `${x}/${y}`;
      // the promise is kept, so points read in parallel never fetch the same tile twice
      if (!tiles.has(key)) tiles.set(key, api.get(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/${Z}/${x}/${y}.pngraw`).then((r) => {
        if (!r.ok) throw new Error(`tile ${key}: ${r.status} ${r.message}`);
        const png = PNG.sync.read(r.buffer);
        const h = new Float32Array(png.width * png.height);
        for (let i = 0; i < h.length; i++) h[i] = -10000 + (png.data[i * 4] * 65536 + png.data[i * 4 + 1] * 256 + png.data[i * 4 + 2]) * 0.1;
        return { size: png.width, h };
      }));
      return tiles.get(key);
    };
    // at the coordinate, bilinear, as Mapbox's MCP elevation tool reads it (C-009, C-010)
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
      const heights = await pool(kept, 4, async (q) => ({ ...q, usgs: await usgs(q.lnglat), mapbox: await mapboxAt(q.lnglat) }));
      const rows = heights.map((q) => {
        // USGS gives resolution in metres for its 1 m DEM (sometimes as 1.000000005) and in degrees for its 1/9 arc-second
        // (about 3 m) DEM, as 0.0000308642; only the 1 m answers count
        const usable = q.usgs.value != null && q.usgs.value > -1e5 && q.usgs.resolution != null && Math.abs(q.usgs.resolution - 1) < 1e-6;
        return { place: p.name, lng: q.lnglat[0], lat: q.lnglat[1], building: q.building, mapbox_m: r2(q.mapbox), usgs_m: r2(q.usgs.value),
          usgs_resolution_m: q.usgs.resolution, usgs_date: q.usgs.date, usable, diff_m: usable ? r2(q.mapbox - q.usgs.value) : null };
      });
      points.push(...rows);
      const use = rows.filter((r) => r.usable), off = use.filter((r) => !r.building), on = use.filter((r) => r.building);
      const dOff = off.map((r) => r.diff_m), dOn = on.map((r) => r.diff_m), offset = median(dOff);
      const years = use.map((r) => Number(String(r.usgs_date || '').split('/').pop())).filter((y) => y > 1990);
      places.push({
        place: p.name, box: p.box, drawn, water_redrawn: water, kept: rows.length, dropped_usgs: rows.length - use.length,
        off_buildings: off.length, on_buildings: on.length,
        usgs_m_median: r2(median(off.map((r) => r.usgs_m))), mapbox_m_median: r2(median(off.map((r) => r.mapbox_m))),
        median_diff_m: r2(offset), p90_abs_diff_m: r2(quantile(dOff.map(Math.abs), 0.9)),
        within_0_5_as_read: share(dOff, (d) => Math.abs(d) <= TOL), within_1_as_read: share(dOff, (d) => Math.abs(d) <= 1),
        within_0_5_offset_removed: share(dOff, (d) => Math.abs(d - offset) <= TOL), within_1_offset_removed: share(dOff, (d) => Math.abs(d - offset) <= 1),
        p90_abs_diff_offset_removed_m: r2(quantile(dOff.map((d) => Math.abs(d - offset)), 0.9)),
        on_buildings_median_diff_m: r2(median(dOn)), lidar_years: years.length ? [Math.min(...years), Math.max(...years)] : null,
      });
    }
    const all = points.filter((r) => r.usable && !r.building).map((r) => r.diff_m);
    return {
      facts: [
        fact('Every place kept at least 90 points off buildings with a height from USGS\'s 1 m DEM', places.every((p) => p.off_buildings >= 90),
          Object.fromEntries(places.map((p) => [p.place, p.off_buildings]))),
        fact(`In every place at least ${BAR * 100}% of points off buildings read within ${TOL} m of USGS as read`, places.every((p) => p.within_0_5_as_read >= BAR),
          Object.fromEntries(places.map((p) => [p.place, p.within_0_5_as_read]))),
        fact(`In every place at least ${BAR * 100}% read within ${TOL} m once the place's median difference is removed`, places.every((p) => p.within_0_5_offset_removed >= BAR),
          Object.fromEntries(places.map((p) => [p.place, [p.median_diff_m, p.within_0_5_offset_removed]]))),
        fact(`In every place, points on buildings read within ${TOL} m of the rest by median difference`,
          places.every((p) => p.on_buildings_median_diff_m == null || Math.abs(p.on_buildings_median_diff_m - p.median_diff_m) <= TOL),
          Object.fromEntries(places.map((p) => [p.place, [p.on_buildings, p.on_buildings_median_diff_m, p.median_diff_m]]))),
      ],
      numbers: {
        tolerance_m: TOL, bar: BAR, seed: SEED, tiles_read: tiles.size,
        all_places_off_buildings: { n: all.length, median_diff_m: r2(median(all)), within_0_5_as_read: share(all, (d) => Math.abs(d) <= TOL), within_1_as_read: share(all, (d) => Math.abs(d) <= 1) },
        places, points,
      },
    };
  },
});
