// Writes every file under data/taskN/ for the tasks-3x set: two glTF models and the GeoJSON the tasks name.
//
//   node evals/tasks-3x/make_data.mjs
//
// The models are built here, not downloaded: flat-shaded prisms in metres, glTF axes (+Y up, -Z forward).
// GL JS places a model's -Z axis to the north and +X to the east, and a positive z rotation turns it clockwise
// seen from above (measured on 2026-11-25 with GL JS 3.35.2; see validation.md).

import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const out = (n, file, body) => {
  const d = path.join(HERE, 'data', `task${n}`);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, file), body);
};

// ---- glTF (binary) writer: each part is a prism over convex polygons in the model's x/z plane ----
function prism(poly, y0, y1) {
  const P = [], N = [];
  const tri = (a, b, c, n) => { P.push(...a, ...b, ...c); N.push(...n, ...n, ...n); };
  for (let i = 1; i < poly.length - 1; i++) {
    const a = [poly[0][0], y1, poly[0][1]], b = [poly[i][0], y1, poly[i][1]], c = [poly[i + 1][0], y1, poly[i + 1][1]];
    const up = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) > 0; // counter-clockwise seen from +Y
    const a0 = [a[0], y0, a[2]], b0 = [b[0], y0, b[2]], c0 = [c[0], y0, c[2]];
    if (up) { tri(a, b, c, [0, 1, 0]); tri(a0, c0, b0, [0, -1, 0]); } else { tri(a, c, b, [0, 1, 0]); tri(a0, b0, c0, [0, -1, 0]); }
  }
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cz = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    let nx = q[1] - p[1], nz = -(q[0] - p[0]);
    const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    if (nx * ((p[0] + q[0]) / 2 - cx) + nz * ((p[1] + q[1]) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
    const A = [p[0], y0, p[1]], B = [q[0], y0, q[1]], C = [q[0], y1, q[1]], D = [p[0], y1, p[1]];
    const e1 = [B[0] - A[0], 0, B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const crx = e1[1] * e2[2] - e1[2] * e2[1], crz = e1[0] * e2[1] - e1[1] * e2[0];
    if (crx * nx + crz * nz > 0) { tri(A, B, C, [nx, 0, nz]); tri(A, C, D, [nx, 0, nz]); }
    else { tri(A, C, B, [nx, 0, nz]); tri(A, D, C, [nx, 0, nz]); }
  }
  return { P, N };
}

function glb(parts) {
  const chunks = [], views = [], accessors = [], meshes = [], materials = [], nodes = [];
  let offset = 0;
  const view = (buf, target) => { views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target }); chunks.push(buf); offset += buf.length; return views.length - 1; };
  parts.forEach((part, k) => {
    const P = [], N = [];
    for (const poly of part.polys) { const g = prism(poly, part.y0, part.y1); P.push(...g.P); N.push(...g.N); }
    const count = P.length / 3;
    const min = [0, 1, 2].map((j) => Math.min(...P.filter((_, i) => i % 3 === j)));
    const max = [0, 1, 2].map((j) => Math.max(...P.filter((_, i) => i % 3 === j)));
    const a = accessors.length;
    accessors.push({ bufferView: view(Buffer.from(new Float32Array(P).buffer), 34962), componentType: 5126, count, type: 'VEC3', min, max });
    accessors.push({ bufferView: view(Buffer.from(new Float32Array(N).buffer), 34962), componentType: 5126, count, type: 'VEC3' });
    // GL JS 3.35.2 will not load a primitive without indices ("Cannot read properties of undefined (reading 'bufferView')")
    accessors.push({ bufferView: view(Buffer.from(new Uint32Array(Array.from({ length: count }, (_, i) => i)).buffer), 34963), componentType: 5125, count, type: 'SCALAR' });
    materials.push({ name: part.name, pbrMetallicRoughness: { baseColorFactor: [...part.color, 1], metallicFactor: 0, roughnessFactor: 0.9 } });
    meshes.push({ name: part.name, primitives: [{ attributes: { POSITION: a, NORMAL: a + 1 }, indices: a + 2, material: k, mode: 4 }] });
    nodes.push({ name: part.name, mesh: k });
  });
  const bin = Buffer.concat(chunks);
  const json = { asset: { version: '2.0', generator: 'evals/tasks-3x/make_data.mjs' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, materials, accessors, bufferViews: views, buffers: [{ byteLength: bin.length }] };
  const pad = (b, c) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, c)]);
  const J = pad(Buffer.from(JSON.stringify(json)), 0x20), B = pad(bin, 0);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + J.length + 8 + B.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(J.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(B.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, J, bh, B]);
}

// ---- geometry helpers ----
const R = 6378137;
const offset = ([lng, lat], dx, dy) => [+(lng + (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI)).toFixed(7), +(lat + (dy / R) * (180 / Math.PI)).toFixed(7)];
const rect = (c, w, h) => { const r = [offset(c, -w / 2, -h / 2), offset(c, w / 2, -h / 2), offset(c, w / 2, h / 2), offset(c, -w / 2, h / 2)]; return [[...r, r[0]]]; };
const fc = (features) => JSON.stringify({ type: 'FeatureCollection', features }, null, 1) + '\n';
const feature = (properties, geometry) => ({ type: 'Feature', properties, geometry });

