// C-033 (T-031): for each of C-030's six US places, how much a height of 0 m in NAVD 88 is in EGM 96 and in EGM 2008,
// against the place's median of Mapbox minus USGS from C-031 (lidar averaged over Mapbox's pixel).
//   node experiments/followups/dem-datum-us.mjs   (needs C-030's and C-031's results)
// No Mapbox requests. About 60 requests, one at a time: NOAA's VDatum API, NOAA's geoid API (GEOID18) and
// GeographicLib's GeoidEval (EGM 96, EGM 2008), all free and keyless.
//
// VDatum fails for some places (Norfolk, Galveston, Sacramento on 2026-11-28, even 10 km away). There the offset is built:
//   offset = GEOID18(place) + shift(NAD 83 ellipsoid to WGS 84's, from the nearest point VDatum answers) - EGM(place)
// and the same build is checked against VDatum where VDatum does answer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiExperiment, fact } from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C030 = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-lowland.json'), 'utf8'));
const C031 = JSON.parse(fs.readFileSync(path.join(HERE, 'results/dem-lowland-pixel.json'), 'utf8'));
const UA = 'dem-check/1.0';
const RESAMPLES = 2000, SEED = 33, NEED = 4, AGREE = 0.03;
const MODELS = { 'EGM 96': ['EGM1996', 'egm1996', 'EGM96'], 'EGM 2008': ['EGM2008', 'egm2008', 'EGM2008'] };
const DONOR_STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2]];

const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
function range95(v, seed) {
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const meds = [];
  for (let b = 0; b < RESAMPLES; b++) meds.push(median(v.map(() => v[Math.floor(rnd() * v.length)])));
  meds.sort((a, b) => a - b);
  return [meds[Math.floor(0.025 * RESAMPLES)], meds[Math.floor(0.975 * RESAMPLES)]];
}
const get = async (url, as = 'json') => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.ok) return as === 'json' ? await r.json() : await r.text(); } catch {}
    await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
  }
  return null;
};
// NAVD 88 0 m in a global model's heights, or null where VDatum fails
async function vdatum([lng, lat], model) {
  const [frame, geoid] = MODELS[model];
  const j = await get(`https://vdatum.noaa.gov/vdatumweb/api/convert?s_x=${lng}&s_y=${lat}&s_z=0&s_h_frame=NAD83_2011&s_v_frame=NAVD88&t_h_frame=WGS84_G1674&t_v_frame=${frame}&t_v_geoid=${geoid}&region=contiguous`);
  const z = Number(j?.t_z);
  return Number.isFinite(z) && z > -9999 ? z : null;
}
async function geoid18([lng, lat]) {
  const j = await get(`https://geodesy.noaa.gov/api/geoid/ght?lat=${lat}&lon=${lng}`);
  if (j?.geoidModel !== 'GEOID18' || !Number.isFinite(j.geoidHeight)) throw new Error(`no GEOID18 at ${lng},${lat}`);
  return j.geoidHeight;
}
async function egm([lng, lat]) {
  const t = await get(`https://geographiclib.sourceforge.io/cgi-bin/GeoidEval?input=${lat}+${lng}`, 'text');
  const out = {};
  for (const model of Object.keys(MODELS)) {
    const m = new RegExp(`${MODELS[model][2]}\\s*=\\s*(-?[\\d.]+)`).exec((t || '').replace(/<[^>]*>/g, ' '));
    if (!m) throw new Error(`no ${model} from GeoidEval at ${lng},${lat}`);
    out[model] = Number(m[1]);
  }
  return out;
}
// the NAD 83 to WGS 84 ellipsoid shift, from the first point near `at` where VDatum answers for both models
async function shiftNear([lng, lat], skipSelf) {
  for (const [dx, dy] of skipSelf ? DONOR_STEPS : [[0, 0], ...DONOR_STEPS]) {
    const donor = [r3(lng + dx), r3(lat + dy)];
    const v = { 'EGM 96': await vdatum(donor, 'EGM 96'), 'EGM 2008': await vdatum(donor, 'EGM 2008') };
    if (v['EGM 96'] == null || v['EGM 2008'] == null) continue;
    const g = await geoid18(donor), e = await egm(donor);
    const shift = Object.fromEntries(Object.keys(MODELS).map((m) => [m, v[m] - g + e[m]]));
    return { donor, shift };
  }
  throw new Error(`no point near ${lng},${lat} where VDatum answers`);
}

