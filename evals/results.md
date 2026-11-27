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
  specific. A skill whose description named the feature was not tested here (T-012); in C-017 one was, and all three sessions
  opened it.
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

## C-015: task 5 offline with GL JS's building layer named (2026-11-26)

```
node evals/run_eval.mjs --set tasks-3x --tasks 5 --arms offline --runs 3 --concurrency 1 \
  --note "Draw them with GL JS's procedural building layer (\`type: 'building'\`), which v3.35.2 has and which can draw a GeoJSON source."
```

The offline arm is as in C-013 and C-014, and the note is added to the end of the task's text. It settles two of the three
doubts C-014's sessions gave (does the layer exist, does it take GeoJSON) and leaves the property names and the
colouring to memory. Records: `results/c015-20261126-065716.jsonl`. Screenshots: `results/c015-task5-named-run0.png` to
`-run2.png`.

**2 of the 3 were right first time, against 1 of 4 without the sentence.** Each session tried once to download GL JS,
and the sandbox refused it.

| Run | Right? | Turns | Minutes | Cost, USD | Page |
|---|---|---|---|---|---|
| 0 | no: every roof cream | 6 | 3 | 0.79 | `building` layer, colour by `building_part`, 124 lines |
| 1 | yes | 10 | 7 | 1.31 | `building` layer, colour by `building-part`, 266 lines |
| 2 | yes | 6 | 4 | 0.78 | `building` layer, colour by `building-part`, 138 lines |
| **All** | **2 of 3** | | | **2.88** | |
| C-014, for comparison | 1 of 3 | 7 to 33 | 16 to 18 | 3.22 to 3.72 | two hand-drawn in WebGL, 588 and 766 lines |

**The miss was one character.** Run 0 wrote `['downcase', ['to-string', ['get', 'building_part']]]` and tested it for
"roof". GL JS's property is `building-part`, so the expression found nothing and every surface took the wall colour.
The roof shapes and heights were right. The session had flagged this in its last message: "If v3.35.2 doesn't provide
that value, every surface comes out cream."

**What this does and does not show.**
- Naming the layer changed what the sessions did. All three used it, against one session in four without the sentence,
  and none drew anything by hand.
- From memory, the model got the layer's heights and roof shapes right 3 times in 3, and the part property's spelling 2
  times in 3.
- So the first guide entry is the sentence, with `building-part` as its known gap (T-015).
- The task here says to use the layer. Whether the entry helps an agent whose task does not say so, if it reads the
  entry somewhere else, is not tested.
- Three sessions on one task, on one model. 2 of 3 against 1 of 4 is a difference in what the sessions chose, which was
  total (3 of 3 used the layer, against 1 of 4); the difference in right answers is too small to call at these counts.

**Use.** $2.88 for the 3 sessions; 3 map loads to grade them.

## C-016: task 5 offline with the entry extended by `building-part` (2026-11-26)

As C-015, with a second sentence added to the note: "It evaluates `building-color` once for each part of a building,
with the part's name (`roof`, `wall`, `window` or `door`) in the feature property `building-part`." Those
are the four names GL JS 3.35.2's code sets, and no others. Records: `results/c016-20261126-152435.jsonl`. Screenshots:
`results/c016-task5-entry-run0.png` to `-run2.png`.

**2 of the 3 were right first time, and all 3 coloured their buildings right.** Each session tried once to download GL
JS, and the sandbox refused it.

| Run | Right? | Turns | Minutes | Cost, USD | Page |
|---|---|---|---|---|---|
| 0 | no: nothing drawn | 9 | 5 | 1.09 | `building` layer coloured by `building-part`, plus a `clip` layer over its own footprints, 255 lines |
| 1 | yes | 7 | 2 | 0.67 | `building` layer coloured by `building-part`, 107 lines |
| 2 | yes | 5 | 3 | 0.71 | `building` layer coloured by `building-part`, 131 lines |
| **All** | **2 of 3** | | | **2.48** | |

**Run 0's clip layer removed its own buildings.** GL JS's evaluation of its building layer gave every height, roof shape
and colour right, but from above the check found park green at every footprint's centre, and the page's own screenshot
shows no planned buildings. The page had added a `clip` layer over the footprints with `clip-layer-types: ['model']`,
to remove Standard's 3D trees standing on the plots. `node evals/clip_test.mjs` loads that page (saved as
`results/c016-run0/index.html`) three ways (`results/c016-clip-test.json`):

| The page's clip layer | Task 5's check |
|---|---|
| as written | fails: 0 of 5 roofs seen from above |
| removed | passes |
| limited to the basemap, `clip-layer-scope: ['basemap']` | fails: 0 of 5 roofs seen from above |

The style spec says a clip layer "removes 3D content from map", and that `clip-layer-scope: ['basemap']` "will only remove
content from the Mapbox Standard style layers". With that scope, this page's own building layer, which is not one of
Standard's, was removed all the same. That is one page; whether it holds in general is T-016.

**What this does and does not show.**
- With `building-part` named, the colouring came out right 3 times in 3, against 2 in 3 with the first sentence alone
  (C-015). The building layer itself raised no failure in these three runs.
- The failure is a different fact, one the entry does not cover: in GL JS 3.35.2 a clip layer removes a page's own
  procedural buildings beneath it, even when scoped to the basemap.
