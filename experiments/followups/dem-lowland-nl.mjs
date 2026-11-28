// C-032 (T-030): C-030 and C-031 again in six low-lying Dutch places, against AHN4's 0.5 m bare-ground lidar DEM
// (heights in NAP), served keyless by Esri Nederland's image server.
//   node experiments/followups/dem-lowland-nl.mjs
// About 120 DEM tiles and 900 Tilequery requests to Mapbox; about 1,800 requests to the AHN server (a point and two
// squares a point), cached in .cache/ahn/ so a second run sends none.
//
// Every AHN request is sent in RD New (EPSG:28992) coordinates converted here. Probed on 2026-11-28, the server's
// statistics for a square sent in GPS coordinates came from a different place than its point sample did; in RD both
// agree. The conversion is Schreutelkamp and Strang van Hees's approximation, good to about a metre.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { apiExperiment, fact } from '../lib.mjs';

// Set before any height was read. Boxes are [west, south, east, north].
const PLACES = [
  { name: 'Rotterdam', box: [4.44, 51.9, 4.56, 51.96] },
  { name: 'Amsterdam', box: [4.86, 52.34, 4.96, 52.39] },
  { name: 'Almere', box: [5.17, 52.35, 5.27, 52.4] },
  { name: 'Dordrecht', box: [4.64, 51.78, 4.72, 51.82] },
  { name: 'Middelburg', box: [3.58, 51.48, 3.64, 51.51] },
  { name: 'Zwolle', box: [6.06, 52.49, 6.12, 52.53] },
];
const PER_PLACE = 100, SEED = 32, Z = 14, TILE = 256, TOL = 0.5, BAR = 0.9, SAME_SURFACE = 0.95;
const AHN = 'https://ahn.arcgisonline.nl/arcgis/rest/services/Hoogtebestand/AHN4_DTM_50cm/ImageServer';
const UA = 'dem-check/1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, '../../.cache/ahn');

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

// WGS84 to RD New, Schreutelkamp and Strang van Hees (2001), about 1 m
function toRD(lat, lng) {
  const dp = 0.36 * (lat - 52.1551744), dl = 0.36 * (lng - 5.38720621);
  const Rpq = [[0, 1, 190094.945], [1, 1, -11832.228], [2, 1, -114.221], [0, 3, -32.391], [1, 0, -0.705], [3, 1, -2.34], [1, 3, -0.608], [0, 2, -0.008], [2, 3, 0.148]];
  const Spq = [[1, 0, 309056.544], [0, 2, 3638.893], [2, 0, 73.077], [1, 2, -157.984], [3, 0, 59.788], [0, 1, 0.433], [2, 2, -6.439], [1, 1, -0.032], [0, 4, 0.092], [1, 4, -0.054]];
  return [155000 + Rpq.reduce((a, [p, q, v]) => a + v * dp ** p * dl ** q, 0), 463000 + Spq.reduce((a, [p, q, v]) => a + v * dp ** p * dl ** q, 0)];
}

async function ahn(kind, [lng, lat], side) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${kind}_${lng}_${lat}_${side ? side.toFixed(2) : 0}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const [x, y] = toRD(lat, lng), sr = { wkid: 28992 };
  let url;
  if (kind === 'point') url = `${AHN}/getSamples?geometry=${encodeURIComponent(JSON.stringify({ x, y, spatialReference: sr }))}&geometryType=esriGeometryPoint&returnFirstValueOnly=true&f=json`;
  else {
    const h = side / 2, ring = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h], [x - h, y - h]];
    url = `${AHN}/computeStatisticsHistograms?geometry=${encodeURIComponent(JSON.stringify({ rings: [ring], spatialReference: sr }))}&geometryType=esriGeometryPolygon&f=json`;
  }
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) {
        const j = await r.json();
        let out;
        // the server refuses a point sample where its DTM's 0.5 m cell has no ground height (a quay, a gap); the caller
        // checks that one-cell square is empty before counting the point as having no height
        if (j.error && kind === 'point' && j.error.code === 400) out = { value: null, refused: true };
        else if (j.error) { last = JSON.stringify(j.error).slice(0, 120); }
        else if (kind === 'point') { const v = Number(j.samples?.[0]?.value); out = { value: Number.isFinite(v) ? v : null, resolution: j.samples?.[0]?.resolution ?? null }; }
        else { const s = j.statistics?.[0]; out = s && s.count > 0 ? { mean: s.mean, min: s.min, max: s.max, count: s.count } : { mean: null, count: 0 }; }
        if (out) { fs.writeFileSync(file, JSON.stringify(out) + '\n'); return out; }
      } else last = `status ${r.status}`;
    } catch (e) { last = e.message; }
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  throw new Error(`AHN ${kind} ${lng},${lat}: ${last}`);
}

