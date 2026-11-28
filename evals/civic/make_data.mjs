// Writes the civic set's data files from New York City's 311 Service Requests (data.cityofnewyork.us, erm2-nwe9):
// every Street Condition / Pothole report in Brooklyn created from 1 to 7 November 2026, as the city's own CSV export.
//   node evals/civic/make_data.mjs
// task1/ and task3/ get the export as it comes. task2/ gets the same rows with the latitude, longitude and location
// columns removed, so a report's position is only the city's x_coordinate_state_plane and y_coordinate_state_plane.
// truth.json (beside this script, not given to agents) keeps each report's latitude and longitude for task 2's check.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WHERE = "complaint_type='Street Condition' AND descriptor='Pothole' AND borough='BROOKLYN' AND created_date between '2026-11-01T00:00:00' and '2026-11-08T00:00:00'";
const url = `https://data.cityofnewyork.us/resource/erm2-nwe9.csv?${new URLSearchParams({ $where: WHERE, $order: 'unique_key', $limit: '5000' })}`;
const r = await fetch(url, { headers: { 'User-Agent': 'dem-check/1.0' } });
if (!r.ok) throw new Error(`311 export: ${r.status}`);
const csv = await r.text();

// a small CSV reader for the export (quoted fields, commas and newlines inside quotes)
function parse(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const rows = parse(csv), head = rows[0], body = rows.slice(1).filter((x) => x.length === head.length);
const col = (n) => head.indexOf(n);
const out = (cells) => cells.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',');
fs.writeFileSync(path.join(HERE, 'data/task1/potholes.csv'), csv);
fs.writeFileSync(path.join(HERE, 'data/task3/potholes.csv'), csv);
const drop = new Set(['latitude', 'longitude', 'location'].map(col));
fs.writeFileSync(path.join(HERE, 'data/task2/potholes-xy.csv'), [head, ...body].map((x) => out(x.filter((_, i) => !drop.has(i)))).join('\n') + '\n');
const truth = body.filter((x) => x[col('latitude')]).map((x) => ({ unique_key: x[col('unique_key')], lng: Number(x[col('longitude')]), lat: Number(x[col('latitude')]),
  x: Number(x[col('x_coordinate_state_plane')]), y: Number(x[col('y_coordinate_state_plane')]), created: x[col('created_date')], closed: x[col('closed_date')] || null }));
const all = body.map((x) => ({ unique_key: x[col('unique_key')], created: x[col('created_date')], closed: x[col('closed_date')] || null, located: !!x[col('latitude')] }));
fs.writeFileSync(path.join(HERE, 'truth.json'), JSON.stringify({ fetched: new Date().toISOString(), where: WHERE, rows: body.length, located: truth.length, truth, all }, null, 1) + '\n');
console.log(`rows ${body.length}, located ${truth.length}, open ${all.filter((a) => !a.closed).length}, columns ${head.length}`);
console.log('first created/closed:', all[0].created, all[0].closed);
