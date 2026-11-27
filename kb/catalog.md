# What Mapbox offers

Read on 2026-11-24. Prices and free tiers are from https://www.mapbox.com/pricing and the purposes are from
https://docs.mapbox.com/api/overview/ on that date `[doc]`. Library facts are read from the packages
installed here `[inv]`. Agent tooling is read from Mapbox's public repositories at their HEAD on that date.

## Web services: what each costs past the free tier

Every request needs an access token. A public (`pk.`) token on a free account was enough for every service whose last
column says where it ran: C-002's experiments (`[exp: …]`, under `experiments/`) and C-001's tasks (`evals/`). Free
amounts are per month; prices are USD per 1,000 units for the first paid tier.

| Area | API | What it does | Unit | Free / month | Then | Run here |
|---|---|---|---|---|---|---|
| Maps | GL JS map loads | one `new mapboxgl.Map()`; includes its vector and raster tile requests | map load | 50,000 | $5.00 | every map experiment and C-001's tasks |
| Maps | Vector Tiles | vector tiles from Mapbox-hosted tilesets, outside GL JS | tile request | 200,000 | $0.25 | only inside GL JS map loads, not called directly |
| Maps | Raster Tiles | satellite and raster tilesets, outside GL JS | tile request | 750,000 | $0.25 | `[exp: api/static-images]` (satellite tile) |
| Maps | Static Tiles | raster tiles rendered from a style | tile request | 200,000 | $0.50 | `[exp: api/static-images]` |
| Maps | Static Images | a PNG of a map from a URL, no library | request | 50,000 | $1.00 | `[exp: api/static-images]`, Standard included |
| Maps | Tilequery | features in a tileset near a point | request | 100,000 | $1.50 | `[exp: api/tilequery]`: at most 50 features a query, so summit contours fall short |
| Maps | Custom tilesets (MTS, Uploads) | processing and hosting your own data | MB, CU, hosting day | 10,000 MB, 20 CU, 750 days, 25 tilesets | per unit | not run (it writes to the account) |
| Navigation | Directions | routes with traffic, up to 25 points | request | 100,000 | $2.00 | C-001 task 9; `[exp: api/optimization]`, `[exp: api/map-matching]` |
| Navigation | Matrix | travel times between many points | matrix element | 100,000 | $2.00 | `[exp: api/matrix]` |
| Navigation | Optimization | best order for a set of stops | request | 100,000 | $2.00 | `[exp: api/optimization]` (v1) |
| Navigation | Isochrone | area reachable within a time or distance | request | 100,000 | $2.00 | `[exp: api/isochrone]` |
| Navigation | Map Matching | snap a GPS trace to roads | request | 100,000 | $2.00 | `[exp: api/map-matching]` |
| Search | Geocoding (temporary) | address and place lookup, forward and reverse, results not stored | request | 100,000 | $0.75 | C-001 task 10 (v6 forward) |
| Search | Geocoding (permanent) | the same, with the right to store results | request | none | $5.00 | not run |
| Search | Search Box, requests | `/category` and `/reverse` | request | 25,000 | $1.70 | `[exp: api/search-box-category]` (`/category`; `/reverse` not run) |
| Search | Search Box, sessions | type-ahead: up to 50 `/suggest` and one `/retrieve` | session | 2,500 | $11.50 | `[exp: api/search-box-suggest]` |
| Search | Address Autofill | address form autofill | session | 1,000 | $12.50 | not run |
| Mobile | Maps SDK iOS / Android | native maps | monthly active user | 25,000 | $4.00 per MAU tier | not run |
| Mobile | Navigation SDK v3 | turn-by-turn in an app | MAU and trips | 100 MAU, 1,000 trips | $0.30 per MAU | not run |

Listed without a price: Styles, Fonts, Datasets, Tokens APIs (no charge shown); Boundaries, Traffic and Movement data,
Atlas (contact sales). A public token reads Mapbox's own styles through the Styles API `[exp: api/styles]` and gets a
token check from the Tokens API, but the account's own listings refuse it: styles and tilesets with 403 naming
`styles:list` and `tilesets:list`, datasets and tokens with 404 `[exp: api/token]`. Not stated on the pages read: whether a card is needed to sign up, and whether use past the free
tier is billed or blocked.

