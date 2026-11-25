// Does the Isochrone API return nested 10, 20 and 30 minute driving areas around a point, called from a browser page?
import { mapExperiment, page, areaKm2, pointInRing, fact } from '../lib.mjs';

const origin = [-105.0003, 39.753]; // Union Station, Denver

const html = page({
  title: 'Isochrone',
  script: `
const origin = ${JSON.stringify(origin)};
window.map = new mapboxgl.Map({ container: 'map', center: origin, zoom: 9.6 });
window.result = null;
map.on('load', async () => {
  const url = 'https://api.mapbox.com/isochrone/v1/mapbox/driving/' + origin.join(',') +
    '?contours_minutes=10,20,30&polygons=true&denoise=1&access_token=' + mapboxgl.accessToken;
  const r = await fetch(url);
  const data = await r.json();
  window.result = { status: r.status, data };
  if (!r.ok) return;
  map.addSource('iso', { type: 'geojson', data });
  map.addLayer({ id: 'iso-fill', type: 'fill', source: 'iso', slot: 'middle', paint: { 'fill-color': ['to-color', ['get', 'color']], 'fill-opacity': 0.25, 'fill-emissive-strength': 1 } });
  map.addLayer({ id: 'iso-line', type: 'line', source: 'iso', slot: 'middle', paint: { 'line-color': ['to-color', ['get', 'color']], 'line-width': 2.5, 'line-emissive-strength': 1 } });
  new mapboxgl.Marker({ color: '#111' }).setLngLat(origin).addTo(map);
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does the Isochrone API return nested 10, 20 and 30 minute driving areas around a point, called from a browser page?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 30000);
    await t.idle(30000);
    await t.wait(300);
    await t.shot('denver');
    const r = await t.eval(() => window.result);
    if (!r || r.status !== 200) return { facts: [fact('The API answered 200', false, { status: r?.status, message: r?.data?.message })], web_service_requests: 1 };
    const fs = r.data.features;
    const byMin = Object.fromEntries(fs.map((f) => {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      return [f.properties.contour, { km2: Math.round(polys.reduce((s, p) => s + areaKm2(p), 0)), containsOrigin: polys.some((p) => pointInRing(origin, p[0])), type: f.geometry.type }];
    }));
    const mins = fs.map((f) => f.properties.contour).sort((a, b) => a - b);
    return {
      facts: [
        fact('The API answered 200 with three areas, for 10, 20 and 30 minutes', JSON.stringify(mins) === '[10,20,30]', { contours: mins }),
        fact('Each longer time covers a larger area', byMin[10].km2 < byMin[20].km2 && byMin[20].km2 < byMin[30].km2, { km2: { 10: byMin[10].km2, 20: byMin[20].km2, 30: byMin[30].km2 } }),
        fact('Every area contains the starting point', Object.values(byMin).every((v) => v.containsOrigin)),
      ],
      numbers: { feature_properties: Object.keys(fs[0].properties) },
      web_service_requests: 1,
    };
  },
});
