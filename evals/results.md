# Results

## C-001: ten blind GL JS tasks, with Mapbox's Agent Skills and without (2026-11-24)

`node evals/run_eval.mjs --arms with,without --concurrency 3`. One session per task and arm, on claude-opus-5-5. Each
session ran in an empty folder under `/private/tmp`, with no MCP servers and no token. The agent wrote `index.html`
without opening it, and the harness opened it once in headless Chromium at 800 × 600 and graded it with
`tasks/checks.mjs`. The with arm loaded mapbox-agent-skills at commit `84d991e` as a plugin, with its MCP servers
removed. Records: `results/c001-20261124-190027.jsonl`. Session folders, transcripts and screenshots stay in the
git-ignored `runs/20261124-190027-with+without/`.

Earlier the same day, the set's own reference and wrong pages gave 10 of 10 and 0 of 10 through the same harness
(`tasks/validation.md`; repeated just before this run, `results/validation-20261124-185808.jsonl`). So the checks do
tell a right page from a wrong one.

| Task | With the skills | Without | Turns (with / without) | Cost, USD (with / without) |
|---|---|---|---|---|
| 1. Shop markers with popups | right | right | 2 / 3 | 0.27 / 0.22 |
| 2. Population density choropleth | right | right | 3 / 3 | 0.24 / 0.22 |
| 3. Clustered sightings | right | right | 3 / 4 | 0.31 / 0.31 |
| 4. Highlight on hover | right | right | 4 / 3 | 0.29 / 0.32 |
| 5. Bike docks with a custom icon | right | right | 3 / 3 | 0.34 / 0.32 |
| 6. Georeferenced image overlay | right | right | 3 / 3 | 0.22 / 0.20 |
| 7. Tokyo at night | right | right | 2 / 2 | 0.21 / 0.19 |
| 8. Crater Lake in 3D | right | right | 3 / 3 | 0.28 / 0.31 |
| 9. Driving route | right | right | 3 / 4 | 0.28 / 0.27 |
| 10. Address search | right | right | 6 / 6 | 0.32 / 0.31 |
| **Right first time** | **10** | **10** | 3.2 / 3.4 on average | 2.75 / 2.67 in all |

No page logged a console error or threw.

**The skills were never opened.** Every with session listed the 27 Mapbox skills, and none called the Skill tool or
read a file from the plugin. The with sessions made 1 to 5 tool calls each: an `ls` of the folder, a look at the data
file, sometimes a syntax check of the page's script with Python, and the Write. No session in either arm fetched
documentation or opened a browser.

**Both arms avoided each wrong page's mistake in the same way.** These are the mistakes the set's writer built the
wrong pages around:

| Task | Mistake | What both arms did |
|---|---|---|
| 7 | setting the light preset before the style loads | passed `config: { basemap: … }` to the constructor |
| 8 | reading terrain height without turning off exaggeration | called `queryTerrainElevation(centre, { exaggerated: false })` |
| 3 | calling the cluster expansion zoom as a promise | used the callback |
| 10 | using the Geocoding API | called `search/geocode/v6/forward` |
| 2 | placing the choropleth beneath roads and labels | put it in `slot: 'bottom'` |
| 5 | keeping every dock icon | set `icon-allow-overlap`, `icon-ignore-placement` and `text-optional` to true |

**What this does and does not show.** On these ten tasks the model needed no help, so the skills had nothing to fix
and were not consulted. The result says nothing about whether the skills' content is right. It also says nothing about
tasks that reach parts of GL JS none of these ten touched: 3D models, `clip`, `raster-particle`, the procedural
`building` layer, style imports, or the Interactions API. And it says nothing about the mobile SDKs, where most of the
skills' content is. It is one session per task and arm, on one model.

**Use.** 20 page runs here and 20 for the repeated validation, each one GL JS map load. The 20 pages made 662 requests
to api.mapbox.com, mostly tiles, which a map load includes, plus 2 Directions and 2 Geocoding requests. The task
writer's development used 73 map loads. All of it is far inside the free tier of 50,000 map loads a month.

