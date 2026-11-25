// Where the MCP server's tool schemas and the API reference disagree, what does the API itself accept? (C-003)
//
// Each disagreement below was found by compare.mjs and kept after review (results.md says which flags were dismissed
// and why). One read-only GET request per claim settles it.
import { apiExperiment, fact } from '../lib.mjs';

const A = 'https://api.mapbox.com';
const query = (n) => 'quiet coffee shop with good wifi near the old harbour in lisbon '.repeat(10).slice(0, n);
const status = async (api, url) => { const r = await api.get(url); return { status: r.status, json: r.json, message: r.message, type: r.type }; };

await apiExperiment({
  file: import.meta.url,
  question: "Where the MCP tools' schemas and Mapbox's API reference disagree, which one does the API agree with?",
  run: async (api) => {
    const fwd = (n) => status(api, `${A}/search/searchbox/v1/forward?q=${encodeURIComponent(query(n))}&proximity=-9.14,38.71&limit=1`);
    const q200 = await fwd(200), q201 = await fwd(201), q256 = await fwd(256);
    const street = await status(api, `${A}/search/geocode/v6/reverse?longitude=2.3376&latitude=48.8606&types=street&limit=1`);
    const ma = await status(api, `${A}/search/geocode/v6/reverse?longitude=-13.2&latitude=27.15&worldview=ma&types=country&limit=1`);
    const us = await status(api, `${A}/search/geocode/v6/reverse?longitude=-13.2&latitude=27.15&worldview=us&types=country&limit=1`);
    const berlin = '13.3777,52.5163;13.4050,52.5200';
    const p6 = await status(api, `${A}/directions/v5/mapbox/driving/${berlin}?geometries=polyline6`);
    const noOverview = await status(api, `${A}/directions/v5/mapbox/driving/${berlin}?overview=false`);
    const mm = await status(api, `${A}/matching/v5/mapbox/driving/13.3889,52.5170;13.3930,52.5173;13.3970,52.5176?overview=full&annotations=maxspeed,congestion_numeric`);
    const iso = await status(api, `${A}/isochrone/v1/mapbox/driving/-105.0003,39.753?contours_minutes=5`);
    const stat = await status(api, `${A}/styles/v1/mapbox/streets-v12/static/2.2945,48.8584,14/300x200`);

    const country = (r) => r.json?.features?.[0]?.properties?.name;
    const ann = mm.json?.matchings?.[0]?.legs?.[0]?.annotation || {};
    return {
      facts: [
        fact('Search Box /forward answers a 200-character query (the tools\' limit)', q200.status === 200, { status: q200.status }),
        fact('It refuses a 201-character query, as the tool\'s description says', q201.status >= 400, { status: q201.status, message: q201.message }),
        fact('It answers a 256-character query, as the docs say', q256.status === 200, { status: q256.status, message: q256.message }),
        fact("Reverse geocoding accepts types=street, a type the docs list and the tool's list leaves out", street.status === 200 && street.json?.features?.[0]?.properties?.feature_type === 'street', { status: street.status, feature_type: street.json?.features?.[0]?.properties?.feature_type }),
        fact("It accepts worldview=ma, one of five worldviews the docs list and the tool leaves out", ma.status === 200, { status: ma.status, country_ma: country(ma), country_us: country(us) }),
        fact('Directions accepts geometries=polyline6, which the tool cannot ask for', p6.status === 200 && typeof p6.json?.routes?.[0]?.geometry === 'string', { status: p6.status }),
        fact('Directions accepts overview=false and returns no geometry', noOverview.status === 200 && noOverview.json?.routes?.[0]?.geometry === undefined, { status: noOverview.status }),
        fact('Map Matching accepts annotations maxspeed and congestion_numeric, which the tool leaves out', mm.status === 200 && 'maxspeed' in ann && 'congestion_numeric' in ann, { status: mm.status, message: mm.message, annotation_keys: Object.keys(ann) }),
        fact('Isochrone answers without generalize, which the tool requires', iso.status === 200, { status: iso.status }),
        fact('Static Images answers with no overlay, which the docs list as required', stat.status === 200 && /image/.test(stat.type), { status: stat.status, type: stat.type }),
      ],
      // the 201- and 256-character queries are sent to be refused or not; a refusal there is the answer
      refusals_are_the_finding: true,
    };
  },
});