- The style spec marks the `building` layer type `"private": true`. That may be why the model doubted the layer
  offline; it is not tested.
- Three sessions on one task, on one model, and every task here says to use the layer.

**Use.** $2.48 for the 3 sessions; 3 map loads to grade them and 5 for the clip test.

## C-017: the three tasks again, with one skill that names their features (2026-11-27)

```
node evals/skill_description_check.mjs evals/skills/gl-js-3d-layers
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/gl-js-3d-layers
```

Set up as C-006's with arm: Mapbox's 27 skills at `84d991e` loaded as a plugin, its MCP servers removed, the user's own
plugins loaded. One skill was added beside the 27, `skills/gl-js-3d-layers/SKILL.md`. Its 536-character description
names the three features tasks 2, 3 and 5 need (`model-color-mix-intensity`, the `clip` layer with `clip-layer-types`,
the procedural `building` layer with `building-part`) and says what each is for. Its body has a snippet for each on
made-up data, and only facts checked in GL JS 3.35.2's style spec or in `tasks-3x/validation.md`. Records:
`results/c017-20261127-030055.jsonl` and `results/c017-description-check.json`. Screenshots:
`results/c017-task2-with-skill.png`, `-task3-` and `-task5-`.

**The description reaches the model whole.** A one-turn session with the same plugin copied the description out of its
list of skills, all 536 characters exactly, without calling a tool. That took three sessions:
- The first reply was lost, because my script did not keep it.
- The second denied every tool, the Skill tool included, and the session said it had been given no list of skills. In
  Claude Code the list of skills comes with the Skill tool.
- The third allowed the Skill tool alone and asked the session not to call it.

**All three sessions opened the added skill, as their first tool call.** None opened any of Mapbox's 27 skills, none
downloaded anything, and all three were right first time.

| Task | Turns | Cost, USD | After opening the skill | C-006, same task: turns, cost, first download |
|---|---|---|---|---|
| 2. Delivery vans (model colour mix) | 6 | 0.34 | read the data and the glTF, wrote the page | 17, $0.88, 8th tool step |
| 3. Clearing the site (clip) | 5 | 0.25 | read the data, wrote the page | 15, $0.59, 5th tool step |
| 5. Planned buildings (roof and wall colours) | 5 | 0.29 | read the data, wrote the page | 39, $1.47, 5th tool step |
| **All** | **16** | **0.87** | | **71, $2.94** |

**What this does and does not show.**
- What the model sees of a skill before opening it is its name and description. With only one skill added, opening
  went from 0 of 3 (C-006) to 3 of 3. So skills are not skipped whatever they say: one whose description named the
  features these tasks need was opened every time.
- It does not separate naming the property from describing the task. The description does both: it names
  `clip-layer-types`, and it says "removing Mapbox Standard's own 3D buildings and trees inside an area", close to task
  3's own words. The skill's name differs from Mapbox's too.
- I wrote the description knowing the tasks. A guide written before its tasks are known would have to guess their words
  (T-017).
- Right first time follows from the skill's body, which has a snippet for each feature. C-006 was 3 of 3 right too, by
  downloading GL JS's code; what changed is that no session had to.
- One session per task, on one model, with one description.

**One more page for T-016.** Task 5's page added a clip layer over its own footprints, as C-016's failing run 0 did, and
passed. It added the clip before its building layer, with a comment saying that keeps the clip off the planned
buildings; the skill says a clip removes content from the layers drawn before it. C-016's run 0 added its clip after
its building layer. That points at render order rather than scope deciding what a clip removes, on one page each way.

**Use.** $0.87 for the 3 sessions and $0.60 for the 3 check sessions; 3 map loads to grade them.

**Later (C-029).** Repeated at 14:31 UTC, after added skills with a general description had stopped being opened on
tasks 2 and 3: opened first on all three again, nothing downloaded, $0.80.

## C-018: which clip layers remove a page's own buildings (2026-11-27)

`node evals/clip_order_test.mjs`. Task 5's reference page (`tasks-3x/reference/task5.html`) loaded eight ways, each
once, with a clip layer over its own five footprints. Each is measured as task 5's check measures roofs: seen from above
at zoom 16.5 with Standard's labels and trees hidden, how many footprints are terracotta at their centre. No Claude
session. Record: `results/c018-clip-order.json`.

The predictions come from GL JS 3.35.2's code (`mapbox-gl-dev.js`), read before the loads. A procedural building
bucket's `updateReplacement` skips a clip only when the clip is drawn before the layer (`region.order < layerIndex`),
and reads neither `clip-layer-scope` nor `clip-layer-types`. Only the model bucket goes through `skipClipping`, which
applies the scope. `isLayerClipped` returns false for a fill-extrusion unless its source layer is `building` or
`procedural_buildings`.

| Own layer | Clip layer | Predicted | Terracotta, of 5 |
|---|---|---|---|
| building | none | 5 | 5 |
| building | after it, `clip-layer-types: ['model']` | 0 | 0 |
| building | after it, `['model']`, `clip-layer-scope: ['basemap']` | 0 | 0 |
| building | after it, no layout at all | 0 | 0 |
| building | before it, `['model']` | 5 | 5 |
| building | before it, `['model']`, scope `['basemap']` | 5 | 5 |
| fill-extrusion, `#b5523b` | none | 5 | 5 |
| fill-extrusion, `#b5523b` | after it, `['model']` | 5 | 5 |