## C-004: the Standard style's 48 settings, named by the model with no help (2026-11-25)

`node evals/config/run.mjs`. Each of the 48 settings had one fresh `claude -p` session on claude-opus-5-5, in an empty
folder under `/private/tmp`.
- **What a session had:** no tools (`--tools ""`), no CLAUDE.md, skills, plugins or MCP servers (`--safe-mode
  --strict-mcp-config`), and no token.
- **What it was asked:** to write JavaScript doing one plain request to an existing Standard-style map, worded without
  the setting's name (`evals/config/requests.json`). For example, "Hide footpaths, pedestrian streets and trails" for
  `showPedestrianRoads`.
- **How it was graded:** `evals/config/grade.mjs` runs every answer once against a real Standard map. Before each
  answer every setting goes back to its default; after it, the page reads back what changed. An answer is right when
  the setting its request meant now holds the value asked for.

Records: `results/c004-20261125-combined.jsonl`. The sessions' answers stay in the git-ignored
`runs/config-20261125-*`.

**The grader first.** Before any session ran, it graded a right answer for each setting (48 of 48 right) and one with a
plausible wrong name, such as `hidePlaceLabels` or `colourWater` (0 of 48 right;
`results/c004-validation-20261125-042015.jsonl`). The wrong names showed something by themselves. None of the 48 made
GL JS print a warning or an error, and none changed anything. **GL JS ignores an unknown setting name without a word**,
so an agent that gets a name wrong cannot find out by running its code.

**44 of the 48 were right**, past the card's bar of 43.

| | Settings |
|---|---|
| Right, named outright (38) | `theme`, `theme-data`, `lightPreset`, `showPlaceLabels`, `colorPlaceLabels`, `showAdminBoundaries`, `colorAdminBoundaries`, `colorCommercial`, `colorMedical`, `colorEducation`, `colorIndustrial`, `colorGreenspace`, `colorWater`, `colorLand`, `showRoadLabels`, `colorRoadLabels`, `showTransitLabels`, `colorMotorways`, `colorTrunks`, `colorRoads`, `showPedestrianRoads`, `showPointOfInterestLabels`, `densityPointOfInterestLabels`, `backgroundPointOfInterestLabels`, `colorModePointOfInterestLabels`, `colorPointOfInterestLabels`, `showLandmarkIcons`, `showLandmarkIconLabels`, `show3dObjects`, `show3dBuildings`, `show3dFacades`, `show3dTrees`, `show3dLandmarks`, `colorPlaceLabelHighlight`, `colorPlaceLabelSelect`, `colorBuildingHighlight`, `colorBuildingSelect`, `font` |
| Right, with a search added as insurance (3) | `colorBuildings`, `colorIndoorLabelHighlight`, `colorIndoorLabelSelect`: each wrote the right name as its first guess or fallback, plus code that looks for a matching key in `map.getSchema('basemap')` at run time |
| Right only by searching (1) | `showIndoor`: it set every boolean setting whose name contains "indoor" |
| Right after a rerun (2) | `roadsBrightness` (set to 1), `fuelingStationModePointOfInterestLabels` |
| Wrong (3) | `showHdRoads`: searched the setting names for "lane", found none, and fell back to an invented `showLaneMarkings`. `colorHdRoads`: the same search, then four invented names (`colorRoadLanes`, `colorLanes`, …). `colorMix3dLandmarks`: invented `colorModeLandmarks: 'full'`, with a comment saying it could not check the name |
| No answer (1) | `showIndoorLabels`: cut off at 5 minutes on the first run, and stopped by an API safeguard error ("flagged this message … This sometimes happens with safe, normal conversations") after 6 minutes on the rerun |

**The misses are the newest, most specialised settings:** lane-level roads, and the landmark colour mix. The model's
fallback when unsure was to search the schema at run time. That is a reasonable strategy, and it worked for
`showIndoor`. It failed for the lane settings because it searched the setting *names*: "lane" is in their titles
("Lane details", "Lane color") and not in `showHdRoads` or `colorHdRoads`. `node tools/kb.mjs find lane` finds both.