## Libraries

| | Version here | Licence |
|---|---|---|
| `mapbox-gl` (GL JS) | 3.35.2, published 2026-11-20 | Mapbox TOS: use only with an active Mapbox account; the SDK sends de-identified usage data |
| `@mapbox/mapbox-gl-style-spec` | 14.35.2 | same |

Also offered, not installed here: Maps SDK for iOS, Android, Flutter and Unity; Navigation SDK; Search JS and the mobile
Search SDKs; Mapbox Studio (style editor, web); Data Workbench; web-service clients for Python, Java, JavaScript, Ruby
and Swift.

## What GL JS 3.35.2 says about itself `[inv]`

Made by `node tools/inventory.mjs`; searched with `node tools/kb.mjs`.

| | Count |
|---|---|
| Layer types | 16: fill, line, symbol, circle, heatmap, fill-extrusion, building, raster, raster-particle, hillshade, model, background, sky, slot, placement-group, clip |
| Paint properties | 186 |
| Layout properties | 90 |
| Source types | 8: vector, raster, raster-dem, raster-array, geojson, video, image, model |
| Expressions | 98 |
| Style root keys | 28, including `imports`, `schema`, `slots`, `featuresets`, `lights`, `terrain`, `fog`, `snow`, `rain`, `projection`, `camera`, `colorTheme` |
| Map methods | 152, own and inherited from Camera and Evented |
| Map constructor options | 64, 57 with a documented default |
| Map events | 59 |
| Other exported classes | 29 (Marker, Popup, controls, sources, events) |

How much is new since v3: of the 272 style properties that record which GL JS version added them, **131 arrived in 3.x**.
They are mostly on 3D buildings (`building` 26, `fill-extrusion` 22), 3D models (20), lines (15), symbols (14) and raster
(11 + 9 for `raster-particle`). New layer types in 3.x: `model` (3.0.0), `slot` (3.0.0), `raster-particle` (3.3.0),
`clip` (3.5.0); `building` and `placement-group` record no GL JS version. New expressions: `config`, `measure-light`,
`distance`, `split`, `to-hsla`, `worldview`, `raster-value`, `raster-particle-speed`, `is-active-floor`, `random`,
`at-interpolated`. 46 properties are marked experimental. 4 are not supported in GL JS at all.

Not in the library: the settings of Mapbox's default Standard style (`lightPreset`, `theme`, which labels to show).
They are declared in the style's own `schema`, served by the Styles API, so reading them needs a token. Standard
declares 48 (22 colours, 16 switches, 6 strings, 3 numbers, 1 untyped) and Standard Satellite 23; their names, types,
defaults and allowed values are in `experiments/api/results/styles.json` `[exp: api/styles]`. In a running map they
are also in `map.getStyle().imports[0].data.schema`. `node tools/kb.mjs config` lists them (`tools/inventory.mjs` fetches
them when a token is in `.env`).

A model with no help named 44 of the 48 right (`evals/results.md`, C-004). It invented names for `showHdRoads`,
`colorHdRoads` and `colorMix3dLandmarks`. **GL JS ignores an unknown setting name without a warning**, so a wrong name
shows up only as nothing changing; `getConfigProperty` afterwards catches it. Asked three more times each (C-012),
the model got those three right 3 times in 9 without help, and 8 times in 9 when told in one sentence to search
`map.getSchema('basemap')` by each entry's `metadata['mapbox:title']` and read the value back. On the other 45 (C-021)
that sentence made every answer a search; none picked a wrong setting. C-004's check reads one value per setting, and
it missed two right answers in C-021 and none in C-004 or C-012 (C-023).

