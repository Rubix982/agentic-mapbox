// C-031 (T-029): for each of C-030's 468 low-lying points, USGS's lidar averaged over one Mapbox pixel (7.5 to 8.6 m)
// and over three (about 25 m), against Mapbox's height from C-030. No Mapbox requests; 936 requests to USGS's 3DEP
// elevation service (free, no key), cached in .cache/usgs-stats/ so a second run sends none.
//   node experiments/followups/dem-lowland-pixel.mjs   (needs C-030's results/dem-lowland.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiExperiment, fact } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C030 = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-lowland.json'), 'utf8'));
const SERVICE = 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/computeStatisticsHistograms';
const UA = 'dem-check/1.0';
const CACHE = path.join(HERE, '../../.cache/usgs-stats');
const TOL = 0.5, BAR = 0.9, FLAT_SPAN = 0.25, FLAT_SHARE = 0.25, SAME_SURFACE = 0.95, Z = 14, TILE = 256;
const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const pixelM = (lat) => (2 * Math.PI * R * Math.cos(rad(lat))) / (2 ** Z * TILE);
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
  question: "Averaged over Mapbox's own pixel, or three pixels, does USGS's lidar agree with Mapbox's height at C-030's 468 points?",
  run: async () => {
    const pts = C030.numbers.points.filter((p) => p.usable && !p.building);
    const rows = await pool(pts, 4, async (p) => {
      const px = pixelM(p.lat), one = await stats([p.lng, p.lat], px), three = await stats([p.lng, p.lat], 3 * px);
      return {
        place: p.place, lng: p.lng, lat: p.lat, mapbox_m: p.mapbox_m, usgs_point_m: p.usgs_m, pixel_m: r2(px),
        lidar_1px: { mean: r2(one.mean), min: r2(one.min), max: r2(one.max), count: one.count },
        lidar_3px: { mean: r2(three.mean), min: r2(three.min), max: r2(three.max), count: three.count },
        point_in_1px_range: p.usgs_m >= one.min - 0.01 && p.usgs_m <= one.max + 0.01,
        flat: three.max - three.min < FLAT_SPAN,
        diff_point_m: p.diff_m, diff_1px_m: r2(p.mapbox_m - one.mean), diff_3px_m: r2(p.mapbox_m - three.mean),
      };
    });
    const summarise = (rs) => {
      const d0 = rs.map((r) => r.diff_point_m), d1 = rs.map((r) => r.diff_1px_m), d3 = rs.map((r) => r.diff_3px_m);
      const flat = rs.filter((r) => r.flat);
      const best = (r) => Math.min(Math.abs(r.diff_1px_m), Math.abs(r.diff_3px_m));
      return {
        n: rs.length,
        within_0_5: { point: share(d0, (d) => Math.abs(d) <= TOL), one_pixel: share(d1, (d) => Math.abs(d) <= TOL), three_pixels: share(d3, (d) => Math.abs(d) <= TOL) },
        within_1: { point: share(d0, (d) => Math.abs(d) <= 1), one_pixel: share(d1, (d) => Math.abs(d) <= 1), three_pixels: share(d3, (d) => Math.abs(d) <= 1) },
        within_0_5_at_either: share(rs, (r) => best(r) <= TOL),
        median_diff_m: { point: r2(median(d0)), one_pixel: r2(median(d1)), three_pixels: r2(median(d3)) },
        flat_n: flat.length, flat_more_than_0_5_off: share(flat, (r) => Math.abs(r.diff_3px_m) > TOL),
        flat_median_abs_diff_m: r2(median(flat.map((r) => Math.abs(r.diff_3px_m)))),
        span_3px_median_m: r2(median(rs.map((r) => r.lidar_3px.max - r.lidar_3px.min))),
      };
    };
    const places = [...new Set(rows.map((r) => r.place))].map((place) => ({ place, ...summarise(rows.filter((r) => r.place === place)) }));
    const all = summarise(rows);
    const same = rows.filter((r) => r.point_in_1px_range).length / rows.length;
    return {
      facts: [
        fact(`The point height from C-030 lies within the one-pixel square's lidar range at ${SAME_SURFACE * 100}% of points or more`, same >= SAME_SURFACE,
          { share: r2(same), of: rows.length, counts_1px: [Math.min(...rows.map((r) => r.lidar_1px.count)), Math.max(...rows.map((r) => r.lidar_1px.count))] }),
        fact(`Every place has ${BAR * 100}% of points within ${TOL} m with lidar averaged over one pixel`, places.every((p) => p.within_0_5.one_pixel >= BAR),
          Object.fromEntries(places.map((p) => [p.place, [p.within_0_5.point, p.within_0_5.one_pixel]]))),
        fact(`Every place has ${BAR * 100}% of points within ${TOL} m with lidar averaged over three pixels`, places.every((p) => p.within_0_5.three_pixels >= BAR),
          Object.fromEntries(places.map((p) => [p.place, [p.within_0_5.point, p.within_0_5.three_pixels]]))),
        fact(`On flat ground (lidar spans under ${FLAT_SPAN} m across three pixels), fewer than ${FLAT_SHARE * 100}% of points are more than ${TOL} m off`,
          all.flat_more_than_0_5_off < FLAT_SHARE, { flat_n: all.flat_n, more_than_0_5_off: all.flat_more_than_0_5_off, median_abs_diff_m: all.flat_median_abs_diff_m }),
      ],
      numbers: { tolerance_m: TOL, bar: BAR, flat_span_m: FLAT_SPAN, all, places, points: rows },
    };
  },
});
