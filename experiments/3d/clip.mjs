// Does a `clip` layer remove the Standard style's 3D buildings inside its polygon and leave the rest?
import { mapExperiment, page, diff, inPolygon, fact } from '../lib.mjs';

// a block of about 220 x 220 m in Lower Manhattan, just north of the view's centre
const c = [-74.0100, 40.7095], dx = 0.0013, dy = 0.001;
const ring = [[c[0] - dx, c[1] - dy], [c[0] + dx, c[1] - dy], [c[0] + dx, c[1] + dy], [c[0] - dx, c[1] + dy], [c[0] - dx, c[1] - dy]];

const html = page({
  title: 'Clip layer',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [-74.0110, 40.7069], zoom: 16, pitch: 55, bearing: -20 });
map.on('style.load', () => {
  map.addSource('cut', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [${JSON.stringify(ring)}] } } });
  map.addLayer({ id: 'cut', type: 'clip', source: 'cut', layout: { 'clip-layer-types': ['model', 'symbol'] } });
  map.addLayer({ id: 'cut-outline', type: 'line', source: 'cut', paint: { 'line-color': '#0a84ff', 'line-width': 3, 'line-emissive-strength': 1 } });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Does a clip layer remove the Standard style's 3D buildings inside its polygon and leave the rest?",
  html,
  check: async (t) => {
    const count = () => t.eval((ring) => {
      const m = window.map, scr = ring.map((p) => { const q = m.project(p); return [q.x, q.y]; });
      const xs = scr.map((p) => p[0]), ys = scr.map((p) => p[1]);
      const box = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
      const q = (id) => m.queryRenderedFeatures(box, { target: { featuresetId: id, importId: 'basemap' } }).length;
      return { buildings: q('buildings'), labels: q('poi') + q('place-labels'), screen: scr };
    }, ring);
    const clipped = await t.shot('clipped');
    const inside = await count();
    await t.eval(() => window.map.setLayoutProperty('cut', 'visibility', 'none'));
    await t.idle(15000);
    await t.wait(300);
    const whole = await t.shot('unclipped');
    const outside = await count();
    const poly = inside.screen;
    // buildings rise above their footprint on screen, so the box excluded from "elsewhere" reaches 250 px up
    const minX = Math.min(...poly.map((p) => p[0])), maxX = Math.max(...poly.map((p) => p[0]));
    const maxY = Math.max(...poly.map((p) => p[1])), minY = Math.min(...poly.map((p) => p[1])) - 250;
    const inBox = (x, y) => x >= minX && x <= maxX && y >= minY && y <= maxY;
    const footprint = (x, y) => inPolygon(x, y, poly);
    const dIn = diff(clipped, whole, footprint), dOut = diff(clipped, whole, (x, y) => !inBox(x, y) && y > maxY + 20);
    // first run measured only pixels inside the footprint, and buildings standing in front of the block cover most
    // of it (7.3, against a guessed threshold of 15); the rendered-feature counts are the direct measure
    return {
      facts: [
        fact('With the clip on, under half as many buildings are rendered in the polygon\'s screen box as with it off', inside.buildings < outside.buildings / 2, { clip_on: inside.buildings, clip_off: outside.buildings }),
        fact("With 'symbol' in clip-layer-types, the labels in that box go too", inside.labels < outside.labels, { clip_on: inside.labels, clip_off: outside.labels }),
        fact('Below and beside the block nothing changes (mean pixel difference under 2)', dOut < 2, { below_and_beside: dOut, inside_footprint: dIn }),
      ],
      numbers: { polygon_px: poly.map((p) => p.map(Math.round)) },
    };
  },
});
