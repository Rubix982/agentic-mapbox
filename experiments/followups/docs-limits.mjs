// C-011 (T-009): every numeric limit Mapbox's API reference states for a GET endpoint a public token can call, tested
// with one request at the limit and one just past it. The limits come from the 25 reference pages in
// docs.mapbox.com/api's sitemap, read by experiments/mcp/docs_params.py into .cache/api-docs/params.json (not
// committed); each test below names the parameter and quotes the stated limit.
//   node experiments/followups/docs-limits.mjs
import { apiExperiment, fact } from '../lib.mjs';

const A = 'https://api.mapbox.com';
const enc = encodeURIComponent;
// n points along Berlin streets, west to east
const line = (n, step = 0.0009, lat = 52.5163, lng = 13.3700) => Array.from({ length: n }, (_, i) => `${(lng + i * step).toFixed(5)},${lat}`).join(';');
const words = (n) => Array.from({ length: n }, (_, i) => ['main', 'street', 'berlin', 'cafe', 'park'][i % 5]).join(' ');
const chars = (n) => ('unter den linden berlin germany '.repeat(20)).slice(0, n).replace(/ $/, 'x');
const nameList = (total, parts) => { const each = Math.floor((total - (parts - 1)) / parts); const xs = Array.from({ length: parts }, () => 'a'.repeat(each)); xs[0] += 'a'.repeat(total - (parts - 1) - each * parts); return xs.join(';'); };
const repeat = (s, n, sep = ',') => Array.from({ length: n }, () => s).join(sep);
const dir = (q, profile = 'driving', coords = '13.3777,52.5163;13.4050,52.5200') => `${A}/directions/v5/mapbox/${profile}/${coords}?${q}`;
const stat = ({ lon = 13.405, lat = 52.52, zoom = 10, bearing = 0, pitch = 0, w = 100, h = 100 }) => `${A}/styles/v1/mapbox/streets-v12/static/${lon},${lat},${zoom},${bearing},${pitch}/${w}x${h}`;
const EV = 'engine=electric&ev_initial_charge=60000&ev_max_charge=80000&ev_connector_types=ccs_combo_type2&energy_consumption_curve=0,300;20,160;80,140;120,180&ev_charging_curve=0,100000;40000,70000;60000,30000;80000,10000';
const BERLIN_MUNICH = '13.3777,52.5163;11.5820,48.1351', BERLIN_STOP_MUNICH = '13.3777,52.5163;11.9671,50.5000;11.5820,48.1351';
const mm = (n, q = '') => `${A}/matching/v5/mapbox/driving/${line(n, 0.0002, 52.5170, 13.3777)}?${q}`;

