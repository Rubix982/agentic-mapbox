// In one Search Box session, does /suggest find the Rijksmuseum without coordinates, and /retrieve then give its
// location?
import { mapExperiment, page, metres, fact } from '../lib.mjs';

const rijks = [4.8852, 52.36]; // published location

const html = page({
  title: 'Search Box suggest and retrieve',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [4.8952, 52.3702], zoom: 12 });
window.result = null;
map.on('load', async () => {
  const session = crypto.randomUUID();
  const tok = '&session_token=' + session + '&access_token=' + mapboxgl.accessToken;
  const s = await fetch('https://api.mapbox.com/search/searchbox/v1/suggest?q=Rijksmuseum&language=en&limit=5&proximity=4.8952,52.3702' + tok);
  const suggest = await s.json();
  if (!s.ok || !suggest.suggestions?.length) { window.result = { status: [s.status], suggest }; return; }
  const first = suggest.suggestions[0];
  const g = await fetch('https://api.mapbox.com/search/searchbox/v1/retrieve/' + encodeURIComponent(first.mapbox_id) + '?' + tok.slice(1));
  const retrieve = await g.json();
  window.result = { status: [s.status, g.status], suggest, retrieve };
  if (!g.ok) return;
  const p = retrieve.features[0].geometry.coordinates;
  new mapboxgl.Marker({ color: '#e4405f' }).setLngLat(p).addTo(map);
  new mapboxgl.Popup({ closeButton: false, offset: 30 }).setLngLat(p).setText(retrieve.features[0].properties.name).addTo(map);
  map.jumpTo({ center: p, zoom: 15.5 });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'In one Search Box session, does /suggest find the Rijksmuseum without coordinates, and /retrieve then give its location?',
  html,
  check: async (t) => {
    await t.waitFor(() => window.result, 30000);
    await t.idle(30000);
    await t.wait(300);
    await t.shot('amsterdam');
    const r = await t.eval(() => window.result);
    if (!r || r.status.some((s) => s !== 200)) return { facts: [fact('Both requests answered 200', false, { status: r?.status, message: r?.suggest?.message || r?.retrieve?.message })], web_service_requests: r?.status?.length || 1 };
    const first = r.suggest.suggestions[0];
    const hasCoords = r.suggest.suggestions.some((x) => x.coordinates || x.geometry || x.center);
    const p = r.retrieve.features[0].geometry.coordinates;
    const off = Math.round(metres(p, rijks));
    return {
      facts: [
        fact("The first suggestion is the Rijksmuseum", /rijksmuseum/i.test(first.name), { name: first.name, feature_type: first.feature_type, place_formatted: first.place_formatted }),
        fact('No suggestion carries coordinates', !hasCoords, { suggestion_keys: Object.keys(first) }),
        fact('Retrieve puts it within 300 m of its published location', off < 300, { metres_off: off }),
      ],
      web_service_requests: 2,
    };
  },
});
