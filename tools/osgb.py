"""WGS84 longitude/latitude to British National Grid (EPSG:27700) with Ordnance Survey's OSTN15 grid.

Reads a JSON list of [lng, lat] on stdin and writes a JSON list of [easting, northing] in metres. PROJ fetches the
OSTN15 grid (uk_os_OSTN15_NTv2_OSGBtoETRS.tif) from cdn.proj.org the first time. Refuses to run without it, since the
seven-parameter fallback can be several metres out (3.9 m at Hull on 2026-11-28).
    .venv/bin/python tools/osgb.py < points.json
"""
import json
import sys

import pyproj
from pyproj.transformer import TransformerGroup

pyproj.network.set_network_enabled(True)
best = TransformerGroup('EPSG:4326', 'EPSG:27700', always_xy=True).transformers[0]
if 'OSTN15' not in best.definition:
    sys.exit('OSTN15 grid not available: ' + best.description)
points = json.load(sys.stdin)
lng, lat = zip(*points) if points else ((), ())
e, n = best.transform(lng, lat)
json.dump([[round(a, 3), round(b, 3)] for a, b in zip(e, n)], sys.stdout)