Where the buildings were removed, every centre read park green (178 to 196, 234 to 238, 173 to 191); where they were
kept, terracotta (166 to 180, 75 to 82, 54 to 59). In all eight, `queryRenderedFeatures` still returned all five
footprints, so a removed building can still be queried.

**What this does and does not show.**
- In GL JS 3.35.2 a clip layer removes a procedural building layer drawn before it, whatever its scope and types, and
  keeps one drawn after it. The style spec's sentence that the `basemap` scope "will only remove content from the
  Mapbox Standard style layers" does not hold for building layers. Whether the code or the spec says what Mapbox
  intends, these loads cannot say.
- C-016's failing page and C-017's passing one fit this: the first added its clip after its building layer, the second
  before.
- A fill-extrusion over a page's own GeoJSON was not removed, as `tasks-3x/validation.md` (item 5) already found.
- That the scope still limits a clip's effect on models and symbols is read from the code, not loaded here.
- One page, one location, software WebGL.

**Use.** 8 map loads.

## C-019: C-017's description cut two ways (2026-11-27)

```
node evals/skill_description_check.mjs evals/skills/c019-names/gl-js-3d-layers --out c019-names-description-check.json
node evals/skill_description_check.mjs evals/skills/c019-task-words/gl-js-3d-layers --out c019-task-words-description-check.json
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c019-names/gl-js-3d-layers
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c019-task-words/gl-js-3d-layers
```

C-017's setup, with the skill's description cut two ways and its name and body unchanged. **names** (271 characters)
lists only the API's names: "Mapbox GL JS v3.35 reference for `addModel`, the `model` layer, `model-rotation`,
`model-color` and `model-color-mix-intensity`; the `clip` layer and `clip-layer-types`; and the procedural `building`
layer with `building-roof-shape`, `building-color` and `building-part`." **task words** (320 characters) names none of
them: "Mapbox GL JS v3.35: how to place a 3D model file at many points, each turned to its own heading and coloured from
its own properties; how to remove Mapbox Standard's own 3D buildings and trees inside an area; and how to draw 3D
buildings from your own footprints with real roof shapes and separate roof and wall colours." Records:
`results/c019-names-20261127-031511.jsonl`, `results/c019-task-words-20261127-031612.jsonl` and the two
`results/c019-*-description-check.json`.

Both checks copied their description out of the list exactly, with no tool called.

**Both arms opened the skill 3 of 3 times, each as the first tool call.** All six were right first time, and none
downloaded anything.

| Task | Words shared with the task's text, names arm | Words shared, task-words arm | Turns, cost: names | Turns, cost: task words |
|---|---|---|---|---|
| 2 | model | 3d, model, file, point, turned, heading, coloured, standard | 6, $0.30 | 6, $0.29 |
| 3 | building | 3d, remove, standard, building, tree, inside | 5, $0.26 | 5, $0.25 |
| 5 | building | 3d, standard, building, footprint, real, roof, shape, wall | 5, $0.27 | 5, $0.35 |
| **All** | | | **$0.83** | **$0.89** |

(Shared words: each text lower-cased, punctuation and a final "s" dropped, and common words such as "the", "and",
"mapbox" and "gl" left out.)

**What this does and does not show.**
- Either half of C-017's description was enough on these tasks. The names arm shares one word with each task's text,
  and task 3's text has neither `clip` nor any other name in it, yet task 3 opened the skill too.
- So it is not the overlap of words with the task that got the skill opened, or not only that. What all three
  descriptions share is the opening "Mapbox GL JS v3.35", which matches the prompt's "Mapbox GL JS v3.35.2", and the
  skill's name, `gl-js-3d-layers`. Neither is in any of Mapbox's 27, and either alone might be what does it (T-018).
- Both task 5 pages added a clip layer before their building layer, as C-017's did, and passed (C-018).
- One session per task and arm, on one model.

**Use.** $1.72 for the 6 sessions and $0.37 for the 2 check sessions.

## C-012: one sentence for the three Standard settings named wrong (2026-11-27)

```
node evals/config/run.mjs --only showHdRoads,colorHdRoads,colorMix3dLandmarks --runs 3 --first 3 --max-avg-cost 5 --max-total-cost 15
node evals/config/run.mjs --only showHdRoads,colorHdRoads,colorMix3dLandmarks --runs 3 --first 3 --max-avg-cost 5 --max-total-cost 15 --hint
node evals/config/run.mjs --only showHdRoads --runs 1 --first 1 --max-avg-cost 5 --max-total-cost 15
```

C-004's requests for the three settings its sessions named wrong, three times each, set up as in C-004: one `claude -p`
session per request with no tools, no CLAUDE.md, skills, plugins or MCP servers, never told the setting's name, and
graded by running its answer and reading the setting back. The second arm adds one sentence before the prompt's last
line, naming no setting: "If you are unsure of a setting's name, search map.getSchema('basemap') at run time by each
entry's metadata['mapbox:title'] and metadata['mapbox:description'] as well as by its name, and read the value back with
map.getConfigProperty, because GL JS ignores a setting name it does not know without any warning." Both arms ran at the
same time. One session without the sentence was stopped at the 20-minute limit; the third command replaced it. Records:
`results/c004-20261127-032110.jsonl` and `results/c004-20261127-035137.jsonl` without the sentence,
`results/c004-20261127-032110-hint.jsonl` with it.

