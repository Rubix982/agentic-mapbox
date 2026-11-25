// Generates the small data files the tasks name. Deterministic.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { PNG } = require('pngjs');
const OUT = path.dirname(new URL(import.meta.url).pathname); // evals/tasks/data, beside this script
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const write = (rel, obj) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof obj === 'string' ? obj : JSON.stringify(obj)); };
const rect = (w, s, e, n) => ({ type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] });

// task 2: six districts in a 3 x 2 grid over Madrid, with a density per km2
{
  const dens = [[4, 10, 32], [50, 87, 240]]; // top row (north), bottom row (south)
  const feats = [];
  let k = 1;
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const w = -3.76 + 0.04 * col, n = 40.45 - 0.03 * row;
    feats.push({ type: 'Feature', properties: { name: `District ${k++}`, density: dens[row][col] }, geometry: rect(r5(w), r5(n - 0.03), r5(w + 0.04), r5(n)) });
  }
  write('task2/districts.geojson', { type: 'FeatureCollection', features: feats });
}

// task 3: 120 sightings around Amsterdam: four groups and five lone points
{
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 1.0; };
  const groups = [[4.85, 52.40, 50], [4.98, 52.36, 35], [4.80, 52.32, 20], [5.03, 52.42, 10]];
  const feats = [];
  let id = 1;
  for (const [lng, lat, n] of groups) for (let i = 0; i < n; i++)
    feats.push({ type: 'Feature', properties: { sighting: id++ }, geometry: { type: 'Point', coordinates: [r5(lng + 0.006 * gauss()), r5(lat + 0.004 * gauss())] } });
  for (const [lng, lat] of [[4.70, 52.46], [5.10, 52.29], [4.72, 52.28], [5.11, 52.465], [4.93, 52.465]])
    feats.push({ type: 'Feature', properties: { sighting: id++ }, geometry: { type: 'Point', coordinates: [lng, lat] } });
  write('task3/sightings.geojson', { type: 'FeatureCollection', features: feats });
}

// task 4: three delivery zones side by side in Toronto, no feature ids
{
  const names = ['West', 'Centre', 'East'];
  const feats = names.map((name, i) => ({ type: 'Feature', properties: { zone: name }, geometry: rect(r5(-79.42 + 0.02 * i), 43.64, r5(-79.40 + 0.02 * i), 43.66) }));
  write('task4/zones.geojson', { type: 'FeatureCollection', features: feats });
}

// task 5: twelve bike docks in a tight 4 x 3 grid in Copenhagen, and a 32 x 32 magenta dock icon
{
  const names = ['Nytorv', 'Gammeltorv', 'Frue Plads', 'Kultorvet', 'Hojbro Plads', 'Amagertorv', 'Kongens Nytorv', 'Gråbrødretorv',
    'Rådhuspladsen', 'Vestergade', 'Studiestræde', 'Larsbjørnsstræde'];
  const feats = [];
  let k = 0;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    feats.push({ type: 'Feature', properties: { name: names[k++] }, geometry: { type: 'Point', coordinates: [r5(12.5664 + 0.0024 * col), r5(55.6815 - 0.0015 * row)] } });
  }
  write('task5/docks.geojson', { type: 'FeatureCollection', features: feats });
  const png = new PNG({ width: 32, height: 32 });
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const d = Math.hypot(x - 15.5, y - 15.5), k4 = (y * 32 + x) * 4;
    const inside = d <= 15, ring = d > 13;
    png.data[k4] = inside ? (ring ? 255 : 255) : 0;
    png.data[k4 + 1] = inside ? (ring ? 255 : 0) : 0;
    png.data[k4 + 2] = inside ? (ring ? 255 : 255) : 0;
    png.data[k4 + 3] = inside ? 255 : 0;
  }
  fs.writeFileSync(path.join(OUT, 'task5/dock.png'), PNG.sync.write(png));
}

// task 6: a 320 x 240 plan image in four coloured quadrants
{
  const W = 320, H = 240, png = new PNG({ width: W, height: H });
  const q = { tl: [220, 30, 30], tr: [30, 170, 60], br: [30, 60, 220], bl: [240, 200, 20] };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = y < H / 2 ? (x < W / 2 ? q.tl : q.tr) : (x < W / 2 ? q.bl : q.br);
    const k4 = (y * W + x) * 4;
    png.data[k4] = c[0]; png.data[k4 + 1] = c[1]; png.data[k4 + 2] = c[2]; png.data[k4 + 3] = 255;
  }
  fs.writeFileSync(path.join(OUT, 'task6/plan.png'), PNG.sync.write(png));
}
console.log('ok');
