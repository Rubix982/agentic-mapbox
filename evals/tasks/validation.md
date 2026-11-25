# Validation of the Mapbox GL JS task set

Mapbox GL JS 3.35.2 from Mapbox's CDN, headless Chromium through Playwright 1.65.1 with SwiftShader WebGL, 800 × 600 px viewport, on macOS, 24 November 2026. The final run was

```
node evals/run_eval.mjs --arms reference,wrong
```

which copies each `reference/taskN.html` or `reference/wrongN.html` to `index.html` in a fresh folder under `/private/tmp/mbx-eval-*`, together with the task's data files, and opens it once with `evals/harness/run_page.mjs`, one page at a time. The twenty pages took 2 min 8 s of wall time, and each page took between 2.5 s and 22 s. The records are in `evals/runs/20261124-185258-reference+wrong/` (`results.jsonl`, `summary.md`, and a screenshot per page); `evals/runs/` is not committed. While developing I ran single pages the same way:

```
node evals/harness/run_page.mjs FOLDER --checks evals/tasks/checks.mjs --task N --shot FOLDER.png
```

Every wrong page loads and shows a map, and every one fails on the state its check reads. Three of them (3, 9 and 10) also throw a TypeError in an event handler after the map has loaded, as the same mistake would in real code. The check does not look at those errors.

## Results

Reference 10/10, wrong 0/10.

| Task | Reference | Wrong page (the mistake) | Wrong |
| --- | --- | --- | --- |
| 1 Shop markers with popups | pass | keeps each shop as `[lat, lng]`, the order the request gives them in, and passes that to `setLngLat` and the bounds | fail |
| 2 Population density choropleth | pass | colours by the legacy `{property, stops}` function, which without `type: 'interval'` interpolates between stops instead of classing | fail |
| 3 Clustered sightings | pass | calls `getClusterExpansionZoom(id).then(...)`, the promise form from MapLibre; in GL JS v3 it takes a callback and returns the source | fail |
| 4 Highlight on hover | pass | adds the source without `generateId`, so the features have no id and `setFeatureState` has nothing to attach to | fail |
| 5 Bike docks with a custom icon | pass | sets `icon-allow-overlap` but leaves `text-optional` false, so a dock whose label collides loses its icon too | fail |
| 6 Georeferenced image overlay | pass | lists the image corners from the south-west, as for a bounding box, instead of top-left, top-right, bottom-right, bottom-left | fail |
| 7 Tokyo at night | pass | calls `setConfigProperty` straight after `new Map()`, before the style has loaded, where it silently does nothing | fail |
| 8 Crater Lake in 3D | pass | reads `queryTerrainElevation(point)` without `{exaggerated: false}`, which by default returns the height times the exaggeration | fail |
| 9 Driving route | pass | requests the route without `geometries=geojson`, so the geometry comes back as an encoded polyline string | fail |
| 10 Address search | pass | calls the Geocoding v6 endpoint but reads the v5 field `feature.center`, which v6 does not have | fail |

## What each check measured

**Task 1.** Reference: 3 markers, zoom 12.53 against the 12.51 that `cameraForBounds` gives for the shops with 80 px padding. The shops project to (720, 237), (588, 215) and (81, 385), each inside a marker drawn in rgb(214, 40, 40), and clicking the markers opened popups reading "Alfama", "Bairro Alto" and "Belém". Wrong: the map frames three markers in southern Tanzania (latitude −9.13, longitude 38.71), so the three real shop positions project hundreds of thousands of pixels off screen, and the zoom is 11.97 against a fit zoom of 12.53.

**Task 2.** Reference: `density` is a fill layer in slot `bottom`, and the six districts (densities 4, 10, 32, 50, 87, 240) evaluate to #edf8fb, #b3cde3, #b3cde3, #8c96c6, #8c96c6 and #88419d exactly, at opacity 0.75. Wrong: the districts at 10, 50 and 240 sit on or past a stop and come out right, while 4, 32 and 87 come out as blends: rgb(214, 231, 241), rgb(158, 175, 211) and rgb(137, 87, 168). The two boundary values are in the data so that a `<` / `<=` slip in a hand-written `case` would also fail.

**Task 3.** Reference: source `sightings` with radius 50 and `clusterMaxZoom` 14; 4 clusters holding 115 sightings plus 5 single points, 120 in all, every cluster labelled with its count. The largest cluster (50 points) has expansion zoom 12. After clicking it, the zoom is 12.00 and the cluster sits 0 px from the centre. Wrong: everything is identical up to the click; afterwards the zoom is still 10 and the cluster is 102 px from the centre. The page logged `getClusterExpansionZoom(...).then is not a function`.