**Without the sentence 3 of 9 were right; with it, 8 of 9.**

| Setting | Right without the sentence | Right with it |
|---|---|---|
| `showHdRoads` | 0 of 3 | 3 of 3 |
| `colorHdRoads` | 1 of 3 | 3 of 3 |
| `colorMix3dLandmarks` | 2 of 3 | 2 of 3 |
| **All** | **3 of 9** | **8 of 9** |

**Why each one missed.**
- Without the sentence, five of the six misses were C-004's: the code searched the settings' names for words like
  "lane" or "landmark", which are in the titles ("Lane details") and not the names, found none, and either logged a
  warning or set names it guessed (`showLanes`, `showLaneMarkings`).
- The sixth (`showHdRoads`, run 0) gave no usable code: 139,535 characters of tool calls written out as text, in a
  session that has no tools.
- With the sentence, the one miss (`colorMix3dLandmarks`, run 0) gave no code either: "My previous reply was stopped
  partway through, so I can't send that code again here".
- All eight right answers with the sentence searched by `metadata['mapbox:title']`. None of the nine without it did.

**Cost.** Five sessions cost $1.66 to $3.19 each and took 9 to 15 minutes; the other thirteen cost $0.05 to $0.17. The
session stopped at 20 minutes reported no cost. Of the five dear ones, four were wrong, two of them with no usable code.

**What this does and does not show.**
- The sentence removed the naming miss: no session with it searched names only, and five of nine without it did and
  missed. It names no setting, so it is a general rule, not a list.
- C-004's three misses come often but not every time: `showHdRoads` was wrong 3 times in 3, `colorHdRoads` 2, and
  `colorMix3dLandmarks` 1.
- On `colorMix3dLandmarks` the sentence cannot be shown to help: 2 of 3 either way, and its one miss with the sentence
  was not about the name.
- I wrote the sentence after seeing C-004's misses on these three settings. Whether it costs anything on the 45 settings
  the model already named right is not tested (T-019).
- Three runs per setting and arm, one model, and sessions that cannot look anything up.

**Use.** $15.36 for the 18 sessions that reported a cost, plus the one stopped at 20 minutes, which reported none; at
the dear sessions' rate that one was probably about $3 to $4, so about $19 in all. One map load per arm to grade.

## C-020: a general description, with and without the version and the name (2026-11-27)

```
node evals/skill_description_check.mjs evals/skills/<arm>/<name> --out <arm>-description-check.json   # for each arm
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c020-version/gl-js-3d-layers
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c020-name/gl-js-3d-layers
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c020-neither/web-map-patterns
```

C-017's setup and skill body, with a general description that names no feature and uses none of the tasks' words:
"Mapbox GL JS v3.35 patterns and snippets for web maps: setting up a map, adding sources and layers, and styling them."

| Arm | Skill name | Version in the description | Opened | Downloaded GL JS | Cost |
|---|---|---|---|---|---|
| A | `gl-js-3d-layers` | yes | 3 of 3, each as the first tool call | 0 of 3 | $0.91 |
| B | `gl-js-3d-layers` | no | 3 of 3, each after one look at the data | 0 of 3 | $0.88 |
| C | `web-map-patterns` | no | 3 of 3 | 2 of 3 | $1.24 |

All nine were right first time. In arm C, task 2 downloaded GL JS's code before opening the skill, and task 5 opened it
first and then downloaded the code to check the building layer. All three checks copied their description out exactly.
Records: `results/c020-version-20261127-041213.jsonl`, `results/c020-name-20261127-041317.jsonl`,
`results/c020-neither-20261127-041420.jsonl` and the three `results/c020-*-description-check.json`.

**The setups match C-006's.** Claude Code 2.1.332, claude-opus-5-5, the same 27 tools and the same plugins in all of
them. The one difference is the added skill, listed 30th of 68, after Mapbox's 27.

**What this does and does not show.**
- An added skill was opened on these tasks whatever its description said, and whatever its name. None of the name,
  the version or the feature names was needed.
- So C-017 and C-019 do not show that a description naming the feature gets a skill read. Every description tried was
  read, the general one included.
- Mapbox's `data-visualization-patterns` description mentions "3D visualizations, data-driven styling … layer types",
  close to arm C's in kind, and in C-006 it was not opened. Why Mapbox's 27 went unopened there and every added skill
  here was opened is not known. It could be that C-006's 0 of 3 was chance, that something unseen changed between 25
  and 27 November, or something about the added skill other than its words, such as its place at the end of the list.
  Running C-006's setup again today separates the first two from the third (T-020). C-022 did: 0 of 3 again. And the
  place was already ruled out here: arms A and B listed the skill 3rd of 68, first of the `mapbox:` skills, and arm C
  30th, last of them. So what this shows is that none of the feature names, the version or the name `gl-js-3d-layers`
  was needed, not that the description plays no part (C-022).
- One session per task and arm, on one model.

**Use.** $3.03 for the 9 sessions and $0.53 for the 3 check sessions.

**Later (C-027, C-029).** All three of this section's counts were taken in the morning. In the afternoon the general
description was opened only on task 5 (C-027), and C-017's description on all three tasks (C-029), so in the afternoon
the wording did matter.

