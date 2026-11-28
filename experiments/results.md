# Results

## C-002: the tour, 21 Mapbox capabilities on this account's public token (2026-11-25)

`node experiments/run.mjs` runs all 22 scripts once, one after another, and rewrites the table below and
`gallery.html`, which has every question, fact and screenshot on one page. The screenshots in `*/results/` are map
images © [Mapbox](https://www.mapbox.com/about/maps) © [OpenStreetMap](http://www.openstreetmap.org/copyright), with
satellite imagery © Maxar in `3d/terrain` and `api/static-images`. They are not covered by this repository's licence. Each map script opens its page once in
headless Chromium at 800 × 600 with the account's public (`pk.`) token, and the page calls the web services itself, from
the browser. The three scripts with no map call the web services from Node. Every fact was written as a sentence that
could come out false, and "false" below is a result.

| Experiment | Served by Mapbox | Facts that held | Map loads | Web-service requests |
|---|---|---|---|---|
| standard/light-presets | yes | 5 of 5 | 1 | 0 |
| standard/themes | yes | 4 of 4 | 1 | 0 |
| standard/buildings-3d | yes | 3 of 3 | 1 | 0 |
| standard/interactions | yes | 4 of 5 | 1 | 0 |
| standard/imports | yes | 4 of 4 | 1 | 0 |
| 3d/globe | yes | 3 of 3 | 1 | 0 |
| 3d/terrain | yes | 5 of 5 | 1 | 0 |
| 3d/terrain-heights | yes | 2 of 4 | 1 | 0 |
| 3d/model | yes | 2 of 2 | 1 | 0 |
| 3d/clip | yes | 3 of 3 | 1 | 0 |
| 3d/precipitation | yes | 4 of 5 | 1 | 0 |
| data/raster-particle | yes | 3 of 4 | 1 | 0 |
| api/isochrone | yes | 3 of 3 | 1 | 1 |
| api/matrix | yes | 3 of 3 | 1 | 1 |
| api/optimization | yes | 2 of 2 | 1 | 2 |
| api/map-matching | yes | 3 of 3 | 1 | 2 |
| api/search-box-category | yes | 2 of 3 | 1 | 1 |
| api/search-box-suggest | yes | 3 of 3 | 1 | 2 |
| api/tilequery | yes | 3 of 5 | 1 | 4 |
| api/static-images | yes | 4 of 4 | 0 | 4 |
| api/styles | yes | 4 of 4 | 0 | 3 |
| api/token | listings refused | 1 of 5 | 0 | 5 |

**The count.** 20 of the 21 capabilities on the card were served in full to the public token on a free account. The
21st was served in part: the Tokens API answered, and all four of the account's listings refused the public token.
The style list and the tileset list answered 403 and named the scope they want (`styles:list`, `tilesets:list`). The
dataset list and the token list answered 404 Not Found and named nothing. The Tokens API calls the token valid and
`pk`, and lists no scopes for it.

### The Standard style

- **Light presets and themes switch in place.** Setting each of the four light presets, and then the three themes,
  never reloaded the style (`style.load` fired once). Mean brightness went from 214 at day to 202 at dawn, 70 at dusk
  and 40 at night (0–255). Monochrome's mean saturation is 0.000 against default's 0.129. The themes the style declares are `default`, `faded`, `monochrome` and `custom`.
- **What GL JS hands back.** `getStyle()` returns Standard inside `imports[0].data`, with its schema of 48 settings and
  six featuresets: `poi`, `place-labels`, `buildings`, `landmark-icons`, `indoor-labels`, `water`. Standard itself uses
  the 3.x layer types it advertises: one `building` layer, six `model` layers, one `clip` layer, beside six
  `fill-extrusion` layers.
- **3D buildings.** Over Lower Manhattan the `buildings` featureset returned 853 rendered buildings, the tallest
  417 m. Turning `show3dObjects` off changed the picture (mean pixel difference 21.8), and the featureset still returned
  their footprints.
- **The Interactions API.**
  - A click handler on the `buildings` featureset fired once, with the building under the cursor.
  - `setFeatureState(e.feature, { select: true })` read back as set.
  - At a 45° pitch the building turned blue, from (243, 233, 223) to (82, 148, 234).
  - At pitch 0 the same click set the state and nothing on screen changed (whole-frame difference 0), in each of the three
    runs that measured it.
  - I first thought the pitch, or software WebGL, was the cause (T-006). It was neither (C-007, C-008). The GPU gave the
    same result as SwiftShader. And the pitch-0 click had landed on a different building: the Empire State Building
    (`height` 443.2), which Standard draws as a 3D landmark model. Selected directly, an ordinary building turned 2,430
    pixels blue at pitch 0 and 5,485 at 45. The Empire State Building turned none at either pitch until `show3dLandmarks`
    was off, and then 43,603 (`followups/results/select-same-building.json`).
- **Imports.** A style of my own imported Standard with `lightPreset: 'dusk'` and POI labels off, and put a line
  layer in Standard's `middle` slot; all of it read back. With POI labels off the `poi` featureset still rendered 10
  features, every one a rail or metro stop: those follow `showTransitLabels`.

### 3D and atmosphere

- **Globe.** At zoom 1.5 the projection is a globe without asking. The corners are space: brightness 20 to 102,
  against 233 at the globe's centre. `setProjection('mercator')` fills them with map.
- **Terrain on Standard Satellite.**
  - The style turns terrain on by itself.
  - Its exaggeration is 1 up to zoom 12 and falls to 0 by zoom 13.7, and at zoom 14 `queryTerrainElevation` returns
    null. So at street zoom this style has no terrain to read a height from.
  - From the tilted view at zoom 13 it still answers, and turning terrain off changes the view (mean difference 39).
- **Heights from Mapbox's DEM** (`mapbox-terrain-dem-v1`, exaggeration held at 1, read at zoom 14 looking straight
  down):
  - Crater Lake read 1,884 m (published 1,883) and Lake Geneva 370 m (372).
  - Mont Blanc read 4,792 m (4,806) and Fuji 3,766 m (3,776).
  - The Matterhorn read 3,575 m at its published summit coordinate. The highest point anywhere within 1 km is 4,226 m,
    252 m short of 4,478 m, and 324 m west-south-west of that coordinate.
  - Since the other four came out close, I took the shortfall to be specific to the Matterhorn. It is not (C-009, below).

