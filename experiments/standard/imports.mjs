// Can a style of my own import Standard, set Standard's settings inside the import, and put its own layer in one of
// Standard's slots?
import { mapExperiment, page, fact } from '../lib.mjs';

const seine = [[2.2945, 48.8617], [2.3013, 48.8637], [2.3125, 48.8640], [2.3226, 48.8617], [2.3320, 48.8592], [2.3417, 48.8573], [2.3500, 48.8540], [2.3580, 48.8500]];

const html = page({
  title: 'Style imports',
  script: `
window.map = new mapboxgl.Map({
  container: 'map',
  center: [2.325, 48.859], zoom: 13.5, pitch: 40,
  style: {
    version: 8,
    imports: [{ id: 'basemap', url: 'mapbox://styles/mapbox/standard', config: { lightPreset: 'dusk', showPointOfInterestLabels: false } }],
    sources: { walk: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ${JSON.stringify(seine)} } } } },
    layers: [{ id: 'walk', type: 'line', source: 'walk', slot: 'middle', paint: { 'line-color': '#ff2d55', 'line-width': 7, 'line-emissive-strength': 1 } }],
  },
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Can my own style import Standard, set Standard's settings inside the import, and put its own layer in one of Standard's slots?",
  html,
  check: async (t) => {
    await t.shot('dusk');
    const v = await t.eval(() => {
      const m = window.map, s = m.getStyle();
      return {
        imports: (s.imports || []).map((i) => i.id),
        lightPreset: m.getConfigProperty('basemap', 'lightPreset'),
        poiLabels: m.getConfigProperty('basemap', 'showPointOfInterestLabels'),
        slot: m.getSlot ? m.getSlot('walk') : m.getLayer('walk').slot,
        walkRendered: m.queryRenderedFeatures({ layers: ['walk'] }).length,
        poi: m.queryRenderedFeatures({ target: { featuresetId: 'poi', importId: 'basemap' } }).map((f) => ({ name: f.properties.name, transit_mode: f.properties.transit_mode, keys: Object.keys(f.properties).sort().join(',') })),
        slots: s.imports[0].data.layers.filter((l) => l.type === 'slot').map((l) => l.id),
      };
    });
    return {
      facts: [
        fact('The map has one import, basemap', JSON.stringify(v.imports) === '["basemap"]', { imports: v.imports }),
        fact("The import's settings read back as given: lightPreset dusk, POI labels off", v.lightPreset === 'dusk' && v.poiLabels === false, { lightPreset: v.lightPreset, showPointOfInterestLabels: v.poiLabels }),
        // first run: expected nothing, got 10 station icons; showTransitLabels (still on) governs those
        fact('With POI labels off, everything the poi featureset still renders is a transit stop', v.poi.length > 0 && v.poi.every((f) => f.transit_mode), { poi_rendered: v.poi.length, transit_modes: [...new Set(v.poi.map((f) => f.transit_mode))], property_keys: [...new Set(v.poi.map((f) => f.keys))] }),
        fact('My layer sits in the middle slot and is drawn', v.slot === 'middle' && v.walkRendered > 0, { slot: v.slot, rendered: v.walkRendered, standard_slots: v.slots }),
      ],
      numbers: v,
    };
  },
});
