// Does a raster-particle layer animate global wind from Mapbox's raster-array example tileset, on a public token?
import { mapExperiment, page, diff, fact } from '../lib.mjs';

const html = page({
  title: 'Wind particles',
  script: `
window.map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/dark-v11', center: [-40, 35], zoom: 1.8 });
// started by the check once the map is idle: an animated layer never lets the map go idle
window.start = () => {
  map.addSource('wind', { type: 'raster-array', url: 'mapbox://rasterarrayexamples.gfs-winds', tileSize: 512 });
  map.addLayer({
    id: 'wind', type: 'raster-particle', source: 'wind', 'source-layer': '10winds',
    paint: {
      'raster-particle-speed-factor': 0.4,
      'raster-particle-fade-opacity-factor': 0.9,
      'raster-particle-reset-rate-factor': 0.4,
      'raster-particle-count': 4000,
      'raster-particle-max-speed': 40,
      'raster-particle-color': ['interpolate', ['linear'], ['raster-particle-speed'],
        1.5, 'rgba(134,163,171,256)', 2.5, 'rgba(126,152,188,256)', 4.12, 'rgba(110,143,208,256)',
        6.17, 'rgba(15,147,167,256)', 9.26, 'rgba(57,163,57,256)', 11.83, 'rgba(194,134,62,256)',
        14.92, 'rgba(200,66,13,256)', 18.0, 'rgba(210,0,50,256)', 21.6, 'rgba(175,80,136,256)',
        25.21, 'rgba(117,74,147,256)', 29.32, 'rgba(68,105,141,256)', 33.44, 'rgba(194,251,119,256)',
        43.72, 'rgba(241,255,109,256)', 50.41, 'rgba(256,256,256,256)', 59.16, 'rgba(0,256,256,256)', 69.44, 'rgba(256,37,256,256)'],
    },
  });
};
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Does a raster-particle layer animate global wind from Mapbox's raster-array example tileset, on a public token?",
  html,
  check: async (t) => {
    const tiles = [];
    t.page.on('response', (r) => { if (/rasterarrayexamples|\.mrt/.test(r.url())) tiles.push(r.status()); });
    const before = await t.shot('basemap');
    await t.eval(() => window.start());
    await t.wait(6000);
    const a = await t.shot('wind');
    await t.wait(300);
    const b = await t.screenshot();
    const idle = await t.idle(5000);
    return {
      facts: [
        // first run required 200 and got 200 and 206: the raster-array tiles are fetched with range requests
        fact('The wind tiles are served (at least one, all HTTP 2xx)', tiles.length > 0 && tiles.every((s) => s >= 200 && s < 300), { tile_responses: tiles.length, statuses: [...new Set(tiles)] }),
        fact('The particles change the picture (mean difference over 3 from the plain basemap)', diff(before, a) > 3, { vs_basemap: diff(before, a) }),
        fact('They move: two frames 300 ms apart differ (mean difference over 0.5)', diff(a, b) > 0.5, { frame_to_frame: diff(a, b) }),
        fact('With the layer animating, the map never fires idle within 5 s', !idle, { idle }),
      ],
    };
  },
});