**C-009: the same DEM on 24 summits.** 12 sharp and 12 broad, named before any was measured, half of each in the Alps.
Coordinates and heights are from Wikidata (`followups/summits.json`). The zoom-14 tiles were read directly, with no
GL JS, taking the highest pixel within 1 km of each coordinate (`followups/dem-summits-tiles.mjs`, 118 tiles).
Pizzo Badile and Dôme du Goûter were left out by the rule set beforehand: their highest pixel lay at the 1 km edge.
Metres below the published height:

| Sharp | Low by | Broad | Low by |
|---|---|---|---|
| Matterhorn | 252 | Mont Blanc | 12 |
| Weisshorn | 82 | Breithorn | 21 |
| Dent Blanche | 104 | Alphubel | 21 |
| Eiger | 9 | Allalinhorn | 29 |
| Grossglockner | 120 | Titlis | 44 |
| Grand Teton (US) | 2 | Mount Rainier (US) | −3 |
| Mount Thielsen (US) | 11 | Mount Whitney (US) | 7 |
| Mount Assiniboine (Canada) | 62 | Mount Elbert (US) | 5 |
| Mount Fitz Roy | 549 | Mount Fuji | 23 |
| Ama Dablam | 148 | Uhuru Peak | 12 |
| Machhapuchhre | 131 | Mount Elbrus | 29 |
| **more than 50 m low** | **8 of 11** (median 104) | **more than 50 m low** | **0 of 11** (median 21) |

- Within the Alps, the same region, 4 of the 5 sharp summits read more than 50 m low and none of the 5 broad ones did.
- The two sharp summits in the US read within 11 m. That fits Mapbox's statement that the DEM "uses multiple data
  sources depending on the zoom level and location", if the US source is finer, but the page names no sources, so it
  is a guess.
- The tile's pixels are 6 to 9.5 m across, so pixel size alone does not explain a 100 m shortfall. The data under the
  tiles is smoother than the pixels.
- GL JS reads the same as the tiles (`followups/dem-summits-gl.mjs`, one map load). At 20 of the 24 summits its
  highest reading within 1 km is within 4 m of the tile's. The other four differ by 6 to 18 m, two higher and two
  lower. At the Matterhorn's coordinate the tile itself gives 3,587 m; GL JS gave 3,575.

**C-030: the same DEM on low-lying US ground** (2026-11-27). 100 random land points in each of six flood-prone places
(New Orleans, Miami Beach, Norfolk, Galveston, Charleston, Sacramento), from a fixed seed and boxes set before any height
was read, redrawn when inside a water polygon of Mapbox's Streets tileset. Each was read from the zoom-14 tile at the
coordinate, bilinear, as Mapbox's MCP elevation tool reads it, and compared with USGS's Elevation Point Query Service,
which answers from its 1 m lidar-derived bare-earth DEM (`followups/dem-lowland.mjs`; 88 tiles, 816 Tilequery requests,
600 USGS requests). The bar, set beforehand, was 90% of points off buildings within 0.5 m in each place. Mapbox's
height minus USGS's:

| Place | Points | Median difference | Within 0.5 m | Within 1 m | Within 0.5 m, median removed |
|---|---|---|---|---|---|
| New Orleans, LA | 71 | +0.26 m | 70% | 97% | 89% |
| Miami Beach, FL | 77 | −0.42 m | 49% | 81% | 69% |
| Norfolk, VA | 86 | −0.22 m | 64% | 84% | 65% |
| Galveston, TX | 76 | +0.25 m | 50% | 89% | 62% |
| Charleston, SC | 75 | −0.28 m | 56% | 85% | 67% |
| Sacramento, CA | 83 | +0.06 m | 35% | 67% | 36% |
| **All six** | **468** | **−0.08 m** | **54%** | **84%** | |