// [page, parameter, stated limit as the docs word it, which end, value at, value past, url(v)]
const T = [
  ['static-images', 'lon', 'between -180 and 180', 'max', 180, 180.5, (v) => stat({ lon: v, zoom: 1 })],
  ['static-images', 'lon', 'between -180 and 180', 'min', -180, -180.5, (v) => stat({ lon: v, zoom: 1 })],
  ['static-images', 'lat', 'between -85.0511 and 85.0511', 'max', 85.0511, 85.06, (v) => stat({ lat: v, zoom: 1 })],
  ['static-images', 'lat', 'between -85.0511 and 85.0511', 'min', -85.0511, -85.06, (v) => stat({ lat: v, zoom: 1 })],
  ['static-images', 'zoom', 'between 0 and 22', 'max', 22, 22.5, (v) => stat({ zoom: v })],
  ['static-images', 'zoom', 'between 0 and 22', 'min', 0, -1, (v) => stat({ zoom: v })],
  ['static-images', 'width', 'between 1 and 1280', 'max', 1280, 1281, (v) => stat({ w: v })],
  ['static-images', 'width', 'between 1 and 1280', 'min', 1, 0, (v) => stat({ w: v })],
  ['static-images', 'height', 'between 1 and 1280', 'max', 1280, 1281, (v) => stat({ h: v })],
  ['static-images', 'height', 'between 1 and 1280', 'min', 1, 0, (v) => stat({ h: v })],
  ['static-images', 'bearing', 'between 0 and 360', 'max', 360, 361, (v) => stat({ bearing: v })],
  ['static-images', 'bearing', 'between 0 and 360', 'min', 0, -1, (v) => stat({ bearing: v })],
  ['static-images', 'pitch', 'between 0 and 60', 'max', 60, 61, (v) => stat({ pitch: v })],
  ['static-images', 'pitch', 'between 0 and 60', 'min', 0, -1, (v) => stat({ pitch: v })],
  ['tilequery', 'limit', 'between 1-50', 'max', 50, 51, (v) => `${A}/v4/mapbox.mapbox-streets-v8/tilequery/13.405,52.52.json?radius=500&limit=${v}`],
  ['tilequery', 'limit', 'between 1-50', 'min', 1, 0, (v) => `${A}/v4/mapbox.mapbox-streets-v8/tilequery/13.405,52.52.json?radius=500&limit=${v}`],
  ['tilequery', 'tileset_id', 'up to 25 (composited)', 'max', 25, 26, (v) => `${A}/v4/${repeat('mapbox.mapbox-streets-v8', v)}/tilequery/13.405,52.52.json`],
  ['vector-tiles', 'tileset_id', 'up to 15 (composited)', 'max', 15, 16, (v) => `${A}/v4/${repeat('mapbox.mapbox-streets-v8', v)}/14/8800/5373.mvt`],
  ['raster-tiles', 'tileset_id', 'up to 15 (composited)', 'max', 15, 16, (v) => `${A}/v4/${repeat('mapbox.satellite', v)}/14/8800/5373.jpg`],
  ['directions', 'coordinates', 'between two and 25', 'max', 25, 26, (v) => dir('', 'driving', line(v))],
  ['directions', 'coordinates', 'between two and 25', 'min', 2, 1, (v) => dir('', 'driving', line(v))],
  ['directions', 'avoid_maneuver_radius', 'range from 1 to 1000', 'max', 1000, 1001, (v) => dir(`avoid_maneuver_radius=${v}`)],
  ['directions', 'avoid_maneuver_radius', 'range from 1 to 1000', 'min', 1, 0, (v) => dir(`avoid_maneuver_radius=${v}`)],
  ['directions', 'bearings', 'between 0 and 360', 'max', 360, 361, (v) => dir(`bearings=${v},45;`)],
  ['directions', 'bearings', 'between 0 and 360', 'min', 0, -1, (v) => dir(`bearings=${v},45;`)],
  ['directions', 'exclude', 'at most 50 points', 'max', 50, 51, (v) => dir(`exclude=${Array.from({ length: v }, (_, i) => `point(${(13.30 + i * 0.001).toFixed(3)} 52.60)`).join(',')}`)],
  ['directions', 'waypoint_names', 'total characters cannot exceed 500', 'max', 500, 501, (v) => dir(`steps=true&waypoint_names=${enc(nameList(v, 2))}`)],
  ['directions', 'waypoint_external_ids', 'each up to 128 characters', 'max', 128, 129, (v) => dir(`waypoint_external_ids=${'a'.repeat(v)};b`)],
  ['directions', 'walking_speed', 'minimum of 0.14, maximum of 6.94', 'max', 6.94, 6.95, (v) => dir(`walking_speed=${v}`, 'walking')],
  ['directions', 'walking_speed', 'minimum of 0.14, maximum of 6.94', 'min', 0.14, 0.13, (v) => dir(`walking_speed=${v}`, 'walking')],
  ['directions', 'walkway_bias', 'from -1 to 1', 'max', 1, 1.1, (v) => dir(`walkway_bias=${v}`, 'walking')],
  ['directions', 'walkway_bias', 'from -1 to 1', 'min', -1, -1.1, (v) => dir(`walkway_bias=${v}`, 'walking')],
  ['directions', 'alley_bias', 'from -1 to 1', 'max', 1, 1.1, (v) => dir(`alley_bias=${v}`, 'walking')],
  ['directions', 'alley_bias', 'from -1 to 1', 'min', -1, -1.1, (v) => dir(`alley_bias=${v}`, 'walking')],
  ['directions', 'max_height', 'must be between 0 and 10', 'max', 10, 10.1, (v) => dir(`max_height=${v}`)],
  ['directions', 'max_height', 'must be between 0 and 10', 'min', 0, -0.1, (v) => dir(`max_height=${v}`)],
  ['directions', 'max_width', 'must be between 0 and 10', 'max', 10, 10.1, (v) => dir(`max_width=${v}`)],
  ['directions', 'max_width', 'must be between 0 and 10', 'min', 0, -0.1, (v) => dir(`max_width=${v}`)],
  ['directions', 'max_weight', 'must be between 0 and 100', 'max', 100, 100.1, (v) => dir(`max_weight=${v}`)],
  ['directions', 'max_weight', 'must be between 0 and 100', 'min', 0, -0.1, (v) => dir(`max_weight=${v}`)],
  ['isochrone', 'contours_minutes', 'the maximum time is 60 minutes', 'max', 60, 61, (v) => `${A}/isochrone/v1/mapbox/driving/13.3777,52.5163?contours_minutes=${v}`],
  ['isochrone', 'contours_minutes', 'up to four contours', 'max', 4, 5, (v) => `${A}/isochrone/v1/mapbox/driving/13.3777,52.5163?contours_minutes=${Array.from({ length: v }, (_, i) => 5 * (i + 1)).join(',')}`],
  ['isochrone', 'contours_meters', 'the maximum distance is 100000 meters', 'max', 100000, 100001, (v) => `${A}/isochrone/v1/mapbox/driving/13.3777,52.5163?contours_meters=${v}`],
  ['isochrone', 'contours_meters', 'up to four contours', 'max', 4, 5, (v) => `${A}/isochrone/v1/mapbox/driving/13.3777,52.5163?contours_meters=${Array.from({ length: v }, (_, i) => 1000 * (i + 1)).join(',')}`],
  ['isochrone', 'denoise', 'from 0.0 to 1.0', 'max', 1, 1.1, (v) => `${A}/isochrone/v1/mapbox/driving/13.3777,52.5163?contours_minutes=5&denoise=${v}`],
  ['isochrone', 'denoise', 'from 0.0 to 1.0', 'min', 0, -0.1, (v) => `${A}/isochrone/v1/mapbox/driving/13.3777,52.5163?contours_minutes=5&denoise=${v}`],
  ['map-matching', 'coordinates', 'between 2 and 100', 'max', 100, 101, (v) => mm(v)],
  ['map-matching', 'coordinates', 'between 2 and 100', 'min', 2, 1, (v) => mm(v)],
  ['map-matching', 'radiuses', 'between 0.0 and 50.00', 'max', 50, 50.1, (v) => mm(3, `radiuses=${v};${v};${v}`)],
  ['map-matching', 'radiuses', 'between 0.0 and 50.00', 'min', 0, -1, (v) => mm(3, `radiuses=${v};${v};${v}`)],
  ['map-matching', 'waypoint_names', 'total characters (including semicolons) cannot exceed 500', 'max', 500, 501, (v) => mm(3, `steps=true&waypoint_names=${enc(nameList(v, 3))}`)],
  ['matrix', 'coordinates', 'between two and 25', 'max', 25, 26, (v) => `${A}/directions-matrix/v1/mapbox/driving/${line(v)}`],
  ['matrix', 'coordinates', 'between two and 25', 'min', 2, 1, (v) => `${A}/directions-matrix/v1/mapbox/driving/${line(v)}`],
  ['matrix', 'coordinates', 'for driving-traffic the maximum is 10', 'max', 10, 11, (v) => `${A}/directions-matrix/v1/mapbox/driving-traffic/${line(v)}`],
  ['matrix', 'bearings', 'between 0 and 360', 'max', 360, 361, (v) => `${A}/directions-matrix/v1/mapbox/driving/${line(2)}?bearings=${v},45;`],
  ['matrix', 'bearings', 'between 0 and 360', 'min', 0, -1, (v) => `${A}/directions-matrix/v1/mapbox/driving/${line(2)}?bearings=${v},45;`],
  ['optimization-v1', 'coordinates', 'between two and 12', 'max', 12, 13, (v) => `${A}/optimized-trips/v1/mapbox/driving/${line(v)}`],
  ['optimization-v1', 'coordinates', 'between two and 12', 'min', 2, 1, (v) => `${A}/optimized-trips/v1/mapbox/driving/${line(v)}`],
  ['optimization-v1', 'bearings', 'between 0 and 360', 'max', 360, 361, (v) => `${A}/optimized-trips/v1/mapbox/driving/${line(2)}?bearings=${v},45;`],
  ['optimization-v1', 'bearings', 'between 0 and 360', 'min', 0, -1, (v) => `${A}/optimized-trips/v1/mapbox/driving/${line(2)}?bearings=${v},45;`],
  ['geocoding (v6)', 'q', 'at most 20 words', 'max', 20, 21, (v) => `${A}/search/geocode/v6/forward?q=${enc(words(v))}&limit=1`],
  ['geocoding (v6)', 'q', 'at most 256 characters', 'max', 256, 257, (v) => `${A}/search/geocode/v6/forward?q=${enc(chars(v))}&limit=1`],
  ['geocoding (v6)', 'limit (forward)', 'the maximum supported is 10', 'max', 10, 11, (v) => `${A}/search/geocode/v6/forward?q=berlin&limit=${v}`],
  ['geocoding (v6)', 'limit (reverse)', 'the maximum supported is 5', 'max', 5, 6, (v) => `${A}/search/geocode/v6/reverse?longitude=13.405&latitude=52.52&types=address&limit=${v}`],
  ['geocoding-v5', 'search_text', 'at most 20 words', 'max', 20, 21, (v) => `${A}/geocoding/v5/mapbox.places/${enc(words(v))}.json?limit=1`],
  ['geocoding-v5', 'search_text', 'at most 256 characters', 'max', 256, 257, (v) => `${A}/geocoding/v5/mapbox.places/${enc(chars(v))}.json?limit=1`],
  ['geocoding-v5', 'limit (forward)', 'the maximum supported is 10', 'max', 10, 11, (v) => `${A}/geocoding/v5/mapbox.places/berlin.json?limit=${v}`],
  ['geocoding-v5', 'limit (reverse)', 'the maximum supported is 10', 'max', 10, 11, (v) => `${A}/geocoding/v5/mapbox.places/13.405,52.52.json?types=address&limit=${v}`],
  ['search-box', 'q (forward)', 'limited to 256 characters', 'max', 256, 257, (v) => `${A}/search/searchbox/v1/forward?q=${enc(chars(v))}&limit=1`],
  ['search-box', 'limit (forward)', 'up to 10', 'max', 10, 11, (v) => `${A}/search/searchbox/v1/forward?q=cafe&proximity=13.405,52.52&limit=${v}`],
  ['search-box', 'radius (forward)', 'between 0.00001 and 10', 'max', 10, 10.1, (v) => `${A}/search/searchbox/v1/forward?q=cafe&proximity=13.405,52.52&radius=${v}&limit=1`],
  ['search-box', 'radius (forward)', 'between 0.00001 and 10', 'min', 0.00001, 0.000009, (v) => `${A}/search/searchbox/v1/forward?q=cafe&proximity=13.405,52.52&radius=${v}&limit=1`],
  ['search-box', 'minimum_rating (forward)', 'between 0.0 and 5.0', 'max', 5, 5.1, (v) => `${A}/search/searchbox/v1/forward?q=cafe&proximity=13.405,52.52&minimum_rating=${v}&limit=1`],
  ['search-box', 'minimum_rating (forward)', 'between 0.0 and 5.0', 'min', 0, -0.1, (v) => `${A}/search/searchbox/v1/forward?q=cafe&proximity=13.405,52.52&minimum_rating=${v}&limit=1`],
  ['search-box', 'limit (category)', 'up to 25', 'max', 25, 26, (v) => `${A}/search/searchbox/v1/category/cafe?proximity=13.405,52.52&limit=${v}`],
  ['search-box', 'radius (category)', 'between 0.00001 and 10', 'max', 10, 10.1, (v) => `${A}/search/searchbox/v1/category/cafe?proximity=13.405,52.52&radius=${v}&limit=1`],
  ['search-box', 'radius (category)', 'between 0.00001 and 10', 'min', 0.00001, 0.000009, (v) => `${A}/search/searchbox/v1/category/cafe?proximity=13.405,52.52&radius=${v}&limit=1`],
  ['search-box', 'limit (reverse)', 'up to 10', 'max', 10, 11, (v) => `${A}/search/searchbox/v1/reverse?longitude=13.405&latitude=52.52&limit=${v}`],
  // Directions' EV routing: Berlin to Munich, an 80 kWh car starting at 60 kWh (the request ev_probe checks first)
  ...[
    ['ev_min_charge_at_destination', 'must be between 0 and ev_max_charge (80000 here)', [[80000, 80001], [0, -1]]],
    ['ev_min_charge_at_charging_station', 'must be between 0 and ev_max_charge (80000 here)', [[80000, 80001], [0, -1]]],
    ['ev_min_energy_increment_at_charging_station', 'must be between 0 and ev_max_charge (80000 here)', [[80000, 80001], [0, -1]]],
    ['ev_regeneration_efficiency', 'allowed range is [0.0, 1.0]', [[1, 1.1], [0, -0.1]]],
    ['auxiliary_consumption', 'the minimum value is 0 watts, the maximum value is 10000 watts', [[10000, 10001], [0, -1]]],
    ['ev_pre_conditioning_time', 'the minimum value is 0 minutes, the maximum value is 240 minutes', [[240, 241], [0, -1]], '&ev_unconditioned_charging_curve=0,50000;42000,35000;60000,15000;80000,5000'],
    ['ev_exclude_station_ids', 'a limit of 40 IDs', [[40, 41]], '', (v) => Array.from({ length: v }, (_, i) => `station${i}`).join(',')],
    ['ev_exclude_charge_point_provider_ids', 'the maximum number of IDs in a query is 40', [[40, 41]], '', (v) => Array.from({ length: v }, (_, i) => `provider${i}`).join(',')],
    ['ev_prefer_charge_point_provider_ids', 'the maximum number of IDs in a query is 30', [[30, 31]], '', (v) => Array.from({ length: v }, (_, i) => `provider${i}`).join(',')],
    ['ev_prefer_charge_point_provider_weights', 'each element is a number in (0.0, 1.0]', [[1, 1.1], [0.01, 0]], '&ev_prefer_charge_point_provider_ids=provider0'],
  ].flatMap(([param, stated, ends, extra = '', fmt = (v) => v]) => ends.map(([at, past], i) => ['directions (EV)', param, stated, ends.length === 2 && i === 1 ? 'min' : 'max', at, past, (v) => dir(`${EV}${extra}&${param}=${fmt(v)}`, 'driving', BERLIN_MUNICH)])),
  ['directions (EV)', 'waypoints.charging_station_power', 'must be greater than or equal to 1000 watts', 'min', 1000, 999, (v) => dir(`${EV}&waypoints.charging_station_power=;${v};&waypoints.charging_station_current_type=;dc;`, 'driving', BERLIN_STOP_MUNICH)],
  ['directions (EV)', 'waypoints.minimal_stop_time', 'the valid integer range is 0 through 7200', 'max', 7200, 7201, (v) => dir(`${EV}&waypoints.charging_station_power=;50000;&waypoints.charging_station_current_type=;dc;&waypoints.minimal_stop_time=;${v};`, 'driving', BERLIN_STOP_MUNICH)],
  ['fonts', 'font', 'a maximum of 10 comma-separated font names', 'max', 10, 11, (v) => `${A}/fonts/v1/mapbox/${enc(repeat('DIN Pro Regular', v))}/0-255.pbf`],
  ['fonts', 'start', 'a multiple of 256 between 0 and 65280', 'max', 65280, 65536, (v) => `${A}/fonts/v1/mapbox/${enc('DIN Pro Regular')}/${v}-${v + 255}.pbf`],
  ['fonts', 'start', 'a multiple of 256 between 0 and 65280', 'min', 0, -256, (v) => `${A}/fonts/v1/mapbox/${enc('DIN Pro Regular')}/${v}-${v + 255}.pbf`],
  ['ev-charge-finder', 'distance', 'up to 100 kilometers', 'max', 100, 101, (v) => `${A}/ev/v1/locations?latitude=52.52&longitude=13.405&distance=${v}`],
  ['ev-charge-finder', 'limit', 'up to 100', 'max', 100, 101, (v) => `${A}/ev/v1/locations?latitude=52.52&longitude=13.405&limit=${v}`],
  ['ev-charge-finder', 'latitude', 'between -90.0 and 90.0', 'max', 90, 90.1, (v) => `${A}/ev/v1/locations?latitude=${v}&longitude=13.405`],
  ['ev-charge-finder', 'longitude', 'between -180.0 and 180.0', 'max', 180, 180.1, (v) => `${A}/ev/v1/locations?latitude=52.52&longitude=${v}`],
];

