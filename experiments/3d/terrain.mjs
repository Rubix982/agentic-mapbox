// What does the Standard Satellite style do with terrain by itself: is it on, and does it stay on as you zoom in?
// (Whether the heights are right is terrain-heights.mjs.)
import { mapExperiment, page, diff, fact } from '../lib.mjs';

const summit = [7.65861, 45.97636];

const html = page({
  title: 'Terrain on satellite',
  script: `
window.map = new mapboxgl.Map({
  container: 'map', style: 'mapbox://styles/mapbox/standard-satellite',
  center: ${JSON.stringify(summit)}, zoom: 13, pitch: 70, bearing: 225,
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does the Standard Satellite style turn terrain on by itself, and does it stay on as you zoom in?',
  html,
  check: async (t) => {
    const own = await t.eval(() => window.map.getTerrain());
    const at = () => t.eval((p) => window.map.queryTerrainElevation(p, { exaggerated: false }), summit);
    const view = async (zoom, pitch, bearing) => {
      await t.eval(({ p, zoom, pitch, bearing }) => window.map.jumpTo({ center: p, zoom, pitch, bearing }), { p: summit, zoom, pitch, bearing });
      await t.idle(30000);
      await t.wait(500);
      return at();
    };
    const atZ13 = await at();
    const tilted = await t.shot('terrain');
    const atZ12 = await view(12, 70, 225);
    const atZ14 = await view(14, 70, 225);
    await t.shot('zoom14');
    await view(13, 70, 225);
    await t.eval(() => window.map.setTerrain(null));
    await t.idle(30000);
    await t.wait(500);
    const flat = await t.shot('flat');
    const d = diff(tilted, flat);
    const ex = own && own.exaggeration;
    const m = (v) => (typeof v === 'number' ? Math.round(v) : v);
    return {
      facts: [
        fact('Standard Satellite turns terrain on by itself', !!own, { style_terrain: own }),
        fact("The style's terrain exaggeration is 1 up to zoom 12 and falls to 0 by zoom 13.7 (read from its expression)", JSON.stringify(ex) === JSON.stringify(['interpolate', ['linear'], ['zoom'], 6, 0, 7, 1, 12, 1, 13.7, 0])),
        fact('At zoom 12 and 13 the terrain answers a height query', typeof atZ12 === 'number' && typeof atZ13 === 'number', { zoom12_m: m(atZ12), zoom13_m: m(atZ13) }),
        fact('At zoom 14 there is no terrain left to query (queryTerrainElevation returns null)', atZ14 === null, { zoom14: atZ14 }),
        fact('At zoom 13 the terrain is still visible: turning it off changes the view (mean pixel difference over 15)', d > 15, { mean_pixel_difference: d }),
      ],
    };
  },
});