- No place reached the bar, as read or with its median difference removed. New Orleans came closest, 63 of 71 points
  with its median removed, where the bar needed 64. Elsewhere removing the median changed little, so the disagreement
  is mostly scatter, in both directions (92 points more than 0.5 m high, 124 more than 0.5 m low), not a shift.
- Half the points are within 0.47 m, one in ten is more than 1.36 m off, and 16 of the 468 more than 2 m. The largest
  are three neighbouring Charleston points near 32.807° N, 79.926° W: lidar 8 to 10 m, Mapbox 0.2 m. Not looked at.
- Points inside building polygons read like the rest, so the DEM is of the ground, as USGS's is.
- Worked out afterwards: for a flood line at 1, 2 or 3 m, 12%, 14% and 12% of the points fall on the other side of it
  on Mapbox's heights from lidar's. At 1 m, 43 of the 56 are flooded on Mapbox's heights and dry on lidar's; 26 of
  them are in Miami Beach, where Mapbox reads a median 0.42 m low.
- Mapbox's MCP elevation tool and its ground-location tool both read heights through the same code
  (`elevation-tool/terrain.ts` at `ea129dc`), so both would give these heights for these points.
- Not tested here: whether lidar averaged over Mapbox's 7.5 to 8.6 m pixel agrees better (T-029, run as C-031
  below); which zero Mapbox's heights start from here (USGS's is NAVD88; Mapbox's DEM page says its sources use "NAVD
  88, EGM 96, and Ordnance Datum Newlyn" among others, not which where; T-031); and anywhere outside the US (T-030).
  USGS's lidar here was flown between 2013 and 2025, and Mapbox does not say when its source was.

**C-031: the lidar averaged over Mapbox's own pixel** (2026-11-27). For each of C-030's 468 points, USGS's 3DEP
elevation service (`computeStatisticsHistograms`) gave the lidar's mean, minimum and maximum over a square one Mapbox
pixel across (7.5 to 8.6 m) and one three pixels across (about 25 m), at the lidar's own spacing of about 0.9 m
(`followups/dem-lowland-pixel.mjs`; 936 requests, no Mapbox requests). Share within 0.5 m of Mapbox's height:

| Place | Lidar at the point (C-030) | Over one pixel | Over three pixels |
|---|---|---|---|
| New Orleans, LA | 70% | 72% | 70% |
| Miami Beach, FL | 49% | 51% | 51% |
| Norfolk, VA | 64% | 63% | 64% |
| Galveston, TX | 50% | 53% | 55% |
| Charleston, SC | 56% | 55% | 56% |
| Sacramento, CA | 35% | 36% | 40% |
| **All six, 468 points** | **54%** | **54%** | **56%** |

- Of the 216 points more than 0.5 m off at the point, 206 still were over one pixel and 195 over three. So C-030's
  scatter is not lidar detail that an 8 m pixel averages away: the heights are off at their own scale, up to 25 m.