await apiExperiment({
  file: import.meta.url,
  question: "Do Mapbox's per-place shifts from USGS in C-030's US places match a difference of zero (NAVD 88, EGM 96, EGM 2008)?",
  run: async () => {
    const places = [];
    for (const [k, p] of C030.numbers.places.entries()) {
      const [w, s, e, n] = p.box, centre = [r3((w + e) / 2), r3((s + n) / 2)];
      const d = C031.numbers.points.filter((q) => q.place === p.place).map((q) => q.diff_1px_m);
      const med = median(d), [lo, hi] = range95(d, SEED + k);
      const direct = { 'EGM 96': await vdatum(centre, 'EGM 96'), 'EGM 2008': await vdatum(centre, 'EGM 2008') };
      const g = await geoid18(centre), em = await egm(centre);
      const { donor, shift } = await shiftNear(centre, true); // always from another point, so places VDatum answers check the build
      const built = Object.fromEntries(Object.keys(MODELS).map((m) => [m, g + shift[m] - em[m]]));
      const used = Object.fromEntries(Object.keys(MODELS).map((m) => [m, direct[m] ?? built[m]]));
      const zeros = [['NAVD 88', 0], ...Object.entries(used)];
      const fits = zeros.filter(([, z]) => z >= lo && z <= hi).map(([name]) => name);
      places.push({
        place: p.place, centre, n: d.length, median_m: r3(med), range95_m: [r3(lo), r3(hi)],
        geoid18_m: g, egm_m: em, shift_from: donor, shift_m: Object.fromEntries(Object.entries(shift).map(([m, v]) => [m, r3(v)])),
        vdatum_m: Object.fromEntries(Object.entries(direct).map(([m, v]) => [m, r3(v)])), built_m: Object.fromEntries(Object.entries(built).map(([m, v]) => [m, r3(v)])),
        offsets_m: { 'NAVD 88': 0, ...Object.fromEntries(Object.entries(used).map(([m, v]) => [m, r3(v)])) },
        source: direct['EGM 96'] != null && direct['EGM 2008'] != null ? 'VDatum' : 'built', fits,
        decided: fits.length === 1 ? fits[0] : fits.length ? 'undecided' : 'none',
      });
    }
    const checked = places.filter((p) => p.source === 'VDatum');
    const worst = Math.max(...checked.flatMap((p) => Object.keys(MODELS).map((m) => Math.abs(p.built_m[m] - p.vdatum_m[m]))));
    const count = (name) => places.filter((p) => p.decided === name).length;
    return {
      facts: [
        fact(`Where VDatum answers, the built offsets agree with it within ${AGREE} m`, checked.length > 0 && worst <= AGREE, { places_checked: checked.map((p) => p.place), worst_m: r3(worst) }),
        fact(`NAVD 88 alone fits at least ${NEED} places`, count('NAVD 88') >= NEED, { places: places.filter((p) => p.decided === 'NAVD 88').map((p) => p.place) }),
        fact(`EGM 96 alone fits at least ${NEED} places`, count('EGM 96') >= NEED, { places: places.filter((p) => p.decided === 'EGM 96').map((p) => p.place) }),
        fact(`EGM 2008 alone fits at least ${NEED} places`, count('EGM 2008') >= NEED, { places: places.filter((p) => p.decided === 'EGM 2008').map((p) => p.place) }),
      ],
      numbers: { resamples: RESAMPLES, places },
    };
  },
});