**What uncertainty cost.**
- The answers the model knew cost about $0.02 each (median $0.017).
- The two it got by searching or missed in the rerun cost $3.06 and $3.07, and took 14 and 15 minutes.
- The first `showHdRoads` cost $0.39.
- Not every slow session was uncertain, though: `fuelingStationModePointOfInterestLabels` took 6.5 minutes for $0.02.
  So time alone does not separate thinking from waiting.

**About the first run.** Six of the 48 sessions hit the 5-minute limit I had set and were killed before answering, and
my runner logged those as having no error. They were rerun with a 20-minute limit
(`runs/config-20261125-143417`, `-143501`), and the combined record keeps each setting's completed answer. The cut-off
attempts are kept apart in `runs/config-20261125-combined/cut-off.jsonl`, and the runner now marks a killed session as
an error.

**What this does and does not show.**
- It shows the model knows the Standard style's settings well enough that a guide entry for them would mostly repeat
  it.
- What a guide could still carry is small and specific:
  - the three lane and landmark names;
  - that a wrong name fails silently;
  - that a run-time search should look at titles as well as names (T-010).
- It is one session per setting, on one model, with requests I wrote. Their wording can hint at the names ("lane",
  "density", "single colour"), so it tests whether the model knows the exact form of a name it is pointed towards,
  not whether it can find the setting from a vague wish.

**Use.**
- **Sessions:** $8.34 reported, for the 42 completed first-run sessions and the 6 reruns. The 6 killed sessions used
  tokens the CLI did not report.
- **Map loads:** four, one each for the grader's validation and three grading passes.
- **Styles API:** two requests, from `tools/inventory.mjs`.

## C-005: ten blind tasks on the newer parts of GL JS 3.x, with no help (2026-11-25)

`node evals/run_eval.mjs --set tasks-3x --arms without`. The set was written by a fresh agent that had not seen this
repository's notes, results, tour or vendored Mapbox repositories (`tasks-3x/`). It was told six areas: the 3D `model`
layer, `clip`, `raster-particle`, the procedural `building` layer, style imports and the Interactions API. It was not
told what the set was for. Its own two validation runs gave 10 and 0 (`tasks-3x/validation.md`), and so did mine just
before the sessions (`results/c005-validation-20261125-154442.jsonl`).

The sessions were set up exactly as C-001's without arm: `claude -p` on claude-opus-5-5 in an empty folder under
`/private/tmp`, no MCP servers, no token, the same prompt and the same tools (Read, Write, Edit, Glob, Grep, Bash).
Records: `results/c005-20261125-154837.jsonl`.

**10 of the 10 were right first time.**

