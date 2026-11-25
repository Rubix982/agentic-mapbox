// Does GL JS terrain on Mapbox's DEM (mapbox-terrain-dem-v1, exaggeration 1) put known summits and lake surfaces at
// their published heights?
import { mapExperiment, page, fact } from '../lib.mjs';

// published heights; coordinates are the summits' (or a point on the lake)
const places = {
  'Mont Blanc': [[6.86517, 45.83264], 4806],
  'Mount Fuji': [[138.7274, 35.3606], 3776],
  Matterhorn: [[7.65861, 45.97639], 4478],
  'Crater Lake, surface': [[-122.109, 42.9446], 1883],
  'Lake Geneva, surface': [[6.6, 46.45], 372],
};

const html = page({
  title: 'Terrain heights',
  script: `
window.map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/satellite-v9', center: [6.86517, 45.83264], zoom: 14 });
map.on('style.load', () => {
  map.addSource('dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
  map.setTerrain({ source: 'dem', exaggeration: 1 });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Does GL JS terrain on Mapbox's DEM put known summits and lake surfaces at their published heights?",
  html,
  check: async (t) => {
    const got = {};
    for (const [name, [p, known]] of Object.entries(places)) {
      await t.eval((p) => window.map.jumpTo({ center: p, zoom: 14, pitch: 0, bearing: 0 }), p);
      await t.idle(30000);
      await t.wait(500);
      // the height at the point, and the highest height within about 1 km (a 10 m grid), in case the coordinate is off
      got[name] = await t.eval(({ p, known }) => {
        const e = (q) => window.map.queryTerrainElevation(q, { exaggerated: false });
        let best = -1e9, at = null;
        for (let dy = -0.009; dy <= 0.009; dy += 0.0001) for (let dx = -0.013; dx <= 0.013; dx += 0.00013) {
          const z = e([p[0] + dx, p[1] + dy]);
          if (z > best) { best = z; at = [p[0] + dx, p[1] + dy]; }
        }
        const k = Math.cos((p[1] * Math.PI) / 180) * 111320;
        return { known, at_point: Math.round(e(p)), highest_within_1km: Math.round(best), highest_is_m_away: Math.round(Math.hypot((at[0] - p[0]) * k, (at[1] - p[1]) * 110540)) };
      }, { p, known });
      if (name === 'Matterhorn') await t.shot('matterhorn');
    }
    const close = (n, tol) => Math.abs(got[n].at_point - got[n].known) <= tol;
    return {
      facts: [
        fact('Both lake surfaces read within 5 m', close('Crater Lake, surface', 5) && close('Lake Geneva, surface', 5), { crater: got['Crater Lake, surface'], geneva: got['Lake Geneva, surface'] }),
        fact("Mont Blanc's and Fuji's summits read within 25 m", close('Mont Blanc', 25) && close('Mount Fuji', 25), { mont_blanc: got['Mont Blanc'], fuji: got['Mount Fuji'] }),
        fact("The Matterhorn's summit reads within 25 m", close('Matterhorn', 25), got.Matterhorn),
        fact('Somewhere within 1 km of the Matterhorn the DEM reaches within 25 m of 4,478 m', Math.abs(got.Matterhorn.highest_within_1km - 4478) <= 25, got.Matterhorn),
      ],
      numbers: got,
    };
  },
});