Run here `[exp: experiments/standard, 3d, data]`: light presets, themes, 3D buildings, the Interactions API, style
imports, globe, terrain, a glTF `model` layer, `clip`, snow and rain, and `raster-particle`. Three things in them
an agent could trip on:
- `mapbox-terrain-dem-v1` reads sharp summits low: 8 of 11 by more than 50 m (median 104 m; the Matterhorn 252, Fitz
  Roy 549), but the two sharp US summits within 11 m. Broad summits read a median 21 m low (C-009). GL JS reads the
  same as the tiles. Do not quote a summit's height from it.
- Standard Satellite's terrain fades to nothing between zoom 12 and 13.7, and above that `queryTerrainElevation`
  returns null.
- Snow and rain keep the map from ever firing `idle`; wind particles do not.
- A landmark Standard draws as a 3D model (the Empire State Building) is in the `buildings` featureset, and its `select`
  state reads back, but nothing on screen changes until `show3dLandmarks` is off. Ordinary buildings turn the select
  colour at pitch 0 and at 45 (C-008).
- The style spec marks the procedural `building` layer type `"private": true`. GL JS evaluates its `building-color`
  once per part, with `building-part` set to `roof`, `wall`, `window` or `door`.
- A `clip` layer removes every procedural `building` layer drawn before it, a page's own included, whatever its
  `clip-layer-scope` and `clip-layer-types`; one drawn after the clip is kept. The spec says the `basemap` scope limits a
  clip to Standard's layers. In GL JS 3.35.2's code the building bucket checks only the drawing order, and only the
  model bucket applies the scope. Eight loads of one page came out as the code predicts, and a fill-extrusion over the
  page's own GeoJSON was not removed (C-018, `evals/clip_order_test.mjs`; first seen in C-016). The removed buildings
  are still returned by `queryRenderedFeatures`.

With no help, the model got ten blind tasks on these areas right (C-005, `evals/results.md`). It knew seven; for the
model colour mix, `clip` and the procedural building's colours it downloaded GL JS's own code and read it. With no
network (C-013, C-014) it wrote the colour mix and `clip` from memory. The building came out right 1 time in 4. Three
times it doubted that GL JS 3.35.2 has a building layer and drew the roofs in its own WebGL layer. The one time it used
the layer, from memory, it was right. Told that the layer exists (C-015), it used it 3 times in 3 and was right twice; the miss
coloured by `building_part`, which GL JS does not set, instead of `building-part`. With `building-part` named too (C-016), all three coloured
right, and the one miss was a `clip` layer that removed its own buildings.

## Agent tooling Mapbox publishes

- **MCP server**, github.com/mapbox/mcp-server (MIT), 35 tool folders at HEAD (the 2026-11-10 blog said 33). 16 call
  Mapbox web APIs: search and geocode, reverse geocode, category search and list, place details, location grounding,
  directions, matrix, optimization, isochrone, map matching, elevation, static map image, list public tokens, feedback,
  report. The other 19 run without calling an API: area, bearing, bounding box, buffer, centroid, convex hull,
  destination, difference, distance, intersect, length, midpoint, nearest point, nearest point on line, points within
  polygon, simplify, union, render map, resource reader.
  - **How much of each API the tools reach** `[exp: experiments/mcp]`, at `ea129dc` (v0.18.1), against
    docs.mapbox.com/api on 2026-11-25:
    - They expose 101 of the 240 parameters documented for the endpoints they call. Isochrone and reverse geocoding
      are complete; Directions exposes 11 of 36, Static Images 9 of 21, Search Box text search 11 of 25.
    - Their value lists are short in places: 4 of 9 worldviews, no `street` type, no `polyline6`.
    - They know things the docs get wrong: the Search Box query limit is 200 characters, not 256.
