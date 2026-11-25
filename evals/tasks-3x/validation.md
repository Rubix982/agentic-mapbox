# Validation: tasks-3x

Both validation runs were `node evals/run_eval.mjs --set tasks-3x --arms reference,wrong`, one straight after the
other on 2026-11-25. Each run opened all 20 pages (10 references, 10 wrong pages) once in the harness's headless
Chromium with SwiftShader WebGL at 800 × 600. Each run's records were written with `--resume` into an empty folder of
its own instead of `evals/runs/`; their `results.jsonl` and `summary.md` are copied into `validation-runs/run1/` and
`validation-runs/run2/`.

| run | reference pages passed | wrong pages passed | time spent in pages |
|---|---|---|---|
| 1 | 10/10 | 0/10 | 203 s |
| 2 | 10/10 | 0/10 | 177 s |

## What each wrong page gets wrong

Each wrong page is its reference with one change.

| task | feature | the wrong page's one mistake | why a capable developer might make it |
|---|---|---|---|
| 1 | `model` source | `orientation: [0, 0, Math.PI / 2]` | radians, the three.js / glTF habit; the spec's `orientation` is in degrees, so the model turns 1.57° and its long side stays east–west |
| 2 | `addModel` + model layer on GeoJSON | `model-color` set, `model-color-mix-intensity` left out | the colour reads as "the colour"; it is only a tint, and the mix intensity defaults to 0, so every van is drawn untinted white |
| 3 | `clip` layer | no `clip-layer-types` | a clip "removes 3D content", and it does remove Standard's buildings; Standard's trees are instanced models, which it only removes when `model` is listed |
| 4 | `raster-particle` | no `raster-particle-max-speed` | the colour ramp is written in m/s, but GL JS spreads it over 0..max-speed, which defaults to 1, so every particle above 1 m/s gets the 1 m/s colour (blue) |
| 5 | procedural `building` layer | `['get', 'part']` in place of `['get', 'building-part']` in `building-color` | Standard's own landmark model layer colours roof/wall/window by `["get", "part"]`; the building layer sets the part in `building-part`, so `part` never matches and roofs get the wall colour |
| 6 | imports, slots | the flood fill added with no `slot` | the version-2 habit: with Standard, a layer without a slot is drawn above the whole basemap, roads and labels included |
| 7 | imports at runtime | `map.setStyle('mapbox://styles/mapbox/standard-satellite')` instead of `map.updateImport('basemap', …)` | the version-2 way to change basemap; it replaces the whole style, and the route added on `load` is gone |
| 8 | Interactions, featureset feature state | the previous building's `select` state is never cleared | the handler sets state on the clicked feature and forgets the old one, so selections pile up |
| 9 | Interactions on a featureset | `map.on('click', 'poi-label', …)` | the version-2 habit of naming a basemap layer; in Standard that layer lives inside the import, so the listener never fires (no error is logged either) |
| 10 | Interactions on a root layer, feature state | the GeoJSON source has no `promoteId` | the districts carry `district_id` but no feature ids, so the click handler's `getFeatureState` / `setFeatureState` calls throw "The feature id parameter must be provided" |

## What each check measured, on both runs

Pixel samples are mean RGB of a 5 × 5 patch (3 × 3 in task 10). Tasks 1, 2, 5 and 10 sample from a top-down camera
the check sets itself. Tasks 1, 2, 5 and 8 hide Standard's labels and trees first; task 8 keeps the page's own camera.

### Task 1

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | roof red at centre yes (232,86,86); red 12–16 m N/S 4/4, E/W 0/4, 30 m N/S 0/2; orientation [0,0,90] |
| 1 | wrong | fail | roof red at centre yes (232,86,86); red 12–16 m N/S 0/4, E/W 4/4, 30 m N/S 0/2; orientation [0,0,1.5707963267948966] Failed on: the pavilion does not reach 12-16 m north and south of its centre (0/4 samples red): its long side is not north-south (+1 more) |
| 2 | reference | pass | roof red at centre yes (232,86,86); red 12–16 m N/S 4/4, E/W 0/4, 30 m N/S 0/2; orientation [0,0,90] |
| 2 | wrong | fail | roof red at centre yes (232,86,86); red 12–16 m N/S 0/4, E/W 4/4, 30 m N/S 0/2; orientation [0,0,1.5707963267948966] Failed on: the pavilion does not reach 12-16 m north and south of its centre (0/4 samples red): its long side is not north-south (+1 more) |

