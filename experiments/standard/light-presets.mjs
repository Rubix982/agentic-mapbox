// Do the Standard style's four light presets each change the picture, without reloading the style?
import { mapExperiment, page, stats, fact } from '../lib.mjs';

const html = page({
  title: 'Standard light presets',
  script: `
window.styleLoads = 0;
window.map = new mapboxgl.Map({ container: 'map', center: [-74.0110, 40.7069], zoom: 15.5, pitch: 60, bearing: -20 });
map.on('style.load', () => { window.styleLoads++; });
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Do the Standard style's four light presets each change the picture, without reloading the style?",
  html,
  check: async (t) => {
    const presets = ['dawn', 'day', 'dusk', 'night'];
    const schema = await t.eval(() => window.map.getSchema('basemap').lightPreset);
    const got = {};
    for (const p of presets) {
      await t.eval((p) => window.map.setConfigProperty('basemap', 'lightPreset', p), p);
      await t.idle(30000);
      await t.wait(500);
      const img = await t.shot(p);
      got[p] = { readBack: await t.eval(() => window.map.getConfigProperty('basemap', 'lightPreset')), ...stats(img) };
    }
    const loads = await t.eval(() => window.styleLoads);
    const others = presets.filter((p) => p !== 'day');
    return {
      facts: [
        fact('The style declares exactly these four presets: dawn, day, dusk, night', JSON.stringify(schema.values) === JSON.stringify(presets), { declared: schema.values, default: schema.default }),
        fact('Each preset reads back as set', presets.every((p) => got[p].readBack === p)),
        fact("Every other preset's mean brightness differs from day's by more than 10 (on 0-255)", others.every((p) => Math.abs(got[p].lum - got.day.lum) > 10), Object.fromEntries(presets.map((p) => [p, got[p].lum]))),
        fact('Night is the darkest of the four', presets.every((p) => p === 'night' || got[p].lum > got.night.lum)),
        fact('Changing the preset never reloaded the style (style.load fired once)', loads === 1, { style_loads: loads }),
      ],
      numbers: got,
    };
  },
});