## C-021: C-012's sentence on the other 45 settings (2026-11-27)

```
node evals/config/run.mjs --hint --only <the 45 settings other than showHdRoads, colorHdRoads, colorMix3dLandmarks> --runs 1 --max-avg-cost 1 --max-total-cost 15
node evals/config/check_misses.mjs evals/runs/config-20261127-042216-hint
```

C-004's requests for the other 45 of the Standard style's 48 settings, once each, with C-012's sentence, set up and
graded as in C-004. Records: `results/c004-20261127-042216-hint.jsonl` and `results/c021-misses.json`.

C-004 had got 44 of these 45 right. The 45th, `showIndoorLabels`, had no answer: its session ended in an API
safeguard error.

**By C-004's check, 43 of the 45 were right. By what the two misses do, all 45 were.** All 45 sessions ran, for $6.52.

Both misses found the right setting:
- **`theme`** ("Make the whole basemap greyscale, with no colour at all"; the check wants `theme: 'monochrome'`). The
  answer set `theme: 'custom'` with a greyscale colour table it built itself in `theme-data`, falling back to
  `'monochrome'` only if that was refused. Loaded, it left no pixel with colour (largest channel minus smallest above
  12, every seventh pixel sampled). So did `'monochrome'`. Standard untouched had 73.9% of them coloured.
- **`roadsBrightness`** ("When the map is dark, make the roads stand out brighter than they do by default"; the check
  wants it at 0.41 or more). The answer raises the setting only while the light preset is dusk or night. The check reads
  it at the default `day`, where it stays 0.4. Switched to `night`, it went to 0.88.

**How the sentence changed the answers.** All 45 searched `map.getSchema('basemap')` by `metadata['mapbox:title']`,
though the sentence says to do so "if you are unsure", and C-004 had named all but one of these without help.

| | C-004, no sentence | C-021, with the sentence |
|---|---|---|
| Median answer | 63 characters, one call | 2,428 characters |
| Longest answer | 594 characters | 5,367 characters |
| Cost of the 45 | $4.83 (median $0.017) | $6.52 (median $0.066) |

**What this does and does not show.**
- On these 45 the sentence broke nothing that was checked by what it does: no search picked a wrong setting or came back
  empty.
- It does change every answer, from one known call to a search, and two of those searches did something other than the
  one call C-004's check accepts. A check that wants a given value marked them wrong, though both did what was asked.
- "If you are unsure" did not hold the model back: it searched every time.
- One session per setting, on one model.

**Use.** $6.52 for the 45 sessions; one map load to grade them and four to load the two misses.

## C-022: C-006's setup again, Mapbox's 27 skills alone (2026-11-27)

`node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with`, C-006's command unchanged: Mapbox's Agent Skills at
commit `84d991e` as a plugin, its MCP servers removed, no skill added. Records: `results/c022-20261127-091829.jsonl`.

**None of the three sessions opened a skill, as in C-006.** Each listed the same 67 skills at start-up, in the same
order, the 27 Mapbox skills among them. None called the Skill tool or read a skill's files, and no visible text
mentions a skill.

**All three downloaded GL JS's code again, and all three were right first time.**

| Task | Turns | Cost, USD | First download, in tool calls | What it fetched |
|---|---|---|---|---|
| 2. Delivery vans (model colour mix) | 18 | 0.86 | 3rd | `mapbox-gl-dev.js` from unpkg |
| 3. Clearing the site (clip) | 9 | 0.39 | 2nd | `mapbox-gl.js` from Mapbox's CDN |
| 5. Planned buildings (roof and wall colours) | 19 | 1.00 | 2nd | `mapbox-gl-dev.js` from Mapbox's CDN |
| **All** | | **2.25** | | |

C-006's first downloads came at the 8th, 5th and 5th tool step.

**What this does and does not show.**
- Mapbox's 27 skills alone were opened 0 of 6 times on these tasks, on 25 and 27 November. A skill added beside them was
  opened 21 of 21 times (C-017 to C-020). C-006's result was not chance on three sessions, and C-017 to C-020's
  comparisons with it stand.
- It is not the added skill's place in the list: it was opened 3 of 3 times listed first of the `mapbox:` skills
  (C-017, C-020 arms A and B) and 3 of 3 listed last (C-020 arm C).
- A session sees each skill only as its name and description, in its place. All 27 of Mapbox's skills, like the added
  one, carry nothing else in their front matter. So what gets the added skill opened is in its name or description,
  read next to Mapbox's. C-020 showed that none of the feature names, the version or the name `gl-js-3d-layers` was
  needed. Its general description still differs from all 27 of Mapbox's: theirs name a framework, a platform, a use
  case or a migration, and it names the kind of work the tasks are, a GL JS web map with sources and layers. Whether
  that is the cause is untested (T-022). C-024 tested it: given to Mapbox's own `mapbox-web-integration-patterns`, the
  description was opened 0 of 3 times, so it is not the cause on its own. (C-027: that does not hold. C-024 ran in the
  afternoon, when added skills were opened only on task 5, and was set against a morning run.)
