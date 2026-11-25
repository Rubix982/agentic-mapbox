// Does the Map Matching API snap a noisy GPS trace back onto the road it was taken from?
//
// The trace is made from a real route: Directions gives a drive through Chicago, the page takes a point every 60 m
// along it and moves each one up to 20 m in a random direction (the same random numbers every run). Map Matching then
// gets only the noisy points.
import { mapExperiment, page, toLine, metres, fact } from '../lib.mjs';

const from = [-87.6226, 41.8826], to = [-87.6336, 41.9211]; // Millennium Park to Lincoln Park Zoo

const html = page({
  title: 'Map Matching',
  script: `
const from = ${JSON.stringify(from)}, to = ${JSON.stringify(to)};
window.map = new mapboxgl.Map({ container: 'map', center: [-87.628, 41.902], zoom: 13.2 });
window.result = null;
// deterministic noise: mulberry32
let seed = 42; const rand = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = 6371008.8, rad = Math.PI / 180;
const dist = (a, b) => 2 * R * Math.asin(Math.sqrt(Math.sin((b[1] - a[1]) * rad / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin((b[0] - a[0]) * rad / 2) ** 2));
function sample(line, every) {
  const out = [line[0]]; let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], d = dist(a, b); let s = every - carry;
    while (s <= d) { const f = s / d; out.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])]); s += every; }
    carry = d - (s - every);
  }
  out.push(line[line.length - 1]);
  return out;
}
const jitter = (p, m) => { const a = rand() * 2 * Math.PI, r = rand() * m; return [p[0] + (r * Math.cos(a)) / (R * rad * Math.cos(p[1] * rad)), p[1] + (r * Math.sin(a)) / (R * rad)]; };
map.on('load', async () => {
  const tok = '&access_token=' + mapboxgl.accessToken;
  const d = await fetch('https://api.mapbox.com/directions/v5/mapbox/driving/' + from.join(',') + ';' + to.join(',') + '?geometries=geojson&overview=full' + tok);
  const dir = await d.json();
  if (!d.ok) { window.result = { status: [d.status], dir }; return; }
  const route = dir.routes[0].geometry.coordinates;
  let pts = sample(route, 60);
  if (pts.length > 100) pts = pts.filter((_, i) => i % Math.ceil(pts.length / 100) === 0);
  const trace = pts.map((p) => jitter(p, 20));
  const m = await fetch('https://api.mapbox.com/matching/v5/mapbox/driving/' + trace.map((p) => p.map((v) => v.toFixed(6)).join(',')).join(';') +
    '?geometries=geojson&overview=full&tidy=false&radiuses=' + trace.map(() => 30).join(';') + tok);
  const match = await m.json();
  window.result = { status: [d.status, m.status], route, trace, match };
  if (!m.ok) return;
  map.addSource('trace', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: trace } } });
  map.addSource('match', { type: 'geojson', data: { type: 'FeatureCollection', features: match.matchings.map((x) => ({ type: 'Feature', properties: {}, geometry: x.geometry })) } });
  map.addLayer({ id: 'match', type: 'line', source: 'match', slot: 'middle', paint: { 'line-color': '#0a84ff', 'line-width': 5, 'line-emissive-strength': 1 } });
  map.addLayer({ id: 'trace', type: 'circle', source: 'trace', slot: 'top', paint: { 'circle-color': '#ff2d55', 'circle-radius': 3, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1, 'circle-emissive-strength': 1 } });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does the Map Matching API snap a noisy GPS trace back onto the road it was taken from?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 45000);
    await t.idle(30000);
    await t.shot('chicago');
    const r = await t.eval(() => window.result);
    if (!r || r.status.some((s) => s !== 200)) return { facts: [fact('Both APIs answered 200', false, { status: r?.status, message: r?.match?.message || r?.dir?.message })], web_service_requests: r?.status?.length || 1 };
    const matched = r.match.matchings.flatMap((x) => x.geometry.coordinates);
    const traceOff = r.trace.map((p) => toLine(p, r.route));
    const matchOff = matched.map((p) => toLine(p, r.route));
    const routeLen = r.route.slice(1).reduce((s, p, i) => s + metres(r.route[i], p), 0);
    const matchLen = r.match.matchings.reduce((s, x) => s + x.distance, 0);
    const pct = (a) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.floor(0.95 * (s.length - 1))] * 10) / 10; };
    return {
      facts: [
        fact('The trace came back as one matching', r.match.matchings.length === 1, { matchings: r.match.matchings.length, confidence: r.match.matchings[0]?.confidence, trace_points: r.trace.length }),
        fact('The noisy points sit up to 20 m off the route, and 95% of the matched line lies within 5 m of it', pct(matchOff) <= 5, { trace_off_route_p95_m: pct(traceOff), matched_off_route_p95_m: pct(matchOff), matched_off_route_max_m: Math.round(Math.max(...matchOff) * 10) / 10 }),
        fact("The matched distance is within 5% of the route's", Math.abs(matchLen - routeLen) / routeLen < 0.05, { route_m: Math.round(routeLen), matched_m: Math.round(matchLen) }),
      ],
      web_service_requests: 2,
    };
  },
});
