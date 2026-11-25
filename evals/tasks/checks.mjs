// Checks for the ten tasks in tasks.md. Each gets `t` from evals/harness/run_page.mjs after window.map exists and the
// map has gone idle once, and returns { passed, reasons, numbers }. Map state is read through window.map; pixels are
// used only for coarse colour classes. Functions passed to t.eval run inside the page, so they cannot use anything
// defined in this file.

const EARTH_R = 6371008.8;
function metres([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(a));
}
const round = (v, d = 2) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : v);
const done = (reasons, numbers) => ({ passed: reasons.length === 0, reasons, numbers });

// Poll fn in the page until it returns something truthy, or give up after `ms` and return the last value.
async function waitFor(t, fn, arg, ms = 15000) {
  const t0 = Date.now();
  let v;
  while (Date.now() - t0 < ms) {
    v = await t.eval(fn, arg).catch(() => undefined);
    if (v) return v;
    await t.page.waitForTimeout(250);
  }
  return v;
}

// Pages often add layers after an async step (fetching data, loading an image), which can finish after the harness's
// first idle. Wait for what the check reads to exist, then for the next idle so it is drawn.
async function ready(t, fn, arg, ms = 15000) {
  const v = await waitFor(t, fn, arg, ms);
  await t.idle(15000);
  return v;
}

// After an interaction: give the page a moment to start any camera move, wait for it to end, then for idle.
async function settle(t, startMs = 700, ms = 20000) {
  await t.page.waitForTimeout(startMs);
  const t0 = Date.now();
  while (Date.now() - t0 < ms && (await t.eval(() => window.map.isMoving()).catch(() => false))) await t.page.waitForTimeout(200);
  await t.idle(15000);
}

// Fraction of pixels in the (2r+1)^2 patch at (x, y) for which pred([r, g, b]) holds.
function fraction(img, x, y, r, pred) {
  let hit = 0, n = 0;
  x = Math.round(x); y = Math.round(y);
  for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) {
    if (i < 0 || j < 0 || i >= img.width || j >= img.height) continue;
    const k = (j * img.width + i) * 4;
    n++;
    if (pred([img.data[k], img.data[k + 1], img.data[k + 2]])) hit++;
  }
  return n ? hit / n : 0;
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const near = (c, hex, tol = 3) => Array.isArray(c) && hexRgb(hex).every((v, i) => Math.abs(v - c[i]) <= tol);