- On flat ground, where the lidar spans under 0.25 m across the 25 m square, 12 of 21 points are still more than 0.5 m
  off (10 of 19 without Charleston's two). All five flat Norfolk points read low, by 0.27 to 0.62 m.
- Not tested here: a Mapbox source smoother than 25 m (T-032, run as C-034 below), and why the heights are off.

**C-032: the same in the Netherlands, against AHN** (2026-11-28). C-030 and C-031 again in six low-lying Dutch places
(Rotterdam, Amsterdam, Almere, Dordrecht, Middelburg, Zwolle), 100 land points each, against AHN4's 0.5 m bare-ground
lidar DEM (heights in NAP) from Esri Nederland's keyless image server (`followups/dem-lowland-nl.mjs`). Every AHN request
went in RD New coordinates converted here: the server's statistics for a square sent in GPS coordinates came from a
different place than its point sample. For 36 points the server's own GPS conversion for point samples matched mine
to within 5 cm at 35.

| Place | Points | AHN, median | Mapbox minus AHN, median | Within 0.5 m | Within 1 m | Within 0.5 m over one pixel |
|---|---|---|---|---|---|---|
| Rotterdam | 78 | −1.63 m | +2.01 m | 12% | 26% | 14% |
| Amsterdam | 64 | +0.63 m | +2.89 m | 13% | 17% | 13% |
| Almere | 77 | −3.60 m | −0.07 m | 30% | 43% | 31% |
| Dordrecht | 76 | −0.28 m | +0.90 m | 12% | 33% | 8% |
| Middelburg | 82 | −0.23 m | 0.00 m | 40% | 55% | 40% |
| Zwolle | 66 | +1.54 m | +0.10 m | 30% | 50% | 32% |
| **All six** | **443** | | **+0.69 m** | **23%** | **38%** | **23%** |

- 86 points are more than 3 m off, 77 of them with Mapbox higher; in Amsterdam one in ten is more than 8.6 m off.
  Removing each place's median leaves 9% to 40% within 0.5 m, and over three pixels (17.6 m) the share is 22%.
- Mapbox reads the polders' depth: Almere's ground is a median 3.6 m below NAP, and Mapbox's median difference is −0.07 m.
- AHN refuses a point sample where its 0.5 m cell at the point has no ground height (5 to 12 points a place); each
  refusal was checked against that cell before being counted as dropped.
- The errors are largest in the two densest cities and mostly upward. Whether that is buildings and trees in Mapbox's
  source was tested in C-039, below: in part, and not on open ground.

**C-033: is the US shift a different zero?** (2026-11-28). For each of C-030's six places, how much higher than USGS
Mapbox would read if its source were on EGM 96 or EGM 2008 instead of NAVD 88, against the place's median from C-031
and its 95% range from 2,000 resamplings (`followups/dem-datum-us.mjs`). VDatum answered for New Orleans, Miami Beach
and Charleston. For Norfolk, Galveston and Sacramento the offsets were built from GEOID18 (NGS's geoid API), EGM 96 and
EGM 2008 (GeographicLib's GeoidEval) and the NAD 83 to WGS 84 ellipsoid shift from the nearest point VDatum answers;
built the same way, the other three agreed with VDatum within 0.025 m.

| Place | Median (95% range) | EGM 96 | EGM 2008 | Fits |
|---|---|---|---|---|
| New Orleans, LA | +0.25 (+0.16 to +0.34) | −0.18 | −0.01 | none |
| Miami Beach, FL | −0.44 (−0.59 to −0.33) | +0.68 | +0.09 | none |
| Norfolk, VA | −0.22 (−0.38 to −0.12) | +0.07 | −0.32 | EGM 2008 |
| Galveston, TX | +0.22 (+0.13 to +0.36) | −0.11 | −0.17 | none |
| Charleston, SC | −0.26 (−0.40 to −0.11) | +0.09 | −0.25 | EGM 2008 |
| Sacramento, CA | +0.09 (−0.21 to +0.33) | −0.53 | −0.79 | NAVD 88 (0) |

- No zero fits four places, so the shifts are not a difference of zero; in three places none of the three fits. And
  C-030 had already removed each place's whole median, the most a change of zero could do, and that left 36% to 89%
  within 0.5 m.

**C-034: the lidar averaged over 50 m and 100 m** (2026-11-28). The same 468 US points, with USGS's lidar averaged over
squares 50 m and 100 m across (`followups/dem-lowland-wide.mjs`, 936 requests). Share within 0.5 m of Mapbox's height:

| Place | Point | 8 m | 25 m | 50 m | 100 m |
|---|---|---|---|---|---|
| New Orleans, LA | 70% | 72% | 70% | 66% | 68% |
| Miami Beach, FL | 49% | 51% | 51% | 51% | 53% |
| Norfolk, VA | 64% | 63% | 64% | 69% | 71% |
| Galveston, TX | 50% | 53% | 55% | 67% | 64% |
| Charleston, SC | 56% | 55% | 56% | 60% | 63% |
| Sacramento, CA | 35% | 36% | 40% | 45% | 45% |
| **All six** | **54%** | **54%** | **56%** | **59%** | **60%** |

- No place reaches 90% at any scale, so resolution does not explain C-030's errors up to 100 m. Within 1 m the share
  goes from 84% to 87%.

**C-036: Mapbox's geocoder on official city addresses** (2026-11-28). 500 random addresses from each of New Orleans'
"Site Address Point" list (268,821) and New York's "AddressPoint" list (967,871), sent to Geocoding v6 forward as one
line each, first result only (`followups/geocode-addresses.mjs`). Temporary geocoding, so each result was compared in
memory and dropped; only counts were kept.

| City | Within 10 m | 10 to 50 m | 50 to 100 m | 100 to 500 m | Beyond 500 m | No result |
|---|---|---|---|---|---|---|
| New Orleans | 398 | 85 | 8 | 8 | 0 | 1 |
| New York | 473 | 23 | 1 | 0 | 2 | 1 |

- 97% and 99% within 50 m, against the 90% bar. The 16 New Orleans addresses beyond 50 m all came back with "high"
  confidence; New York's 3 came back "low".

**C-038: the same in England, against the Environment Agency's lidar** (2026-11-28). Six low-lying places, 100 land
points each, against the 1 m lidar DTM (heights in Ordnance Datum Newlyn) by WCS, converted to the British National
Grid with OSTN15 (`tools/osgb.py`, pyproj in `.venv`; `followups/dem-lowland-england.mjs`). Four requests at a time
drew a 429 after about 60, so the run sent one a second.

| Place | Points | Lidar, median | Mapbox minus lidar, median | Within 0.5 m | Within 1 m |
|---|---|---|---|---|---|
| Hull | 83 | 2.28 m | +0.51 m | 30% | 52% |
| Boston | 92 | 2.54 m | +2.69 m | 7% | 13% |
| Bridgwater | 86 | 6.95 m | +1.27 m | 16% | 34% |
| Great Yarmouth | 82 | 2.08 m | −1.23 m | 20% | 34% |
| Canvey Island | 87 | 1.87 m | +0.94 m | 16% | 39% |
| York | 77 | 13.20 m | +1.80 m | 10% | 23% |
| **All six** | **507** | | **+1.07 m** | **16%** | **32%** |

- 88 points are more than 3 m off, 75 of them with Mapbox higher. Over one pixel 17%, over three 16%, and with each
  place's median removed 17% to 33%. Ordnance Datum Newlyn, a zero Mapbox names, did not help.
- For 20 points the lidar cell requested on its own matched the cell read from the 17 m square within 0.03 m at 17
  and 0.14 m at 3, so the squares were read the right way up.

**C-039: C-032's points against AHN's surface model** (2026-11-28). C-032's sample drawn again from the same seed
(the same 490 points off buildings, and 110 inside Mapbox's buildings that C-032 left out), with AHN4's surface model
(`AHN4_DSM_50cm`, buildings and trees in) and ground model averaged over squares one and three Mapbox pixels across.
Cover is the surface's mean minus the ground's (`followups/dem-surface-nl.mjs`).

| Points | n | Cover, median | Mapbox above the ground, median | Within 0.5 m of the ground |
|---|---|---|---|---|
| Inside Mapbox's buildings | 101 | 7.2 m (roof above the ground) | +1.47 m | 25% |
| Off buildings, 1 m or more of cover | 148 | 3.0 m | +1.38 m | 21% |
| Off buildings, open (under 0.25 m) | 214 | 0.0 m | +0.03 m | 24% |
| All off buildings | 443 | 0.3 m | +0.68 m | 23% |

- Within each place, Mapbox's height above the ground rises 0.31 m per metre of cover over 17.6 m (Theil–Sen, 95%
  range 0.22 to 0.40, 544 points): 0.43 off buildings and 0.17 inside them. The bars set beforehand were 0.5 for a
  surface model and 0.1 for bare ground.
- Mapbox does not show roofs: inside buildings it reads a fifth of the roof's height above the ground, and at 72 of
  101 points more than 3 m below the roof.
- On open ground Mapbox has no lean (median +0.03 m) but is within 0.5 m at 24% and within 1 m at 40%, with 35 of 214
  more than 3 m off. Buildings and trees are part of C-032's upward lean, not why most points miss.

**C-040: AHN's surface averaged over 30, 100 and 250 m** (2026-11-28). C-039's 544 points against the mean of AHN4's
surface and ground models over squares 30, 100 and 250 m across, beside C-039's 5.9 and 17.6 m
(`followups/dem-smooth-nl.mjs`). No Mapbox requests.

| Square | Within 0.5 m of the surface | Within 0.5 m of the ground | Mapbox minus surface, median | Mapbox minus ground, median |
|---|---|---|---|---|
| 5.9 m | 15% | 25% (501 points) | −0.86 m | +0.59 m |
| 17.6 m | 15% | 23% | −1.08 m | +0.83 m |
| 30 m | 18% | 21% | −1.12 m | +0.87 m |
| 100 m | 15% | 21% | −1.60 m | +0.89 m |
| 250 m | 12% | 21% | −1.63 m | +0.96 m |

- No size reaches the 33% set beforehand for "closer", let alone 90%, and the ground does better than the surface at
  every size. Mapbox lies between the two, nearer the surface in Rotterdam and Amsterdam and nearer the ground in
  Almere, Middelburg and Zwolle, and within 0.5 m of either at fewer than two points in five in every place.
- At six Amsterdam building points the server reported every cell of squares 17.6 m and up as holding a ground height,
  though the ground model is empty over one pixel there; the means read as ground, so they are used, and the counts
  are not quoted.

- **A glTF model.** A 30 × 30 × 90 m box written here as glTF (Y up), added with `addModel` and a `model` layer,
  stood upright and red in Praça do Comércio. The picture changed by 19.6 near it and by 0 elsewhere.
- **Clip.** A `clip` layer over one Lower Manhattan block cut the rendered buildings in that block's screen box from
  74 to 22, and with `'symbol'` in `clip-layer-types` the labels from 6 to 3. Nothing below or beside it changed.
- **Snow and rain** (experimental).
  - Both draw and both move: snow whitened 0.27% of the pixels, and rain changed the frame by 6.4 on average.
  - While either falls, the map never fires `idle` within 5 s.
  - So a page, or a test harness, that waits for `idle` has to start them afterwards.
- **Wind particles.** A `raster-particle` layer on Mapbox's `rasterarrayexamples.gfs-winds` tileset (layer `10winds`)
  was served to the public token, as HTTP 200 and 206 range responses, and animated. Unlike snow, the map still fired
  `idle` within 5 s with the particles running.

### Web services

- **Isochrone.** The 10, 20 and 30 minute driving areas around Denver's Union Station came back nested, at 37, 478
  and 1,667 km², each containing the start.
- **Matrix.** A full 4 × 4 table of driving times across San Francisco, zero on the diagonal. Ferry Building to Coit
  Tower takes 11.9 min and the way back 15.0.
- **Optimization.** Seven Lisbon stops in a deliberately zig-zag order: the optimised round trip is 26.7 km and 73 min,
  against 51.2 km and 165 min in the order given.
- **Map Matching.**
  - The trace was 57 points taken every 60 m along a Directions route through Chicago, each moved up to 20 m (95% of
    them ended within 16.4 m of the route).
  - It came back as one matching with confidence 0.95.
  - 95% of the matched line lies on the route (0.0 m), the furthest point is 10.9 m off, and its length is 6,749 m
    against the route's 6,763.
- **Search Box, category.** `category/cafe` inside a box over Melbourne's centre returned 25 places, all inside the
  box. 24 list `cafe` among their categories. The 25th, Bench Coffee Company, lists `coffee`, `food` and
  `food_and_drink`.
- **Search Box, suggest and retrieve.** In one session `/suggest` put the Rijksmuseum first with no coordinates on any
  suggestion, and `/retrieve` placed it 4 m from its published location.
- **Tilequery.**
  - Within 100 m of the Eiffel Tower, Mapbox Streets returned features from six layers, among them a `poi_label` named
    "Tour Eiffel 3e étage", 15 m away.
  - The summit contours were wrong in a way that matters for anyone reading heights from them. One query returns at
    most 50 contours (asking for 100 is refused: "options.limit must be a number between 1 and 50"), and they are 10 m
    apart.
  - At Mont Blanc the 50 that came back ran from 2,780 to 3,270 m, and at the Matterhorn from 2,270 to 2,760 m.
  - So the highest contour returned says nothing about the summit. Mapbox's MCP server has an elevation tool; whether
    it reads contours this way is T-008.
- **Static Images, Static Tiles, Raster Tiles.** All four images came back at the size asked: Standard at 1200 × 800,
  Streets with a pin and an encoded path framed automatically, a 512 px static tile at 1024 × 1024, and a satellite
  tile at 512 × 512. Standard works in the Static Images API.
- **Styles API.** Mapbox's Standard style comes back as 307 kB of JSON with a schema of 48 settings: 22 colours,
  16 switches, 6 strings, 3 numbers and 1 with no type. Standard Satellite has 23, one of them
  (`showRoadsAndTransit`) not in Standard. The classic Streets v12 has no schema. The names, types, defaults and allowed
  values are in `api/results/styles.json`, without Mapbox's descriptions.

### What I got wrong on first runs

These were mistakes in my pages or my measures. Mapbox served every one of these requests correctly. I wrote the
pages after reading the inventory, so none of this is evidence for T-004.

1. `standard/interactions` measured the colour under the Empire State Building's label icon, which is drawn over the
   building, so the change was hidden.
2. `standard/imports` expected the `poi` featureset to be empty with POI labels off, but transit stops stay.
3. `3d/terrain` set terrain on the style's `mapbox-dem` source from the root style, which threw "source not found":
   that source belongs to the import.
4. `3d/clip` used a pixel threshold inside the block's footprint (it gave 7.3, against 15). Buildings in front cover
   most of the block, so the measure became the rendered-building count.
5. `3d/precipitation` asked snow to change the whole frame's mean by 5 (it gave 2.2), which sparse flakes cannot do.
   The measure became the share of pixels turned white.
6. `data/raster-particle` required HTTP 200 and got 200 and 206.
7. `api/tilequery` left `/tilequery/` out of the URL and got three 404s.
8. `3d/model` asked for a mean difference over 20 near the model, and the same page gave 21.4 on one run and 19.6 on
   the next.

Six facts were restated after a first run showed what to measure: interactions (split into pitch 0 and pitch 45),
imports (transit stops), clip, snow, model, and the wind tiles' status. A fact restated after seeing the data is
weaker evidence than one stated before. Each script says what its first version asked.

### Limits

- One final run of each, on one machine, in headless Chromium with software WebGL (SwiftShader). Facts about what is
  drawn, such as the pitch-0 selection and how visible snow is, may differ on a GPU.
- The facts and thresholds are mine, with the six restated ones listed above.
- Nothing here checks billing. The account page was not read, so what each run cost against the free tier is
  inferred from the pricing page's units, not observed.
- The Tokens API listed no scopes for the token, so which scopes a default public token carries is not confirmed here.
  Only the two scope names in the 403 messages are.

**Use.** The final run used 19 map loads and 25 web-service requests (one Search Box session). Fixing my own pages
and probing cost roughly 40 more map loads and 35 more requests; I counted those from the session rather than metering
them. The free tiers are 50,000 map loads and 2,500 to 100,000 requests a month.

## C-003: the MCP server's tool schemas against Mapbox's API reference (2026-11-25)

Four scripts in `experiments/mcp/`, run in this order:
- `tool_schemas.mjs` turns the input schemas of the 16 web-service tools in github.com/mapbox/mcp-server (commit
  `ea129dc`, v0.18.1) into JSON Schema. It imports only the schema files, against the zod version the server pins, and
  never starts the server (`results/tool-schemas.json`).
- `compare.mjs` holds a map of which endpoint each tool's requests go to and how each input gets there, read from the
  tools' code (each entry names its file and lines). It compares that with the parameter tables of those endpoints on
  docs.mapbox.com/api, read on 2026-11-25 by `docs_params.py` (`results/compare.json`).
- `settle.mjs` sends one read-only request for each disagreement the API can decide (`results/settle.json`).

The docs pages stay in the git-ignored `.cache/mcp-docs/`; the results keep parameter names, types and constraints,
not Mapbox's descriptions.

**The count.** For the endpoints the 16 tools call, Mapbox documents 240 parameters, leaving out the access token.
- **101 (42%)** are exposed: an agent can set them through a tool.
- **19** are fixed: the tool always sends the same value or one it works out itself.
- **120** are never sent.

Counting only the 11 tools that wrap a single endpoint, on their main call, it is 82 of 166 (49%).

| Tool | Endpoint section on docs.mapbox.com | Documented | Exposed | Fixed | Never sent |
|---|---|---|---|---|---|
| isochrone | Isochrone: retrieve isochrones | 10 | 10 | 0 | 0 |
| reverse-geocode | Geocoding v6: reverse | 8 | 8 | 0 | 0 |
| category-list | Search Box: list categories | 1 | 1 | 0 | 0 |
| place-details | Places: retrieve a single place | 1 | 1 | 0 | 0 |
| place-details (fallback) | Details: retrieve POI details | 4 | 4 | 0 | 0 |
| matrix | Matrix | 9 | 7 | 0 | 2 |
| optimization | Optimization v1 | 14 | 10 | 0 | 4 |
| search-and-geocode | Search Box: text search | 25 | 11 | 1 | 13 |
| static-map-image | Static Images | 21 | 9 | 0 | 12 |
| category-search | Search Box: category search | 19 | 7 | 0 | 12 |
| map-matching | Map Matching | 22 | 7 | 0 | 15 |
| directions | Directions | 36 | 11 | 2 | 23 |
| ground-location | geocoding, category search and isochrone, combined | 37 | 10 | 3 | 24 |
| feedback | Feedback: list (duplicate check) and create | 22 | 5 | 6 | 11 |
| list-public-tokens | Tokens: list | 6 | 0 | 3 | 3 |
| elevation | Raster Tiles (DEM tiles) | 5 | 0 | 4 | 1 |
| report | `POST /user-feedback/v1/cli-feedback` | not in the API reference | | | |

**What the tools leave out.** Isochrone and reverse geocoding are covered completely. The rest leave out most of what
their endpoints offer:
- **Directions** sends no `language` (so turn instructions come only in the default language), no `bearings`,
  `radiuses`, `approaches`, `waypoints` or `continue_straight`, and none of the voice or banner instructions. It always
  sends `steps=true` and its own `annotations`. The 29 electric-vehicle parameters on the same page are not counted
  above; counted, Directions exposes 11 of 65.
- **Static Images** cannot set a `bearing` or `pitch`, frame a bounding box or `auto`, add `padding`, or hide the logo.
- **Search Box text search** always asks for 10 results, and cannot filter by `open_now`, `minimum_rating` or
  `price_levels`, or search along a `route`.
- **Map Matching** has no `tidy`, `steps`, `language` or `waypoints`.

Two tools have inputs that do not do what their names suggest:
- `place-details` sends `language`, `worldview` and `attribute_sets` only to its fallback, the older Details API. Its
  first request, to the Places API, carries the ID alone.
- `list-public-tokens` asks for 100 tokens and never pages, so an account with more gets the first 100.

**Where the tools and the docs disagree.**
- Heuristics in `compare.mjs` raised 31 flags. I read each against the docs and the tool's code:
  - **17 dismissed.** Coordinate ranges the docs do not bother to state; value lists the heuristic misread; Isochrone's
    "one of `contours_minutes` or `contours_meters`" rule, which the tool enforces in code; `ground-location` calling
    category search only when given a query; Directions' `geometries: 'none'`, which means "send nothing".
  - **6 not settled.** They concern the Feedback API, and settling them would mean sending Mapbox feedback.
  - **8 settled.** One request each:
- **The tool was right, the docs wrong (2).**
  - Search Box: the docs say a query may be 256 characters; the tool caps it at 200, and its description says the API
    refuses more. The API answered 400 "Query exceeded character limit of 200" at both 201 and 256 characters.
  - Static Images: the docs list `overlay` as required; the API returned an image without one.
- **The docs were right, the tool's schema too narrow (6).**
  - Reverse geocoding accepts `types=street`, missing from the tool's list.
  - It accepts `worldview=ma`. The tool offers 4 of the docs' 9 worldviews. At the same point in Western Sahara,
    `worldview=ma` returned "Morocco" and `worldview=us` "Western Sahara".
  - Directions accepts `geometries=polyline6` and `overview=false`, which the tool cannot send.
  - Map Matching returns `maxspeed` and `congestion_numeric` annotations, which the tool leaves out.
  - Isochrone answers without `generalize`, which the tool requires.

**Two things read from the code that bear on other threads:**
- The elevation tool does not use Tilequery. It decodes `mapbox.mapbox-terrain-dem-v1` tiles (`.pngraw`) at zoom 14,
  or lower when a path needs more than 48 tiles. So the 50-contour limit from C-002 cannot affect it (T-008 asked
  whether it would). It reads the same DEM, at the same zoom, that `3d/terrain-heights` found low on the Matterhorn,
  and C-009 found low on most sharp summits outside the US (T-007).
- **C-010 called it.** I ran the server from source at that commit and called `elevation_tool` once with C-009's 24
  summit coordinates (`followups/mcp-elevation.mjs`). npm's latest release, 0.18.1 (2026-11-17), has no elevation tool;
  it arrived in the source afterwards.
  - Every answer was within 0.5 m of C-009's own read of the tiles at the same coordinate, so the code reading was
    right.
  - For the Matterhorn it answered 3,587 m, 890 m below the published 4,477.5 m. Fitz Roy came back 914 m low and
    Machhapuchhre 534 m low. 11 of the 24 came back more than 50 m low, two of them broad (Titlis, Elbrus).
  - These are larger than C-009's shortfalls because the tool reads the one point it is given, not the highest point
    nearby. A coordinate a little off a sharp summit lands on its slope.
  - Its text calls the numbers "Ground elevation" and gives no warning. Its schema describes `points` as "places to get
    the ground elevation of, e.g. a summit, a town or a campsite".
- `list-public-tokens` calls `GET /tokens/v2/{username}`. In C-002 that answered 404 to this account's public token,
  so with a public token the tool probably cannot list anything. That is untested.

### Limits

- The docs were read once, and only their parameter tables. A parameter described only in prose, or on another page,
  is not counted.
- The map from tool inputs to API parameters is my reading of the code at one commit.
- The constraint comparison is heuristic. Every flag it raised was reviewed by hand, but where it raised none, I did
  not check the agreement one by one. A tool's maximum matching some number elsewhere in the description would pass
  unnoticed.
- One request settled each claim, with no repeat.

**Use.** 14 docs pages, no account involved. 22 web-service requests (the settling run twice, once before the two
deliberate 400s were marked as such), all read-only. No map loads.

## C-011: the API reference's stated limits, sent at and past each (2026-11-25)

`node tools/api-docs.mjs` reads the parameter tables of all 25 reference pages in docs.mapbox.com/api's sitemap: 103
endpoints and 619 parameters. A scan of their descriptions found 86 sentences stating a numeric limit, most naming
both ends of a range.

`followups/docs-limits.mjs` sent 104 limits, one request at each and one just past it (209 requests). The rest of the 86
sentences were left out by the card's rules: secret token, writes, session billing, or the paid batch endpoint
(`followups/results/docs-limits.json`, `left_out`). The four EV Charge Finder limits answered 401 to this token, so 100
were tested.

| | Limits | |
|---|---|---|
| The API agrees with the docs | 77 | refuses just past the limit, accepts at it |
| **The API is stricter than the docs** | **2** | refuses a value the docs allow |
| The API is looser than the docs | 21 | accepts a value past the stated limit |

**The two where the API is stricter.**
- Search Box `/forward`'s `q`: the docs say 256 characters, the API says "Query exceeded character limit of 200". This
  is C-003's finding again.
- Map Matching's `radiuses`: the docs say "between 0.0 and 50.00", and the API refuses 0 ("must be … greater than 0").

**The 21 where it is looser.** None of them would break code written to the docs.
- 10 of the 21 are on Directions' EV routing. Its minimum charges and minimum energy increment accept more than
  `ev_max_charge`. The pre-conditioning time accepts 241 minutes. The three ID lists accept one more ID than their
  stated maximum, and a station's power accepts 999 W.
- 6 of the 21 are geocoding (v5 and v6), which accepted 21 words and `limit` one past its maximum. Whether the extra
  result came back was not checked.
- The other 5:
  - Static Images accepted a bearing of 361 and of −1.
  - Directions and Map Matching accepted 501 characters of `waypoint_names`.
  - Map Matching accepted a radius of 50.1.

**The API's own messages are not always right either.**
- Search Box's error says "Radius must be in range [0.0001,10]", but the API accepted 0.00001, the docs' minimum.
- Directions refused a bearing of 361 with "Number of bearing elements must match number of coordinates provided".

**What this does and does not show.**
- When code respects a numeric limit the API reference states, the API refused it in 2 of 100 tested limits.
- C-003's 2 in 8 came from a sample chosen because the docs and the tools disagreed, so it was not a fair rate.
- This covers numeric limits only: not allowed values, required parameters or types. C-003's other docs error, a
  Static Images overlay the docs call required, is of the kind not covered.
- It covers only what a public token reaches with GET requests: none of the account APIs and nothing that writes.