- **The API reference itself** `[exp: experiments/followups/docs-limits.mjs]`: 25 pages, 103 endpoints, 619
  parameters (`kb.mjs api`). Of 100 numeric limits it states that a public token can test, the API was stricter on 2
  (Search Box `q` is 200 characters, not 256; Map Matching refuses a radius of 0) and looser on 21 (C-011).
    - The elevation tool reads `mapbox-terrain-dem-v1` tiles; it does not use Tilequery. Called once with 24 summits'
      coordinates (C-010), it answered what the tiles hold within 0.5 m. Its schema offers "a summit" as an example,
      and for the Matterhorn it answered 3,587 m, 890 m below the published height; 11 of the 24 came back more than
      50 m low. It is in the source at `ea129dc` but not in npm's latest release, 0.18.1.
- **DevKit MCP server** (styles, tokens, validation) and **Docs MCP server**: github.com/mapbox/mcp-devkit-server,
  github.com/mapbox/mcp-docs-server.
- **Mapbox CLI**, github.com/mapbox/mapbox-cli (MIT): geocoding, search, static images and tokens from a terminal, JSON
  output, `--schema` and `--dry-run`.
- **Agent Skills**, github.com/mapbox/mapbox-agent-skills (MIT), 27 skills at HEAD:

| Skill | Lines | Reference files | Eval prompts |
|---|---|---|---|
| web-integration-patterns (React, Vue, Svelte, Angular, Next.js) | 420 | 8 | 3 |
| web-performance-patterns | 357 | 5 | 3 |
| ios-patterns · android-patterns · flutter-patterns | 346 · 410 · 333 | 5 · 6 · 2 | 4 · 6 · 5 |
| ios / android maps v10 → v11 migration | 156 · 156 | 2 · 2 | 4 · 3 |
| ios / android navigation v2 → v3 migration | 227 · 219 | 2 · 3 | 11 · 3 |
| ios-swiftui-migration · android-compose-migration | 173 · 167 | 3 · 3 | 6 · 6 |
| android-sdk-inventory | 103 | 1 | 6 |
| cartography | 228 | 2 | 3 |
| style-patterns · style-quality | 231 · 232 | 8 · 3 | 3 · 3 |
| data-visualization-patterns | 302 | 6 | 3 |
| search-integration · search-patterns | 264 · 388 | 9 · 3 | 3 · 3 |
| geospatial-operations | 460 | 0 | 5 |
| navigation-patterns | 148 | 6 | 18 |
| store-locator-patterns | 303 | 6 | 3 |
| google-maps-migration · maplibre-migration | 411 · 429 | 5 · 3 | 3 · 3 |
| token-security | 325 | 3 | 3 |
| mcp-devkit-patterns · mcp-runtime-patterns · location-grounding | 99 · 198 · 242 | 4 · 8 · 0 | 3 · 4 · 8 |

Their eval runner (`scripts/run-evals.js`) asks each prompt with and without the skill and has a model grade the prose
answer against written expectations; the stored run used claude-sonnet-4 to answer and to grade. No eval runs code.

Coverage of GL JS 3.x in the skills, by a text search of their files (a mention, not a check of correctness):
`addInteraction` appears in 20 files and featuresets in 11; `lightPreset` in 2, `setConfigProperty` in 1; the
`clip`, `model` and `raster-particle` layer types in none. Pinned CDN versions in their examples: `v3.0.0` 8 times,
`v3.18.1` twice. Style URLs: `streets-v12` 40 times, `streets-v11` 7.

Whether they get opened: in C-001, sessions given all 27 opened none on ten everyday tasks. In C-006 they opened none on
the three tasks the model did not know either, and downloaded GL JS's code instead (0 of 13 in all, `evals/results.md`).
A skill added beside them whose description names the features the tasks need was opened first on every task, in the
morning and the afternoon of 27 November, 6 of 6 (C-017, C-029). Other added skills depended on the hour. In the
morning every one was opened on every task, 15 of 15: with only the API's names or only the tasks' words (C-019), and
with a general description under a plain name (C-020). In the afternoon a general description was opened only on task
5, the procedural buildings, 3 of 9, under a plain name or a `mapbox-` one (C-026, C-027). Nothing the transcripts
record changed between the two (C-028). So the afternoon's tests of the name and the description (C-024, C-026) say
nothing about either, and what changed is not known (T-026, parked).
