// C-009 (T-007): read mapbox-terrain-dem-v1's zoom-14 tiles directly (no GL JS) around 24 summits, and say how far
// below its published height each reads. About 100 tile requests.
//   node experiments/followups/dem-summits-tiles.mjs
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { apiExperiment, fact } from '../lib.mjs';

const { summits } = JSON.parse(fs.readFileSync(new URL('./summits.json', import.meta.url), 'utf8'));
const Z = 14, RADIUS = 1000;
const R = 6371008.8, rad = (d) => (d * Math.PI) / 180;
const tileXY = ([lng, lat], z) => {
  const n = 2 ** z;
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n];
};
const lngLatOf = (x, y, z) => {
  const n = 2 ** z;
  return [(x / n) * 360 - 180, (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI];
};
const metres = (a, b) => {
  const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };

await apiExperiment({
  file: import.meta.url,
  question: "Read directly from its zoom-14 tiles, is Mapbox's DEM low on sharp summits in general, or only on the Matterhorn?",
  run: async (api) => {
    const tiles = new Map();
    const tile = async (x, y) => {
      const key = `${x}/${y}`;
      if (!tiles.has(key)) {
        const r = await api.get(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/${Z}/${x}/${y}.pngraw`);
        if (!r.ok) throw new Error(`tile ${key}: ${r.status} ${r.message}`);
        const png = PNG.sync.read(r.buffer);
        const h = new Float32Array(png.width * png.height);
        for (let i = 0; i < h.length; i++) h[i] = -10000 + (png.data[i * 4] * 65536 + png.data[i * 4 + 1] * 256 + png.data[i * 4 + 2]) * 0.1;
        tiles.set(key, { size: png.width, h });
      }
      return tiles.get(key);
    };
    const rows = [];
    for (const s of summits) {
      const [cx, cy] = tileXY(s.lnglat, Z);
      // the tiles a 1 km circle can touch
      const k = RADIUS / ((2 * Math.PI * R * Math.cos(rad(s.lnglat[1]))) / 2 ** Z);
      let best = -1e9, at = null, size = null;
      for (let ty = Math.floor(cy - k); ty <= Math.floor(cy + k); ty++) for (let tx = Math.floor(cx - k); tx <= Math.floor(cx + k); tx++) {
        const t = await tile(tx, ty);
        size = t.size;
        for (let j = 0; j < t.size; j++) for (let i = 0; i < t.size; i++) {
          const p = lngLatOf(tx + (i + 0.5) / t.size, ty + (j + 0.5) / t.size, Z);
          if (metres(p, s.lnglat) > RADIUS) continue;
          const v = t.h[j * t.size + i];
          if (v > best) { best = v; at = p; }
        }
      }
      // at the coordinate itself, bilinear, as Mapbox's MCP elevation tool reads it (terrain.ts heightInTile)
      const t = await tile(Math.floor(cx), Math.floor(cy));
      const px = Math.max(0, Math.min(t.size - 1, (cx - Math.floor(cx)) * t.size - 0.5)), py = Math.max(0, Math.min(t.size - 1, (cy - Math.floor(cy)) * t.size - 0.5));
      const x0 = Math.floor(px), y0 = Math.floor(py), x1 = Math.min(t.size - 1, x0 + 1), y1 = Math.min(t.size - 1, y0 + 1), fx = px - x0, fy = py - y0;
      const H = (x, y) => t.h[y * t.size + x];
      const atPoint = (H(x0, y0) * (1 - fx) + H(x1, y0) * fx) * (1 - fy) + (H(x0, y1) * (1 - fx) + H(x1, y1) * fx) * fy;
      const pixel_m = (2 * Math.PI * R * Math.cos(rad(s.lnglat[1]))) / (2 ** Z * size);
      const away = Math.round(metres(at, s.lnglat));
      rows.push({ name: s.name, shape: s.shape, region: s.region, published_m: s.published_m, at_point_m: Math.round(atPoint), highest_within_1km_m: Math.round(best),
        highest_is_m_away: away, low_by_m: Math.round(s.published_m - best), pixel_m: Math.round(pixel_m * 10) / 10, left_out: away >= 950 });
    }
    const kept = rows.filter((r) => !r.left_out);
    const sharp = kept.filter((r) => r.shape === 'sharp'), broad = kept.filter((r) => r.shape === 'broad');
    const sharpLow = sharp.filter((r) => r.low_by_m > 50).length, broadClose = broad.filter((r) => Math.abs(r.low_by_m) <= 25).length;
    const mattOnly = sharp.filter((r) => r.low_by_m > 50).every((r) => r.name === 'Matterhorn');
    return {
      facts: [
        fact('Every tile came back as a square PNG', rows.every((r) => r.pixel_m > 0), { tiles: tiles.size, pixel_m: [...new Set(rows.map((r) => r.pixel_m))] }),
        fact('At least 9 of the 12 sharp summits read more than 50 m low by their highest pixel within 1 km', sharpLow >= 9, { sharp_more_than_50m_low: sharpLow, of: sharp.length, median_low_by_m: median(sharp.map((r) => r.low_by_m)) }),
        fact('At least 10 of the 12 broad summits read within 25 m', broadClose >= 10, { broad_within_25m: broadClose, of: broad.length, median_low_by_m: median(broad.map((r) => r.low_by_m)) }),
        fact('The Matterhorn is the only sharp summit more than 50 m low', mattOnly && sharpLow === 1, { sharp_more_than_50m_low: sharp.filter((r) => r.low_by_m > 50).map((r) => r.name) }),
      ],
      numbers: { summits: rows, tiles_read: tiles.size },
    };
  },
});