| Task | Area | Turns | Cost, USD | Downloaded GL JS's code? | What the page used |
|---|---|---|---|---|---|
| 1. Pavilion on the Great Lawn | 3D model | 3 | 0.36 | no | `addModel`, `model-rotation: [0, 0, 90]` |
| 2. Delivery vans at the depot | 3D models | 18 | 0.81 | **yes** (`npm pack mapbox-gl@3.35.2`) | `addModel`, `model-color-mix-intensity: 1` |
| 3. Clearing the redevelopment site | clip | 26 | 0.82 | **yes** (style spec and source maps from unpkg) | `clip-layer-types: ['model']`, `clip-layer-scope: ['basemap']` |
| 4. Global wind animation | raster-particle | 3 | 0.36 | no | `raster-particle-max-speed: 40` |
| 5. Planned buildings with real roofs | procedural buildings | 23 | 1.06 | **yes** (`mapbox-gl-dev.js` from Mapbox's CDN) | `building-roof-shape`, and `building-part` for roof and wall colours |
| 6. Flood zones under the streets | Standard configuration and slots | 3 | 0.25 | no | `lightPreset: 'dusk'`, POI labels off, `slot: 'bottom'` |
| 7. Satellite toggle that keeps the route | basemap switching | 3 | 0.41 | no | `setStyle`, re-adding the route on every `style.load` |
| 8. Pick a building | Interactions | 4 | 0.30 | no | `addInteraction` on the `buildings` featureset, feature state |
| 9. What's this place? | Interactions | 2 | 0.23 | no | `addInteraction` on the `poi` featureset |
| 10. Toggle districts | Interactions | 3 | 0.24 | no | `promoteId`, feature state |
| **All** | | 8.8 on average | **4.84** | 3 of 10 | |

**Three sessions looked the answer up themselves.**
- They used Bash to download GL JS 3.35.2's own published code and read it. Task 2 used npm, task 3 unpkg's source maps
  of the original TypeScript, and task 5 the development build on Mapbox's CDN.
- They are the three long, expensive sessions: 18 to 26 turns and $0.81 to $1.06, against 2 to 4 turns and $0.23 to
  $0.41 for the rest.
- They are also the three areas the set's own writer found hardest:
  - task 5 needs a property name, `building-part`, that the style spec never mentions, and the session found it in the
    source, as the writer had;
  - task 3 needs to know which 3D content a `clip` layer removes;
  - task 2 needs `model-color-mix-intensity` beside `model-color`.
- No session in C-001 fetched anything: the same check over its 20 transcripts finds 0. The harness did not record
  this as a fact until now; `run_eval.mjs` now writes `fetched_over_network` and `network_commands` for each session.

**Task 7 passed without the reference page's method.** The reference keeps the route by swapping the basemap
import, and the wrong page calls `setStyle`, which drops the route. The session also called `setStyle`, but re-added
the route every time the style loaded. The check tests what the map shows after the switch, not how it got there,
so it counted as right.

**What this does and does not show.**
- With a shell and a network, the model needed no help from this repository on ten tasks in the newest parts of GL JS.
  It knew seven, and worked out three from the library's own code.
- So a guide here would not change whether these tasks come out right. At most it could save the three expensive
  sessions about $0.50 each, and that is untested.
- It does not show the model *knows* tasks 2, 3 and 5: with no network they might fail (T-011).
- It is one session per task, on one model. The checks tie themselves to internals of GL JS 3.35.2 (`map.style`,
  `_mergedOrder`).

**Use.**
- **Sessions:** $4.84 for the 10.
- **Map loads:** 110 by the set's writer while it built and validated the set, 20 for my validation, and 10 to grade
  the sessions.

## C-006: the three looked-up tasks again, with Mapbox's skills installed (2026-11-25)

`node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with`. C-005's tasks 2, 3 and 5 are the three where the
model did not know the answer and downloaded GL JS's code to find it. Here each ran once more, set up exactly as C-001's
with arm: Mapbox's Agent Skills at commit `84d991e` loaded as a plugin, its MCP servers removed. Records:
`results/c006-20261125-174022.jsonl`.

**None of the three sessions opened a skill.** Each listed the 27 Mapbox skills at start-up (67 skills in all, with
the user's own plugins), and none called the Skill tool or read a skill's files. No visible text in any of the three
mentions a skill.

**All three downloaded GL JS's code again, and all three were right first time.**

| Task | Turns | Cost, USD | First download, in tool steps | What it fetched |
|---|---|---|---|---|
| 2. Delivery vans (model colour mix) | 17 | 0.88 | 8th | the style spec and 3D-style sources from GitHub, then `npm init` to validate |
| 3. Clearing the site (clip) | 15 | 0.59 | 5th | `mapbox-gl-dev.js` from unpkg |
| 5. Planned buildings (roof and wall colours) | 39 | 1.47 | 5th | `mapbox-gl-dev.js` from Mapbox's CDN, then read it 11 times |
| **All** | | **2.94** | | |

**What this does and does not show.**
- Not knowing did not send the model to a skill. It went straight to the library's code, past 27 skills whose
  descriptions cover GL JS web work. With C-001's 0 of 10 on tasks it knew, that is 0 of 13.
- So "the model knew the answer" does not explain C-001's 0 of 10 on its own: here it did not know, and still opened
  none.
- None of Mapbox's skills covers what these three tasks need (no `clip`, no model colour mix, no procedural building).
  The model could not have known that without opening one, so it did not skip them because it had read them. It may
  have judged from their general descriptions ("web integration patterns") that they would not hold anything this
  specific. A skill whose description named the feature was not tested (T-012).
- One session per task, on one model, with the user's own plugins loaded as in C-001.

## C-013: the three looked-up tasks again, with no network (2026-11-26)

`node evals/offline_probe.mjs`, then `node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms offline --concurrency
1`. The offline arm is C-005's without arm (same prompt, tools, model and empty folder, no token, no MCP servers) with
three changes. Bash runs in Claude Code's sandbox with no allowed domains and no way to run outside it. WebFetch and
WebSearch are denied. And neither Bash nor the file tools can read the home folder, `/private/tmp` or the folders beside
the session's own. Those hold this machine's copies of GL JS and the earlier runs' pages and transcripts. A search
outside the home folder found GL JS only under `/private/tmp`. Bash can still read the folder node is installed in
(`~/.nvm`, which holds no GL JS), so node runs. Records: `results/c013-20261126-044700.jsonl`.

**The block was checked before any task ran.** One Haiku session made 16 tool calls (`results/offline-probe.json`).
- **Refused (13):** curl, node's `fetch` and `npm view` to the network; Read, Glob and Bash on the home folder, on a
  copy of GL JS in `/private/tmp` and on a folder beside the session's own.
- **Worked (3):** writing, reading and running node in the session's own folder.
- The sandbox refused the network calls itself. Claude Code's permission rules stopped most of the reads first, by
  reading the path in the command, even when it was spelled with a variable. One read hid its path inside node's
  arguments, and the sandbox refused it (`EPERM`).
- It took five probe sessions to get there. In the first versions every Bash command ended in an error, because Claude
  Code writes a file under `/tmp/claude-501` after each command and closing `/private/tmp` whole blocked it. A Read deny
  rule on `/private/tmp` closes it to the sandbox too. The arm now closes each entry of `/private/tmp` instead.

**2 of the 3 were right first time.** Every session first tried to download GL JS, and every attempt was refused
(`network_denied` in the records counts the sandbox's refusals; task 5's other attempt was stopped by the permission
rules).

| Task | Turns (C-005) | Cost, USD | Right? | What the page used |
|---|---|---|---|---|
| 2. Delivery vans (model colour mix) | 7 (18) | 0.89 | yes | `model-color-mix-intensity: 1` |
| 3. Clearing the site (clip) | 4 (26) | 0.43 | yes | `clip-layer-types: ['model']` |
| 5. Planned buildings (roof and wall colours) | 10 (23) | 3.20 | no: no GL JS building layer | its own WebGL `custom` layer, 580 lines |
| **All** | | **4.52** | **2 of 3** | |

**Task 5 drew the roofs itself.** After the refused downloads, the session said it could not confirm offline that GL
JS 3.35.2 has a procedural building layer, and that a wrong guess would show no buildings at all. It wrote a custom
WebGL layer that builds each footprint's walls and roof, with shading and shadows. Then it checked the geometry with
its own node script against stubbed GL JS. The page took 16 minutes, against C-005's 81-line page using GL JS's
`building` layer. The screenshot (`results/c013-task5-offline.png`) shows the five buildings in terracotta and cream
with five different roof shapes. I have not checked each shape against its building.

**What this does and does not show.**
- For tasks 2 and 3, C-005's downloads were caution. With no way to look, the model wrote both from what it knew, in
  fewer turns.
- For task 5, the model did not trust offline that this version of GL JS has the building layer. Whether it knows how
  to colour the layer's roofs and walls (`building-part`) was never reached (T-014).
- The task as the agent saw it asks for buildings with those roofs and colours, not for GL JS's layer; only the check
  names the layer. By what it shows, the page could be counted right. It is counted wrong here because the check
  decides, as in C-005.
- The candidate guide entry is that GL JS 3.35.2 has a procedural `building` layer. One run cannot say whether
  the model avoids it every time (T-013).
- One session per task, on one model. Each session knew it was offline from the refused download, which is the
  condition being tested. The permission rules also stopped two sessions from looking in node's folder by name.

**Use.**
- **Sessions:** $4.52 for the 3 task sessions; about $0.10 for five probe sessions and six one-command test sessions on
  Haiku.
- **Map loads:** 3, to grade the pages.

## C-014: task 5 three more times, with no network (2026-11-26)

`node evals/run_eval.mjs --set tasks-3x --tasks 5 --arms offline --runs 3 --concurrency 1`, with the offline arm exactly
as in C-013; its settings had not changed since the last probe passed. Records: `results/c014-20261126-053718.jsonl`.
Screenshots: `results/c014-task5-offline-run0.png` to `-run2.png`.

**1 of the 3 was right first time, and 1 of 4 with C-013's session.** Each session tried once to download GL JS, and
the sandbox refused it.

| Run | Right? | Turns | Minutes | Cost, USD | What the page drew with |
|---|---|---|---|---|---|
| C-013 | no | 10 | 16 | 3.20 | its own WebGL custom layer, 580 lines |
| 0 | no | 12 | 16 | 3.22 | a fill-extrusion for the walls and its own WebGL layer for the roofs, 588 lines |
| 1 | yes | 7 | 18 | 3.32 | GL JS's `building` layer, with a hand-drawn WebGL fallback, 682 lines |
| 2 | no | 33 | 18 | 3.72 | its own WebGL custom layer, 766 lines |
| **These 3** | **1 of 3** | | | **10.26** | |

**Why the failing pages avoided the layer.** Both sessions said so in their last message.
- Run 0: "Mapbox v3 seems to have an experimental `building` layer type with a roof-shape setting that matches these roof
  names exactly, and I suspect the task was designed around it. I didn't use it because I couldn't confirm its exact
  property names, whether it accepts GeoJSON, or how to colour roofs and walls separately."
- Run 2: "I didn't use Mapbox's newer procedural `building` layer with its `building-roof-shape` property. I had no
  network access to check how it behaves in v3.35.2, including whether it accepts GeoJSON or can colour roofs and walls
  separately."

**The passing page used the layer from memory, and kept a way out.** Its first choice was a `building` layer over the
GeoJSON source, with `building-roof-shape` from `roof`, the height from `height_m`, and the colour chosen by
`['get', 'building-part']`. The check found all five heights, roof shapes and colours right. Then it tested the rendered
pixels where each roof should be. If fewer than 3 of the 5 showed terracotta, or the layer type was rejected, it removed
the layer and drew the buildings itself. In the harness the layer stayed. The session said the part it trusted least
was the `building-part` colouring.

**What this does and does not show.**
- Offline, the model got task 5 right 1 time in 4. With a network it got it right 2 of 2 times (C-005, C-006), after
  reading GL JS's code.
- The failures do not come from the model not knowing the layer: run 1 wrote it right from memory, `building-part`
  included. They come from it not trusting what it remembers about a feature it cannot check, as two sessions said.
- So the candidate entry confirms something: that GL JS 3.35.2 has the procedural `building` layer, that it takes a
  GeoJSON source, and how roofs and walls are coloured. Whether naming the layer is enough is T-014.
- All three failing pages show the five buildings in terracotta and cream with different roof shapes. I have not checked
  each shape against its building. The check counts them wrong because it accepts only GL JS's layer, which the task's
  wording does not name.
- Offline, task 5 cost $3.20 to $3.72 a session, right or wrong, against $1.06 and $1.47 with a network.
- Four sessions on one task, on one model.

**Use.** $10.26 for the 3 sessions; 3 map loads to grade them.

