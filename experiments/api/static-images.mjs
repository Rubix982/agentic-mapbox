// Do the image APIs (Static Images, Static Tiles, Raster Tiles) return images of the size asked, with no map
// library at all, including a Static Image of the Standard style?
import { apiExperiment, fact } from '../lib.mjs';

function imageSize(b) {
  if (b.slice(1, 4).toString() === 'PNG') return { format: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { format: 'jpeg', height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return { format: 'webp' };
  return { format: 'unknown' };
}

// Google's encoded polyline, precision 5, as the Static Images path overlay wants it
function polyline(coords) {
  const enc = (v) => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); };
  let out = '', la0 = 0, ln0 = 0;
  for (const [lng, lat] of coords) { const la = Math.round(lat * 1e5), ln = Math.round(lng * 1e5); out += enc(la - la0) + enc(ln - ln0); la0 = la; ln0 = ln; }
  return out;
}

const tile = ([lng, lat], z) => {
  const n = 2 ** z, r = (lat * Math.PI) / 180;
  return [Math.floor(((lng + 180) / 360) * n), Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)];
};

const eiffel = [2.2945, 48.8584], trocadero = [2.2875, 48.8616], arc = [2.295, 48.8738];

await apiExperiment({
  file: import.meta.url,
  question: 'Do Static Images, Static Tiles and Raster Tiles return images of the size asked, with no map library, including a Static Image of the Standard style?',
  run: async (api) => {
    const [x, y] = tile(eiffel, 15);
    const path = encodeURIComponent(polyline([eiffel, trocadero, arc]));
    const asks = {
      standard: ['https://api.mapbox.com/styles/v1/mapbox/standard/static/2.2945,48.8584,15.5,30,55/600x400@2x', 1200, 800],
      overlay: [`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l-monument+e4405f(2.2945,48.8584),path-5+ff2d55-0.8(${path})/auto/600x400@2x?padding=40`, 1200, 800],
      static_tile: [`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/15/${x}/${y}@2x`, 1024, 1024],
      satellite_tile: [`https://api.mapbox.com/v4/mapbox.satellite/15/${x}/${y}@2x.jpg`, 512, 512],
    };
    const got = {};
    for (const [k, [url, w, h]] of Object.entries(asks)) {
      const r = await api.get(url);
      const size = r.ok ? imageSize(r.buffer) : {};
      got[k] = { status: r.status, content_type: r.type, ...size, asked: `${w}x${h}`, kb: Math.round(r.buffer.length / 1024), message: r.message };
      if (r.ok && size.format !== 'unknown' && size.format !== 'webp') api.save(k, r.buffer, size.format === 'jpeg' ? 'jpg' : 'png');
    }
    const right = (k) => got[k].status === 200 && got[k].width === asks[k][1] && got[k].height === asks[k][2];
    return {
      facts: [
        fact('A Static Image of the Standard style comes back at the size asked (600 x 400 @2x = 1200 x 800)', right('standard'), got.standard),
        fact('A Static Image with a pin and a path, framed automatically, comes back at 1200 x 800', right('overlay'), got.overlay),
        fact('A 512 px Static Tile @2x comes back at 1024 x 1024', right('static_tile'), got.static_tile),
        fact('A satellite Raster Tile @2x comes back at 512 x 512', right('satellite_tile'), got.satellite_tile),
      ],
      numbers: got,
    };
  },
});
