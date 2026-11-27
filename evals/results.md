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
