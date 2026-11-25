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
  - Standard's own layers do read `select`, so I don't know why. It might be specific to software WebGL (T-006).
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
  - Since the other four came out close, the shortfall is specific to the Matterhorn in this DEM, not to the method.
    Why it is low is not known (T-007).
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
  whether it would). It reads the same DEM, at the same zoom, that `3d/terrain-heights` found low on the Matterhorn
  (T-007).
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
