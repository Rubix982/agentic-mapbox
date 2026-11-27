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
layer and drew the roofs by hand). C-015 closed on 2026-11-26 (with GL JS's building layer named, 2 of 3 right; the miss
was `building_part` for `building-part`). C-016 closed on 2026-11-26 (with `building-part` told, every page coloured
right; the miss was a clip layer that removed the page's own buildings). C-017 closed on 2026-11-27 (a skill whose
description names the three tasks' features was opened 3 of 3 times, first, with nothing downloaded). C-018 closed on
2026-11-27 (a clip removes a page's own buildings when drawn after them, whatever its scope; 8 of 8 as the code predicts). C-019
closed on 2026-11-27 (the description cut to names only, or to task words only, was opened 3 of 3 times either way). C-012
closed on 2026-11-27 (the three settings right 3 of 9 times without help, 8 of 9 with one sentence telling the model to
search the schema by title). C-020 closed on 2026-11-27 (a skill added beside Mapbox's 27 was opened 3 of 3 times even with a plain name and
a general description, so C-017 and C-019's descriptions are not what got it read). C-021 closed on 2026-11-27 (C-012's sentence on
the other 45 settings: 43 right by C-004's check, all 45 by what they do). C-022 closed on 2026-11-27 (C-006's setup
run again: Mapbox's 27 skills opened 0 of 3 times, as on 25 November). C-023 closed on 2026-11-27 (judged by what
they do to the map, 0 of 24 earlier verdicts flip; every earlier count stands). C-024 closed on 2026-11-27 (C-020's
general description given to Mapbox's own web-integration skill: opened 0 of 3). C-025 closed unstarted on 2026-11-27
(no run of C-004's check is planned, so T-023 is parked). C-026 closed on 2026-11-27 (the added skill renamed
`mapbox-web-map-patterns`: opened 1 of 3, against 3 of 3 under its plain name). C-027 closed on 2026-11-27 (side by
side, both names 1 of 3; added skills were opened on every task in the morning and only on task 5 in the afternoon, so
C-024 and C-026's readings do not hold). C-028 closed on 2026-11-27 (nothing the transcripts record splits the morning
from the afternoon). C-029 closed on 2026-11-27 (in the afternoon C-017's skill, naming the features, was still opened
on all three tasks). One card at a
time.

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

**Status:** answered (C-012)
**Parent:** T-002
**Opened:** 2026-11-25
**Question:** In C-004 the model, unsure, searched `map.getSchema('basemap')`'s setting names for "lane" and found
nothing. "Lane" is in the settings' titles ("Lane details"), not their names (`showHdRoads`). A sentence such as "search
the schema's titles as well as its names, and check `getConfigProperty` afterwards, because GL JS ignores unknown names
silently" might fix all three misses without listing any name. Rerunning the three missed requests with that sentence
would say whether a general rule is enough, or whether the names themselves have to be given.
**Answer:** a general rule is enough: 3 of 9 right without the sentence, 8 of 9 with it, and no session with it missed
on the name (C-012). Opened T-019.

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

**Status:** answered (C-017)
**Parent:** T-005
**Opened:** 2026-11-25
**Question:** In C-006 the model skipped 27 Mapbox skills with general descriptions even on tasks it did not know. A
skill whose description names `clip`, `model-color-mix-intensity` and `building-part`, run on the same three tasks,
would say whether the description's wording is what decides, or whether skills are skipped whatever they say.
**Answer:** yes, it was opened, in 3 of 3 sessions, each as the first tool call, with nothing downloaded (C-017). The
description also used the tasks' own words, so naming the feature and describing the task are not separated. Opened
T-017.

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

**Status:** answered (C-015)
**Parent:** T-011
**Opened:** 2026-11-26
**Question:** Task 5's wording asks for the picture, and only its check names the procedural `building` layer. A version
of the task that says to use that layer, run offline, would say whether the model knows how to use it (`building-part`
for roof and wall colours) or only doubted that it exists. C-014's passing session wrote the layer right from memory,
so the question is now whether naming the layer is enough to make the model trust it.
**Answer:** mostly (`evals/results.md`, C-015): 2 of 3 right, against 1 of 4 without the sentence. All three used the
layer; the miss spelt the part property `building_part`. Opened T-015.

### T-015 · With `building-part` added to the entry, is task 5 right every time offline?

**Status:** answered (C-016)
**Parent:** T-014
**Opened:** 2026-11-26
**Question:** In C-015 the one sentence naming GL JS's building layer gave 2 of 3, and the miss spelt the part property
`building_part`. The same three offline runs with the entry extended ("each part's colour is evaluated with the part's
name, roof or wall, in the feature property `building-part`") would say whether the entry then needs nothing more.
**Answer:** 2 of 3 (`evals/results.md`, C-016), and all 3 coloured right. The miss added a `clip` layer that removed
its own buildings, even when limited to the basemap. Opened T-016.

### T-016 · Does a clip layer limited to the basemap remove a page's own procedural buildings?

**Status:** answered (C-018)
**Parent:** T-015
**Opened:** 2026-11-26
**Question:** In C-016 a `clip` layer with `clip-layer-scope: ['basemap']` still removed the page's own `building`
layer, though the style spec says that scope "will only remove content from the Mapbox Standard style layers". One
minimal page with a clip layer, a fill-extrusion and a building layer, with and without the scope, would say whether
this is GL JS's behaviour in general, and for which layer types. C-017's task 5 page added its clip before its own
building layer and passed, where C-016's run 0 added it after, so render order may be what decides.
**Answer:** yes, for any clip drawn after the building layer, whatever its scope or types; a clip drawn before it
removes nothing of it (C-018, 8 of 8 map loads as GL JS's code predicts). The building bucket checks only the drawing
order. A fill-extrusion over the page's own GeoJSON was not removed.

### T-017 · Is a skill opened when its description names the feature but not the task's words?

**Status:** answered (C-019)
**Parent:** T-012
**Opened:** 2026-11-27
**Question:** C-017's skill was opened 3 of 3, but its description both named the properties and described the tasks in
words close to their own, written knowing the tasks. A description of property names alone, or one written before the
tasks, on the same three tasks would say which part gets a skill opened.
**Answer:** either half was enough: names only and task words only were each opened 3 of 3 times, first (C-019). All
the descriptions share "Mapbox GL JS v3.35" and the skill's name, which may be what does it. Opened T-018.

### T-018 · Is it the skill's name, or "Mapbox GL JS v3.35" in its description, that gets it opened?

**Status:** answered (C-020)
**Parent:** T-017
**Opened:** 2026-11-27
**Question:** In C-017 and C-019 three descriptions were each opened 3 of 3 times. All three open with "Mapbox GL JS
v3.35", matching the prompt's version, and belong to a skill named `gl-js-3d-layers`; none of Mapbox's 27 skills has
either. The same skill with a general description in Mapbox's style ("patterns for Mapbox GL JS web maps"), once with
the version and once without, on the same three tasks, would say whether either alone gets it opened.
**Answer:** neither is needed. With a general description it was opened 3 of 3 times with the name and version, 3 of 3
with the name alone, and 3 of 3 with a plain name (`web-map-patterns`) and no version (C-020). So no description tried
explains why it was opened. Opened T-020.

### T-019 · Does C-012's sentence cost anything on the 45 settings the model already names right?

**Status:** answered (C-021)
**Parent:** T-010
**Opened:** 2026-11-27
**Question:** In C-012 one sentence telling the model to search `map.getSchema('basemap')` by title took the three
settings it named wrong from 3 of 9 right to 8 of 9. The sentence was written for those three. Running all 48 of C-004's
requests once with it would say whether it breaks any of the 45 the model got right without help.
**Answer:** nothing seen in what the answers do: 43 of 45 by C-004's check, and the two misses did what was asked when
loaded (C-021). Every answer searched the schema, though, and the median answer grew from 63 characters to 2,428.
Opened T-021.

### T-020 · Run again today, does C-006's setup still open none of Mapbox's 27 skills?

**Status:** answered (C-022)
**Parent:** T-018
**Opened:** 2026-11-27
**Question:** In C-017 to C-020 every skill added beside Mapbox's 27 was opened on tasks 2, 3 and 5, 21 sessions of 21,
however its description read. In C-006, two days earlier, with the same Claude Code version, model and plugins, Mapbox's
27 alone were opened 0 of 3. C-006's run once more (three sessions) would say whether that 0 of 3 holds today. If it
does, something about the added skill beyond its words gets it opened; if not, C-006's 0 of 3 was chance or something
has changed, and C-017 to C-020's comparisons with it fall.
**Answer:** yes, 0 of 3 again (C-022), so 0 of 6 on two days against 21 of 21 for an added skill. The added skill's
place in the list was already ruled out (3rd of 68 in C-017, 30th in C-020, opened either way), which leaves its name
or description. Opened T-022.

### T-021 · Should C-004's check judge a setting by what the map shows rather than by one value?

**Status:** answered (C-023)
**Parent:** T-019
**Opened:** 2026-11-27
**Question:** In C-021 two answers did what was asked (a greyscale map; brighter roads at night) and C-004's check marked
both wrong, because it wants one value read at the default light preset. Which of C-004's 48 checks would mark a
different right answer wrong, and does any earlier count change if they judged by what the map shows?
**Answer:** no earlier count changes (C-023). Of the 24 answers in C-004, C-012 and C-021 whose records show anything
beyond the one setting, none flips: the 11 marked wrong change nothing on the map, and the 13 marked right that did
more did what was asked. C-021's two remain the only miscounts, of 111. The first half, which checks would mark a second
right answer wrong, matters only if the check is run again, and is T-023.

### T-022 · What in an added skill's name or description gets it opened where Mapbox's 27 are not?

**Status:** answered (C-024)
**Parent:** T-020
**Opened:** 2026-11-27
**Question:** On tasks 2, 3 and 5 a skill added beside Mapbox's 27 was opened 21 of 21 times and Mapbox's 27 alone 0 of
6 (C-006, C-022). A session sees each skill only as its name, description and place, and the place is ruled out. C-020's
general description ("Mapbox GL JS patterns and snippets for web maps: setting up a map, adding sources and layers, and
styling them") names the kind of work the tasks are, where Mapbox's name a framework, platform, use case or migration.
Swapping descriptions would say which: give one of Mapbox's own skills that description with no skill added, or give
the added skill the description of Mapbox's `mapbox-web-integration-patterns`, three sessions each.
**Answer:** not the description alone (C-024). Given to Mapbox's `mapbox-web-integration-patterns`, C-020's general
description was opened 0 of 3 times, where on the added `web-map-patterns` it was opened 3 of 3, listed in nearly the
same place. Left: the name, or the skills listed around it. Opened T-024. Later (C-027): does not hold. C-024 ran in
the afternoon and was set against a morning run; in the afternoon the added skill itself was opened 1 of 3 times.

### T-023 · Before C-004's check is run again, which of its 48 checks would mark a second right answer wrong?

**Status:** parked (C-025, closed unstarted)
**Parent:** T-021
**Opened:** 2026-11-27
**Question:** In C-021, with C-012's sentence, answers grew longer and found second routes: a custom greyscale colour
table for `theme`, a night-only `roadsBrightness`. The check credited neither. If the check is used again, for example
on the sentence's next version, which of its 48 requests can be met some way other than the one value it reads, and
should those be judged by what the map shows? Nothing earlier changes either way (C-023), so this matters only before
another run.
**Answer:** — Parked on 2026-11-27: no new run of the check is planned, and C-023 showed no count already made depends on
it (C-025, field 6). Resume before the check is next run. Untested candidates from reading the 48: `show3dObjects`
met by turning off its three parts one by one, and `showAdminBoundaries` met by a transparent `colorAdminBoundaries`.
The two known are `theme` and `roadsBrightness` (C-021).

### T-024 · Is it the added skill's name that gets it opened, or the skills listed around it?

**Status:** answered (C-026)
**Parent:** T-022
**Opened:** 2026-11-27
**Question:** C-020's general description was opened 3 of 3 times on an added skill named `web-map-patterns`, beside
Mapbox's own `mapbox-web-integration-patterns` and its framework description, and 0 of 3 times when it replaced that
description (C-024). All 27 of Mapbox's skills start with `mapbox-`; no added skill tried did. Adding the same skill
as `mapbox-web-map-patterns` changes only the name against C-020's arm C. If it is opened 0 or 1 times, the name gets
it opened; if 2 or 3, the name is not it, and what is left is Mapbox's own framework description listed beside it.
Three sessions.
**Answer:** the name, weakly (C-026). Renamed `mapbox-web-map-patterns`, in the same place in the list, the skill was
opened 1 of 3 times against 3 of 3 as `web-map-patterns`. On three sessions each that split comes up about one time in
five by chance. Opened T-025. Later (C-027): does not hold; at the same time the two names were opened 1 of 3 each.

### T-025 · Over more sessions, is the added skill still opened less often under a `mapbox-` name?

**Status:** answered (C-027)
**Parent:** T-024
**Opened:** 2026-11-27
**Question:** C-020's arm C (`web-map-patterns`) opened the skill 3 of 3 times on tasks 2, 3 and 5; C-026, the same
skill renamed `mapbox-web-map-patterns` in the same place, 1 of 3. That split comes up about one time in five by chance.
Running each arm once more on the three tasks, six sessions for about $3.5, would give six sessions an arm and show
whether the gap holds.
**Answer:** no gap at the same time: each name was opened 1 of 3 times (C-027), 4 of 6 against 2 of 6 in all. Arm C
itself fell from 3 of 3 at 04:14 UTC to 1 of 3 at 13:46, and every added skill run in the afternoon was opened only on
task 5. Opened T-026.

### T-026 · What changed between 04:14 and 13:28 UTC on 27 November, so that added skills stopped being opened on tasks 2 and 3?

**Status:** parked (C-028, C-029)
**Parent:** T-025
**Opened:** 2026-11-27
**Question:** Added skills were opened on tasks 2 and 3 in all 12 morning sessions (C-017 to C-020) and none of 6
afternoon ones (C-026, C-027), with the same Claude Code, model, tools, plugins and skills in the start-up record. On
task 5 they were opened every time, 9 of 9. Mapbox's skills alone were opened 0 of 9 throughout. Three cheap steps
would narrow it: run C-017's skill, whose description names the tasks' features, again now (3 sessions, about $1 to
$2.5), to see whether such a description is still opened on tasks 2 and 3; have one session copy out the Skill tool's
own text now (about $0.2), so a later change to it can be seen; and run arm C again on another day.
**Answer:** — Not known what changed: nothing the transcripts record splits the two halves of the day, and the first
prompt was the same size to within the name tried (C-028). Its effect was on the general description only: C-017's
skill, naming the features, was opened on all three tasks at 14:31 (C-029). Copying out the Skill tool's text is not
needed, since the prompt's size is recorded in every transcript. Parked on 2026-11-27; resume by running arm C
(`evals/skills/c020-neither/web-map-patterns`) on another day, three sessions, to see whether the morning's behaviour
comes back.