### Task 2

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | rotation = [0,0,heading] for 8/8; mix intensity 1; drawn in status colour 8/8 (late V02 (225,66,63), on-time V01 (74,159,77)) |
| 1 | wrong | fail | rotation = [0,0,heading] for 8/8; mix intensity 0; drawn in status colour 0/8 (late V02 (241,241,241), on-time V01 (241,241,241)) Failed on: only 0/8 vans are drawn in their status colour seen from above (late red, on-time green) |
| 2 | reference | pass | rotation = [0,0,heading] for 8/8; mix intensity 1; drawn in status colour 8/8 (late V02 (225,66,63), on-time V01 (74,159,77)) |
| 2 | wrong | fail | rotation = [0,0,heading] for 8/8; mix intensity 0; drawn in status colour 0/8 (late V02 (241,241,241), on-time V01 (241,241,241)) Failed on: only 0/8 vans are drawn in their status colour seen from above (late red, on-time green) |

### Task 3

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | clip site-clip: types ["model"], render index 171 (Standard 3d-building 153, trees 148), covers 5/5 inside, 0/4 outside |
| 1 | wrong | fail | clip site-clip: types [], render index 171 (Standard 3d-building 153, trees 148), covers 5/5 inside, 0/4 outside Failed on: clip layer site-clip does not list 'model' in clip-layer-types ([]), so the basemap's 3D trees stay |
| 2 | reference | pass | clip site-clip: types ["model"], render index 171 (Standard 3d-building 153, trees 148), covers 5/5 inside, 0/4 outside |
| 2 | wrong | fail | clip site-clip: types [], render index 171 (Standard 3d-building 153, trees 148), covers 5/5 inside, 0/4 outside Failed on: clip layer site-clip does not list 'model' in clip-layer-types ([]), so the basemap's 3D trees stay |

### Task 4

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | max speed 20 m/s; ramp at 0/10/20/30 m/s (50,136,189) (253,223,138) (213,62,79) (213,62,79) |
| 1 | wrong | fail | max speed 1 m/s; ramp at 0/10/20/30 m/s (50,136,189) (70,144,184) (70,144,184) (70,144,184) Failed on: a 10 m/s particle is drawn rgb(70,144,184) not #fee08b (max speed 1 m/s, ramp texel 255/255) (+2 more) |
| 2 | reference | pass | max speed 20 m/s; ramp at 0/10/20/30 m/s (50,136,189) (253,223,138) (213,62,79) (213,62,79) |
| 2 | wrong | fail | max speed 1 m/s; ramp at 0/10/20/30 m/s (50,136,189) (70,144,184) (70,144,184) (70,144,184) Failed on: a 10 m/s particle is drawn rgb(70,144,184) not #fee08b (max speed 1 m/s, ramp texel 255/255) (+2 more) |

### Task 5

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | heights 12/9/36/15/18 m, roofs gabled/hipped/flat/pyramidal/mansard; roof part colour (181,82,59), wall (239,230,210); drawn 5/5, terracotta from above 5/5 (e.g. (180,82,59)) |
| 1 | wrong | fail | heights 12/9/36/15/18 m, roofs gabled/hipped/flat/pyramidal/mansard; roof part colour (239,230,210), wall (239,230,210); drawn 5/5, terracotta from above 0/5 (e.g. (238,229,209)) Failed on: only 0/5 roofs are drawn terracotta seen from above (219,210,193 / 238,229,209 / 238,229,209 / 238,229,209 / 238,229,209) (+5 more) |
| 2 | reference | pass | heights 12/9/36/15/18 m, roofs gabled/hipped/flat/pyramidal/mansard; roof part colour (181,82,59), wall (239,230,210); drawn 5/5, terracotta from above 5/5 (e.g. (180,82,59)) |
| 2 | wrong | fail | heights 12/9/36/15/18 m, roofs gabled/hipped/flat/pyramidal/mansard; roof part colour (239,230,210), wall (239,230,210); drawn 5/5, terracotta from above 0/5 (e.g. (238,229,209)) Failed on: only 0/5 roofs are drawn terracotta seen from above (219,210,193 / 238,229,209 / 238,229,209 / 238,229,209 / 238,229,209) (+5 more) |

