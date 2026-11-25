// Checks for the tasks-3x set (evals/tasks-3x/tasks.md). Each reads the running map back through the harness
// (evals/harness/run_page.mjs) and returns { passed, reasons, numbers }.
//
// What the checks lean on, beyond the public API, all read-only:
// - map.style.getOwnLayer(id).paint/.layout .get(name).evaluate(feature, state): GL JS's own evaluation of a
//   data-driven property for a given feature, so an expression is judged by what it produces, not how it is written;
// - map.style.fragments[i].style.stylesheet.id: which Mapbox style an import is ('standard', 'standard-satellite');
//   a style given as mapbox://styles/mapbox/standard is wrapped as import 'basemap' with an empty url;
// - map.style._mergedOrder: the render order GL JS uses to decide what a clip layer removes;
// - a raster-particle layer's colorRamp: the 256 colours its particles are drawn with, over 0..max-speed.
// Where a check needs pixels, it first moves the camera to a fixed top-down view and hides Standard's labels and
// trees, so labels cannot land on a sample point.

// ---------- page-side helpers (installed once per page as window.__chk) ----------
function installHelpers() {
  if (window.__chk) return true;
  const ctx = document.createElement('canvas').getContext('2d');
  const C = {
    // any CSS / GL JS colour -> [r, g, b, a] (0-255, alpha 0-1), or null
    rgb(v) {
      if (v == null) return null;
      if (typeof v === 'object' && 'r' in v && typeof v.toString === 'function') v = v.toString();
      if (typeof v !== 'string') return null;
      ctx.fillStyle = '#010203';
      ctx.fillStyle = v;
      const s = ctx.fillStyle;
      if (s === '#010203' && !/^#010203$/i.test(v.trim())) return null;
      if (s[0] === '#') return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    },
    imports() {
      let spec = [];
      try { spec = map.getStyle().imports || []; } catch (e) { /* style mid-load: getStyle() throws */ }
      return (map.style.fragments || []).map((f) => {
        const s = (f.style && f.style.stylesheet) || {};
        const sp = spec.find((i) => i.id === f.id) || {};
        return { id: f.id, url: sp.url || '', sid: s.id || null, name: s.name || null };
      });
    },
    importOf(sid) {
      const re = new RegExp('styles/mapbox/' + sid + '(\\?|$)');
      const i = C.imports().find((x) => x.sid === sid || re.test(x.url));
      return i ? i.id : null;
    },
    // does root source `id` hold the file `file` (by URL) or inline features carrying property `key`?
    sourceHas(id, file, key) {
      const src = map.getStyle().sources[id];
      if (!src) return false;
      const d = src.data;
      if (typeof d === 'string') return d.split('?')[0].endsWith(file);
      const feats = d && (d.features || (d.type === 'Feature' ? [d] : []));
      return !!(feats && feats.some((f) => f.properties && key in f.properties));
    },
    // GL JS's own value of a (possibly data-driven) property for one feature
    ev(layerId, kind, name, feature, state) {
      const L = map.style.getOwnLayer(layerId);
      if (!L || !L[kind]) return { error: 'no layer ' + layerId };
      let v;
      try { v = L[kind].get(name); } catch (e) { return { error: e.message }; }
      try {
        if (v && typeof v.evaluate === 'function') v = v.evaluate(feature || { type: 1, properties: {} }, state || {}, undefined, []);
      } catch (e) { return { error: e.message }; }
      if (v && typeof v === 'object' && 'r' in v && 'a' in v) return C.rgb(v);
      return v;
    },
    hideStandardClutter() {
      for (const i of C.imports()) {
        for (const k of ['showPlaceLabels', 'showPointOfInterestLabels', 'showRoadLabels', 'showTransitLabels', 'show3dTrees', 'showLandmarkIcons']) {
          try { map.setConfigProperty(i.id, k, false); } catch (e) { /* not a Standard import */ }
        }
      }
    },
  };
  window.__chk = C;
  return true;
}

// ---------- node-side helpers ----------
const install = (t) => t.eval(installHelpers);
const close = (a, b, tol) => a && b && a.length >= 3 && [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mod360 = (x) => ((x % 360) + 360) % 360;
const angleOff = (a, b) => { const d = mod360(a - b); return Math.min(d, 360 - d); };
const done = (reasons, numbers) => ({ passed: reasons.length === 0, reasons, numbers });
const offsetLngLat = ([lng, lat], dx, dy) => [lng + (dx / (6378137 * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI), lat + (dy / 6378137) * (180 / Math.PI)];
function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const polygonsOf = (gj) => {
  const feats = gj.type === 'FeatureCollection' ? gj.features : gj.type === 'Feature' ? [gj] : [{ geometry: gj }];
  const out = [];
  for (const f of feats) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') out.push(g.coordinates);
    if (g.type === 'MultiPolygon') out.push(...g.coordinates);
  }
  return out;
};
const covers = (gj, pt) => polygonsOf(gj).some((rings) => pointInRing(pt, rings[0]) && !rings.slice(1).some((h) => pointInRing(pt, h)));

// move to a fixed top-down view, with Standard's labels and trees hidden, and wait for it to draw
async function topDown(t, center, zoom) {
  await install(t);
  await t.eval(({ center, zoom }) => { window.__chk.hideStandardClutter(); map.jumpTo({ center, zoom, pitch: 0, bearing: 0 }); }, { center, zoom });
  await t.idle(30000);
  await t.page.waitForTimeout(300);
  await t.idle(10000);
}
const project = (t, lngLats) => t.eval((ps) => ps.map((p) => { const q = map.project(p); return [Math.round(q.x), Math.round(q.y)]; }), lngLats);

export default {
  // 1. A single glTF model placed at a point, turned 90 degrees (model source, orientation in degrees)
  1: async (t) => {
    const reasons = [], numbers = {};
    const P = [-73.9662, 40.7815];
    const st = await t.eval(() => {
      const s = map.getStyle(), models = [];
      for (const [sid, src] of Object.entries(s.sources || {})) if (src.type === 'model') for (const [mid, m] of Object.entries(src.models || {})) models.push({ sid, mid, uri: m.uri, position: m.position, orientation: m.orientation || [0, 0, 0] });
      const layers = s.layers.filter((l) => l.type === 'model').map((l) => ({ id: l.id, source: l.source, rotation: map.getPaintProperty(l.id, 'model-rotation'), scale: map.getPaintProperty(l.id, 'model-scale') }));
      return { models, layers };
    });
    numbers.models = st.models;
    numbers.modelLayers = st.layers;
    if (!st.layers.length) reasons.push('no 3D model layer in the style');
    // top-down at zoom 18.5: the 40 m x 12 m roof is about 250 x 75 px
    await topDown(t, P, 18.5);
    const at = { c: [0, 0], n12: [0, 12], n16: [0, 16], s12: [0, -12], s16: [0, -16], e12: [12, 0], e16: [16, 0], w12: [-12, 0], w16: [-16, 0], n30: [0, 30], s30: [0, -30] };
    const keys = Object.keys(at);
    const xy = await project(t, keys.map((k) => offsetLngLat(P, ...at[k])));
    const img = await t.screenshot();
    const px = {};
    for (let i = 0; i < keys.length; i++) px[keys[i]] = await t.patch(xy[i][0], xy[i][1], 2, img);
    const red = (p) => p[0] >= 110 && p[0] >= 1.6 * p[1] && p[0] >= 1.6 * p[2];
    const count = (ks) => ks.filter((k) => red(px[k])).length;
    numbers.pixels = px;
    numbers.red = { centre: red(px.c), northSouth12to16m: count(['n12', 'n16', 's12', 's16']), eastWest12to16m: count(['e12', 'e16', 'w12', 'w16']), northSouth30m: count(['n30', 's30']) };
    if (!red(px.c)) reasons.push('no red pavilion roof at -73.9662, 40.7815 seen from above');
    if (numbers.red.northSouth12to16m < 3) reasons.push(`the pavilion does not reach 12-16 m north and south of its centre (${numbers.red.northSouth12to16m}/4 samples red): its long side is not north-south`);
    if (numbers.red.eastWest12to16m > 1) reasons.push(`the pavilion reaches 12-16 m east or west of its centre (${numbers.red.eastWest12to16m}/4 samples red): its long side is not north-south`);
    if (numbers.red.northSouth30m > 0) reasons.push('the pavilion reaches 30 m from its centre: it is larger than its real 40 m x 12 m');
    return done(reasons, numbers);
  },

  // 2. Instanced glTF models on GeoJSON points: heading per feature, tint by status (model-color needs mix intensity)
  2: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const vans = await t.eval(() => fetch('vans.geojson').then((r) => r.json()));
    const layers = await t.eval(() => {
      const s = map.getStyle();
      return s.layers.filter((l) => l.type === 'model' && window.__chk.sourceHas(l.source, 'vans.geojson', 'van_id')).map((l) => l.id);
    });
    numbers.layers = layers;
    if (!layers.length) { reasons.push('no 3D model layer drawing vans.geojson'); return done(reasons, numbers); }
    // GL JS's own evaluation of rotation, colour and mix for each van, in every candidate layer
    const ev = await t.eval(({ layers, feats }) => feats.map((f) => layers.map((id) => {
      const g = { type: 1, properties: f.properties };
      const C = window.__chk;
      return { rotation: C.ev(id, 'paint', 'model-rotation', g), color: C.ev(id, 'paint', 'model-color', g), mix: C.ev(id, 'paint', 'model-color-mix-intensity', g) };
    })), { layers, feats: vans.features });
    numbers.evaluated = vans.features.map((f, i) => ({ van: f.properties.van_id, heading: f.properties.heading, status: f.properties.status, ...ev[i][0] }));
    const badHeading = vans.features.filter((f, i) => !ev[i].some((e) => Array.isArray(e.rotation) && angleOff(e.rotation[2], f.properties.heading) <= 2 && angleOff(e.rotation[0], 0) <= 2 && angleOff(e.rotation[1], 0) <= 2));
    if (badHeading.length) reasons.push(`${badHeading.length}/8 vans are not turned to their heading about the vertical axis (e.g. ${badHeading[0].properties.van_id}: heading ${badHeading[0].properties.heading}, rotation ${JSON.stringify(ev[vans.features.indexOf(badHeading[0])][0].rotation)})`);
    // what the vans look like from above
    await topDown(t, [13.403, 52.474], 18);
    const xy = await project(t, vans.features.map((f) => f.geometry.coordinates));
    const img = await t.screenshot();
    const px = [];
    for (const [x, y] of xy) px.push(await t.patch(x, y, 2, img));
    const isRed = (p) => p[0] >= p[1] + 60 && p[0] >= p[2] + 60;
    const isGreen = (p) => p[1] >= p[0] + 40 && p[1] >= p[2] + 30;
    const right = vans.features.map((f, i) => (f.properties.status === 'late' ? isRed(px[i]) : isGreen(px[i])));
    numbers.pixels = vans.features.map((f, i) => ({ van: f.properties.van_id, status: f.properties.status, rgb: px[i], right: right[i] }));
    numbers.coloured_right = right.filter(Boolean).length;
    if (numbers.coloured_right < 7) reasons.push(`only ${numbers.coloured_right}/8 vans are drawn in their status colour seen from above (late red, on-time green)`);
    return done(reasons, numbers);
  },

  // 3. Clip layer over Standard: must sit above the basemap's 3D layers and include 'model' to remove trees
  3: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const site = await t.eval(() => fetch('site.geojson').then((r) => r.json()));
    const ring = site.features[0].geometry.coordinates[0];
    const [w, s, e, n] = [Math.min(...ring.map((p) => p[0])), Math.min(...ring.map((p) => p[1])), Math.max(...ring.map((p) => p[0])), Math.max(...ring.map((p) => p[1]))];
    const rel = ([a, b]) => [w + a * (e - w), s + b * (n - s)];
    const samples = [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]].map(rel);
    const outside = [[0.5, -0.4], [0.5, 1.4], [-0.4, 0.5], [1.4, 0.5]].map(rel); // 40% of the site's size beyond each edge
    const st = await t.eval(() => {
      const C = window.__chk, s = map.getStyle();
      const order = map.style._mergedOrder.map(String);
      const sep = '\u001f';
      const basemap = C.importOf('standard');
      const idx = (name) => order.findIndex((fq) => fq === name + sep + basemap);
      const clips = s.layers.filter((l) => l.type === 'clip').map((l) => ({
        id: l.id, source: l.source, slot: l.slot || null, minzoom: l.minzoom ?? 0, maxzoom: l.maxzoom ?? 24,
        types: map.getLayoutProperty(l.id, 'clip-layer-types') || [], scope: map.getLayoutProperty(l.id, 'clip-layer-scope') || [],
        visibility: map.getLayoutProperty(l.id, 'visibility') || 'visible', filter: l.filter || null,
        index: order.indexOf(l.id), data: s.sources[l.source] ? s.sources[l.source].data : null,
      }));
      return { basemap, imports: C.imports(), clips, buildingsIndex: idx('3d-building'), treesIndex: idx('trees'), zoom: map.getZoom() };
    });
    numbers.basemap = st.basemap;
    numbers.buildingsIndex = st.buildingsIndex;
    numbers.treesIndex = st.treesIndex;
    if (!st.basemap) reasons.push('the basemap is not Mapbox Standard');
    if (!st.clips.length) { reasons.push('nothing removes basemap 3D content: the style has no clip layer'); numbers.clips = []; return done(reasons, numbers); }
    const judged = [];
    for (const c of st.clips) {
      let data = c.data;
      if (typeof data === 'string') data = await t.eval((u) => fetch(u).then((r) => r.json()), data).catch(() => null);
      const covered = data ? samples.filter((p) => covers(data, p)).length : 0;
      const spill = data ? outside.filter((p) => covers(data, p)).length : 0;
      const why = [];
      if (c.visibility === 'none' || st.zoom < c.minzoom || st.zoom >= c.maxzoom) why.push(`clip layer ${c.id} is not active at zoom ${st.zoom.toFixed(1)}`);
      if (covered < samples.length) why.push(`clip layer ${c.id} covers ${covered}/${samples.length} sample points inside the site`);
      if (spill > 0) why.push(`clip layer ${c.id} also covers ${spill}/4 sample points outside the site`);
      if (!(c.index > st.buildingsIndex && c.index > st.treesIndex)) why.push(`clip layer ${c.id} is drawn below the basemap's 3D buildings or trees (render index ${c.index} vs ${st.buildingsIndex}, ${st.treesIndex}; slot ${c.slot}), so it removes nothing`);
      if (!c.types.includes('model')) why.push(`clip layer ${c.id} does not list 'model' in clip-layer-types (${JSON.stringify(c.types)}), so the basemap's 3D trees stay`);
      if (c.scope.length && !c.scope.includes(st.basemap)) why.push(`clip layer ${c.id} is scoped to ${JSON.stringify(c.scope)}, not the basemap`);
      if (c.filter) why.push(`clip layer ${c.id} has a filter (${JSON.stringify(c.filter).slice(0, 80)}); not judged`);
      judged.push({ id: c.id, slot: c.slot, index: c.index, types: c.types, scope: c.scope, covered, spill, why });
    }
    numbers.clips = judged;
    if (!judged.some((j) => j.why.length === 0)) reasons.push(...judged.sort((a, b) => a.why.length - b.why.length)[0].why);
    return done(reasons, numbers);
  },

  // 4. raster-particle wind: the colour a particle gets at 0/10/20/30 m/s, read from the layer's own colour ramp
  4: async (t) => {
    const reasons = [], numbers = {};
    const st = await t.eval(() => {
      const s = map.getStyle();
      return s.layers.filter((l) => l.type === 'raster-particle').map((l) => {
        const src = s.sources[l.source] || {};
        const L = map.style.getOwnLayer(l.id);
        return {
          id: l.id, sourceType: src.type, url: src.url || null, tiles: src.tiles || null, sourceLayer: l['source-layer'] || null,
          visibility: map.getLayoutProperty(l.id, 'visibility') || 'visible', maxSpeed: L ? L.paint.get('raster-particle-max-speed') : null,
          ramp: L && L.colorRamp ? Array.from(L.colorRamp.data) : null, sourceLoaded: map.isSourceLoaded(l.source),
        };
      });
    });
    numbers.layers = st.map(({ ramp, ...x }) => x);
    if (!st.length) { reasons.push('no particle layer in the style'); return done(reasons, numbers); }
    const want = [[0, '#3288bd'], [10, '#fee08b'], [20, '#d53e4f'], [30, '#d53e4f']];
    const judged = st.map((l) => {
      const why = [];
      const tileset = /mapbox\.gfs-winds/.test(l.url || '') || (l.tiles || []).some((u) => /mapbox\.gfs-winds/.test(u));
      if (l.sourceType !== 'raster-array' || !tileset) why.push(`layer ${l.id} does not read the mapbox.gfs-winds raster-array tileset (source ${l.sourceType} ${l.url})`);
      if (l.sourceLayer !== '10winds') why.push(`layer ${l.id} reads data layer ${l.sourceLayer}, not 10winds`);
      if (l.visibility === 'none') why.push(`layer ${l.id} is hidden`);
      const at = {};
      if (!l.ramp) why.push(`layer ${l.id} has no colour ramp`);
      else for (const [v, h] of want) {
        const i = Math.round((Math.min(v, l.maxSpeed) / l.maxSpeed) * 255);
        const c = l.ramp.slice(i * 4, i * 4 + 4);
        at[v + ' m/s'] = c;
        if (!close(c, hex(h), 30)) why.push(`a ${v} m/s particle is drawn rgb(${c.slice(0, 3)}) not ${h} (max speed ${l.maxSpeed} m/s, ramp texel ${i}/255)`);
        if (c[3] < 128) why.push(`a ${v} m/s particle is drawn ${Math.round((c[3] / 255) * 100)}% opaque`);
      }
      return { id: l.id, maxSpeed: l.maxSpeed, colourAt: at, why };
    });
    numbers.judged = judged;
    if (!judged.some((j) => j.why.length === 0)) reasons.push(...judged.sort((a, b) => a.why.length - b.why.length)[0].why);
    return done(reasons, numbers);
  },

  // 5. Procedural buildings: height and roof shape per footprint, roof and wall colours by building part
  5: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const fp = await t.eval(() => fetch('footprints.geojson').then((r) => r.json()));
    const layers = await t.eval(() => map.getStyle().layers.filter((l) => l.type === 'building' && window.__chk.sourceHas(l.source, 'footprints.geojson', 'height_m')).map((l) => l.id));
    numbers.layers = layers;
    if (!layers.length) { reasons.push('no procedural building layer draws footprints.geojson (a fill-extrusion cannot draw roof shapes)'); return done(reasons, numbers); }
    // the bucket evaluates building-color with feature.properties['building-part'] set to roof / wall / window / door
    const ev = await t.eval(({ layers, feats }) => layers.map((id) => feats.map((f) => {
      const C = window.__chk, g = { type: 3, properties: f.properties };
      const part = (p) => C.ev(id, 'paint', 'building-color', { type: 3, properties: { ...f.properties, 'building-part': p } });
      return { name: f.properties.name, height: C.ev(id, 'layout', 'building-height', g), roof: C.ev(id, 'layout', 'building-roof-shape', g), roofColor: part('roof'), wallColor: part('wall') };
    })), { layers, feats: fp.features });
    const judged = layers.map((id, li) => {
      const why = [];
      fp.features.forEach((f, i) => {
        const e = ev[li][i], p = f.properties;
        if (!(Math.abs(e.height - p.height_m) <= 0.5)) why.push(`${p.name}: height ${e.height} m, want ${p.height_m} m`);
        if (e.roof !== p.roof) why.push(`${p.name}: roof ${e.roof}, want ${p.roof}`);
        if (!close(e.roofColor, hex('#b5523b'), 12)) why.push(`${p.name}: roof colour ${JSON.stringify(e.roofColor)}, want #b5523b`);
        if (!close(e.wallColor, hex('#efe6d2'), 12)) why.push(`${p.name}: wall colour ${JSON.stringify(e.wallColor)}, want #efe6d2`);
      });
      return { id, evaluated: ev[li], why };
    });
    numbers.judged = judged;
    // and the buildings are drawn: all five queryable, roofs terracotta from above
    await topDown(t, [-0.04, 51.5365], 16.5);
    numbers.rendered = await t.eval((layers) => [...new Set(map.queryRenderedFeatures({ layers }).map((f) => f.properties.name))].sort(), layers);
    if (numbers.rendered.length < 5) reasons.push(`only ${numbers.rendered.length}/5 planned buildings are drawn`);
    const centres = fp.features.map((f) => { const r = f.geometry.coordinates[0].slice(0, -1); return [r.reduce((a, p) => a + p[0], 0) / r.length, r.reduce((a, p) => a + p[1], 0) / r.length]; });
    const xy = await project(t, centres);
    const img = await t.screenshot();
    numbers.roofs = [];
    for (let i = 0; i < xy.length; i++) numbers.roofs.push({ name: fp.features[i].properties.name, rgb: await t.patch(xy[i][0], xy[i][1], 2, img) });
    numbers.terracotta = numbers.roofs.filter(({ rgb }) => rgb[0] >= rgb[1] + 50 && rgb[0] >= rgb[2] + 60).length;
    if (numbers.terracotta < 4) reasons.push(`only ${numbers.terracotta}/5 roofs are drawn terracotta seen from above (${numbers.roofs.map((r) => r.rgb.join(',')).join(' / ')})`);
    const best = judged.sort((a, b) => a.why.length - b.why.length)[0];
    if (best.why.length) reasons.push(...best.why.slice(0, 6));
    // leave the view pitched so the harness's screenshot shows the roofs
    await t.eval(() => map.jumpTo({ center: [-0.0398, 51.5363], zoom: 17.6, pitch: 62, bearing: -25 }));
    await t.idle(20000);
    return done(reasons, numbers);
  },

  // 6. Standard import with config (dusk, no POI labels) and a data layer in the bottom slot
  6: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const st = await t.eval(() => {
      const C = window.__chk, s = map.getStyle(), basemap = C.importOf('standard');
      const fills = s.layers.filter((l) => l.type === 'fill' && C.sourceHas(l.source, 'floodzones.geojson', 'zone')).map((l) => {
        const g = { type: 3, properties: { zone: 'A', risk: 'high' } };
        return { id: l.id, slot: map.getSlot(l.id) || null, color: C.ev(l.id, 'paint', 'fill-color', g), opacity: C.ev(l.id, 'paint', 'fill-opacity', g), visibility: map.getLayoutProperty(l.id, 'visibility') || 'visible' };
      });
      return { basemap, imports: C.imports(), lightPreset: basemap ? map.getConfigProperty(basemap, 'lightPreset') : null, poiLabels: basemap ? map.getConfigProperty(basemap, 'showPointOfInterestLabels') : null, fills };
    });
    Object.assign(numbers, st);
    if (!st.basemap) { reasons.push('the basemap is not Mapbox Standard'); return done(reasons, numbers); }
    if (st.lightPreset !== 'dusk') reasons.push(`Standard's light preset is ${JSON.stringify(st.lightPreset)}, not dusk`);
    if (st.poiLabels !== false) reasons.push(`Standard's POI labels are not turned off (showPointOfInterestLabels ${JSON.stringify(st.poiLabels)})`);
    if (!st.fills.length) { reasons.push('no fill layer draws floodzones.geojson'); return done(reasons, numbers); }
    const ok = st.fills.find((f) => f.slot === 'bottom' && f.visibility !== 'none' && close(f.color, hex('#1e88e5'), 12) && Math.abs(f.color[3] * f.opacity - 0.5) <= 0.06);
    if (!ok) {
      const f = st.fills[0];
      if (f.slot !== 'bottom') reasons.push(`the flood fill ${f.id} is in slot ${JSON.stringify(f.slot)}, so it is drawn ${f.slot === 'middle' ? 'over the roads' : f.slot === 'top' ? 'over the roads and most labels' : 'on top of the whole basemap, roads and labels included'}; beneath roads is the bottom slot`);
      if (!close(f.color, hex('#1e88e5'), 12)) reasons.push(`the flood fill is ${JSON.stringify(f.color)}, not #1e88e5`);
      if (!(Math.abs((f.color ? f.color[3] : 1) * f.opacity - 0.5) <= 0.06)) reasons.push(`the flood fill is ${Math.round((f.color ? f.color[3] : 1) * f.opacity * 100)}% opaque, not 50%`);
    }
    return done(reasons, numbers);
  },

  // 7. A button swaps the basemap import to Standard Satellite; the route (root style) must survive
  7: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const read = () => t.eval(() => {
      const C = window.__chk, s = map.getStyle();
      const lines = s.layers.filter((l) => l.type === 'line' && C.sourceHas(l.source, 'route.geojson', 'name'));
      return {
        imports: C.imports(), center: map.getCenter().toArray(), zoom: map.getZoom(),
        routeLayers: lines.map((l) => ({ id: l.id, color: C.ev(l.id, 'paint', 'line-color'), width: C.ev(l.id, 'paint', 'line-width'), visibility: map.getLayoutProperty(l.id, 'visibility') || 'visible' })),
        routeDrawn: lines.length ? map.queryRenderedFeatures({ layers: lines.map((l) => l.id) }).length : 0,
      };
    });
    const before = await read();
    numbers.before = before;
    const isStd = (sid) => before.imports.some((i) => i.sid === sid);
    if (!isStd('standard')) reasons.push('the basemap does not start as Mapbox Standard');
    const r0 = before.routeLayers.find((l) => close(l.color, hex('#d81b60'), 12) && Math.abs(l.width - 5) <= 0.5);
    if (!before.routeLayers.length || !before.routeDrawn) reasons.push('the route is not drawn before switching');
    else if (!r0) reasons.push(`the route line is not 5 px #d81b60 (${JSON.stringify(before.routeLayers.map((l) => [l.color, l.width]))})`);
    let button = t.page.getByRole('button', { name: /satellite/i }).first();
    if (!(await button.count())) button = t.page.getByText(/^\s*satellite\s*$/i).first();
    if (!(await button.count())) { reasons.push('no "Satellite" button'); return done(reasons, numbers); }
    await button.click({ timeout: 5000 });
    // wait for the satellite basemap to load (up to 30 s), then for the map to settle. While a style or import is
    // loading, map.getStyle() throws "Style is not done loading", so nothing here may call it before isStyleLoaded().
    numbers.waited_ms = await t.eval(() => new Promise((res) => {
      const t0 = Date.now();
      const tick = () => {
        let sat = false;
        try { sat = map.isStyleLoaded() && window.__chk.imports().some((i) => i.sid === 'standard-satellite'); } catch (e) { sat = false; }
        if (sat || Date.now() - t0 > 30000) res(Date.now() - t0); else setTimeout(tick, 250);
      };
      setTimeout(tick, 250);
    }));
    await t.idle(30000);
    const after = await read().catch((e) => ({ error: String(e.message || e).split('\n')[0], imports: [], routeLayers: [], routeDrawn: 0 }));
    numbers.after = after;
    const moved = after.center && before.center ? Math.hypot((after.center[0] - before.center[0]) * 111320 * Math.cos((before.center[1] * Math.PI) / 180), (after.center[1] - before.center[1]) * 110540) : null;
    numbers.moved_m = moved && Math.round(moved);
    if (after.error) reasons.push(`the map could not be read 30 s after clicking Satellite: ${after.error}`);
    if (!after.imports.some((i) => i.sid === 'standard-satellite')) reasons.push(`after clicking Satellite the basemap is not Mapbox Standard Satellite (${JSON.stringify(after.imports.map((i) => i.sid || i.url))})`);
    if (!after.routeLayers.length) reasons.push('after switching to satellite the route layer is gone from the style');
    else if (!after.routeDrawn || after.routeLayers.every((l) => l.visibility === 'none')) reasons.push('after switching to satellite the route is not drawn');
    if (!after.error && (moved > 30 || Math.abs(after.zoom - before.zoom) > 0.05)) reasons.push(`the view moved when switching (${Math.round(moved)} m, zoom ${before.zoom.toFixed(2)} -> ${after.zoom.toFixed(2)})`);
    return done(reasons, numbers);
  },

  // 8. Click a Standard building to select it in orange; a second click moves the selection
  8: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const basemap = await t.eval(() => window.__chk.importOf('standard'));
    numbers.basemap = basemap;
    if (!basemap) { reasons.push('the basemap is not Mapbox Standard'); return done(reasons, numbers); }
    // labels off (an orange POI icon on a sample point reads as a highlight), camera left as the page set it
    await t.eval(() => window.__chk.hideStandardClutter());
    await t.idle(15000);
    // find buildings under a grid of screen points
    const cands = await t.eval((imp) => {
      const seen = new Map();
      for (let y = 100; y <= 500; y += 25) for (let x = 100; x <= 700; x += 25) {
        const f = map.queryRenderedFeatures([x, y], { target: { featuresetId: 'buildings', importId: imp } })[0];
        if (f && f.id != null && !seen.has(f.id)) seen.set(f.id, { id: f.id, x, y });
      }
      return [...seen.values()];
    }, basemap);
    numbers.buildings_found = cands.length;
    if (cands.length < 2) { reasons.push('fewer than two buildings under the view'); return done(reasons, numbers); }
    const A = cands.reduce((b, c) => (Math.hypot(c.x - 400, c.y - 300) < Math.hypot(b.x - 400, b.y - 300) ? c : b));
    const B = cands.reduce((b, c) => (Math.hypot(c.x - A.x, c.y - A.y) > Math.hypot(b.x - A.x, b.y - A.y) ? c : b));
    numbers.A = A; numbers.B = B;
    let startPx = null;
    const look = async () => {
      const s = await t.eval(({ imp, ids }) => {
        const C = window.__chk;
        const st = (id) => map.getFeatureState({ id, target: { featuresetId: 'buildings', importId: imp } }) || {};
        return { states: ids.map(st), select: C.rgb(map.getConfigProperty(imp, 'colorBuildingSelect')), highlight: C.rgb(map.getConfigProperty(imp, 'colorBuildingHighlight')) };
      }, { imp: basemap, ids: [A.id, B.id] });
      const img = await t.screenshot();
      const px = [await t.patch(A.x, A.y, 2, img), await t.patch(B.x, B.y, 2, img)];
      const orange = hex('#ff8c00');
      const byState = (st) => (st.select ? close(s.select, orange, 20) : st.highlight ? close(s.highlight, orange, 20) : false);
      const orangeish = (p) => p[0] >= 170 && p[0] - p[2] >= 110 && p[1] >= 60 && p[1] <= 200 && p[0] - p[1] >= 40;
      if (!startPx) startPx = px; // a pixel counts only if it turned orange after the start
      const byPixel = (i) => orangeish(px[i]) && !orangeish(startPx[i]);
      return { states: s.states, colorSelect: s.select, colorHighlight: s.highlight, px, on: [0, 1].map((i) => byState(s.states[i]) || byPixel(i)) };
    };
    const click = async (p) => { await t.page.mouse.click(p.x, p.y); await t.page.waitForTimeout(700); await t.idle(15000); };
    numbers.start = await look();
    await click(A);
    numbers.afterA = await look();
    await click(B);
    numbers.afterB = await look();
    if (!numbers.afterA.on[0]) reasons.push(`clicking a building (id ${A.id}) did not highlight it in #ff8c00 (state ${JSON.stringify(numbers.afterA.states[0])}, select colour ${JSON.stringify(numbers.afterA.colorSelect)}, pixel ${numbers.afterA.px[0]})`);
    if (!numbers.afterB.on[1]) reasons.push(`clicking a second building (id ${B.id}) did not highlight it (state ${JSON.stringify(numbers.afterB.states[1])}, pixel ${numbers.afterB.px[1]})`);
    if (numbers.afterB.on[0]) reasons.push(`the first building stays highlighted after the second is clicked (state ${JSON.stringify(numbers.afterB.states[0])}): two buildings highlighted at once`);
    return done(reasons, numbers);
  },

  // 9. Click a Standard POI -> popup with its name
  9: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const basemap = await t.eval(() => window.__chk.importOf('standard'));
    numbers.basemap = basemap;
    if (!basemap) { reasons.push('the basemap is not Mapbox Standard'); return done(reasons, numbers); }
    const pois = await t.eval((imp) => map.queryRenderedFeatures({ target: { featuresetId: 'poi', importId: imp } })
      .filter((f) => f.properties.name && f.geometry && f.geometry.type === 'Point')
      .map((f) => { const p = map.project(f.geometry.coordinates); return { id: f.id, name: f.properties.name, x: Math.round(p.x), y: Math.round(p.y) }; })
      .filter((p) => p.x > 80 && p.x < 720 && p.y > 80 && p.y < 520)
      .sort((a, b) => Math.hypot(a.x - 400, a.y - 300) - Math.hypot(b.x - 400, b.y - 300)), basemap);
    numbers.pois_in_view = pois.length;
    if (!pois.length) { reasons.push('no named points of interest in view'); return done(reasons, numbers); }
    numbers.attempts = [];
    for (const p of pois.slice(0, 3)) {
      await t.eval(() => document.querySelectorAll('.mapboxgl-popup').forEach((e) => e.remove()));
      // the click must land on this POI: confirm it is the top POI under the point
      const top = await t.eval(({ imp, x, y }) => { const f = map.queryRenderedFeatures([x, y], { target: { featuresetId: 'poi', importId: imp } })[0]; return f ? f.properties.name : null; }, { imp: basemap, x: p.x, y: p.y });
      await t.page.mouse.click(p.x, p.y);
      await t.page.waitForTimeout(800);
      const texts = await t.eval(() => [...document.querySelectorAll('.mapboxgl-popup')].map((e) => e.innerText.trim()));
      const hit = texts.some((s) => s.includes(top || p.name));
      numbers.attempts.push({ name: p.name, topAtPoint: top, at: [p.x, p.y], popups: texts, hit });
      if (hit) break;
      await t.page.waitForTimeout(400);
    }
    if (!numbers.attempts.some((a) => a.hit)) reasons.push(`clicking ${numbers.attempts.length} points of interest (${numbers.attempts.map((a) => a.topAtPoint || a.name).join(', ')}) opened no popup with the place's name (popups seen: ${JSON.stringify(numbers.attempts.map((a) => a.popups))})`);
    return done(reasons, numbers);
  },

  // 10. Toggle selection of GeoJSON districts that have no ids (feature state needs promoteId or generated ids)
  10: async (t) => {
    const reasons = [], numbers = {};
    await install(t);
    const fc = await t.eval(() => fetch('districts.geojson').then((r) => r.json()));
    numbers.fills = await t.eval(() => map.getStyle().layers.filter((l) => l.type === 'fill' && window.__chk.sourceHas(l.source, 'districts.geojson', 'district_id')).map((l) => l.id));
    if (!numbers.fills.length) reasons.push('no fill layer draws districts.geojson');
    await topDown(t, [-97.7431, 30.2672], 13.6);
    const ids = ['D2', 'D6'];
    const centres = ids.map((id) => { const r = fc.features.find((f) => f.properties.district_id === id).geometry.coordinates[0]; return [(r[0][0] + r[2][0]) / 2, (r[0][1] + r[2][1]) / 2]; });
    const xy = await project(t, centres);
    const grid = [-30, 0, 30].flatMap((dx) => [-30, 0, 30].map((dy) => [dx, dy]));
    const look = async () => {
      const img = await t.screenshot();
      const out = [];
      for (const [x, y] of xy) {
        const ps = [];
        for (const [dx, dy] of grid) ps.push(await t.patch(x + dx, y + dy, 1, img));
        const red = ps.filter((p) => p[0] - p[1] >= 50 && p[0] >= 150).length;
        out.push({ red, mid: ps[4], state: red >= 5 ? 'red' : red <= 2 ? 'grey' : 'unclear' });
      }
      return out;
    };
    const click = async (i) => { await t.page.mouse.click(xy[i][0], xy[i][1]); await t.page.waitForTimeout(700); await t.idle(15000); };
    const steps = [];
    steps.push({ step: 'start', want: ['grey', 'grey'], got: await look() });
    await click(0);
    steps.push({ step: `click ${ids[0]}`, want: ['red', 'grey'], got: await look() });
    await click(1);
    steps.push({ step: `click ${ids[1]}`, want: ['red', 'red'], got: await look() });
    await click(0);
    steps.push({ step: `click ${ids[0]} again`, want: ['grey', 'red'], got: await look() });
    numbers.steps = steps.map((s) => ({ step: s.step, want: s.want.join('/'), got: s.got.map((g) => `${g.state}(${g.red}/9 red, rgb ${g.mid})`).join(' / ') }));
    numbers.errors = t.errors.console.slice(0, 3);
    for (const s of steps) if (s.want.some((w, i) => s.got[i].state !== w)) { reasons.push(`after ${s.step} the districts are ${s.got.map((g) => g.state).join('/')} (${ids.join('/')}), want ${s.want.join('/')}`); break; }
    return done(reasons, numbers);
  },
};
