// NAD83 / New York Long Island (ftUS), EPSG:2263: Lambert conformal conic, two standard parallels, GRS80.
// Inverse only: city X/Y in US survey feet -> [lng, lat] in degrees. Used by the reference page and the check.
function nyLongIslandToLngLat(xFt, yFt) {
  const ft = 1200 / 3937, a = 6378137, f = 1 / 298.257222101, e = Math.sqrt(2 * f - f * f);
  const rad = Math.PI / 180, phi1 = 41.03333333333333 * rad, phi2 = 40.66666666666667 * rad, phi0 = 40.16666666666667 * rad, lam0 = -74 * rad;
  const x0 = 300000, y0 = 0;
  const m = (p) => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
  const t = (p) => Math.tan(Math.PI / 4 - p / 2) / ((1 - e * Math.sin(p)) / (1 + e * Math.sin(p))) ** (e / 2);
  const n = (Math.log(m(phi1)) - Math.log(m(phi2))) / (Math.log(t(phi1)) - Math.log(t(phi2)));
  const F = m(phi1) / (n * t(phi1) ** n), r0 = a * F * t(phi0) ** n;
  const x = xFt * ft - x0, y = r0 - (yFt * ft - y0);
  const r = Math.sign(n) * Math.sqrt(x * x + y * y), tt = (r / (a * F)) ** (1 / n), theta = Math.atan2(x, y);
  let phi = Math.PI / 2 - 2 * Math.atan(tt);
  for (let i = 0; i < 8; i++) phi = Math.PI / 2 - 2 * Math.atan(tt * ((1 - e * Math.sin(phi)) / (1 + e * Math.sin(phi))) ** (e / 2));
  return [(theta / n + lam0) / rad, phi / rad];
}
if (typeof module !== 'undefined') module.exports = { nyLongIslandToLngLat };
