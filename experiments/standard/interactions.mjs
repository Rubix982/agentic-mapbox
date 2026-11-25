// Does an Interactions API click on the Standard style's `buildings` featureset fire, and does setting the
// building's `select` state recolour it?
import { mapExperiment, page, diff, fact } from '../lib.mjs';

const html = page({
  title: 'Interactions API',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: [-73.9857, 40.7484], zoom: 16.5, pitch: 45 });
window.clicks = [];
map.on('load', () => {
  map.addInteraction('building-click', {
    type: 'click',
    target: { featuresetId: 'buildings', importId: 'basemap' },
    handler: (e) => {
      map.setFeatureState(e.feature, { select: true });
      window.clicks.push({ id: e.feature.id, properties: e.feature.properties, state: map.getFeatureState(e.feature) });
    },
  });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: "Does an Interactions API click on the Standard style's buildings featureset fire, and does the select state recolour the building?",
  html,
  check: async (t) => {
    const descriptors = await t.eval(() => window.map.getFeaturesetDescriptors('basemap').map((d) => d.featuresetId));
    // a building near the centre with no label or icon within 25 px (a label drawn over the building hides the change)
    const findTarget = () => t.eval(() => {
      const m = window.map, q = (g, id) => m.queryRenderedFeatures(g, { target: { featuresetId: id, importId: 'basemap' } });
      for (let r = 40; r < 260; r += 20) for (let a = 0; a < 360; a += 30) {
        const x = Math.round(400 + r * Math.cos((a * Math.PI) / 180)), y = Math.round(300 + r * Math.sin((a * Math.PI) / 180));
        const f = q([x, y], 'buildings');
        if (!f.length) continue;
        if (['poi', 'place-labels', 'landmark-icons'].some((id) => q([[x - 25, y - 25], [x + 25, y + 25]], id).length)) continue;
        return { x, y, id: f[0].id };
      }
      return null;
    });
    const clickAt = async (pitch) => {
      await t.eval((p) => { window.map.jumpTo({ pitch: p }); window.clicks = []; }, pitch);
      await t.idle(20000);
      await t.wait(500);
      const target = await findTarget();
      if (!target) return { pitch, target: null };
      const imgBefore = await t.shot(`pitch${pitch}-before`);
      const before = await t.patch(target.x, target.y, 3, imgBefore);
      await t.page.mouse.click(target.x, target.y);
      await t.waitFor(() => window.clicks.length > 0, 5000);
      await t.idle(10000);
      await t.wait(500);
      const imgAfter = await t.shot(`pitch${pitch}-after`);
      const after = await t.patch(target.x, target.y, 3, imgAfter);
      const clicks = await t.eval(() => window.clicks);
      await t.eval(() => window.map.resetFeatureStates({ featuresetId: 'buildings', importId: 'basemap' }));
      return { pitch, target, clicks, before, after, frame_difference: diff(imgBefore, imgAfter) };
    };
    const flat = await clickAt(0);
    const tilted = await clickAt(45);
    const blue = (c) => c && c[2] - c[0] > 40;
    return {
      facts: [
        fact('The style offers a buildings featureset', descriptors.includes('buildings'), { featuresets: descriptors }),
        fact('At pitch 45 the click handler fired once, with the building under the cursor', tilted.clicks?.length === 1 && tilted.clicks[0].id === tilted.target.id, { id: tilted.clicks?.[0]?.id, properties: tilted.clicks?.[0]?.properties }),
        fact('The feature state reads back as select: true', tilted.clicks?.[0]?.state?.select === true, { state: tilted.clicks?.[0]?.state }),
        fact("At pitch 45 the clicked building turns blue at the click point (colorBuildingSelect)", !blue(tilted.before) && blue(tilted.after), { before: tilted.before, after: tilted.after, frame_difference: tilted.frame_difference }),
        fact('At pitch 0 the same kind of click also changes the picture', flat.clicks?.length === 1 && flat.frame_difference > 0.1, { clicks: flat.clicks?.length, state: flat.clicks?.[0]?.state, before: flat.before, after: flat.after, frame_difference: flat.frame_difference }),
      ],
      numbers: { flat_target: flat.target, tilted_target: tilted.target },
    };
  },
});
