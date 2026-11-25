// Do the Standard style's themes (default, faded, monochrome) change how colourful the map is?
import { mapExperiment, page, stats, fact } from '../lib.mjs';

const html = page({
  title: 'Standard themes',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [2.3376, 48.8606], zoom: 14.5, pitch: 45 });
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Do the Standard style's themes (default, faded, monochrome) change how colourful the map is?",
  html,
  check: async (t) => {
    const schema = await t.eval(() => window.map.getSchema('basemap').theme);
    const themes = ['default', 'faded', 'monochrome'];
    const got = {};
    for (const th of themes) {
      await t.eval((th) => window.map.setConfigProperty('basemap', 'theme', th), th);
      await t.idle(30000);
      await t.wait(500);
      const img = await t.shot(th);
      got[th] = { readBack: await t.eval(() => window.map.getConfigProperty('basemap', 'theme')), ...stats(img) };
    }
    return {
      facts: [
        fact('The style declares the themes default, faded and monochrome', themes.every((x) => (schema.values || []).includes(x)), { declared: schema.values, default: schema.default }),
        fact('Each theme reads back as set', themes.every((x) => got[x].readBack === x)),
        fact("Faded is less saturated than default", got.faded.sat < got.default.sat, { default: got.default.sat, faded: got.faded.sat }),
        fact('Monochrome is the least saturated, under a third of default', got.monochrome.sat < got.faded.sat && got.monochrome.sat < got.default.sat / 3, { monochrome: got.monochrome.sat }),
      ],
      numbers: got,
    };
  },
});
