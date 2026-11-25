// What does Tilequery say is at a point: the Eiffel Tower in Mapbox Streets, and the summit heights of Mont Blanc and
// the Matterhorn in Mapbox Terrain's contours (a second reading of what 3d/terrain-heights measured)?
import { mapExperiment, page, fact } from '../lib.mjs';

const eiffel = [2.2945, 48.8584];
const peaks = { 'Mont Blanc': [[6.86517, 45.83264], 4806], Matterhorn: [[7.65861, 45.97639], 4478] };

const html = page({
  title: 'Tilequery',
  css: `#out { position: absolute; top: 10px; left: 10px; background: #fff; font: 12px/1.4 system-ui, sans-serif; padding: 6px 8px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.3); max-width: 300px; }`,
  body: '<div id="out"></div>',
  script: `
const eiffel = ${JSON.stringify(eiffel)}, peaks = ${JSON.stringify(peaks)};
window.map = new mapboxgl.Map({ container: 'map', center: eiffel, zoom: 16, pitch: 50 });
window.result = null;
map.on('load', async () => {
  const tok = '&access_token=' + mapboxgl.accessToken;
  // first run left out the /tilequery/ segment and got three 404s
  const q = (tileset, p, params) => fetch('https://api.mapbox.com/v4/' + tileset + '/tilequery/' + p.join(',') + '.json?' + params + tok);
  const responses = await Promise.all([
    q('mapbox.mapbox-streets-v8', eiffel, 'radius=100&limit=50&dedupe=true'),
    ...Object.values(peaks).map(([p]) => q('mapbox.mapbox-terrain-v2', p, 'layers=contour&limit=50')),
  ]);
  const bodies = await Promise.all(responses.map((r) => r.json()));
  // is 50 the ceiling? ask once for 100
  const more = await q('mapbox.mapbox-terrain-v2', peaks['Mont Blanc'][0], 'layers=contour&limit=100');
  window.result = { status: responses.map((r) => r.status), streets: bodies[0], contours: bodies.slice(1), limit100: { status: more.status, body: await more.json() } };
  if (responses.some((r) => !r.ok)) return;
  const layers = {};
  for (const f of bodies[0].features) layers[f.properties.tilequery.layer] = (layers[f.properties.tilequery.layer] || 0) + 1;
  const names = Object.keys(peaks);
  document.getElementById('out').innerHTML = '<b>Within 100 m of here</b><br>' + Object.entries(layers).map(([k, v]) => k + ': ' + v).join('<br>') +
    '<br><br><b>Highest contour</b><br>' + bodies.slice(1).map((b, i) => names[i] + ': ' + Math.max(...b.features.map((f) => f.properties.ele)) + ' m').join('<br>');
  new mapboxgl.Marker({ color: '#e4405f' }).setLngLat(eiffel).addTo(map);
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'What does Tilequery say is at the Eiffel Tower in Mapbox Streets, and how high are Mont Blanc and the Matterhorn in Mapbox Terrain contours?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 30000);
    await t.idle(30000);
    await t.shot('eiffel');
    const r = await t.eval(() => window.result);
    if (!r || r.status.some((s) => s !== 200)) return { facts: [fact('All three queries answered 200', false, { status: r?.status })], web_service_requests: 3 };
    const fs = r.streets.features;
    const layers = [...new Set(fs.map((f) => f.properties.tilequery.layer))];
    const named = fs.find((f) => /eiffel/i.test(f.properties.name_en || f.properties.name || ''));
    const top = Object.fromEntries(Object.keys(peaks).map((k, i) => [k, Math.max(...r.contours[i].features.map((f) => f.properties.ele))]));
    const stack = Object.fromEntries(Object.keys(peaks).map((k, i) => {
      const e = r.contours[i].features.map((f) => f.properties.ele).sort((a, b) => a - b);
      return [k, { returned: e.length, lowest: e[0], highest: e[e.length - 1], steps_m: [...new Set(e.slice(1).map((v, j) => v - e[j]))], geometry: [...new Set(r.contours[i].features.map((f) => f.geometry.type))], distances_m: [...new Set(r.contours[i].features.map((f) => Math.round(f.properties.tilequery.distance)))] }];
    }));
    return {
      facts: [
        fact('Within 100 m of the Eiffel Tower, Streets returns features from several layers, one of them named for the tower', layers.length >= 2 && !!named, { layers, named: named && { layer: named.properties.tilequery.layer, name: named.properties.name, name_en: named.properties.name_en, metres: Math.round(named.properties.tilequery.distance) } }),
        fact("Mont Blanc's highest contour is within 20 m of 4,806 m", Math.abs(top['Mont Blanc'] - 4806) <= 20, { highest_contour_m: top['Mont Blanc'] }),
        fact("The Matterhorn's highest contour is within 20 m of 4,478 m", Math.abs(top.Matterhorn - 4478) <= 20, { highest_contour_m: top.Matterhorn }),
        fact('Each summit query came back with exactly the 50 contours asked for', Object.values(stack).every((v) => v.returned === 50), stack),
        fact('Asking for 100 is refused, so 50 is the most one query returns', r.limit100.status >= 400, { status: r.limit100.status, message: r.limit100.body?.message, returned: r.limit100.body?.features?.length }),
      ],
      web_service_requests: 4,
      expected_refusals: ['limit=100'],
    };
  },
});