**Task 4.** Reference: zone centres at (167, 300), (400, 300) and (633, 300). All three blue before hover; then West, Centre and East each turned red alone as the pointer reached it; all blue again with the pointer at (400, 58), off the zones. Wrong: all three stay blue at every step, and the console holds 27 copies of "The feature id parameter must be provided".

**Task 5.** Reference: layer `docks` with image `dock` loaded at icon size 1; all 12 docks placed, and the magenta icon covers 0.76 to 1.0 of the 5 × 5 patch at all 12 dock positions. Three labels fit. Wrong: 3 of 12 docks placed (Gammeltorv, Amagertorv and Vestergade, the three whose labels fit); magenta at those 3 positions only.

**Task 6.** Reference: image source `plan` under raster layer `plan` at opacity 0.8. The four quarter centres read rgb(225, 73, 73), (73, 185, 97), (73, 97, 225) and (239, 207, 63), which are nearest to red, green, blue and yellow in the right places. These are the image colours blended 80:20 with Mapbox Light's pale grey. Wrong: same layer and opacity, but the image is upside down. The top-left reads yellow (241, 209, 65), the top-right blue, the bottom-right green and the bottom-left red.

**Task 7.** Reference: `lightPreset` night, `theme` monochrome, `showPointOfInterestLabels` false; 0 points of interest rendered (3 transit stops remain, which this setting does not control); camera exactly as asked; mean brightness 47.6 of 255 with a spread of 137 between the darkest and brightest patch. Wrong: day, default, true; 25 points of interest rendered; mean brightness 217. Nothing was logged to the console as an error.

**Task 8.** Reference: terrain from raster-dem source `dem` at exaggeration 1.5. The camera is at −122.098, 42.944, zoom 12, pitch 60, bearing 0, exactly as asked. The terrain's raw elevation at the centre is 1883.2 m and its exaggerated one 2824.8 m; `#elevation` shows "1883 m". Wrong: everything the same except that `#elevation` shows "2825 m".

**Task 9.** Reference: layer `route` draws a 164-point line that starts 37 m from the Brandenburg Gate and ends 121 m from Alexanderplatz (the nearest drivable roads). It is 2.75 km long, all 164 points are in view, it is drawn in #3a86ff at width 5, and `#distance` reads "2.8 km". Wrong: the `route` source holds a geometry that is a polyline string, GL JS's worker reports "Input data is not a valid GeoJSON object", and no line layer has GeoJSON line data within the 20 s the check waits. The page's handler then throws at `route.geometry.coordinates`, so `#distance` is never filled either.

**Task 10.** Reference: after the search, one request to `/search/geocode/v6/forward`. The map ends 16 m from 51.5034° N, 0.1277° W at zoom 16, with one marker whose box contains the map's centre. Wrong: the same one request, then `setLngLat(undefined)` throws. The map stays on Great Britain at zoom 5, 385 km away, with no marker.

## Other valid solutions tried

To check that the checks do not insist on my way of doing a task, I ran some other correct pages, kept only in `/private/tmp`:

- Task 1 with the markers added inside `load` and the map moved there by an animated `fitBounds` (1.5 s) from a different start view: pass, zoom 12.51 against 12.51.
- Task 3 with a legacy `'{point_count}'` token string as the label, the cluster taken from `e.features[0]`, and `flyTo` instead of `easeTo`: failed at first, pass after change 4 below.
- Task 4 with the v3 Interactions API (`addInteraction` with `mouseenter` and `mouseleave` on the layer, and `setFeatureState(e.feature, …)`) instead of layer mouse events: pass, the same colours at every step.
- Task 4 with the fill inserted before Streets' first symbol layer, the usual pattern for drawing under labels. In Streets v12 that layer sits below the roads, so roads cross every patch: pass.
- Task 5 with `text-allow-overlap: true`, so every label is drawn over the neighbouring icons: pass, 12 of 12 placed, magenta fractions 0.68 to 1.0.
- Task 9 with the default simplified overview (9 points instead of 164), the distance summed over the route's legs, 40 px padding and no animation: pass, 2.74 km against "2.8 km".
- Task 10 with the older Geocoding v5 endpoint and its `center` field: pass, 16 m from the target.

## Changes made to make the checks sound

