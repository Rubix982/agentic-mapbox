// At low zoom, does the Standard style draw a globe surrounded by space, and does switching to Mercator fill the
// frame instead?
import { mapExperiment, page, fact } from '../lib.mjs';

const html = page({
  title: 'Globe',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [10, 30], zoom: 1.5 });
`,
});

const corners = [[12, 12], [788, 12], [12, 588], [788, 588]];

await mapExperiment({
  file: import.meta.url,
  question: 'At low zoom, does the Standard style draw a globe surrounded by space, and does Mercator fill the frame instead?',
  html,
  check: async (t) => {
    const g = await t.shot('globe');
    const proj = await t.eval(() => window.map.getProjection().name);
    const fog = await t.eval(() => window.map.getFog());
    const centre = await t.patch(400, 300, 6, g);
    const cg = await Promise.all(corners.map(([x, y]) => t.patch(x, y, 6, g)));
    await t.eval(() => window.map.setProjection('mercator'));
    await t.idle(30000);
    await t.wait(500);
    const m = await t.shot('mercator');
    const proj2 = await t.eval(() => window.map.getProjection().name);
    const cm = await Promise.all(corners.map(([x, y]) => t.patch(x, y, 6, m)));
    const lum = ([r, g, b]) => Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const change = cg.map((c, i) => Math.round(c.reduce((s, v, k) => s + Math.abs(v - cm[i][k]), 0) / 3));
    return {
      facts: [
        fact('The projection is globe without asking for it', proj === 'globe', { projection: proj }),
        fact("All four corners are space: each is darker than the globe's centre by more than 60 (0-255)", cg.every((c) => lum(centre) - lum(c) > 60), { centre: lum(centre), corners: cg.map(lum) }),
        fact('After setProjection("mercator") the projection reads mercator and every corner changes by more than 30', proj2 === 'mercator' && change.every((c) => c > 30), { projection: proj2, corner_change: change, corners_mercator: cm.map(lum) }),
      ],
      numbers: { fog_keys: fog ? Object.keys(fog) : null, space_color: fog && fog['space-color'], star_intensity: fog && fog['star-intensity'] },
    };
  },
});