- The setup was not exactly C-006's. Claude Code 2.1.332, the model and the 67 skills were the same. But a 12th plugin
  was loaded (`cc-plugin-easel`, which adds no skill), and the tool list had changed: WebFetch was gone, and
  `McpTaskCheck`, `PublishPlugin` and `ShareOnboardingGuide` were new. C-020, five hours earlier, still had C-006's 27
  tools. No C-006 session used WebFetch; all fetched with curl, as these did.
- One session per task, on one model.

**Use.** $2.25 for the 3 sessions.

## C-023: the earlier counts judged by what the answers do to the map (2026-11-27)

No new sessions and no map load. Every answer counted in C-004, C-012 and C-021 was read again where its grading record
shows anything other than the one setting changed to the value asked: the 11 marked wrong (C-021's two aside, already
loaded in C-021) and the 13 marked right that changed a second setting or name another `set…` or `addLayer` call. Each
was judged from its code and what the grading page recorded: the settings changed, anything thrown, and what GL JS and
the code printed with `console.warn` or `console.error`. Records: `results/c004-20261125-combined.jsonl`,
`results/c004-20261127-032110.jsonl`, `results/c004-20261127-035137.jsonl`, `results/c004-20261127-032110-hint.jsonl`
and `results/c004-20261127-042216-hint.jsonl`.

**No verdict flips, 0 of 24.** C-004's 44 of 48 and C-012's 3 of 9 and 8 of 9 stand. Across the three cards' 111
answers, C-021's two are the only ones the check got wrong.

| Marked | Answers | What they do | Flips |
|---|---|---|---|
| wrong | 5 | set setting names that do not exist (`showLanes`, `showLaneMarkings`, `colorModeLandmarks`, `colorLanes`, …), which GL JS ignores | 0 |
| wrong | 3 | search the schema by name, find nothing, and print a warning | 0 |
| wrong | 2 | not code: an API safeguard error (C-004, `showIndoorLabels`), and prose saying the session could not finish (C-012 with the sentence, `colorMix3dLandmarks`) | 0 |
| wrong | 1 | 139,534 characters of tool calls written out as text (C-012 without the sentence, `showHdRoads`) | 0 |
| right | 5 | change a second setting the request needs: `theme: 'custom'` with `theme-data` (2), `showLandmarkIcons: true` with "keep the landmark icons" (2), the three 3D settings with `show3dObjects` (1) | 0 |
| right | 3 | carry a fallback fill layer of their own that never ran: each starts with a `console.warn`, none was caught, and each setting read back the colour asked | 0 |
| right | 5 | name a helper of their own (`setAndVerify`, `setSinglePoiLabelColor`, `setIndoorLabelSelectColor`) that the record's scan for `set…` calls picked up; on the map they call only `getSchema`, the two config methods and, in one, a wait for the style to load | 0 |

None of the eleven wrong answers calls anything on the map other than reads of its style and config and
`setConfigProperty`, and the grading page found no setting changed after any of them.

**What this does and does not show.**
- The one-value check did not miscount any answer in C-004 or C-012. Its two misses came in C-021, where the sentence
  made every answer a longer search.
- Answers marked right that changed only the one setting were not reread. A wrong one among them would have to have
  done its harm some way other than through a setting, with no other map method named.
- Which of the 48 checks would mark a second right answer wrong, if the check is run again, is T-023.

## C-024: C-020's general description on one of Mapbox's own skills (2026-11-27)

```
node evals/skill_description_check.mjs --description "mapbox-web-integration-patterns=<the description>" --out c024-description-check.json
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --description "mapbox-web-integration-patterns=<the description>"
```

C-006's setup with one change: Mapbox's own `mapbox-web-integration-patterns` kept its name and body, and its description
was replaced, in the plugin copy, by the one C-020's arm C was opened with: "Mapbox GL JS patterns and snippets for web
maps: setting up a map, adding sources and layers, and styling them." No skill was added. The check copied that
description out of the session's list exactly. Records: `results/c024-20261127-130633.jsonl` and
`results/c024-description-check.json`.

**None of the three sessions opened a skill.** None called the Skill tool or read a skill's files, and no visible text
mentions a skill.

| Task | Turns | Cost, USD | First download, in tool calls | What it fetched |
|---|---|---|---|---|
| 2. Delivery vans (model colour mix) | 20 | 0.86 | 3rd | `mapbox-gl-dev.js` from Mapbox's CDN |
| 3. Clearing the site (clip) | 15 | 0.76 | 2nd | `mapbox-gl.js` from Mapbox's CDN |
| 5. Planned buildings (roof and wall colours) | 24 | 1.04 | 2nd | `mapbox-gl.js` and `mapbox-gl-dev.js` from Mapbox's CDN |
| **All** | | **2.66** | | |

All three were right first time.

| Setup | Skill with the general description | Listed | Opened |
|---|---|---|---|
| C-020, arm C | `web-map-patterns`, added beside Mapbox's 27 | 30th of 68 | 3 of 3 |
| C-024 | `mapbox-web-integration-patterns`, Mapbox's own | 29th of 67 | 0 of 3 |

**What this does and does not show.**
- The description alone does not get a skill opened on these tasks. The same words were opened 3 of 3 times on an
  added skill and 0 of 3 on Mapbox's, listed in nearly the same place.
