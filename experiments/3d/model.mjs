// Does a glTF model written here (a 30 x 30 x 90 m red tower) appear where it is placed, through addModel and a
// `model` layer?
import { mapExperiment, page, diff, fact } from '../lib.mjs';

// A box, glTF 2.0, Y up, metres: 24 vertices (flat normals), 36 indices, one red material.
function tower(w = 30, h = 90) {
  const a = w / 2, faces = [
    [[0, 0, 1], [[-a, 0, a], [a, 0, a], [a, h, a], [-a, h, a]]],
    [[0, 0, -1], [[a, 0, -a], [-a, 0, -a], [-a, h, -a], [a, h, -a]]],
    [[1, 0, 0], [[a, 0, a], [a, 0, -a], [a, h, -a], [a, h, a]]],
    [[-1, 0, 0], [[-a, 0, -a], [-a, 0, a], [-a, h, a], [-a, h, -a]]],
    [[0, 1, 0], [[-a, h, a], [a, h, a], [a, h, -a], [-a, h, -a]]],
    [[0, -1, 0], [[-a, 0, -a], [a, 0, -a], [a, 0, a], [-a, 0, a]]],
  ];
  const pos = [], nor = [], idx = [];
  faces.forEach(([n, q], f) => { q.forEach((p) => { pos.push(...p); nor.push(...n); }); const b = f * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
  const P = Buffer.from(new Float32Array(pos).buffer), N = Buffer.from(new Float32Array(nor).buffer), I = Buffer.from(new Uint16Array(idx).buffer);
  const buf = Buffer.concat([P, N, I]);
  return JSON.stringify({
    asset: { version: '2.0', generator: 'agentic-mapbox experiments/3d/model.mjs' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.9, 0.1, 0.2, 1], metallicFactor: 0, roughnessFactor: 0.7 } }],
    buffers: [{ byteLength: buf.length, uri: 'data:application/octet-stream;base64,' + buf.toString('base64') }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: P.length, target: 34962 },
      { buffer: 0, byteOffset: P.length, byteLength: N.length, target: 34962 },
      { buffer: 0, byteOffset: P.length + N.length, byteLength: I.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', min: [-a, 0, -a], max: [a, h, a] },
      { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
  });
}

const spot = [-9.1366, 38.7075]; // Praça do Comércio, Lisbon: an open square

const html = page({
  title: 'glTF model layer',
  script: `
window.map = new mapboxgl.Map({ container: 'map', center: ${JSON.stringify(spot)}, zoom: 17, pitch: 60, bearing: 20 });
map.on('style.load', () => {
  map.addModel('tower', new URL('tower.gltf', location.href).href);
  map.addSource('spot', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: ${JSON.stringify(spot)} } } });
  map.addLayer({ id: 'tower', type: 'model', source: 'spot', layout: { 'model-id': 'tower' } });
});
`,
});

await mapExperiment({
  file: import.meta.url,
  question: 'Does a glTF model written here (a 30 x 30 x 90 m red tower) appear where it is placed, through addModel and a model layer?',
  html,
  assets: { 'tower.gltf': tower() },
  check: async (t) => {
    const on = await t.shot('tower');
    const base = await t.eval((p) => window.map.project(p), spot);
    const red = await t.patch(Math.round(base.x), Math.round(base.y) - 20, 4, on);
    await t.eval(() => window.map.setLayoutProperty('tower', 'visibility', 'none'));
    await t.idle(15000);
    await t.wait(300);
    const off = await t.shot('hidden');
    const near = (x, y) => Math.abs(x - base.x) < 120 && y < base.y + 40 && y > base.y - 350;
    const far = (x, y) => !(Math.abs(x - base.x) < 200 && y > base.y - 450 && y < base.y + 100);
    const dNear = diff(on, off, near), dFar = diff(on, off, far);
    return {
      facts: [
        // the first version asked for a mean difference over 20 near the model; the same page gave 21.4 on one run and
        // 19.6 on the next, so the threshold sat inside run-to-run variation. Restated as near against elsewhere.
        fact('Showing the model changes the picture near its position at least ten times more than elsewhere', dNear > 10 * Math.max(dFar, 0.5), { near: dNear, elsewhere: dFar }),
        fact('Just above its base point the pixel is red (red channel at least 60 above green and blue)', red[0] - red[1] > 60 && red[0] - red[2] > 60, { rgb: red, base_px: { x: Math.round(base.x), y: Math.round(base.y) } }),
      ],
    };
  },
});
