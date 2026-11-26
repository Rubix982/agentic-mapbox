# Threads

Open questions. C-001 closed on 2026-11-24 (10 of 10 with Mapbox's skills, 10 of 10 without). C-002 closed on 2026-11-25 (20 of 21
capabilities served in full to a public token, the 21st in part). C-003 closed on 2026-11-25 (the MCP tools expose 101 of
240 documented parameters). C-004 closed on 2026-11-25 (44 of the
Standard style's 48 settings named right with no help). C-005 closed on 2026-11-25 (10 of 10
newer-GL-JS tasks right without help; 3 by reading GL JS's own code). On 2026-11-25 C-006 to C-011 closed too:
skills opened in 0 of 3 tasks the model did not know; the pitch-0 building was a 3D landmark; sharp summits read a
median 104 m low; the MCP elevation tool gives the Matterhorn 3,587 m; the API was stricter than its docs on 2 of 100
limits. C-013 closed on 2026-11-26 (with no network, 2 of the 3 looked-up tasks right; for the third the model drew the
roofs itself rather than trust GL JS's building layer). C-012 (T-010) is parked until the user says yes to its
sessions. C-014 closed on 2026-11-26 (task 5 offline: 1 of 4 right; the failing sessions doubted GL JS's building
layer and drew the roofs by hand). One card at a time.

### T-001 · What does each Mapbox capability look like when it is actually run?

**Status:** answered (C-002)
**Parent:** C-001
**Opened:** 2026-11-24
**Question:** `kb/catalog.md` lists what Mapbox offers; none of it has been run here. One small experiment per
capability (Standard style and its light presets, 3D buildings and models, terrain and globe, data-driven styling,
clustering, interactions, Search Box, Directions, Isochrone, Matrix, Static Images), each with a screenshot and the
facts it recorded, would be both a tour and the guide's evidence layer. Needs the token.
**Answer:** 22 experiments over 21 capabilities, all served to the public token except the account's own listings
(`experiments/results.md`, `experiments/gallery.html`). Opened T-006, T-007, T-008.

### T-002 · What settings does the Standard style declare, and which does an agent guess wrong?

**Status:** answered (C-004)
**Parent:** C-001
**Opened:** 2026-11-24
**Question:** the default style's settings (`lightPreset`, `theme`, label toggles) are not in the library; they are in
the style's `schema`, served by the Styles API. Fetching `mapbox://styles/mapbox/standard` with a token and adding its
schema to the inventory would make `kb.mjs` answer them.
**Answer:** 48 settings for Standard and 23 for Standard Satellite (`experiments/api/styles.mjs`). `tools/inventory.mjs`
now fetches them, and `kb.mjs config` and `kb.mjs find` answer from them. A model with no help named 44 of the 48
right. It got `showHdRoads`, `colorHdRoads` and `colorMix3dLandmarks` wrong, and never answered `showIndoorLabels`
(`evals/results.md`, C-004). GL JS ignores an unknown name silently. Opened T-010.

### T-003 · Are the MCP server's tool schemas a usable inventory of the web APIs' parameters?

**Status:** answered (C-003)
**Parent:** C-001
**Opened:** 2026-11-24
**Question:** github.com/mapbox/mcp-server defines each of its 16 API tools with an input schema in code. If those
schemas match the API docs, reading them gives `kb.mjs` the web services (Directions, Search Box, Isochrone…) the way
the style spec gives it GL JS. Check a few against docs.mapbox.com/api.
**Answer:** no. They expose 101 of the 240 parameters documented for the endpoints they call, and the API contradicted
them in 6 of 8 settled disagreements (`experiments/results.md`, C-003). Opened T-009.

### T-004 · Does the model still need no help on the parts of GL JS 3.x that C-001's tasks did not touch?

**Status:** answered (C-005)
**Parent:** C-001
**Opened:** 2026-11-24
**Question:** C-001's ten tasks were everyday web-map work, and the model got all ten right alone. Of the 272 style
properties that record a GL JS version, 131 arrived in 3.x, and none of the ten tasks used the 3D `model` layer,
`clip`, `raster-particle`, the procedural `building` layer, style imports or the Interactions API. A second blind set
drawn from those areas, run through the same harness without help, would say whether a gap exists anywhere in GL JS.
The set's writer would be told the areas, not the reason.
**Answer:** no gap a guide would close. 10 of 10 right without help (`evals/results.md`, C-005). Seven came from
memory; three (model colour mix, clip, procedural building colours) came from downloading GL JS's own code and reading
it. Opened T-011.

### T-005 · When does an agent open a skill it has been given?

**Status:** answered (C-006)
**Parent:** C-001
**Opened:** 2026-11-24
**Question:** In C-001 all 10 with sessions listed 27 Mapbox skills whose descriptions match the tasks (web
integration, data visualisation, search), and none opened one. In the Blender guide's eval the skill was used in
every session. The difference may be that the model knew the answer here and did not there. If so, skills are opened
only when the model senses a gap, and a skill can never correct a confident mistake.
**Answer:** not when it does not know either (C-006). The three C-005 tasks the model had to look up ran again with
Mapbox's skills installed; 0 of 3 opened a skill, and all three downloaded GL JS's code instead (`evals/results.md`).
With C-001 that is 0 of 13, so knowing the answer is not what kept the skills shut. Opened T-012.

### T-006 · Why does a selected building change colour at pitch 45 but not at pitch 0?

**Status:** answered (C-007, C-008)
**Parent:** T-001
**Opened:** 2026-11-25
**Question:** In `experiments/standard/interactions.mjs` a click on Standard's `buildings` featureset sets
`select: true` at both pitches. At 45° the building turns blue; at 0° the frame does not change at all (difference
0, three runs). Standard's `3d-building`, `2d-building` and `procedural-buildings` layers all read `select`. Either
GL JS draws a different layer at pitch 0, or software WebGL (SwiftShader) is the cause; one run on a GPU would separate
the two.
**Answer:** neither. On the Mac's GPU the result was the same as in SwiftShader (C-007). The two pitches had clicked
different buildings, and the pitch-0 one was the Empire State Building, which Standard draws as a 3D landmark model that
never takes the select colour, at any pitch. An ordinary building turns blue at both (C-008,
`experiments/followups/results/select-same-building.json`).

### T-007 · Is Mapbox's DEM low on the Matterhorn, and on sharp peaks in general?

**Status:** answered (C-009)
**Parent:** T-001
**Opened:** 2026-11-25
**Question:** Read through GL JS at zoom 14, `mapbox-terrain-dem-v1` reaches at most 4,226 m within 1 km of the
Matterhorn (published 4,478 m), while Mont Blanc, Fuji and two lakes read within 14 m (`experiments/3d/terrain-heights`).
One spire is one case. A dozen sharp summits against a national survey's heights would say whether it is the
Matterhorn or the shape, and reading the DEM tile's pixels directly would say whether GL JS's sampling is part of it.
**Answer:** the shape, mostly (C-009). Of 11 sharp summits, 8 read more than 50 m low (median 104 m); of 11 broad ones,
none (median 21 m low). The two sharp US summits read within 11 m. GL JS reads what the tiles hold, within 4 m at 20 of
24 summits (`experiments/results.md`).

### T-008 · Does the elevation tool in Mapbox's MCP server give a summit's height?

**Status:** answered (C-003, C-010)
**Parent:** T-001
**Opened:** 2026-11-25
**Question:** Tilequery returns at most 50 contours, 10 m apart, and at Mont Blanc the 50 returned stop at 3,270 m
(`experiments/api/tilequery`). If github.com/mapbox/mcp-server's elevation tool takes the highest contour Tilequery
returns, an agent asking it for Mont Blanc's height gets an answer about 1,500 m too low. Reading the tool's code says
how it works; one call to it says what it answers.
**Answer:** half, from the code (C-003). The premise was wrong. The tool decodes `mapbox.mapbox-terrain-dem-v1` tiles
at zoom 14 (lower on long paths) and never calls Tilequery, so the contour limit cannot reach it. What is left is one
call: it reads the same DEM that `3d/terrain-heights` found 252 m low on the Matterhorn, so it probably answers about
3,575 m there (T-007). Then the call (C-010): with the server run from source at that commit, one call with 24 summits gave
what the tiles hold within 0.5 m. That is 3,587 m for the Matterhorn, 890 m low, and 11 of 24 came back more than 50 m
low (`experiments/results.md`).

### T-009 · Can the API reference's own parameter tables serve as `kb.mjs`'s inventory of the web services?

**Status:** answered (C-011)
**Parent:** T-003
**Opened:** 2026-11-25
**Question:** `experiments/mcp/docs_params.py` already reads every endpoint's parameter tables from docs.mapbox.com/api
(240 parameters for the endpoints the MCP tools call, more on the pages they skip). They are complete where the tools
are not, but in C-003 they were wrong twice in eight checks (the Search Box query limit, Static Images' "required"
overlay). Reading all of them, and checking a sample of their stated limits against the API's own error messages, would
say how often they are wrong. That decides whether `kb.mjs` can repeat them as they stand.
**Answer:** yes, for numeric limits (C-011). Of 100 stated limits tested at and past the limit, the API was stricter
than the docs on 2 (the Search Box query length, a Map Matching radius of 0) and looser on 21. `kb.mjs api` now
repeats the tables, with those results beside the limits tested (`experiments/results.md`).

### T-010 · Would one sentence of help fix the three Standard settings the model named wrong?

**Status:** parked (C-012 has not run; it resumes with the commands in `CARD.md` once the user says yes to 18 sessions)
**Parent:** T-002
**Opened:** 2026-11-25
**Question:** In C-004 the model, unsure, searched `map.getSchema('basemap')`'s setting names for "lane" and found
nothing. "Lane" is in the settings' titles ("Lane details"), not their names (`showHdRoads`). A sentence such as "search
the schema's titles as well as its names, and check `getConfigProperty` afterwards, because GL JS ignores unknown names
silently" might fix all three misses without listing any name. Rerunning the three missed requests with that sentence
would say whether a general rule is enough, or whether the names themselves have to be given.
**Answer:** —

### T-011 · With no network, does the model still get the three tasks it looked up?

**Status:** answered (C-013)
**Parent:** T-004
**Opened:** 2026-11-25
**Question:** In C-005, tasks 2, 3 and 5 (model colour mix, clip, procedural building colours) came out right only after
the sessions downloaded GL JS's own code. The same three sessions run with the network blocked would say whether the
model knows them or only found them. If they fail, those three are the guide's first entries, and an agent working
offline or without a shell needs them told. If they pass, the lookups were caution, not need.
**Answer:** 2 of 3 (`evals/results.md`, C-013). Tasks 2 and 3 came out right from what the model knew, so their lookups
were caution. On task 5 the model would not trust that GL JS 3.35.2 has a procedural building layer, and drew the roofs
in its own WebGL layer, which the check fails. Opened T-013, T-014.


### T-012 · Is a skill opened when its description names the feature the task needs?

**Status:** open
**Parent:** T-005
**Opened:** 2026-11-25
**Question:** In C-006 the model skipped 27 Mapbox skills with general descriptions even on tasks it did not know. A
skill whose description names `clip`, `model-color-mix-intensity` and `building-part`, run on the same three tasks,
would say whether the description's wording is what decides, or whether skills are skipped whatever they say.
**Answer:** —

### T-013 · Does task 5 fail the same way every time with no network?

**Status:** answered (C-014)
**Parent:** T-011
**Opened:** 2026-11-26
**Question:** In C-013 the one offline session on task 5 avoided GL JS's building layer and drew the roofs in WebGL.
C-013's pre-stated next step is three more offline runs of task 5 (`run_eval.mjs --set tasks-3x --tasks 5 --arms
offline --runs 3 --concurrency 1`, about $3 a session) before any guide entry is written.
**Answer:** mostly (`evals/results.md`, C-014): 1 of 3 right, so 1 of 4 with C-013's session. The failing sessions
avoided the building layer, saying they could not confirm it. The passing one wrote the layer right from memory, but
kept a hand-drawn fallback.

### T-014 · Told to use GL JS's building layer, does the model get task 5 right offline?

**Status:** open
**Parent:** T-011
**Opened:** 2026-11-26
**Question:** Task 5's wording asks for the picture, and only its check names the procedural `building` layer. A version
of the task that says to use that layer, run offline, would say whether the model knows how to use it (`building-part`
for roof and wall colours) or only doubted that it exists. C-014's passing session wrote the layer right from memory,
so the question is now whether naming the layer is enough to make the model trust it.
**Answer:** —