export default {
  // 1. Markers and popups
  1: async (t) => {
    const reasons = [];
    const shops = [['Alfama', -9.1300, 38.7114], ['Bairro Alto', -9.1458, 38.7134], ['Belém', -9.2063, 38.6976]];
    await ready(t, () => document.querySelectorAll('.mapboxgl-marker').length >= 3, null, 10000);
    const s = await t.eval((shops) => {
      const m = window.map;
      const markers = [...document.querySelectorAll('.mapboxgl-marker')].map((el) => {
        const b = el.getBoundingClientRect();
        const colours = new Set();
        for (const n of [el, ...el.querySelectorAll('*')]) {
          const cs = getComputedStyle(n);
          colours.add(cs.fill); colours.add(cs.backgroundColor);
        }
        return { l: b.left, t: b.top, r: b.right, b: b.bottom, red: colours.has('rgb(214, 40, 40)') };
      });
      const points = shops.map(([, lng, lat]) => { const p = m.project([lng, lat]); return [p.x, p.y]; });
      const bounds = new mapboxgl.LngLatBounds();
      for (const [, lng, lat] of shops) bounds.extend([lng, lat]);
      const cam = m.cameraForBounds(bounds, { padding: 80 });
      return { markers, points, zoom: m.getZoom(), fitZoom: cam ? cam.zoom : null, w: innerWidth, h: innerHeight };
    }, shops);
    const numbers = { markers: s.markers.length, zoom: round(s.zoom), fit_zoom: round(s.fitZoom), shops: {} };
    if (s.markers.length !== 3) reasons.push(`expected 3 markers, found ${s.markers.length}`);
    if (s.fitZoom === null || Math.abs(s.zoom - s.fitZoom) > 0.35) reasons.push(`zoom ${round(s.zoom)} is not the zoom that frames the three shops with 80 px padding (${round(s.fitZoom)})`);
    for (let i = 0; i < shops.length; i++) {
      const [name] = shops[i];
      const [x, y] = s.points[i];
      const rec = (numbers.shops[name] = { screen: [round(x, 0), round(y, 0)] });
      if (x < 0 || y < 0 || x > s.w || y > s.h) { reasons.push(`${name} is outside the view`); continue; }
      const mk = s.markers.find((b) => x >= b.l - 6 && x <= b.r + 6 && y >= b.t - 6 && y <= b.b + 6);
      if (!mk) { reasons.push(`no marker is drawn at ${name}`); continue; }
      rec.red = mk.red;
      if (!mk.red) reasons.push(`the marker at ${name} is not #d62828`);
      await t.eval(() => document.querySelectorAll('.mapboxgl-popup').forEach((p) => { p.style.pointerEvents = 'none'; }));
      await t.page.mouse.click((mk.l + mk.r) / 2, (mk.t + mk.b) / 2);
      await t.page.waitForTimeout(400);
      const texts = await t.eval(() => [...document.querySelectorAll('.mapboxgl-popup')].map((p) => p.textContent.normalize('NFC')));
      rec.popups = texts.map((x) => x.trim().slice(0, 60));
      if (!texts.some((x) => x.includes(name.normalize('NFC')))) reasons.push(`clicking the ${name} marker did not open a popup with "${name}"`);
    }
    return done(reasons, numbers);
  },

  // 2. Data-driven styling
  2: async (t) => {
    const reasons = [];
    const districts = [
      ['District 1', -3.74, 40.435, 4, '#edf8fb'], ['District 2', -3.70, 40.435, 10, '#b3cde3'],
      ['District 3', -3.66, 40.435, 32, '#b3cde3'], ['District 4', -3.74, 40.405, 50, '#8c96c6'],
      ['District 5', -3.70, 40.405, 87, '#8c96c6'], ['District 6', -3.66, 40.405, 240, '#88419d'],
    ];
    await ready(t, () => window.map.getLayer('density') && window.map.queryRenderedFeatures({ layers: ['density'] }).length > 0, null);
    const s = await t.eval((districts) => {
      const m = window.map;
      const layer = m.getStyle().layers.find((l) => l.id === 'density');
      if (!layer) return { layer: null };
      const out = districts.map(([name, lng, lat]) => {
        const p = m.project([lng, lat]);
        const f = m.queryRenderedFeatures([p.x, p.y], { layers: ['density'] }).find((x) => x.properties.name === name);
        if (!f) return { name, found: false };
        const c = f.layer.paint['fill-color'];
        const op = f.layer.paint['fill-opacity'];
        return { name, found: true, rgb: c && 'r' in c ? [c.r, c.g, c.b].map((v) => Math.round(v * 255 / (c.a || 1))) : null, opacity: op === undefined ? 1 : op };
      });
      return { layer: { type: layer.type, slot: layer.slot || null }, out };
    }, districts);
    if (!s.layer) return done(['there is no layer with id "density"'], {});
    const numbers = { type: s.layer.type, slot: s.layer.slot, districts: {} };
    if (s.layer.type !== 'fill') reasons.push(`layer "density" is a ${s.layer.type} layer, not fill`);
    if (s.layer.slot !== 'bottom') reasons.push(`layer "density" is in slot ${s.layer.slot}, not "bottom" (beneath roads and labels)`);
    districts.forEach(([name, , , dens, hex], i) => {
      const o = s.out[i];
      numbers.districts[name] = { density: dens, expected: hex, rgb: o.rgb, opacity: o.opacity };
      if (!o.found) { reasons.push(`${name} is not rendered in "density" at its centre`); return; }
      if (!near(o.rgb, hex, 2)) reasons.push(`${name} (density ${dens}) is rgb(${o.rgb}), expected ${hex}`);
      if (typeof o.opacity !== 'number' || Math.abs(o.opacity - 0.75) > 0.01) reasons.push(`${name} has fill opacity ${o.opacity}, expected 0.75`);
    });
    return done(reasons, numbers);
  },

  // 3. Clustering
  3: async (t) => {
    const reasons = [];
    await ready(t, () => {
      const m = window.map, st = m.getStyle();
      const sid = Object.keys(st.sources).find((k) => st.sources[k].type === 'geojson' && st.sources[k].cluster);
      const layers = sid ? st.layers.filter((l) => l.source === sid).map((l) => l.id) : [];
      return layers.length && m.queryRenderedFeatures({ layers }).some((f) => f.properties.cluster);
    }, null);
    const s = await t.eval(() => {
      const m = window.map, st = m.getStyle();
      const sid = Object.keys(st.sources).find((k) => st.sources[k].type === 'geojson' && st.sources[k].cluster);
      if (!sid) return { sid: null };
      const src = st.sources[sid];
      const layers = st.layers.filter((l) => l.source === sid).map((l) => l.id);
      const feats = layers.length ? m.queryRenderedFeatures({ layers }) : [];
      const clusters = {}, labels = {}, singles = {};
      for (const f of feats) {
        const p = f.properties || {}, type = f.layer.type;
        if (p.cluster) {
          if (type === 'circle') clusters[p.cluster_id] = { n: p.point_count, c: f.geometry.coordinates };
          if (type === 'symbol') {
            // a legacy '{point_count}' token string comes back unresolved; GL JS fills it in only at layout
            const tf = f.layer.layout && f.layer.layout['text-field'];
            labels[p.cluster_id] = tf == null ? '' : String(tf).replace(/{([^{}]+)}/g, (_, k) => (p[k] === undefined ? '' : String(p[k])));
          }
        } else if (type === 'circle') singles[p.sighting ?? JSON.stringify(f.geometry.coordinates)] = true;
      }
      return { sid, radius: src.clusterRadius, maxzoom: src.clusterMaxZoom, srcMaxzoom: src.maxzoom, clusters, labels, singles: Object.keys(singles).length, zoom: m.getZoom() };
    });
    if (!s.sid) return done(['no clustered GeoJSON source'], {});
    const ids = Object.keys(s.clusters);
    const inClusters = ids.reduce((a, k) => a + s.clusters[k].n, 0);
    const radius = s.radius ?? 50, maxz = s.maxzoom ?? ((s.srcMaxzoom ?? 18) - 1);
    const labelled = ids.filter((k) => s.labels[k] !== undefined && s.labels[k].trim() === String(s.clusters[k].n)).length;
    const numbers = { source: s.sid, cluster_radius: radius, cluster_max_zoom: maxz, clusters: ids.length, points_in_clusters: inClusters, unclustered: s.singles, total: inClusters + s.singles, labelled_clusters: labelled };
    if (radius !== 50) reasons.push(`cluster radius is ${radius}, expected 50`);
    if (maxz !== 14) reasons.push(`clusterMaxZoom is ${maxz}, expected 14`);
    if (ids.length < 2) reasons.push(`only ${ids.length} clusters drawn`);
    if (inClusters + s.singles !== 120) reasons.push(`clusters and single points account for ${inClusters + s.singles} sightings, not 120`);
    if (labelled !== ids.length) reasons.push(`${ids.length - labelled} of ${ids.length} clusters do not show their count`);
    if (!ids.length) return done(reasons, numbers);

    const big = ids.reduce((a, k) => (s.clusters[k].n > s.clusters[a].n ? k : a), ids[0]);
    const target = s.clusters[big].c;
    const before = await t.eval(({ sid, id, c }) => new Promise((res) => {
      window.map.getSource(sid).getClusterExpansionZoom(Number(id), (err, z) => {
        const p = window.map.project(c);
        res({ exp: err ? null : z, x: p.x, y: p.y });
      });
    }), { sid: s.sid, id: big, c: target });
    numbers.clicked = { cluster_id: Number(big), points: s.clusters[big].n, expansion_zoom: before.exp, zoom_before: round(s.zoom) };
    await t.page.mouse.click(before.x, before.y);
    await settle(t, 1000);
    const after = await t.eval((c) => { const p = window.map.project(c); return { zoom: window.map.getZoom(), x: p.x, y: p.y }; }, target);
    const off = Math.hypot(after.x - 400, after.y - 300);
    Object.assign(numbers.clicked, { zoom_after: round(after.zoom), offset_from_centre_px: round(off, 1) });
    if (before.exp === null) reasons.push('could not read the cluster expansion zoom');
    else if (!(Math.abs(after.zoom - before.exp) <= 0.25)) reasons.push(`after clicking the ${s.clusters[big].n}-point cluster the zoom is ${round(after.zoom)}, expected its expansion zoom ${before.exp}`);
    if (!(off <= 40)) reasons.push(`after clicking, the cluster is ${round(off, 0)} px from the centre of the map`);
    return done(reasons, numbers);
  },

  // 4. Feature-state hover
  4: async (t) => {
    const reasons = [];
    const pts = { West: [-79.41, 43.65], Centre: [-79.39, 43.65], East: [-79.37, 43.65], outside: [-79.39, 43.665] };
    await ready(t, (c) => {
      const m = window.map, st = m.getStyle();
      const fills = st.layers.filter((l) => l.type === 'fill' && st.sources[l.source] && st.sources[l.source].type === 'geojson').map((l) => l.id);
      return fills.length && m.queryRenderedFeatures(m.project(c), { layers: fills }).length > 0;
    }, pts.Centre);
    const scr = await t.eval((pts) => {
      const o = {};
      for (const k in pts) { const p = window.map.project(pts[k]); o[k] = [p.x, p.y]; }
      return o;
    }, pts);
    const RED = [230, 57, 70], BLUE = [142, 202, 230];
    const classify = (img, [x, y]) => {
      const r = fraction(img, x, y, 7, (c) => dist3(c, RED) < 60), b = fraction(img, x, y, 7, (c) => dist3(c, BLUE) < 60);
      // a label drawn over the fill may cover part of a patch, so a third of the patch is enough
      return r >= 0.3 && r > b ? 'red' : b >= 0.3 && b > r ? 'blue' : `other(${round(r)},${round(b)})`;
    };
    const zones = ['West', 'Centre', 'East'];
    const look = async () => { const img = await t.screenshot(); return Object.fromEntries(zones.map((z) => [z, classify(img, scr[z])])); };
    const steps = [
      ['before any hover', null, { West: 'blue', Centre: 'blue', East: 'blue' }],
      ['pointer over West', 'West', { West: 'red', Centre: 'blue', East: 'blue' }],
      ['pointer moved to Centre', 'Centre', { West: 'blue', Centre: 'red', East: 'blue' }],
      ['pointer moved to East', 'East', { West: 'blue', Centre: 'blue', East: 'red' }],
      ['pointer moved off the zones', 'outside', { West: 'blue', Centre: 'blue', East: 'blue' }],
    ];
    const numbers = { screen: Object.fromEntries(Object.entries(scr).map(([k, v]) => [k, v.map((x) => round(x, 0))])), steps: {} };
    for (const [label, where, want] of steps) {
      if (where) {
        await t.page.mouse.move(scr[where][0], scr[where][1], { steps: 8 });
        await t.page.waitForTimeout(300);
        await t.idle(5000);
      }
      const got = await look();
      numbers.steps[label] = got;
      const bad = zones.filter((z) => got[z] !== want[z]);
      if (bad.length) reasons.push(`${label}: ${bad.map((z) => `${z} is ${got[z]}, expected ${want[z]}`).join('; ')}`);
    }
    return done(reasons, numbers);
  },

  // 5. Symbols with a custom icon
  5: async (t) => {
    const reasons = [];
    const names = ['Nytorv', 'Gammeltorv', 'Frue Plads', 'Kultorvet', 'Hojbro Plads', 'Amagertorv', 'Kongens Nytorv', 'Gråbrødretorv',
      'Rådhuspladsen', 'Vestergade', 'Studiestræde', 'Larsbjørnsstræde'];
    const coords = [];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) coords.push([12.5664 + 0.0024 * col, 55.6815 - 0.0015 * row]);
    await ready(t, () => {
      const m = window.map, st = m.getStyle();
      const layers = st.layers.filter((l) => l.type === 'symbol' && st.sources[l.source] && st.sources[l.source].type === 'geojson').map((l) => l.id);
      return layers.length && m.queryRenderedFeatures({ layers }).some((f) => f.layer.layout && f.layer.layout['icon-image']);
    }, null);
    const s = await t.eval((coords) => {
      const m = window.map, st = m.getStyle();
      const layers = st.layers.filter((l) => l.type === 'symbol' && st.sources[l.source] && st.sources[l.source].type === 'geojson').map((l) => l.id);
      const placed = {}, images = new Set(), sizes = new Set();
      for (const f of layers.length ? m.queryRenderedFeatures({ layers }) : []) {
        const icon = f.layer.layout && f.layer.layout['icon-image'];
        const name = icon ? String(icon) : '';
        if (!name) continue;
        images.add(name);
        sizes.add(f.layer.layout['icon-size'] === undefined ? 1 : f.layer.layout['icon-size']);
        placed[f.properties.name] = true;
      }
      return {
        layers, placed: Object.keys(placed).map((n) => n.normalize('NFC')), images: [...images].map((n) => ({ n, has: m.hasImage(n) })),
        sizes: [...sizes], screen: coords.map((c) => { const p = m.project(c); return [p.x, p.y]; }),
      };
    }, coords);
    const img = await t.screenshot();
    const magenta = s.screen.map(([x, y]) => fraction(img, x, y, 2, ([r, g, b]) => r > 170 && b > 170 && g < 110));
    const shown = magenta.filter((f) => f >= 0.4).length;
    const missing = names.filter((n) => !s.placed.includes(n.normalize('NFC')));
    const numbers = { symbol_layers: s.layers, icon_images: s.images, icon_sizes: s.sizes, docks_with_icon_placed: 12 - missing.length, missing, magenta_at_dock: shown, magenta_fractions: magenta.map((f) => round(f)) };
    if (!s.images.length) reasons.push('no symbol layer on a GeoJSON source draws an icon');
    else if (!s.images.every((x) => x.has)) reasons.push(`icon image not loaded: ${s.images.filter((x) => !x.has).map((x) => x.n).join(', ')}`);
    if (s.sizes.some((v) => typeof v !== 'number' || Math.abs(v - 1) > 0.01)) reasons.push(`icon-size is ${s.sizes.join(', ')}, expected 1 (natural size)`);
    if (missing.length) reasons.push(`${missing.length} of 12 docks have no icon on the map: ${missing.join(', ')}`);
    if (shown < 9) reasons.push(`the dock icon's colour shows at only ${shown} of 12 dock positions`);
    return done(reasons, numbers);
  },

  // 6. Image overlay
  6: async (t) => {
    const reasons = [];
    const quads = { 'top-left': [[14.41, 50.09], [220, 30, 30]], 'top-right': [[14.43, 50.09], [30, 170, 60]],
      'bottom-right': [[14.43, 50.08], [30, 60, 220]], 'bottom-left': [[14.41, 50.08], [240, 200, 20]] };
    await ready(t, () => {
      const m = window.map, st = m.getStyle();
      const ids = Object.keys(st.sources).filter((k) => st.sources[k].type === 'image');
      return st.layers.some((l) => l.type === 'raster' && ids.includes(l.source)) && ids.every((k) => m.isSourceLoaded(k));
    }, null);
    const s = await t.eval((quads) => {
      const m = window.map, st = m.getStyle();
      const imgSources = Object.keys(st.sources).filter((k) => st.sources[k].type === 'image');
      const layer = st.layers.find((l) => l.type === 'raster' && imgSources.includes(l.source));
      const op = layer ? m.getPaintProperty(layer.id, 'raster-opacity') : undefined;
      const screen = {};
      for (const k in quads) { const p = m.project(quads[k][0]); screen[k] = [p.x, p.y]; }
      return { imgSources, layer: layer ? layer.id : null, opacity: op === undefined ? 1 : op, screen };
    }, quads);
    const numbers = { image_sources: s.imgSources, raster_layer: s.layer, opacity: s.opacity, quadrants: {} };
    if (!s.layer) return done(['no raster layer draws an image source'], numbers);
    if (typeof s.opacity !== 'number' || Math.abs(s.opacity - 0.8) > 0.01) reasons.push(`raster opacity is ${JSON.stringify(s.opacity)}, expected 0.8`);
    const img = await t.screenshot();
    for (const k in quads) {
      const [x, y] = s.screen[k];
      const mean = await t.patch(Math.round(x), Math.round(y), 4, img);
      const nearest = Object.keys(quads).reduce((a, q) => (dist3(mean, quads[q][1]) < dist3(mean, quads[a][1]) ? q : a), 'top-left');
      numbers.quadrants[k] = { screen: [round(x, 0), round(y, 0)], rgb: mean, looks_like: nearest };
      if (nearest !== k) reasons.push(`the ${k} of the area shows the image's ${nearest} quadrant (rgb ${mean})`);
    }
    return done(reasons, numbers);
  },

  // 7. Standard style configuration
  7: async (t) => {
    const reasons = [];
    const s = await t.eval(() => {
      const m = window.map, g = (k) => { try { return m.getConfigProperty('basemap', k); } catch (e) { return `error: ${e.message}`; } };
      // The 'poi' featureset also holds transit stops (group "transit"), which showTransitLabels governs, not this setting.
      let pois = null, transit = null, sample = [];
      try {
        const fs = m.queryRenderedFeatures({ target: { featuresetId: 'poi', importId: 'basemap' } });
        const isTransit = (f) => f.properties.group === 'transit' || f.properties.transit_mode !== undefined;
        const p = fs.filter((f) => !isTransit(f));
        pois = p.length; transit = fs.length - p.length;
        sample = p.slice(0, 4).map((f) => `${f.properties.name} (${f.properties.class})`);
      } catch (e) { pois = `error: ${e.message}`; }
      const c = m.getCenter();
      return { lightPreset: g('lightPreset'), theme: g('theme'), showPOI: g('showPointOfInterestLabels'), pois, transit_stops: transit, poi_sample: sample, center: [c.lng, c.lat], zoom: m.getZoom(), pitch: m.getPitch() };
    });
    const img = await t.screenshot();
    const lum = [];
    for (let y = 30; y < 600; y += 60) for (let x = 40; x < 800; x += 80) {
      const [r, g, b] = await t.patch(x, y, 4, img);
      lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
    const brightness = lum.reduce((a, v) => a + v, 0) / lum.length;
    const spread = Math.max(...lum) - Math.min(...lum);
    const numbers = { ...s, center: s.center.map((v) => round(v, 4)), zoom: round(s.zoom), pitch: round(s.pitch, 1), mean_brightness: round(brightness, 1), brightness_spread: round(spread, 1) };
    if (s.lightPreset !== 'night') reasons.push(`lightPreset is ${s.lightPreset}, expected night`);
    if (s.theme !== 'monochrome') reasons.push(`theme is ${s.theme}, expected monochrome`);
    if (s.showPOI !== false) reasons.push(`showPointOfInterestLabels is ${s.showPOI}, expected false`);
    if (s.pois !== 0) reasons.push(`${s.pois} point-of-interest labels are rendered`);
    if (metres(s.center, [139.7671, 35.6812]) > 30 || Math.abs(s.zoom - 15) > 0.05 || Math.abs(s.pitch - 60) > 0.5) reasons.push(`camera is ${numbers.center} z${numbers.zoom} pitch ${numbers.pitch}, expected 139.7671, 35.6812 z15 pitch 60`);
    if (!(brightness < 90)) reasons.push(`the map is too bright for night (mean brightness ${round(brightness, 1)} of 255)`);
    if (!(spread > 20)) reasons.push(`the screenshot is nearly uniform (patch brightness spread ${round(spread, 1)}), so the map did not draw`);
    return done(reasons, numbers);
  },

  // 8. 3D terrain
  8: async (t) => {
    const reasons = [];
    const LAKE = [-122.0980, 42.9440];
    const text = await waitFor(t, () => { const el = document.getElementById('elevation'); return el && /\d/.test(el.textContent) ? el.textContent : null; }, null, 15000);
    const s = await t.eval((lake) => {
      const m = window.map, terr = m.getTerrain(), st = m.getStyle();
      const c = m.getCenter();
      return {
        terrain: terr ? { source: terr.source, exaggeration: terr.exaggeration, type: st.sources[terr.source] && st.sources[terr.source].type } : null,
        raw: m.queryTerrainElevation(lake, { exaggerated: false }), shown: m.queryTerrainElevation(lake),
        center: [c.lng, c.lat], zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing(),
      };
    }, LAKE);
    const m = text ? String(text).replace(/[\s,\u00a0\u202f']/g, '').match(/-?\d+(\.\d+)?/) : null;
    const value = m ? Number(m[0]) : null;
    const numbers = { elevation_text: text || null, elevation_value: value, terrain: s.terrain, raw_elevation_m: round(s.raw, 1), exaggerated_elevation_m: round(s.shown, 1),
      center: s.center.map((v) => round(v, 5)), zoom: round(s.zoom), pitch: round(s.pitch, 1), bearing: round(s.bearing, 1) };
    if (!s.terrain) reasons.push('terrain is not enabled');
    else {
      if (s.terrain.type !== 'raster-dem') reasons.push(`terrain source is ${s.terrain.type}, not raster-dem`);
      if (typeof s.terrain.exaggeration !== 'number' || Math.abs(s.terrain.exaggeration - 1.5) > 0.01) reasons.push(`terrain exaggeration is ${JSON.stringify(s.terrain.exaggeration)}, expected 1.5`);
    }
    const bearingOff = Math.abs((((s.bearing + 180) % 360) + 360) % 360 - 180);
    if (metres(s.center, LAKE) > 50 || Math.abs(s.zoom - 12) > 0.1 || Math.abs(s.pitch - 60) > 1 || bearingOff > 1)
      reasons.push(`camera is ${numbers.center} z${numbers.zoom} pitch ${numbers.pitch} bearing ${numbers.bearing}, expected -122.098, 42.944 at z12, pitch 60, bearing 0`);
    if (typeof s.raw !== 'number' || s.raw < 1860 || s.raw > 1905) reasons.push(`the terrain gives the lake surface as ${round(s.raw, 1)} m (Crater Lake is at 1883 m); terrain data did not load there`);
    if (value === null) reasons.push('#elevation shows no number');
    else if (typeof s.raw === 'number' && Math.abs(value - s.raw) > 15) reasons.push(`#elevation shows ${value}, but the lake surface is ${Math.round(s.raw)} m above sea level in the terrain data`);
    return done(reasons, numbers);
  },

  // 9. Directions
  9: async (t) => {
    const reasons = [];
    const START = [13.3777, 52.5163], END = [13.4132, 52.5219];
    const found = await waitFor(t, () => {
      const m = window.map, st = m.getStyle();
      let best = null;
      const lines = (g) => !g ? [] : g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates
        : g.type === 'Feature' ? lines(g.geometry) : g.type === 'FeatureCollection' ? g.features.flatMap(lines) : g.type === 'GeometryCollection' ? g.geometries.flatMap(lines) : [];
      for (const l of st.layers) {
        if (l.type !== 'line') continue;
        const src = st.sources[l.source];
        if (!src || src.type !== 'geojson' || typeof src.data !== 'object') continue;
        for (const cs of lines(src.data)) if (Array.isArray(cs) && cs.length >= 2 && (!best || cs.length > best.coords.length)) best = { layer: l.id, coords: cs };
      }
      return best;
    }, null, 20000);
    if (!found) return done(['no line layer draws a GeoJSON line'], {});
    await settle(t, 300);
    const s = await t.eval(({ layer, coords }) => {
      const m = window.map;
      const norm = (v) => { if (typeof v !== 'string') return v; const c = document.createElement('canvas').getContext('2d'); c.fillStyle = '#000'; c.fillStyle = v; return c.fillStyle; };
      const inside = coords.filter((c) => { const p = m.project(c); return p.x >= 0 && p.y >= 0 && p.x <= innerWidth && p.y <= innerHeight; }).length;
      const el = document.getElementById('distance');
      return { color: norm(m.getPaintProperty(layer, 'line-color')), width: m.getPaintProperty(layer, 'line-width') ?? 1, inside, text: el ? el.textContent : null };
    }, found);
    const c = found.coords;
    let len = 0;
    for (let i = 1; i < c.length; i++) len += metres(c[i - 1], c[i]);
    const km = len / 1000;
    const mt = s.text ? s.text.replace(/,(?=\d)/g, '.').match(/\d+(\.\d+)?/) : null;
    const shownKm = mt ? Number(mt[0]) : null;
    const numbers = { layer: found.layer, points: c.length, start_offset_m: round(metres(c[0], START), 0), end_offset_m: round(metres(c[c.length - 1], END), 0),
      line_km: round(km), in_view: `${s.inside}/${c.length}`, color: s.color, width: s.width, distance_text: s.text };
    if (numbers.start_offset_m > 300) reasons.push(`the line starts ${numbers.start_offset_m} m from the Brandenburg Gate`);
    if (numbers.end_offset_m > 300) reasons.push(`the line ends ${numbers.end_offset_m} m from Alexanderplatz`);
    if (km < 2 || km > 8) reasons.push(`the line is ${round(km)} km long, not a plausible driving route (2-8 km)`);
    if (s.inside < 0.95 * c.length) reasons.push(`only ${s.inside} of ${c.length} route points are in view`);
    if (String(s.color).toLowerCase() !== '#3a86ff') reasons.push(`line colour is ${s.color}, expected #3a86ff`);
    if (s.width !== 5) reasons.push(`line width is ${JSON.stringify(s.width)}, expected 5`);
    if (shownKm === null) reasons.push('#distance shows no number');
    else if (Math.abs(shownKm - km) > 0.15 * km) reasons.push(`#distance shows ${shownKm} km but the drawn route is ${round(km)} km`);
    return done(reasons, numbers);
  },

  // 10. Geocoding
  10: async (t) => {
    const reasons = [];
    const TARGET = [-0.1277, 51.5034]; // 10 Downing Street
    const geocodeRequests = [];
    const onReq = (r) => { if (/api\.mapbox\.com\/(search\/geocode|geocoding)\//.test(r.url())) geocodeRequests.push(r.url().split('?')[0]); };
    t.page.on('request', onReq);
    const before = await t.eval(() => { const c = window.map.getCenter(); return [c.lng, c.lat]; });
    try {
      await t.page.fill('#search', '10 Downing Street, London', { timeout: 5000 });
      await t.page.click('#go', { timeout: 5000 });
    } catch (e) {
      t.page.off('request', onReq);
      return done([`could not type into #search and click #go: ${String(e.message).split('\n')[0]}`], {});
    }
    await waitFor(t, (b) => { const c = window.map.getCenter(); return Math.abs(c.lng - b[0]) + Math.abs(c.lat - b[1]) > 0.01; }, before, 15000);
    await settle(t, 300);
    t.page.off('request', onReq);
    const s = await t.eval(() => {
      const m = window.map, c = m.getCenter(), cx = innerWidth / 2, cy = innerHeight / 2;
      const markers = [...document.querySelectorAll('.mapboxgl-marker')].map((el) => el.getBoundingClientRect());
      const onCentre = markers.filter((b) => cx >= b.left - 8 && cx <= b.right + 8 && cy >= b.top - 8 && cy <= b.bottom + 8).length;
      return { center: [c.lng, c.lat], zoom: m.getZoom(), markers: markers.length, onCentre };
    });
    const off = metres(s.center, TARGET);
    const numbers = { start_center: before.map((v) => round(v, 3)), center: s.center.map((v) => round(v, 5)), metres_from_target: round(off, 0), zoom: round(s.zoom),
      markers: s.markers, markers_at_centre: s.onCentre, geocoding_requests: geocodeRequests.length, endpoints: [...new Set(geocodeRequests)] };
    if (off > 300) reasons.push(`the map is centred ${round(off / 1000, 1)} km from 10 Downing Street`);
    if (Math.abs(s.zoom - 16) > 0.1) reasons.push(`zoom is ${round(s.zoom)}, expected 16`);
    if (s.markers !== 1) reasons.push(`expected one marker, found ${s.markers}`);
    else if (s.onCentre !== 1) reasons.push('the marker is not on the result at the centre of the map');
    if (geocodeRequests.length === 0) reasons.push('no request was made to the Mapbox Geocoding API');
    return done(reasons, numbers);
  },
};