// stated limits the scan found but this card leaves out, and why
const LEFT_OUT = [
  ['datasets, uploads, Mapbox Tiling Service, user feedback, tokens', 'need a secret token, and most write'],
  ['search-box /suggest (q, limit, radius)', 'billed by session'],
  ['geocoding-v5 batch (50 queries, 20 words, 256 characters)', 'batch needs the paid permanent endpoint'],
  ['ev-charge-finder origin_latitude / origin_longitude, and the lower ends of its ranges', 'the same check as the upper ends, left out to save requests'],
  ['static-images auto and padding', 'the numbers describe the default padding, not a limit on a value'],
];

await apiExperiment({
  file: import.meta.url,
  question: "How often does a numeric limit stated in Mapbox's API reference disagree with the API?",
  run: async (api) => {
    const send = async (url) => { const r = await api.get(url); return { status: r.status, message: r.ok ? null : (typeof (r.json?.message ?? r.json?.error) === 'object' ? JSON.stringify(r.json.message ?? r.json.error) : String(r.json?.message ?? r.json?.error ?? r.message ?? '')).slice(0, 200) }; };
    const rows = [];
    for (const [page, param, stated, end, at, past, url] of T) {
      const a = await send(url(at)), p = await send(url(past));
      const ok = (x) => x.status >= 200 && x.status < 300;
      // refused at the limit: for lack of access, the limit is untested; otherwise the API is stricter than the docs
      // if its message is about this parameter (the write-up checks each one)
      const verdict = ok(a) && !ok(p) ? 'agrees' : ok(a) && ok(p) ? 'api looser' : [401, 403].includes(a.status) ? 'untested (no access)' : 'api stricter';
      rows.push({ page, param, stated, end, at, past, at_status: a.status, at_message: a.message, past_status: p.status, past_message: p.message, verdict });
    }
    // can this token use Directions' EV routing at all?
    const ev = await send(dir('engine=electric&ev_initial_charge=60000&ev_max_charge=80000&ev_connector_types=ccs_combo_type2&energy_consumption_curve=0,300;20,160;80,140;120,180&ev_charging_curve=0,100000;40000,70000;60000,30000;80000,10000', 'driving', '13.3777,52.5163;11.5820,48.1351'));
    const count = (v) => rows.filter((r) => r.verdict === v).length;
    const tested = rows.length - count('untested (no access)');
    return {
      // the requests past each limit are meant to be refused
      refusals_are_the_finding: true,
      facts: [
        fact('Every tested limit was sent at and past the limit', rows.length === T.length, { tests: rows.length }),
        fact('The API is stricter than the docs on 5% or fewer of the limits tested', count('api stricter') <= 0.05 * tested, { tested, api_stricter: rows.filter((r) => r.verdict === 'api stricter').map((r) => `${r.page} ${r.param} ${r.end} ${r.at}: ${r.at_status} ${r.at_message}`) }),
        fact('The API accepted no request past a stated limit', count('api looser') === 0, { api_looser: rows.filter((r) => r.verdict === 'api looser').map((r) => `${r.page} ${r.param} ${r.end} ${r.past}: ${r.past_status}`) }),
      ],
      numbers: { counts: { sent: rows.length, tested, agrees: count('agrees'), api_stricter: count('api stricter'), api_looser: count('api looser'), untested_no_access: count('untested (no access)') }, ev_probe: ev, rows, left_out: LEFT_OUT },
    };
  },
});
