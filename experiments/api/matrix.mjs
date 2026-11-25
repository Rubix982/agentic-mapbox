// Does the Matrix API return a full table of driving times between four points, and is A-to-B ever different from
// B-to-A?
import { mapExperiment, page, fact } from '../lib.mjs';

const places = [
  ['Ferry Building', [-122.3937, 37.7955]],
  ['de Young Museum', [-122.4686, 37.7715]],
  ['Mission Dolores', [-122.4269, 37.7642]],
  ['Coit Tower', [-122.4058, 37.8024]],
];

const html = page({
  title: 'Matrix',
  css: `#table { position: absolute; top: 10px; left: 10px; background: #fff; font: 12px/1.4 system-ui, sans-serif; padding: 6px 8px; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
#table td, #table th { padding: 1px 6px; text-align: right; } #table th { font-weight: 600; }`,
  body: '<table id="table"></table>',
  script: `
const places = ${JSON.stringify(places)};
window.map = new mapboxgl.Map({ container: 'map', center: [-122.43, 37.785], zoom: 12.2 });
window.result = null;
map.on('load', async () => {
  for (const [name, p] of places) new mapboxgl.Marker({ color: '#e4405f' }).setLngLat(p).setPopup(new mapboxgl.Popup().setText(name)).addTo(map);
  const url = 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/' + places.map((x) => x[1].join(',')).join(';') +
    '?annotations=duration,distance&access_token=' + mapboxgl.accessToken;
  const r = await fetch(url);
  const data = await r.json();
  window.result = { status: r.status, data };
  if (!r.ok) return;
  const short = (s) => s.split(' ')[0];
  document.getElementById('table').innerHTML = '<tr><th>min</th>' + places.map((p) => '<th>' + short(p[0]) + '</th>').join('') + '</tr>' +
    data.durations.map((row, i) => '<tr><th>' + short(places[i][0]) + '</th>' + row.map((d) => '<td>' + (d / 60).toFixed(1) + '</td>').join('') + '</tr>').join('');
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does the Matrix API return a full table of driving times between four points, and is A-to-B ever different from B-to-A?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 30000);
    await t.idle(30000);
    await t.shot('san-francisco');
    const r = await t.eval(() => window.result);
    if (!r || r.status !== 200) return { facts: [fact('The API answered 200', false, { status: r?.status, message: r?.data?.message })], web_service_requests: 1 };
    const D = r.data.durations, n = places.length;
    const full = D.length === n && D.every((row) => row.length === n && row.every((v) => typeof v === 'number'));
    const diag = D.every((row, i) => row[i] === 0);
    let worst = { ratio: 1 };
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const ratio = Math.max(D[i][j], D[j][i]) / Math.min(D[i][j], D[j][i]);
      if (ratio > worst.ratio) worst = { ratio: Math.round(ratio * 100) / 100, from: places[i][0], to: places[j][0], there_min: Math.round(D[i][j] / 6) / 10, back_min: Math.round(D[j][i] / 6) / 10 };
    }
    return {
      facts: [
        fact('The API answered 200 with a full 4 x 4 table of times', full, { rows: D.length }),
        fact('A point to itself takes 0 s', diag),
        fact('For at least one pair, one direction takes over 10% longer than the other', worst.ratio > 1.1, worst),
      ],
      numbers: { durations_s: D, distances_m: r.data.distances, keys: Object.keys(r.data) },
      web_service_requests: 1,
    };
  },
});