- Two differences are left. One is the name: all 27 of Mapbox's skills start with `mapbox-`, and neither added skill
  tried so far did. The other is the list around it: in arm C, Mapbox's framework description for
  `mapbox-web-integration-patterns` was listed beside the general one, and here it was not. Adding the skill as
  `mapbox-web-map-patterns` would separate them (T-024).
- The setup matched C-006's exactly this time: the same 11 plugins and 27 tools, WebFetch among them. The 12th plugin and
  changed tools C-022 saw were gone.
- Three sessions against three, on one model.

**Use.** $2.66 for the 3 sessions and $0.21 for the check session.

**Later (C-027).** This section's first two bullets do not hold. Its 0 of 3 at 13:06 UTC was set against arm C's 3 of 3
at 04:14, and arm C run again at 13:46 was opened 1 of 3 times. Added skills were opened on every task in the morning
and only on task 5 in the afternoon (C-027).

## C-026: C-020's arm C again, with the skill named `mapbox-web-map-patterns` (2026-11-27)

```
node evals/skill_description_check.mjs evals/skills/c026-prefixed/mapbox-web-map-patterns --out c026-description-check.json
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c026-prefixed/mapbox-web-map-patterns
```

C-020's arm C with one change: the added skill's folder and name are `mapbox-web-map-patterns` in place of
`web-map-patterns`. Its description ("Mapbox GL JS patterns and snippets for web maps: setting up a map, adding sources
and layers, and styling them.") and body are the same, and it was listed 30th of 68, as in arm C. Tools and plugins
matched C-006's. The check copied the description out of the session's list exactly. Records:
`results/c026-20261127-132807.jsonl` and `results/c026-description-check.json`.

**One of the three sessions opened the skill.**

| Task | Opened the skill | First download, in tool calls | Turns | Cost, USD |
|---|---|---|---|---|
| 2. Delivery vans (model colour mix) | no | 2nd, `mapbox-gl-unminified.js` from Mapbox's CDN | 14 | 0.82 |
| 3. Clearing the site (clip) | no | 2nd, `npm pack mapbox-gl@3.35.2` | 19 | 0.70 |
| 5. Planned buildings (roof and wall colours) | 2nd tool call | 3rd, `mapbox-gl.js` from Mapbox's CDN | 14 | 0.57 |
| **All** | **1 of 3** | | | **2.09** |

All three were right first time.

| Setup | Skill with the general description | Listed | Opened |
|---|---|---|---|
| C-020, arm C | `web-map-patterns`, added | 30th of 68 | 3 of 3 |
| C-026 | `mapbox-web-map-patterns`, added | 30th of 68 | 1 of 3 |
| C-024 | `mapbox-web-integration-patterns`, Mapbox's own | 29th of 67 | 0 of 3 |

**What this does and does not show.**
- Against arm C only the name changed, and the skill was opened 1 of 3 times instead of 3 of 3. That fits the name
  setting the added skill apart from Mapbox's 27, all of which start with `mapbox-`.
- It does not establish it. If the name made no difference, a split of 3 against 1 on three sessions each would come up
  about one time in five (Fisher's exact test, one-sided, p = 0.2). With C-024, a `mapbox-` name with this description
  was opened 1 of 6 times against the plain name's 3 of 3 (p = 0.048). C-024 also lacks Mapbox's framework description
  beside it, though, so it is not a clean repeat.
- The prefix made the skill less often opened, not never: task 5 opened it first, as in arm C.
- Three sessions against three, on one model. More sessions of both arms is T-025.

**Use.** $2.09 for the 3 sessions and $0.21 for the check session.

**Later (C-027).** This section's first three bullets do not hold. Run at the same time, at 13:46 UTC, the plain and
`mapbox-` names were each opened 1 of 3 times. The 3 of 3 it was set against came from 04:14.

## C-027: both names again, side by side (2026-11-27)

```
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c020-neither/web-map-patterns
node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/c026-prefixed/mapbox-web-map-patterns
```

C-020's arm C and C-026's arm, unchanged, started together at 13:46 UTC. The start-up record had C-006's tools and
plugins and one skill more than C-026's, installed on this machine in between (`system-design-brain`). No check
sessions: both descriptions had been copied out exactly before (C-020, C-026). Records:
`results/c027-plain-20261127-134613.jsonl` and `results/c027-prefixed-20261127-134615.jsonl`.

**Each name was opened 1 of 3 times, both on task 5.**

| Task | `web-map-patterns` | `mapbox-web-map-patterns` |
|---|---|---|
| 2. Delivery vans | not opened; downloaded GL JS at the 3rd tool call | not opened; downloaded at the 3rd |
| 3. Clearing the site | not opened; downloaded at the 2nd | not opened; downloaded at the 2nd |
| 5. Planned buildings | opened at the 2nd tool call, then downloaded at the 3rd | opened at the 2nd, then downloaded at the 3rd |
| Cost, USD | 2.17 | 1.73 |

All six were right first time. With C-020 and C-026, the plain name was opened 4 of 6 times and the `mapbox-` name 2 of
6 (Fisher's exact test, one-sided, p = 0.28).

**Every run with an added skill splits by time of day.**

| 27 November, UTC | Runs | Task 2 | Task 3 | Task 5 |
|---|---|---|---|---|
| 03:00 to 04:14, added skill, six versions | C-017, C-019 (2), C-020 (3) | 6 of 6 | 6 of 6 | 6 of 6 |
| 13:28 to 13:46, added skill, two names | C-026, C-027 (2) | 0 of 3 | 0 of 3 | 3 of 3 |
| any time, Mapbox's skills only | C-006 (25 Nov), C-022, C-024 | 0 of 3 | 0 of 3 | 0 of 3 |

**What this does and does not show.**
- Run at the same time, the two names came out the same. The gap C-026 reported came from setting an afternoon run
  against a morning one.
- On tasks 2 and 3, 12 of 12 in the morning against 0 of 6 in the afternoon would come up about once in 18,000 by
  chance if nothing had changed. The start-up record shows the same Claude Code 2.1.332, model, tools, plugins and
  skills, apart from the names tried and the one skill installed in between, which C-026 did not have and still got 1
  of 3. So what changed is not in that record. The Skill tool's own text is not in it, and nor is anything on the
  server's side.
- C-024 set its 0 of 3 (13:06) against arm C's 3 of 3 (04:14) too, so it says nothing about the description.
- What holds at every time tried: Mapbox's skills alone were opened 0 of 9 times, and on task 5 an added skill was
  opened 9 of 9 times against Mapbox's 0 of 3 (about one time in 220 by chance).
- The morning runs' comparisons with each other stand as counts: every description and name tried then was opened 3 of
  3, listed first or last of the `mapbox:` skills.
- What changed between 04:14 and 13:28 is T-026.

**Use.** $3.89 for the 6 sessions.

## C-028: what the transcripts record, morning against afternoon (2026-11-27)

No new sessions. The 27 transcripts of sessions with an added skill, 18 from 03:00 to 04:14 UTC (C-017, C-019, C-020)
and 9 from 13:28 to 13:46 (C-026, C-027), compared on every field they record beyond the start-up list. The transcripts
are git-ignored; the figures below were read from them.

**No recorded field splits the morning from the afternoon.**

| Field | Morning (18) | Afternoon (9) |
|---|---|---|
| Model on every assistant turn, and in the result's model usage | `claude-opus-5-5` | `claude-opus-5-5` |
| Service tier, speed, inference region | standard, standard, global | standard, standard, global |
| Fast mode | off | off |
| Cached first part of the prompt, tokens | 13,524 | 13,524 |
| Whole first prompt, task 2, tokens | 46,153 to 46,313 | 46,158 (C-026); 46,419 and 46,422 (C-027) |

The first prompt's size moves only with what was changed on purpose. C-020's arm C at 04:14 began task 2 with 46,153
tokens. C-026 at 13:28, the same skill with `mapbox-` added to its name, began with 46,158. C-027's two runs began about
266 higher, matching the one skill installed on the machine in between. So the system prompt, the tools' text and the
list of skills did not change in length. The only change to the Skill tool's text this leaves open is one that kept its
length exactly.

**What differs is what the sessions did, after they chose.** In the afternoon they took more tool calls, had 7 to 13
thinking blocks against 2 to 4 in the morning (one morning session had 9), and 7 of the 9 started background downloads
of GL JS. That follows from not opening the skill. The thinking text is not recorded, only its signature, so the
transcripts cannot say why a session chose as it did.

**What this does and does not show.**
- By everything recorded, the model, its settings and the prompt were the same in both halves of the day.
- It cannot rule out a change on the server's side that the transcript does not report, or a change to the Skill
  tool's text of exactly the same length.
- Having a session copy out the Skill tool's text as a baseline (T-026) is not needed: every transcript already records
  the prompt's size, and a change to the text would show there unless it kept exactly the same length.

**Use.** None.

## C-029: C-017's skill again, in the afternoon (2026-11-27)

`node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill evals/skills/gl-js-3d-layers`, C-017's
command unchanged, at 14:31 UTC. The skill's description names the features the three tasks need. It was listed 5th of
69, and the tools and plugins matched C-006's. Records: `results/c029-20261127-143115.jsonl`.

**All three sessions opened the skill as their first tool call, downloaded nothing, and were right first time.**

| Task | Turns | Cost, USD | C-017's cost, USD |
|---|---|---|---|
| 2. Delivery vans | 6 | 0.28 | 0.34 |
| 3. Clearing the site | 5 | 0.25 | 0.25 |
| 5. Planned buildings | 5 | 0.27 | 0.29 |
| **All** | | **0.80** | **0.87** |

Beside the afternoon's other runs:

| 27 November, afternoon, UTC | Description | Task 2 | Task 3 | Task 5 |
|---|---|---|---|---|
| 13:28 to 13:46 (C-026, C-027) | general, two names | 0 of 3 | 0 of 3 | 3 of 3 |
| 14:31 (C-029) | names the features | 1 of 1 | 1 of 1 | 1 of 1 |

**What this does and does not show.**
- A description naming the features was opened on all three tasks in the afternoon as in the morning, so C-017's
  result holds at both times seen.
- In the afternoon the description mattered. On tasks 2 and 3 the feature-naming one was opened 2 of 2 times and the
  general one 0 of 6, a split that would come up about one time in 28 by chance. In the morning both were opened every
  time (C-017, C-020), so C-020's "the wording is not what got it read" held only then.
- What changed between 04:14 and 13:28 is not known (C-028). It changed how often a general description was opened,
  and not the one naming the features.
- Three sessions, on one model.

**Use.** $0.80 for the 3 sessions.