1. **Waiting for layers added after an async step (checks 1 to 6).** The first task 5 reference failed with every dock missing, although its screenshot showed all twelve. The page adds its layer in the `loadImage` callback, which finished after the map's first `idle`, and the harness hands the page to the check at that first idle. Checks 1 to 6 now poll for the thing they read (markers, the `density` layer, a rendered cluster, a rendered fill, a placed icon, a loaded image source) for up to 15 s, then wait for the next idle. Checks 8, 9 and 10 already waited for their element, route or camera move.
2. **Task 8 moved from the Matterhorn to Crater Lake.** It first asked for the Matterhorn's summit height at zoom 13 and pitch 65. Two things went wrong with the reference. First, that camera sits about 2.5 km above sea level, inside the exaggerated mountain, so when the terrain arrived GL JS lifted the camera above it. The centre moved 3.4 km north and the zoom fell to 12.29, which the check rightly called the wrong camera. Second, the terrain returned 3603 m for a 4478 m summit, because the value at a sharp peak depends on which DEM zoom is loaded. The lake's surface is flat, so its height does not depend on tile resolution: the reference reads 1883.2 m, the published 1883 m. At zoom 12 and pitch 60 the camera starts well above the rim, and GL JS leaves it where it was put.
3. **Task 7, transit stops.** With `showPointOfInterestLabels` false, the Standard style's `poi` featureset still returned 3 features. All were transit stations (`group: "transit"`), which `showTransitLabels` controls. The check now counts only points of interest that are not transit.
4. **Task 3, token labels.** A label written as `'{point_count}'` renders correctly, but `queryRenderedFeatures` returns the layout value with the token unfilled, so the check saw no counts. The check now fills `{…}` tokens from the feature's properties before comparing.
5. **Task 4, patch threshold.** A patch first had to be at least half one colour. Because a label drawn over a zone centre could take more than half a 15 × 15 patch, I lowered this to at least 30 %, and more of that colour than of the other. I made this change before running the under-the-roads variant above, so I do not know whether the old threshold would have failed it. The wrong page is fully blue at every step, so the margin on that side is large.
6. **Task 7, a map that drew nothing.** A black canvas would pass a "dark enough for night" test. The check also requires the brightest and darkest of its 100 patches to differ by more than 20 (reference 137).
7. **Never querying the Standard style without a layer list.** In GL JS 3.35.2, `queryRenderedFeatures()` with no `layers` or `target` on the Standard style throws `Cannot read properties of undefined (reading 'getModel')` from `evaluateQueryRenderedFeaturePadding`. Every check passes a layer list or a featureset target.

## Page runs used

73 page runs, each one GL JS map load: 2 to see what the Standard style exposes at runtime, 23 developing the reference and wrong pages, 8 for the other valid solutions above, and two full runs of all 20 pages. The first full run also gave 10/10 and 0/10; I deleted its records after change 5 and ran the set again, and the second run is the one reported here. The web-service calls inside those runs were 7 Directions requests (task 9) and 7 Geocoding requests (task 10), one per page run that reached them. Each page also made 13 to 108 requests to `api.mapbox.com` for its style, tiles, sprites and fonts (counts in `results.jsonl`, `requests_by_host`).

## Limits

- The styles are fetched live from Mapbox and are not pinned to the GL JS version. Task 7's check reads Standard's config names (`lightPreset`, `theme`, `showPointOfInterestLabels`), its `poi` featureset and that featureset's `group` property as they were served on 24 November 2026. A change to the Standard style could break that check without any change to GL JS.
- Tasks 9 and 10 use live services. The margins are wide: the route's endpoints were 37 m and 121 m from the given points against a 300 m limit, and its 2.75 km length is against a 2 to 8 km range. The geocoding result was 16 m from the target against 300 m. A long closure on Unter den Linden could still move the route, though probably not outside those bounds.
- Some checks hold the task's data. Check 2 holds the district centres and densities, check 5 the dock positions and names, check 6 the image's quarter colours. If a data file changes, its check must change with it. I generated the files with a small script kept outside the repository: a 3 × 2 grid of 0.04° × 0.03° cells for task 2, four tight, roughly Gaussian groups of 50, 35, 20 and 10 points plus 5 lone points for task 3, three 0.02° squares for task 4, a 4 × 3 grid at 0.0024° × 0.0015° spacing for task 5, and a four-colour 320 × 240 PNG for task 6.
- Three checks accept only one way of doing something, because the task names that way:
  - Check 2 requires slot `bottom`, so a layer in `middle` (above roads, below labels) fails.
  - Check 7 requires `showPointOfInterestLabels` to be false, so hiding points of interest any other way fails.
  - Check 10 counts only requests to `/search/geocode/` and `/geocoding/`, so a page that used the Search Box API instead would fail that clause.
- Check 5 relies on symbol collisions. At this zoom the reference places every dock and the wrong page 3 of 12, so the margin is wide. A page with a much smaller label size would collide less, and the wrong-page mistake would then hide fewer docks. For a correct page this does not matter.