### Task 6

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | lightPreset dusk, showPointOfInterestLabels false; flood fill slot "bottom", colour (30,136,229), opacity 0.5 |
| 1 | wrong | fail | lightPreset dusk, showPointOfInterestLabels false; flood fill slot null, colour (30,136,229), opacity 0.5 Failed on: the flood fill flood is in slot null, so it is drawn on top of the whole basemap, roads and labels included; beneath roads is the bottom slot |
| 2 | reference | pass | lightPreset dusk, showPointOfInterestLabels false; flood fill slot "bottom", colour (30,136,229), opacity 0.5 |
| 2 | wrong | fail | lightPreset dusk, showPointOfInterestLabels false; flood fill slot null, colour (30,136,229), opacity 0.5 Failed on: the flood fill flood is in slot null, so it is drawn on top of the whole basemap, roads and labels included; beneath roads is the bottom slot |

### Task 7

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | before: standard, route 1 layer(s) (216,27,96) 5 px; after click: standard-satellite, route layers 1, route features drawn 3, moved 0 m |
| 1 | wrong | fail | before: standard, route 1 layer(s) (216,27,96) 5 px; after click: standard-satellite, route layers 0, route features drawn 0, moved 0 m Failed on: after switching to satellite the route layer is gone from the style |
| 2 | reference | pass | before: standard, route 1 layer(s) (216,27,96) 5 px; after click: standard-satellite, route layers 1, route features drawn 3, moved 0 m |
| 2 | wrong | fail | before: standard, route 1 layer(s) (216,27,96) 5 px; after click: standard-satellite, route layers 0, route features drawn 0, moved 0 m Failed on: after switching to satellite the route layer is gone from the style |

### Task 8

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | A 56692696 after click A: {"select":true} (251,138,0); after click B: A {"select":false} (243,233,223), B {"select":true} (236,164,77); select colour (255,140,0) |
| 1 | wrong | fail | A 56692696 after click A: {"select":true} (251,138,0); after click B: A {"select":true} (251,138,0), B {"select":true} (236,164,77); select colour (255,140,0) Failed on: the first building stays highlighted after the second is clicked (state {"select":true}): two buildings highlighted at once |
| 2 | reference | pass | A 56692696 after click A: {"select":true} (251,138,0); after click B: A {"select":false} (243,233,223), B {"select":true} (236,164,77); select colour (255,140,0) |
| 2 | wrong | fail | A 56692696 after click A: {"select":true} (251,138,0); after click B: A {"select":true} (251,138,0), B {"select":true} (236,164,77); select colour (255,140,0) Failed on: the first building stays highlighted after the second is clicked (state {"select":true}): two buildings highlighted at once |

### Task 9

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | 25 named POIs in view; clicked "Flatiron Building" at (406,317) -> popups ["Flatiron Building"] |
| 1 | wrong | fail | 25 named POIs in view; clicked "Flatiron Building" at (406,317) -> popups []; clicked "23rd Street" at (447,265) -> popups []; clicked "Flatiron Tailor" at (334,286) -> popups [] Failed on: clicking 3 points of interest (Flatiron Building, 23rd Street, Flatiron Tailor) opened no popup with the place's name (popups seen: [[],[],[]]) |
| 2 | reference | pass | 25 named POIs in view; clicked "Flatiron Building" at (406,317) -> popups ["Flatiron Building"] |
| 2 | wrong | fail | 25 named POIs in view; clicked "Flatiron Building" at (406,317) -> popups []; clicked "23rd Street" at (447,265) -> popups []; clicked "Flatiron Tailor" at (334,286) -> popups [] Failed on: clicking 3 points of interest (Flatiron Building, 23rd Street, Flatiron Tailor) opened no popup with the place's name (popups seen: [[],[],[]]) |