await apiExperiment({
  file: import.meta.url,
  question: "On low-lying ground in six Dutch places, how close are Mapbox's DEM heights to AHN4's 0.5 m lidar DEM, at the point and averaged over Mapbox's pixel?",
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
      // AHN's bare-ground DEM has no height under buildings, so only points off buildings are asked
      const off = kept.filter((q) => !q.building);
      const rows = await pool(off, 4, async (q) => {
        const px = pixelM(q.lnglat[1]);
        const [pt, one, three, mb] = [await ahn('point', q.lnglat), await ahn('stats', q.lnglat, px), await ahn('stats', q.lnglat, 3 * px), await mapboxAt(q.lnglat)];
        const refusedEmpty = pt.refused ? (await ahn('stats', q.lnglat, 0.5)).count === 0 : null;
        if (pt.refused && !refusedEmpty) throw new Error(`AHN refused a point sample at ${q.lnglat} where its 0.5 m cell has a ground height`);
        const usable = pt.value != null && one.mean != null && three.mean != null;
        return {
          place: p.name, lng: q.lnglat[0], lat: q.lnglat[1], mapbox_m: r2(mb), ahn_point_m: r2(pt.value), ahn_resolution_m: pt.resolution, pixel_m: r2(px),
          ahn_1px: { mean: r2(one.mean), min: r2(one.min), max: r2(one.max), count: one.count }, ahn_3px: { mean: r2(three.mean), count: three.count },
          refused_no_ground: pt.refused ? true : undefined, usable, point_in_1px_range: usable ? pt.value >= one.min - 0.01 && pt.value <= one.max + 0.01 : null,
          diff_point_m: usable ? r2(mb - pt.value) : null, diff_1px_m: usable ? r2(mb - one.mean) : null, diff_3px_m: usable ? r2(mb - three.mean) : null,
        };
      });
      points.push(...rows);
      const use = rows.filter((r) => r.usable), d0 = use.map((r) => r.diff_point_m), offset = median(d0);
      places.push({
        place: p.name, box: p.box, drawn, water_redrawn: water, kept: kept.length, on_buildings: kept.length - off.length, no_ahn_height: off.length - use.length, of_which_refused: rows.filter((r) => r.refused_no_ground).length, n: use.length,
        ahn_m_median: r2(median(use.map((r) => r.ahn_point_m))), median_diff_m: r2(offset), p90_abs_diff_m: r2(quantile(d0.map(Math.abs), 0.9)),
        within_0_5: { point: share(d0, (d) => Math.abs(d) <= TOL), one_pixel: share(use.map((r) => r.diff_1px_m), (d) => Math.abs(d) <= TOL), three_pixels: share(use.map((r) => r.diff_3px_m), (d) => Math.abs(d) <= TOL) },
        within_1_point: share(d0, (d) => Math.abs(d) <= 1),
        within_0_5_median_removed: share(d0, (d) => Math.abs(d - offset) <= TOL), within_1_median_removed: share(d0, (d) => Math.abs(d - offset) <= 1),
      });
    }
    const use = points.filter((r) => r.usable), d0 = use.map((r) => r.diff_point_m);
    const same = use.filter((r) => r.point_in_1px_range).length / use.length;
    return {
      facts: [
        fact(`AHN's point height lies within its own one-pixel square's range at ${SAME_SURFACE * 100}% of points or more`, same >= SAME_SURFACE, { share: r2(same), of: use.length }),
        fact(`Every place has ${BAR * 100}% of points within ${TOL} m at the point, as read`, places.every((p) => p.within_0_5.point >= BAR), Object.fromEntries(places.map((p) => [p.place, p.within_0_5.point]))),
        fact(`Every place has ${BAR * 100}% within ${TOL} m once its median difference is removed`, places.every((p) => p.within_0_5_median_removed >= BAR), Object.fromEntries(places.map((p) => [p.place, [p.median_diff_m, p.within_0_5_median_removed]]))),
        fact(`Every place has ${BAR * 100}% within ${TOL} m with AHN averaged over one pixel`, places.every((p) => p.within_0_5.one_pixel >= BAR), Object.fromEntries(places.map((p) => [p.place, p.within_0_5.one_pixel]))),
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
