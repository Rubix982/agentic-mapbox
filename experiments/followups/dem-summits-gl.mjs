// C-009 (T-007): the same 24 summits read through GL JS (queryTerrainElevation, zoom 14, exaggeration 1), beside the
// direct tile reads in results/dem-summits-tiles.json. One map load.
//   node experiments/followups/dem-summits-gl.mjs   (after dem-summits-tiles.mjs)
import fs from 'node:fs';
import { mapExperiment, page, fact } from '../lib.mjs';

const { summits } = JSON.parse(fs.readFileSync(new URL('./summits.json', import.meta.url), 'utf8'));
const tiles = JSON.parse(fs.readFileSync(new URL('./results/dem-summits-tiles.json', import.meta.url), 'utf8')).numbers.summits;

const html = page({
  title: 'Summits through GL JS',
  script: `
window.map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/satellite-v9', center: ${JSON.stringify(summits[0].lnglat)}, zoom: 14 });
map.on('style.load', () => {
  map.addSource('dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
  map.setTerrain({ source: 'dem', exaggeration: 1 });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Does GL JS read Mapbox's DEM at 24 summits the same as the tiles do directly?",
  html,
  check: async (t) => {
    const rows = [];
    for (const s of summits) {
      await t.eval((p) => window.map.jumpTo({ center: p, zoom: 14, pitch: 0, bearing: 0 }), s.lnglat);
      await t.idle(30000);
      await t.wait(500);
      const g = await t.eval((p) => {
        const e = (q) => window.map.queryTerrainElevation(q, { exaggerated: false });
        const k = Math.cos((p[1] * Math.PI) / 180) * 111320, m = 110540;
        let best = -1e9;
        for (let dy = -1000; dy <= 1000; dy += 5) for (let dx = -1000; dx <= 1000; dx += 5) {
          if (dx * dx + dy * dy > 1e6) continue;
          const z = e([p[0] + dx / k, p[1] + dy / m]);
          if (z != null && z > best) best = z;
        }
        return { at_point_m: Math.round(e(p)), highest_within_1km_m: Math.round(best) };
      }, s.lnglat);
      const d = tiles.find((x) => x.name === s.name);
      rows.push({ name: s.name, shape: s.shape, gl: g, tile: { at_point_m: d.at_point_m, highest_within_1km_m: d.highest_within_1km_m },
        highest_gl_minus_tile_m: g.highest_within_1km_m - d.highest_within_1km_m, at_point_gl_minus_tile_m: g.at_point_m - d.at_point_m });
      if (s.name === 'Matterhorn') await t.shot('matterhorn');
    }
    const maxGap = Math.max(...rows.map((r) => Math.abs(r.highest_gl_minus_tile_m)));
    return {
      facts: [
        fact("GL JS's highest reading within 1 km matches the tile's within 2 m at every summit", maxGap <= 2, { largest_gap_m: maxGap }),
        fact("GL JS's reading at each coordinate matches the tile's within 2 m", rows.every((r) => Math.abs(r.at_point_gl_minus_tile_m) <= 2), { gaps_m: rows.map((r) => [r.name, r.at_point_gl_minus_tile_m]) }),
      ],
      numbers: { summits: rows },
    };
  },
});