### Task 10

| run | page | verdict | what the check measured |
|---|---|---|---|
| 1 | reference | pass | start: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D2: red(9/9 red, 228,128,117) / grey(0/9 red, 195,195,195); click D6: red(9/9 red, 228,128,117) / red(9/9 red, 229,129,118); click D2 again: grey(0/9 red, 194,194,194) / red(9/9 red, 229,129,118) |
| 1 | wrong | fail | start: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D2: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D6: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D2 again: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195) Failed on: after click D2 the districts are grey/grey (D2/D6), want red/grey |
| 2 | reference | pass | start: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D2: red(9/9 red, 228,128,117) / grey(0/9 red, 195,195,195); click D6: red(9/9 red, 228,128,117) / red(9/9 red, 229,129,118); click D2 again: grey(0/9 red, 194,194,194) / red(9/9 red, 229,129,118) |
| 2 | wrong | fail | start: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D2: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D6: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195); click D2 again: grey(0/9 red, 194,194,194) / grey(0/9 red, 195,195,195) Failed on: after click D2 the districts are grey/grey (D2/D6), want red/grey |

## Runs before these two

These are kept because two of them changed the set.

| run | references | wrong pages | what happened |
|---|---|---|---|
| development 1 (all tasks) | 9/10 | 0/10 | Task 8's reference failed its own check: the pixel fallback read building A as orange before any click, (255,174,92), an orange POI icon on the sample point. Check 8 now hides Standard's labels, and a pixel counts only if it turned orange after the start. The screenshots also showed task 5's procedural buildings drawn solid black (see below). |
| development 2–3 (tasks 5 and 8, then 5) | 2/2, then 1/1 | 0/2, then 0/1 | Task 5 was changed twice (see below); task 8 passed with the fixed check. |
| validation pair A, run 1 | 10/10 | 0/10 | — |
| validation pair A, run 2 | 9/10 | 0/10 | Task 7's reference: the check threw `Style is not done loading`. Its wait loop called `map.getStyle()` while the satellite import was still loading, and `getStyle()` throws then. Run 1 passed, so the failure depends on timing. The wait now checks `map.isStyleLoaded()` first and tolerates the throw. The pair was discarded. |
| development 4 (task 7) | 1/1 | 0/1 | The fixed check 7; the two runs above followed it. |

Task 5 changed twice. It first asked for roof shapes and "one row of windows per storey" on Mapbox Light, and its
wrong page left out `building-facade: true`. The buildings drew black there, so the first change moved the task to
Standard, which lit them (development 2). Its screenshots then showed the reference and the wrong page identical, with
no windows in either. The check was separating them by a property with no visible effect. The second change replaced
the windows with terracotta roofs and cream walls, a colour that shows from above, so the check also samples roof
pixels (development 3).

## What GL JS did that I did not expect

1. **A glTF primitive without indices does not load** (tasks 1, 2). My first generated model had no index buffer,
   which glTF 2.0 allows. GL JS 3.35.2 failed with `Could not load model … Cannot read properties of undefined
   (reading 'bufferView')`. `make_data.mjs` now writes indices.
2. **The procedural `building` layer drew solid black on Mapbox Light (light-v11)** (task 5). That style has no 3D
   `lights`. The same layer was lit in a test style that defined `lights` and on Standard. I saw this under SwiftShader
   only and have not checked it on a GPU.
3. **`building-facade: true` draws no windows on GeoJSON footprints** (task 5). In the building bucket,
   `hasFauxFacade = facades.length !== 0 && building-facade`. The facades are LineString features in the same source
   whose `source_id` matches the footprint's, which Mapbox's procedural-buildings tileset carries and plain footprints
   do not. I read this in the source. It matches the screenshots, where the reference and the facade-less wrong page
   were identical.
