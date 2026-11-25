// Does Search Box category search return cafés inside a given box, each tagged as a café?
import { mapExperiment, page, fact } from '../lib.mjs';

const bbox = [144.953, -37.82, 144.974, -37.807]; // Melbourne CBD

const html = page({
  title: 'Search Box category',
  script: `
const bbox = ${JSON.stringify(bbox)};
window.map = new mapboxgl.Map({ container: 'map', bounds: [[bbox[0], bbox[1]], [bbox[2], bbox[3]]] });
window.result = null;
map.on('load', async () => {
  const url = 'https://api.mapbox.com/search/searchbox/v1/category/cafe?language=en&limit=25&bbox=' + bbox.join(',') +
    '&proximity=144.9631,-37.8136&access_token=' + mapboxgl.accessToken;
  const r = await fetch(url);
  const data = await r.json();
  window.result = { status: r.status, data };
  if (!r.ok) return;
  map.addSource('cafes', { type: 'geojson', data });
  map.addLayer({ id: 'cafes', type: 'circle', source: 'cafes', slot: 'top', paint: { 'circle-color': '#ff9f0a', 'circle-radius': 6, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2, 'circle-emissive-strength': 1 } });
  map.addSource('box', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]] } } });
  map.addLayer({ id: 'box', type: 'line', source: 'box', paint: { 'line-color': '#0a84ff', 'line-width': 2, 'line-dasharray': [2, 2], 'line-emissive-strength': 1 } });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does Search Box category search return cafés inside a given box, each tagged as a café?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 30000);
    await t.idle(30000);
    await t.shot('melbourne');
    const r = await t.eval(() => window.result);
    if (!r || r.status !== 200) return { facts: [fact('The API answered 200', false, { status: r?.status, message: r?.data?.message })], web_service_requests: 1 };
    const fs = r.data.features;
    const inBox = fs.filter(({ geometry: { coordinates: [x, y] } }) => x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3]);
    const tagged = fs.filter((f) => (f.properties.poi_category_ids || []).includes('cafe'));
    return {
      facts: [
        fact('It returns at least 10 results', fs.length >= 10, { results: fs.length }),
        fact('Every result is inside the box', inBox.length === fs.length, { inside: inBox.length }),
        fact("Every result lists 'cafe' among its categories", tagged.length === fs.length, { tagged_cafe: tagged.length }),
      ],
      numbers: {
        first_five: fs.slice(0, 5).map((f) => f.properties.name),
        not_tagged_cafe: fs.filter((f) => !(f.properties.poi_category_ids || []).includes('cafe')).map((f) => ({ name: f.properties.name, poi_category_ids: f.properties.poi_category_ids, poi_category: f.properties.poi_category })),
        property_keys: Object.keys(fs[0]?.properties || {}),
      },
      web_service_requests: 1,
    };
  },
});
