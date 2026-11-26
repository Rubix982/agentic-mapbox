// C-008 (T-006): set select: true on the same two buildings at pitch 0 and at pitch 45, without clicking, and count the
// pixels that change; list which style layers draw each building at each pitch. One map load.
//   node experiments/followups/select-same-building.mjs
import { mapExperiment, page, fact } from '../lib.mjs';

// the buildings interactions.mjs clicked at pitch 0 and at pitch 45 (C-007)
const BUILDINGS = { flat_target: 34633854, tilted_target: 265260939 };

const html = page({
  title: 'Select the same building',
  script: `window.map = new mapboxgl.Map({ container: 'map', center: [-73.9857, 40.7484], zoom: 16.5, pitch: 0 });`,
});

const changed = (a, b) => {
  let n = 0, blue = 0;
  for (let k = 0; k < a.data.length; k += 4) {
    const d = Math.max(Math.abs(a.data[k] - b.data[k]), Math.abs(a.data[k + 1] - b.data[k + 1]), Math.abs(a.data[k + 2] - b.data[k + 2]));
    if (d > 10) { n++; if (b.data[k + 2] - b.data[k] > 40) blue++; }
  }
  return { pixels_changed: n, of_them_blue: blue };
};

await mapExperiment({
  file: import.meta.url,
  question: 'Does selecting a building through the buildings featureset draw nothing at pitch 0 for every building, or only for some?',
  html,
  check: async (t) => {
    const out = {};
    for (const pitch of [0, 45]) {
      await t.eval((p) => window.map.jumpTo({ pitch: p }), pitch);
      await t.idle(20000);
      await t.wait(500);
      for (const [label, id] of Object.entries(BUILDINGS)) {
        const layers = await t.eval((id) => {
          const fs = window.map.queryRenderedFeatures({ target: { featuresetId: 'buildings', importId: 'basemap' } }).filter((f) => f.id === id);
          window.target = fs[0]; // a featureset feature, which setFeatureState takes
          return { in_featureset: fs.length, properties: fs[0] && fs[0].properties };
        }, id);
        const before = await t.shot(`${label}-pitch${pitch}-before`);
        await t.eval(() => window.target && window.map.setFeatureState(window.target, { select: true }));
        await t.idle(10000);
        await t.wait(500);
        const after = await t.shot(`${label}-pitch${pitch}-after`);
        const state = await t.eval(() => window.target ? window.map.getFeatureState(window.target) : null);
        await t.eval(() => window.map.resetFeatureStates({ featuresetId: 'buildings', importId: 'basemap' }));
        await t.idle(10000);
        out[`${label}_pitch${pitch}`] = { id, state, ...layers, ...changed(before, after) };
      }
    }
    // the centre is the Empire State Building, which Standard draws as a 3D landmark model: with landmarks off, does the
    // building that never changed colour change now?
    await t.eval(() => { window.map.setConfigProperty('basemap', 'show3dLandmarks', false); window.map.jumpTo({ pitch: 45 }); });
    await t.idle(20000);
    await t.wait(500);
    {
      const id = BUILDINGS.flat_target;
      const found = await t.eval((id) => { const fs = window.map.queryRenderedFeatures({ target: { featuresetId: 'buildings', importId: 'basemap' } }).filter((f) => f.id === id); window.target = fs[0]; return fs.length; }, id);
      const before = await t.shot('flat_target-landmarks-off-before');
      await t.eval(() => window.target && window.map.setFeatureState(window.target, { select: true }));
      await t.idle(10000);
      await t.wait(500);
      const after = await t.shot('flat_target-landmarks-off-after');
      out.flat_target_pitch45_landmarks_off = { id, in_featureset: found, ...changed(before, after) };
    }
    const shows = (k) => out[k].of_them_blue > 50;
    return {
      facts: [
        fact('Both buildings are in the buildings featureset at both pitches', Object.values(out).every((o) => o.in_featureset > 0), out),
        fact('At pitch 45 selecting either building turns pixels blue', shows('flat_target_pitch45') && shows('tilted_target_pitch45'), { flat: out.flat_target_pitch45, tilted: out.tilted_target_pitch45 }),
        fact('At pitch 0 selecting either building turns pixels blue', shows('flat_target_pitch0') && shows('tilted_target_pitch0'), { flat: out.flat_target_pitch0, tilted: out.tilted_target_pitch0 }),
        fact('The building clicked at pitch 0 turns blue at pitch 45', shows('flat_target_pitch45'), out.flat_target_pitch45),
        fact('With 3D landmarks off, the building clicked at pitch 0 turns blue at pitch 45', shows('flat_target_pitch45_landmarks_off'), out.flat_target_pitch45_landmarks_off),
      ],
      numbers: out,
    };
  },
});
