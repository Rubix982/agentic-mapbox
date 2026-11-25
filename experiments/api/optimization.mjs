// Does the Optimization API find a round trip through seven stops that is shorter than visiting them in the order
// given?
import { mapExperiment, page, fact } from '../lib.mjs';

// seven Lisbon stops, listed so that the given order zig-zags east and west
const stops = [
  ['Praça do Comércio', [-9.1366, 38.7075]],
  ['Belém Tower', [-9.216, 38.6916]],
  ['Castelo de São Jorge', [-9.1335, 38.7139]],
  ['LX Factory', [-9.1783, 38.7035]],
  ['Miradouro de Santa Luzia', [-9.1301, 38.7118]],
  ['Jerónimos Monastery', [-9.2068, 38.6979]],
  ['Parque Eduardo VII', [-9.153, 38.729]],
];

const html = page({
  title: 'Optimization',
  script: `
const stops = ${JSON.stringify(stops)};
window.map = new mapboxgl.Map({ container: 'map', center: [-9.172, 38.71], zoom: 12.4 });
window.result = null;
map.on('load', async () => {
  const coords = stops.map((s) => s[1].join(',')).join(';');
  const tok = '&access_token=' + mapboxgl.accessToken;
  const [o, d] = await Promise.all([
    fetch('https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coords + '?roundtrip=true&source=first&geometries=geojson&overview=full' + tok),
    fetch('https://api.mapbox.com/directions/v5/mapbox/driving/' + coords + ';' + stops[0][1].join(',') + '?geometries=geojson&overview=full' + tok),
  ]);
  const opt = await o.json(), dir = await d.json();
  window.result = { status: [o.status, d.status], opt, dir };
  if (!o.ok || !d.ok) return;
  map.addSource('given', { type: 'geojson', data: dir.routes[0].geometry });
  map.addSource('best', { type: 'geojson', data: opt.trips[0].geometry });
  map.addLayer({ id: 'given', type: 'line', source: 'given', slot: 'middle', paint: { 'line-color': '#8e8e93', 'line-width': 3, 'line-dasharray': [2, 2], 'line-emissive-strength': 1 } });
  map.addLayer({ id: 'best', type: 'line', source: 'best', slot: 'middle', paint: { 'line-color': '#0a84ff', 'line-width': 5, 'line-emissive-strength': 1 } });
  opt.waypoints.forEach((w, i) => {
    const el = document.createElement('div');
    el.textContent = w.waypoint_index + 1;
    el.style.cssText = 'background:#0a84ff;color:#fff;font:600 12px system-ui;width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid #fff';
    new mapboxgl.Marker({ element: el }).setLngLat(stops[i][1]).addTo(map);
  });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does the Optimization API find a round trip through seven stops that is shorter than visiting them in the order given?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 30000);
    await t.idle(30000);
    await t.shot('lisbon');
    const r = await t.eval(() => window.result);
    if (!r || r.status.some((s) => s !== 200)) return { facts: [fact('Both APIs answered 200', false, { status: r?.status, message: r?.opt?.message || r?.dir?.message })], web_service_requests: 2 };
    const order = r.opt.waypoints.map((w, i) => [w.waypoint_index, stops[i][0]]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const best = r.opt.trips[0], given = r.dir.routes[0];
    const km = (m) => Math.round(m / 100) / 10, min = (s) => Math.round(s / 60);
    return {
      facts: [
        fact('The trip visits all seven stops once and starts at the first', order.length === 7 && new Set(order).size === 7 && order[0] === stops[0][0], { visiting_order: order }),
        fact('The optimised round trip is shorter than the given order', best.distance < given.distance, { optimised_km: km(best.distance), given_order_km: km(given.distance), optimised_min: min(best.duration), given_order_min: min(given.duration) }),
      ],
      web_service_requests: 2,
    };
  },
});
