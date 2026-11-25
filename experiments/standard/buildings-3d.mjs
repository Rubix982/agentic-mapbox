// Does the Standard style draw 3D buildings that can be queried through its `buildings` featureset, and does its
// show3dObjects setting remove them?
import { mapExperiment, page, diff, fact } from '../lib.mjs';

const html = page({
  title: 'Standard 3D buildings',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [-74.0110, 40.7069], zoom: 16, pitch: 60, bearing: -20 });
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does the Standard style draw 3D buildings that can be queried through its `buildings` featureset, and does show3dObjects remove them?',
  html,
  check: async (t) => {
    const read = () => t.eval(() => {
      const f = window.map.queryRenderedFeatures({ target: { featuresetId: 'buildings', importId: 'basemap' } });
      const h = f.map((x) => x.properties.height).filter((x) => typeof x === 'number');
      return { n: f.length, maxHeight: Math.max(...h), tall: h.filter((x) => x > 100).length };
    });
    const types = await t.eval(() => {
      const d = window.map.getStyle().imports[0].data;
      return d.layers.reduce((a, l) => ((a[l.type] = (a[l.type] || 0) + 1), a), {});
    });
    const on = await read();
    const imgOn = await t.shot('on');
    await t.eval(() => window.map.setConfigProperty('basemap', 'show3dObjects', false));
    await t.idle(30000);
    await t.wait(500);
    const off = await read();
    const imgOff = await t.shot('off');
    const d = diff(imgOn, imgOff);
    return {
      facts: [
        fact('The buildings featureset returns rendered buildings with a height', on.n > 50 && on.maxHeight > 100, on),
        fact('Turning show3dObjects off changes the picture (mean pixel difference over 10)', d > 10, { mean_pixel_difference: d }),
        fact('With show3dObjects off the featureset still returns the building footprints', off.n > 0, off),
      ],
      numbers: { on, off, basemap_layer_types: types },
    };
  },
});