// Task 1: a 40 m x 12 m pavilion, 15 m tall, long side along the model's x axis; red so it reads against grass.
out(1, 'pavilion.glb', glb([{ name: 'pavilion', polys: [[[-20, -6], [20, -6], [20, 6], [-20, 6]]], y0: 0, y1: 15, color: [0.85, 0.08, 0.08] }]));

// Task 2: a delivery van, 2.4 m wide, 6 m long, nose (the lower cab) towards the model's -z axis, i.e. facing north.
out(2, 'van.glb', glb([
  { name: 'cargo', polys: [[[-1.2, -1], [1.2, -1], [1.2, 3], [-1.2, 3]]], y0: 0.3, y1: 2.7, color: [0.92, 0.92, 0.92] },
  { name: 'cab', polys: [[[-1.2, -3], [1.2, -3], [1.2, -1], [-1.2, -1]]], y0: 0.3, y1: 2.0, color: [0.92, 0.92, 0.92] },
]));
const DEPOT = [13.403, 52.474]; // Tempelhofer Feld, Berlin
const vans = [
  ['V01', -40, 25, 0, 'on-time'], ['V02', 0, 30, 45, 'late'], ['V03', 40, 25, 90, 'on-time'], ['V04', -45, -5, 135, 'on-time'],
  ['V05', 5, -5, 200, 'late'], ['V06', 45, 0, 270, 'on-time'], ['V07', -20, -30, 315, 'late'], ['V08', 25, -30, 160, 'on-time'],
];
out(2, 'vans.geojson', fc(vans.map(([van_id, dx, dy, heading, status]) => feature({ van_id, heading, status }, { type: 'Point', coordinates: offset(DEPOT, dx, dy) }))));

// Task 3: the redevelopment site around Square du Temple, Paris (a lng/lat box)
out(3, 'site.geojson', fc([feature({ name: 'Square du Temple site' }, { type: 'Polygon', coordinates: [[[2.3595, 48.864], [2.3618, 48.864], [2.3618, 48.8655], [2.3595, 48.8655], [2.3595, 48.864]]] })]));

// Task 5: planned buildings in Victoria Park, London
const PARK = [-0.04, 51.5365];
const blocks = [
  ['North Hall', -60, 40, 30, 18, 12, 'gabled'], ['Boathouse', 0, 45, 24, 24, 9, 'hipped'], ['Tower', 60, 30, 26, 22, 36, 'flat'],
  ['Pavilion', -40, -30, 20, 20, 15, 'pyramidal'], ['Library', 35, -35, 40, 16, 18, 'mansard'],
];
out(5, 'footprints.geojson', fc(blocks.map(([name, dx, dy, w, h, height_m, roof]) => feature({ name, height_m, roof }, { type: 'Polygon', coordinates: rect(offset(PARK, dx, dy), w, h) }))));

// Task 6: flood zones in HafenCity, Hamburg
out(6, 'floodzones.geojson', fc([
  feature({ zone: 'A', risk: 'high' }, { type: 'Polygon', coordinates: [[[9.989, 53.5398], [9.9985, 53.5398], [9.9992, 53.5426], [9.9895, 53.5431], [9.989, 53.5398]]] }),
  feature({ zone: 'B', risk: 'high' }, { type: 'Polygon', coordinates: [[[10.0005, 53.5392], [10.0085, 53.539], [10.0088, 53.5417], [10.0008, 53.5421], [10.0005, 53.5392]]] }),
  feature({ zone: 'C', risk: 'medium' }, { type: 'Polygon', coordinates: [[[9.9845, 53.5436], [9.9905, 53.5434], [9.9908, 53.5459], [9.9848, 53.5461], [9.9845, 53.5436]]] }),
]));

// Task 7: a walking route in downtown San Francisco
out(7, 'route.geojson', fc([feature({ name: 'Market Street walk' }, { type: 'LineString', coordinates: [[-122.4194, 37.7793], [-122.4135, 37.7816], [-122.4078, 37.7843], [-122.4031, 37.7876], [-122.3998, 37.7907], [-122.3947, 37.7946]] })]));

// Task 10: six districts in a 3 x 2 grid in Austin, with no feature ids
const AUS = [-97.7431, 30.2672];
const districts = [];
let k = 1;
for (const row of [1, 0]) for (const col of [-1, 0, 1]) {
  const c = offset(AUS, col * 620, (row - 0.5) * 620);
  districts.push(feature({ district_id: `D${k}`, name: `District ${k}` }, { type: 'Polygon', coordinates: rect(c, 600, 600) }));
  k++;
}
out(10, 'districts.geojson', fc(districts));
console.log('wrote', fs.readdirSync(path.join(HERE, 'data')).map((d) => `${d}: ${fs.readdirSync(path.join(HERE, 'data', d)).join(', ')}`).join(' | '));