4. **`building-color` is told the part through a feature property named `building-part`** (task 5). The bucket
   evaluates the colour four times per building, setting `building-part` to `roof`, `wall`, `window` and `door`. The
   spec only says the colour "can be styled using different building parts", without naming the property. Standard's
   own landmark model layer uses `["get", "part"]` for the same idea, which is the wrong page's mistake.
5. **A clip layer removes fill-extrusions only from a `building` or `procedural_buildings` source layer** (task 3).
   This is in `isLayerClipped`. In my first probe a clip over a GeoJSON fill-extrusion removed nothing. Standard's
   buildings qualify. A clip in Standard's `middle` slot also removes nothing, because Standard's 3D layers come after
   that slot; a probe screenshot showed both. That is why check 3 compares render order.
6. **`map.getStyle().imports` gives Standard an empty `url`** when the map's style is
   `mapbox://styles/mapbox/standard` (tasks 3, 6–9). GL JS wraps a style that has a `schema` as an import named
   `basemap` with inline data. The checks therefore recognise an import by its loaded stylesheet's `id` (`standard`,
   `standard-satellite`) rather than by URL.
7. **`map.getStyle()` throws while an import is loading** (task 7), as described under pair A above.
8. **`map.getFeatureState({ featuresetId, importId, id })` returns nothing** (task 8). The featureset form is
   `{ id, target: { featuresetId, importId } }`.
9. **`map.on('click', 'poi-label', …)` on Standard neither fires nor logs an error** (task 9), so the version-2 habit
   fails silently.
10. **The object form of `map.updateImport` reads `importSpecification.data.schema`** (task 7) when the given config
    differs from the import's. It would throw on an import that has config but was given no `data`. I read this in the
    source and did not run it. The reference uses the string form, `updateImport('basemap', url)`.
11. **Model rotation, measured** (tasks 1, 2). A positive z rotation turns a model clockwise seen from above, both as
    a model source's `orientation` and as a layer's `model-rotation`. glTF −Z points north and +X east. So
    `[0, 0, heading]` is right for a model that faces north in its file. The spec only says "euler angles".
12. Without a token, GL JS clears the canvas once its session check fails (`_revokeAuth`), so nothing can be tried
    offline. I did not work around it, since that code is marked as covered by the Mapbox Terms of Service.

## Map loads

Each page run through the harness is one map load.

| what | loads |
|---|---|
| probe 1 (model axes, building layer, clip, interaction; local test style) | 1 |
| probe 2 (Standard: featuresets, clip on trees, model rotation and tint) | 1 |
| development run 1, all 20 pages | 20 |
| development 2–4 (tasks 5 and 8, then 5, then 7) | 8 |
| validation pair A (discarded) | 40 |
| the two validation runs above | 40 |
| **total** | **110** |

Not counted as map loads: two local attempts with Mapbox hosts blocked and no token (they went blank, as in point 12),
and three plain requests made with curl, with the token kept out of the output: the Standard and Standard Satellite
style JSON and the mapbox.gfs-winds TileJSON.

## Limits of the checks

- The checks read GL JS 3.35.2 internals: `map.style.getOwnLayer(id).paint/.layout`, `map.style.fragments`,
  `map.style._mergedOrder` and a raster-particle layer's `colorRamp`. They are tied to this version.
- Task 3 judges the clip layer's configuration against GL JS's own clipping rules, not pixels. Trees over a green
  park cannot be told apart reliably from above.
- Task 4 reads the colour ramp the particles are drawn with, not particle pixels. The particles do draw under
  SwiftShader; they are visible in the screenshots.
- Task 5 checks wall colour by evaluation only; roofs are checked by evaluation and pixels.
- Tasks 8 and 9 click live Standard data (buildings in Paris, POIs in New York). The check picks its targets at run
  time, so a data update should change which buildings or POIs are clicked rather than the verdict; that is
  untested, and a view with no named POI in it would fail task 9.
- The checks that move the camera or hide Standard's labels do so after they have read the page's own state.
