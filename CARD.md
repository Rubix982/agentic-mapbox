# CARD

The live card is below the template. One card open at a time; a card closes with a number, or a sentence that could
have come out the other way.

```
### C-xxx · title
**Opened / Closed:**
1. WHERE WE ARE      the last thing established, as a number or a fact
2. WHAT WE ARE DOING one action a second person could carry out
3. WHY               what is not known now that will be known after
4. WHAT IS AFFECTED  which claims, files or numbers change either way (written before the work)
5. CONCLUSION        if X, we claim A; if not-X, we claim B
6. CONSEQUENCE OF NOT DOING IT
**Result:**
```

---

### C-001 · Does code written with Mapbox's own skills render what was asked?

**Opened:** 2026-11-24 · **Closed:** 2026-11-24

1. **WHERE WE ARE.** Mapbox publishes 27 Agent Skills (MIT). Their evals ask each prompt with and without the skill
   and grade the prose answer with the same model; none runs code (`kb/catalog.md`). GL JS 3.35.2 has 276 style
   properties, and 131 of the 272 that record a version arrived in 3.x `[inv]`. This machine has Node 22 and
   Playwright's Chromium.
2. **WHAT WE ARE DOING.** A fresh agent that has not seen this repository writes ten GL JS tasks, each with a check
   that reads the map's state back in the browser (`evals/tasks/`). For each task, one fresh Claude session solves it
   with Mapbox's skills installed and one without. Every solution runs once in headless Chromium against the real
   API, and the task's check scores it right or wrong.
3. **WHY.** Unknown now: whether Mapbox's skills leave failures that running the code would catch. After: two counts
   out of ten, and each failure with its cause.
4. **WHAT IS AFFECTED.** Nothing published yet. This card decides what the repository becomes: a field guide that
   adds to Mapbox's skills, or an executed-eval harness offered to theirs. It also answers T-020 in the Blender guide
   (whether its method adds anything when the vendor ships its own skills).
5. **CONCLUSION.** If the sessions with Mapbox's skills get at least 9 of 10 right, the encyclopedia exists: this
   repository keeps the inventory and the harness, offers the harness to mapbox-agent-skills, and no guide is
   written. If they get 8 or fewer, the failures name what a guide has to carry, and C-002 writes that guide and runs
   it as a third arm on the same tasks.
6. **CONSEQUENCE OF NOT DOING IT.** A guide gets written without knowing whether it repeats Mapbox's, or is skipped
   without knowing whether theirs leaves a gap.

**Needs before it can run:** a Mapbox account and access token from the user (in `.env`, never committed), and the
user's yes to 20 Claude sessions. Estimated use: about 20 solutions × a few map loads each, against a free tier of
50,000 map loads a month. Both given on 2026-11-24.

**Setup (2026-11-24, before any session ran):** the harness is `evals/run_eval.mjs` and `evals/harness/run_page.mjs`,
modelled on the Blender guide's runner. Each session is `claude -p` on claude-opus-5-5 in an empty folder under
`/private/tmp`, with no MCP servers (`--strict-mcp-config`) and no token in its environment; it writes `index.html`
without opening it, and the harness opens it once in headless Chromium at 800 × 600, injecting the token. The with arm
gets mapbox-agent-skills at commit `84d991e` as a plugin, its MCP servers removed: this card tests the skills, not the
MCP tools. A probe session per arm on the same settings listed 27 Mapbox skills and no MCP tools (with), and no Mapbox
skill and no MCP tools (without). Both arms also load the user's own 11 plugins, the same in each. The ten tasks, their
checks and their reference and wrong pages are written by a fresh agent told not to read `kb/`, this card, the
threads, the inventory or the vendored skills (`evals/tasks/`).

**Result:** with Mapbox's skills, 10 of the 10 tasks were right the first time; without them, also 10 of 10 (one
session per task and arm, claude-opus-5-5; `evals/results.md`). The reference and wrong pages had given 10 and 0 on
the same checks, so the checks do separate right from wrong. The with sessions listed the 27 skills, and none of them
opened one. Both arms avoided every trap the wrong pages were built on, in the same way.

The count meets field 5's first branch (9 or more), so its action stands: no guide is written for tasks like these.
Its stated reason does not stand. Field 5 read a high count as "the encyclopedia exists", which assumed the base
model would fail without help, as it had in the Blender guide (6 of 10). Here it did not fail, so the run cannot credit
the skills with anything. What it shows is that, on ten everyday GL JS tasks written blind, the model alone needed no
help, and the skills had nothing to fix. The card should have had a branch for a baseline at the ceiling; it is
recorded here rather than rewritten above.

In plain words: Opus 5.5 built all ten maps right with no help, so Mapbox's skills had nothing to add on these tasks,
and it never opened them.

What stays unknown: whether the newer parts of GL JS that no task touched leave room (T-004), and anything about the
mobile SDKs.

---

### C-002 · How much of what Mapbox offers runs on this account's public token?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** `kb/catalog.md` lists Mapbox's web services and GL JS features from Mapbox's own pages and the
   installed library. C-001 ran ten everyday GL JS tasks and two web services (Directions, Geocoding v6); nothing else
   in the catalog has been run here. The token in `.env` is a public (`pk.`) token on a free account.
2. **WHAT WE ARE DOING.** For each of the 21 capabilities below, write one experiment as `METHOD.md` describes
   (`experiments/<area>/<name>.mjs`, one question each), run it once with the account's public token, and record
   whether Mapbox served it, what the experiment measured, and a screenshot.
   - GL JS on the Standard style: light presets, themes, 3D buildings, the Interactions API, style imports.
   - GL JS 3D and atmosphere: globe, terrain on satellite, a glTF `model` layer, a `clip` layer, snow and rain.
   - GL JS data: a `raster-particle` wind layer.
   - Web services, drawn on a map: Isochrone, Matrix, Optimization, Map Matching, Search Box category search, a Search
     Box suggest-and-retrieve session, Tilequery.
   - Web services, from Node: Static Images and Static Tiles, the Styles API (the Standard style and its settings),
     the Tokens API and the account's listing endpoints (read only).
3. **WHY.** Unknown now: which of these a public token on a free account can use at all (some Mapbox APIs want a
   secret token, a scope or beta access, and the catalog does not say which), and whether each does what the catalog
   says. After: a count out of 21, each refusal with the status and message Mapbox sent, and one measured fact per
   capability.
4. **WHAT IS AFFECTED.** `kb/catalog.md` gains, for each row, whether it ran here and where the evidence is. T-001 is
   answered. The Styles API experiment fetches the Standard style's settings, which is T-002's first step; adding them
   to the inventory stays T-002's. The pages are mine, written after reading the inventory, so how many work on the
   first run says nothing about T-004.
5. **CONCLUSION.** If all 21 run on the public token, the catalog's rows stand as written and each gets an `[exp]`
   tag. If some are refused, each refused row says what it needs, from the status and message Mapbox sent, and the
   catalog's line "every request needs an access token" gets corrected to say which token.
6. **CONSEQUENCE OF NOT DOING IT.** The catalog stays a reading of Mapbox's pages with nothing run behind it, and the
   exploration asked for stays a list.

**Use, estimated before running:** about 18 map loads a full run, plus reruns while fixing my own pages, and about 25
web-service requests (one Search Box session), against free tiers of 50,000 map loads and 2,500 to 100,000 requests a
month. No request creates, changes or deletes anything on the account.

**Result:** 20 of the 21 were served in full to the public token; the 21st in part. The Tokens API answered, and all
four of the account's own listings (styles, tilesets, datasets, tokens) refused the public token: two with 403 naming
the scope they want, two with 404 (`experiments/results.md`, one final run of 22 scripts, 19 map loads and 25
web-service requests).

So both branches of field 5 apply, each to its own rows. The catalog's service rows that ran here get an `[exp]` tag.
Its line "every request needs an access token" is corrected: a public token is enough for every service run here, and
the account's own listings are not open to one.

The tour also turned up three things the card did not ask about:
- Mapbox's DEM puts the Matterhorn at most 4,226 m, 252 m short, while Mont Blanc, Fuji and two lakes read within
  14 m (T-007).
- Tilequery returns at most 50 contours 10 m apart, so its highest contour at a summit is not the summit's height
  (T-008).
- At pitch 0 a selected building does not change colour on screen, while at pitch 45 it turns blue (T-006).

Eight of my pages or measures were wrong on their first run and six facts were restated after it. Both lists are in
the results, so the facts that held are not all equally strong.

In plain words: everything I tried worked with the free account's public key, except listing the account's own
styles, tilesets, datasets and tokens. Two height readings came out wrong: Mapbox's elevation data, as GL JS reads it, has
the Matterhorn 252 m too low, and Tilequery's contours stop 1,500 m below Mont Blanc's summit.

What stays unknown: whether a GPU draws what software WebGL did here, and anything about billing, since the account
page was not read.

---

### C-003 · Are the MCP server's tool schemas a usable inventory of Mapbox's web-service parameters?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** `tools/kb.mjs` answers GL JS questions from the library's own definitions and knows nothing about
   the web services. github.com/mapbox/mcp-server at `ea129dc` (v0.18.1, MIT) has 16 tools that call Mapbox web
   services, each with a zod input schema in code. Two of my eight first-run mistakes in C-002 were web-service
   details: a missing `/tilequery/` path segment, and not knowing Tilequery's limit of 50.
2. **WHAT WE ARE DOING.** For each of the 16 tools, compare the parameters it accepts, traced through its code to the
   request it sends, with the parameter tables of that endpoint on docs.mapbox.com/api, read on 2026-11-25. Where the
   two disagree on a constraint (type, allowed values, range, default, required or not), one request to the API decides.
3. **WHY.** Unknown now: how much of each endpoint the tools expose, and whether what they say about it is right.
   After: for each tool, the share of its endpoint's documented parameters it exposes, the ones it fixes itself, the
   ones it leaves out, and each disagreement with the API's answer to it.
4. **WHAT IS AFFECTED.** `tools/inventory.mjs` and `kb.mjs` gain the web services, or don't. `kb/catalog.md`'s MCP
   paragraph says how complete the tools are. T-003 is answered. Reading the elevation tool's code also shows how it
   works, which is half of T-008; calling it stays T-008's.
5. **CONCLUSION.** If the tools expose at least 90% of their endpoints' documented parameters, counted over all 16, and
   the API contradicts none of their constraints, the schemas become `kb.mjs`'s web-services inventory, read from the
   pinned commit the way the style spec is read from the installed package. If not, they are a curated subset rather
   than an inventory: the catalog records what they leave out and what they get wrong, and the next candidate source
   (the docs' own tables, or mapbox-sdk-js's service definitions) goes into the threads.
6. **CONSEQUENCE OF NOT DOING IT.** `kb.mjs` stays blind to the web services, and their URLs keep being written from
   memory, which is where C-002's Tilequery mistake came from.

**Use, estimated before running:** about 12 docs pages (no account involved), and web-service requests only to settle
disagreements, probably under 30, all read-only, against free tiers of 25,000 to 100,000 a month.

**Result:** no, on both conditions of field 5 (`experiments/results.md`, C-003).
- For the endpoints they call, the 16 tools expose 101 of the 240 documented parameters (42%; 49% counting only the
  11 tools that wrap one endpoint), against the 90% field 5 asked for. Another 19 are fixed by the tools and 120 are
  never sent.
- Of eight disagreements the API settled, it contradicted the tools' schemas six times: five lists of allowed values
  too short, and one parameter required that the API does not need. It sided with the tools twice, against the docs:
  the Search Box query limit is 200 characters, not 256, and Static Images needs no overlay.

So the second branch: the schemas are a curated subset made for agents, not an inventory, and `kb.mjs` does not read
them. The catalog now records what they leave out and what they get wrong. The next candidate is the docs' own
parameter tables, which `docs_params.py` already reads; they list everything counted here, but were wrong in two of the
eight settled points (T-009).

The code also answered half of T-008, against its premise: the elevation tool reads DEM tiles, not Tilequery
contours.

In plain words: Mapbox's MCP tools let an agent set fewer than half of the options Mapbox documents for the services
they call, so they cannot serve as a list of what those services can do. Where the tools and the docs disagreed, the
API sided with the docs six times and with the tools twice.

What stays unknown: how the endpoints this card did not touch compare (Tilequery, Static Tiles, Optimization v2, Search
Box suggest and retrieve), and the six Feedback API constraints, which only sending feedback would settle.

---

### C-004 · Which of the Standard style's 48 settings does the model name wrong without help?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** The Standard style declares 48 settings (`experiments/api/styles.mjs`), changed at run time with
   `setConfigProperty('basemap', name, value)`. They are not in GL JS's own definitions, so `kb.mjs` cannot answer
   them. In C-001 the model set one of them, `lightPreset`, right without help.
2. **WHAT WE ARE DOING.** One fresh claude-opus-5-5 session per setting, with no tools, files, skills or web (`--tools ""
   --safe-mode`), gets a plain request for what that setting does, worded without its name ("hide the footpaths and
   trails"), and answers with JavaScript for an existing Standard map. Each answer is then run once in a page with the
   Standard style loaded. It is right if the setting the request meant now reads back with the value the request asked
   for.
3. **WHY.** Unknown now: how many of the settings the model can name, and what it writes for the ones it cannot.
   After: a count out of 48, and each miss with what the answer did instead (an invented name, a layer edit, an error).
4. **WHAT IS AFFECTED.** T-002 is answered. `kb/catalog.md` says which settings a model gets wrong. If any are missed,
   they are the first entries of the guide this repository has not needed so far (C-001). The model's answers are
   evidence for T-004's question about the newer parts of GL JS.
5. **CONCLUSION.** If at least 43 of the 48 (90%) are right, the model knows the Standard style's settings: `kb.mjs` gets
   them for people, and no guide entry is written. If 42 or fewer are right, the misses are what an agent needs told,
   and the next card writes them as a guide entry and runs the missed requests again with it.
6. **CONSEQUENCE OF NOT DOING IT.** Whether agents need the schema stays a guess. The catalog keeps implying they cannot
   know it ("reading them needs a token") without anyone having checked whether they do.

**Needs before it can run:** the user's yes to 48 Claude sessions. Given on 2026-11-25, and again for rerunning the six
the first run cut off.

**Result:** 44 of the 48 right (`evals/results.md`, C-004).
- **Wrong (3):** `showHdRoads`, `colorHdRoads` and `colorMix3dLandmarks`, each answered with an invented name.
- **No answer (1):** `showIndoorLabels`, cut off once and stopped once by an API safeguard error.

Before any session ran, the grader had given 48 of 48 to right answers and 0 of 48 to wrong-named ones. The same check
showed that GL JS ignores an unknown setting name without any warning.

44 meets field 5's first branch (43 or more), so no guide entry is written. `kb.mjs config` now lists the settings for
people, from `tools/inventory.mjs`, which fetches them from the Styles API, and marks the three the model named wrong.

Two things the card did not ask about:
- When unsure, the model wrote code that searches the schema at run time. That found `showIndoor`, and missed the lane
  settings because it searched names, not titles (T-010).
- Being unsure was expensive: $3.06 and $3.07 for two answers, against a median of $0.02.

In plain words: asked in plain language for each of the Standard style's 48 settings, Opus 5.5 with no help wrote a
working call for 44. For three of the newest it made up names that the map ignores without any warning.

What stays unknown: whether vaguer requests than mine would still lead it to the right names, other models, and
`showIndoorLabels`.

The first run lost six sessions to a 5-minute limit I set, and my runner logged them as having no error. They were rerun
with the user's yes, and the runner now records a killed session as an error.

---

### C-005 · Does the model still need no help on the parts of GL JS 3.x that C-001 did not touch?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** With no help, the model got C-001's ten everyday GL JS tasks right (10 of 10) and 44 of the
   Standard style's 48 settings (C-004). Its three misses were among the newest, most specialised settings. None of
   C-001's tasks used the 3D `model` layer, `clip`, `raster-particle`, the procedural `building` layer, style imports or
   the Interactions API.
2. **WHAT WE ARE DOING.** C-001 again, on new ground. A fresh agent that has not seen this repository's notes writes ten
   tasks drawn from those six areas, each with a check that reads the map back, and a right and a wrong page for each,
   and keeps going until the checks give 10 and 0 (`evals/tasks-3x/`). Then one fresh session per task solves it
   without help, as C-001's without arm did, and the harness runs each page once.
3. **WHY.** Unknown now: whether C-001's ceiling holds on the 3.x surface, or ends where C-004's misses suggest it might.
   After: a count out of ten, and each failure with its cause.
4. **WHAT IS AFFECTED.** T-004 is answered. C-001's conclusion that there is no gap for a guide either extends to the
   newer parts of GL JS or gets its first counterexamples. The README's sentence calling this open changes either way.
5. **CONCLUSION.** If at least 9 of the 10 are right, the claim that the model needs no help with GL JS covers the 3.x
   areas tested too, and the repository stays an inventory and a harness, with no guide. If 8 or fewer are right, the
   failures name the guide's first entries. The next card writes them and runs the failed tasks again with the entries
   and without, and with Mapbox's skills for comparison.
6. **CONSEQUENCE OF NOT DOING IT.** C-001's "no gap" stays a claim about everyday tasks only, while the guide's best
   chance of mattering, the newest part of the library, goes unchecked.

**Needs before it can run:** the user's yes to 10 Claude sessions. Given on 2026-11-25, for once the task set
validates (10 and 0, repeated here before any session).

**Result:** 10 of the 10 right first time, without help (`evals/results.md`, C-005). The set's right and wrong pages
had given 10 and 0 on two runs by its writer and one by me.

So the count meets field 5's first branch, and its action stands: no guide. But "needs no help" needs the same care as
C-001's reading did. Seven sessions answered from what the model knows, in 2 to 4 turns. The other three (the model
colour mix, the clip layer, the procedural building's roof and wall colours) downloaded GL JS 3.35.2's own published
code with Bash and read it, in 18 to 26 turns, at two to four times the cost. No session in C-001 had done that.

What the result supports is that a model with a shell and a network needs nothing from this repository on these tasks:
where it does not know, it reads the library. It does not show the model knows those three. With no network they might
fail; that is T-011.

In plain words: Opus 5.5 built all ten maps right with no help. For three of the newest features it did not know the
answer, and went and read Mapbox's own code to find it.

What stays unknown: those three tasks with the network off, and any model but Opus 5.5.

---

### C-006 · Does an agent open a skill when it does not know the answer?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** In C-001, sessions given Mapbox's 27 skills opened none of them on ten tasks the model already
   knew (0 of 10). In C-005, with no skills, the sessions for tasks 2, 3 and 5 did not know, and downloaded GL JS's own
   code to find out (3 of 3). None of Mapbox's skills mentions what those three tasks need: a search of the skills at
   commit `84d991e` finds no `clip`, no model colour mix and no procedural building.
2. **WHAT WE ARE DOING.** Run C-005's tasks 2, 3 and 5 once each with Mapbox's skills installed, set up exactly as
   C-001's with arm, and read each transcript for whether a skill was opened, and whether before or after any download.
3. **WHY.** Unknown now: whether not knowing is what makes an agent open a skill, or whether it skips skills either way.
   After: a count out of 3, set against C-001's 0 of 10.
4. **WHAT IS AFFECTED.** T-005 is answered or narrowed. The README and `kb/catalog.md` say none of the skills was opened
   in C-001; that sentence gets its explanation or stays a bare count. If this repository ever writes a guide, this
   decides whether shipping it as a skill would get it read.
5. **CONCLUSION.** If 2 or 3 of the 3 open a skill, agents open skills when they do not know: C-001's 0 of 10 came from
   the model knowing, and a guide shipped as a skill would be read on the tasks that need it. If 0 of 3, not knowing sent
   the model to the library's code and past 27 skills whose descriptions match the task: a guide shipped as a skill
   would go unread where it is needed, and belongs in the prompt, a CLAUDE.md or a tool description instead. 1 of 3
   settles neither, and says more runs are needed.
6. **CONSEQUENCE OF NOT DOING IT.** Any guide's form gets chosen blind. T-005's explanation of C-001 ("the model knew")
   stays a guess that sounds like a finding.

**Needs before it can run:** 3 Claude sessions, about $1 each at C-005's prices. The user said on 2026-11-25 to work
through T-005 to T-011 without their input.

**Result:** 0 of the 3 opened a skill (`evals/results.md`, C-006). All three downloaded GL JS's own code again, as in
C-005, and all three were right first time. The sessions cost $2.94.

That is field 5's second branch. Not knowing sent the model to the library's code, past 27 skills whose descriptions
cover GL JS web work. So C-001's 0 of 10 is not explained by the model knowing: here it did not know, and opened none.
A guide shipped as a skill like Mapbox's would not have been read on these tasks.

The branch's claim needs one narrowing. Mapbox's skill descriptions are general ("web integration patterns"), and none
of the skills covers these features. A skill whose description names the feature (`clip`, `model-color-mix-intensity`)
might be opened; that is T-012.

In plain words: when the model did not know how to use three of GL JS's newest features, it read Mapbox's code instead
of opening any of the 27 Mapbox skills it had been given.

What stays unknown: whether a skill described in the task's own terms would be opened, and other models.

---

### C-007 · Is the unchanged building at pitch 0 GL JS's doing or software WebGL's?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** In `experiments/standard/interactions`, clicking a building in Standard's `buildings` featureset
   sets `select: true` at pitch 0 and at pitch 45. At 45 the building turns blue; at 0 the frame does not change at all
   (difference 0, three runs). Every page here is drawn with SwiftShader, Chromium's software WebGL. Headless Chromium on
   this machine can also draw with its GPU (Apple M2 Pro, through Metal), and `run_page.mjs` now does that when
   `MBX_GPU=metal` is set.
2. **WHAT WE ARE DOING.** Run `interactions.mjs` unchanged three times with SwiftShader and three times with the GPU, and
   compare the pitch-0 frame difference and the colour at the click point.
3. **WHY.** Unknown now: whether a selected building really draws nothing at pitch 0, or only does so in this harness.
   After: which of the two.
4. **WHAT IS AFFECTED.** `kb/catalog.md` says "at pitch 0 a building's `select` state reads back but draws nothing in
   software WebGL", and `experiments/results.md` says the same with T-006's two explanations. If SwiftShader is the
   cause, it is a limit of the harness, and `METHOD.md` must say that pixel checks on feature state can come out wrong
   here. C-005's task 8 (pick a building) passed in this harness; if its check reads pixels, it inherits the limit.
5. **CONCLUSION.** If the GPU runs change the picture at pitch 0 (frame difference above 0.1, and the click point turns
   blue) in all three while SwiftShader again does not, software WebGL is the cause, and the harness has a blind spot
   that `METHOD.md` records. If the GPU runs also leave the frame unchanged, GL JS or the Standard style draws no
   selection at pitch 0 on any renderer. That is a behaviour of the library, recorded as such, and the next question is
   which layer draws the building there.
6. **CONSEQUENCE OF NOT DOING IT.** A check written for this harness could fail a right page, or pass a wrong one, on
   anything feature state draws at pitch 0, and nobody would know why.

**Needs before it can run:** six map loads, against the free tier's 50,000 a month.

**Result:** the GPU changed nothing. Six runs with the GPU (Apple M2 Pro through Metal; each page's WebGL renderer is
now recorded) and with SwiftShader all gave the same thing (`experiments/followups/results/interactions-renderers.json`):
- **At pitch 0:** frame difference 0, and the click point read [198, 188, 182] before and after.
- **At pitch 45:** the building turned from [243, 233, 223] to [82, 148, 234].

So it is field 5's second branch as far as the renderer goes: software WebGL is not the cause, and the harness has no
blind spot here. Its pixel checks of feature state hold on this machine's GPU as well.

The branch's other half does not follow yet. The rerun showed that the two pitches clicked different buildings
(`34633854` at pitch 0, `265260939` at 45), because the experiment picks the first unlabelled building near the centre
at each pitch. "GL JS draws no selection at pitch 0" is confounded with "this building draws no selection". That is
C-008, so T-006 stays open.

In plain words: drawing with the Mac's real GPU instead of software, the clicked building still did not change colour
at pitch 0, so the test harness was not the problem.

---

### C-008 · Does a selected building draw nothing at pitch 0, or only that one building?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** C-007: on the GPU as in software, a building clicked at pitch 0 did not change colour, and one
   clicked at pitch 45 turned blue. They were two different buildings, `34633854` and `265260939`.
2. **WHAT WE ARE DOING.** In one map load, set `select: true` directly (`setFeatureState` through the `buildings`
   featureset) on each of the two buildings at pitch 0 and at pitch 45. Count the pixels that change each time, and
   list which style layers draw each building at each pitch.
3. **WHY.** Unknown now: whether the missing colour belongs to the pitch or to the building. After: which, and the layer
   that draws the building when it fails.
4. **WHAT IS AFFECTED.** `kb/catalog.md`'s line "at pitch 0 a building's `select` state reads back but draws nothing in
   software WebGL" is wrong in its last three words either way (C-007), and gets rewritten from this. The same goes for
   `experiments/results.md`'s note on the interactions experiment. T-006 is answered.
5. **CONCLUSION.** If both buildings change colour at 45 and neither at 0, it is the pitch: the Standard style draws no
   selection at pitch 0, and the layer list says which layer draws buildings there. If `34633854` changes at neither
   pitch and `265260939` at both, it is the building: some buildings show no selection whatever the pitch, and the
   layer list says what is different about them. Any other pattern is reported as it comes.
6. **CONSEQUENCE OF NOT DOING IT.** The catalog keeps a sentence about pitch 0 that the evidence does not support, and
   anyone building selection on Standard does not know whether it works on a flat map.

**Needs before it can run:** one map load.

**Result:** it is the building, not the pitch (`experiments/followups/results/select-same-building.json`). Pixels that
changed when each building was selected:

| Building | Pitch 0 | Pitch 45 |
|---|---|---|
| `265260939` (66.6 m) | 2,474, of them 2,430 blue | 5,485, all blue |
| `34633854` (the Empire State Building, to 443.2 m) | 0 | 0 |
| `34633854`, with `show3dLandmarks` off | not run | 43,930, of them 43,603 blue |

The map is centred on the Empire State Building, and Standard draws it as a 3D landmark model. Its footprint is in the
`buildings` featureset, and selecting it reads back `select: true`, but the model on screen does not take the select
colour. With landmarks off, the plain extrusion that replaces the model does.

That is field 5's second branch. The layer list came back empty (features from an imported style carry no layer), so
the reason came from the properties and the landmark switch instead. Both C-007's renderer explanation and T-006's
pitch explanation were wrong; the experiment had picked a different building at each pitch.

In plain words: selecting a building on Mapbox's default map colours it at any pitch, except for famous buildings drawn
as detailed 3D models, like the Empire State Building, which do not change colour at all.

What stays unknown: whether every landmark behaves this way (only one was tested), and whether Standard offers another
way to highlight one, such as the `landmark-icons` featureset.

---

### C-009 · Is Mapbox's DEM low on sharp summits in general, or only on the Matterhorn?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** Read through GL JS at zoom 14, `mapbox-terrain-dem-v1` reaches at most 4,226 m within 1 km of the
   Matterhorn, against a published 4,478 m, and only 3,575 m at the summit's coordinate. Mont Blanc, Fuji and two lakes
   read within 14 m (`experiments/3d/terrain-heights`).
2. **WHAT WE ARE DOING.** Take 24 summits named here before any is measured: 12 sharp (horns, spires, needles) and 12
   broad (domes, snow caps, wide volcanic summits), half of each in the Alps so the region is the same. Get each one's
   coordinate and published height from Wikidata. Read the DEM's zoom-14 tiles directly and take the highest pixel within
   1 km. Then read the same summits through GL JS's `queryTerrainElevation` in one map load.
   - **Sharp:** Matterhorn, Weisshorn, Dent Blanche, Eiger, Piz Badile, Grossglockner; Grand Teton, Mount Thielsen,
     Mount Assiniboine; Fitz Roy, Ama Dablam, Machapuchare.
   - **Broad:** Mont Blanc, Dôme du Goûter, Breithorn, Alphubel, Allalinhorn, Titlis; Mount Rainier, Mount Whitney,
     Mount Elbert; Mount Fuji, Uhuru Peak (Kilimanjaro), Mount Elbrus.
3. **WHY.** Unknown now: whether one spire is low or every sharp summit is, and whether GL JS's sampling adds to it.
   After: how far below its published height each summit reads, by shape, and GL JS's reading beside the tile's.
4. **WHAT IS AFFECTED.** The README and `experiments/results.md` say "Mapbox's DEM has the Matterhorn 252 m low";
   that sentence either widens to sharp summits or stays about one mountain. T-008's prediction, that the MCP elevation
   tool gives about 3,575 m for the Matterhorn, rests on the same DEM. Any agent that quotes a summit's height from
   Mapbox's terrain inherits the answer.
5. **CONCLUSION.** If at least 9 of the 12 sharp summits read more than 50 m low by their highest pixel within 1 km,
   and at least 10 of the 12 broad ones within 25 m, the DEM is low on sharp summits in general, and the catalog says
   so for anyone quoting heights from it. If the Matterhorn is the only sharp summit more than 50 m low, it is a fault in
   the data there, and the catalog names it as one. Counts in between are reported as they are. Separately: if GL JS's
   readings match the tile's within 2 m, GL JS's sampling plays no part; if they are lower, it does.
6. **CONSEQUENCE OF NOT DOING IT.** One mountain stands for the DEM's accuracy in this repository's headline, and
   nobody knows whether summit heights from Mapbox are wrong in general.

**Rules set before measuring:** a summit whose highest pixel lies 950 m or more from its Wikidata coordinate is left out,
since the coordinate may be wrong; the count is then out of what remains. Where Wikidata gives several heights, the one
it ranks preferred is used.

**Needs before it can run:** about 100 tile requests (free tier 750,000 a month) and one map load.

**Result:** not only the Matterhorn (`experiments/results.md`, C-009). Two summits were left out by the rule above, one
of each shape. Of the 11 sharp summits left, 8 read more than 50 m low by their highest pixel within 1 km (median
104 m low; Fitz Roy 549 m). Of the 11 broad ones, 0 read more than 50 m low and 8 read within 25 m (median 21 m low).

Neither branch's numbers came out exactly:
- **The Matterhorn-only branch is plainly wrong.** Seven other sharp summits read more than 50 m low.
- **The general branch missed its thresholds by one each:** 8 sharp summits low where it asked for 9, and 8 broad ones
  close where it asked for 10. The broad misses were 29, 29 and 44 m low.
- **The region the card held constant shows the difference cleanly.** In the Alps, 4 of 5 sharp summits read more than
  50 m low and 0 of 5 broad ones did.
- **The exception is the US.** Grand Teton and Mount Thielsen, both sharp, read within 11 m. Mapbox's DEM page says it
  uses different sources by location but does not name them, so a finer US source is a guess.

GL JS's sampling is not part of it. Its readings match the tile's within 4 m at 20 of 24 summits, and within 18 m, in
both directions, at the rest. That misses the 2 m the card set, but the misses are a tenth the size of the shortfall.

So the README and catalog now say the DEM reads sharp summits low, not just the Matterhorn, and that summit heights
should not be quoted from it.

In plain words: Mapbox's elevation data puts the tops of pointed mountains outside the US about 100 m too low, and
Fitz Roy 549 m too low, while rounded summits come out within a few tens of metres.

What stays unknown: why the US summits are close (the sources are not published), and whether the shortfall grows with
how sharp a summit is. I sorted the summits into two shapes by eye and did not measure sharpness.

---

### C-010 · What does Mapbox's MCP elevation tool answer for a summit?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** C-003 read the tool's code: `elevation_tool` decodes `mapbox-terrain-dem-v1` zoom-14 tiles and
   interpolates between the four pixels around the point. C-009 read the same tiles with the same arithmetic and got
   3,587 m at the Matterhorn's Wikidata coordinate (published 4,477.5) and 4,793 m at Mont Blanc's (4,805.6).
2. **WHAT WE ARE DOING.** Start Mapbox's MCP server (`@mapbox/mcp-server` 0.18.1 from npm, the version at the commit C-003
   read) with this account's public token, and call `elevation_tool` once with C-009's 24 summit coordinates as
   `points`. Then set its answers beside C-009's direct reads at the same coordinates.
3. **WHY.** Unknown now: what the tool answers. The prediction comes from reading code, and nothing has called it.
   After: its 24 numbers, and how far each is from the published height.
4. **WHAT IS AFFECTED.** T-008 is answered. `kb/catalog.md` says the tool reads DEM tiles and not Tilequery, and that
   gets its first measured numbers. `experiments/results.md`'s prediction ("probably about 3,575 m there") is confirmed
   or corrected.
5. **CONCLUSION.** If the tool's answers match C-009's direct reads within 1 m at all 24, the code reading was right. An
   agent asking it how high the Matterhorn is gets about 3,587 m, 890 m low, and the catalog says the tool gives the
   ground's height at the coordinate, which on a sharp summit is far below the published one. If any answer differs by
   more than 1 m, the tool does something the code reading missed, and the difference says what.
6. **CONSEQUENCE OF NOT DOING IT.** The catalog's warning about the tool rests on a prediction from code.

**Needs before it can run:** one tool call, which fetches about 24 tiles. The package is installed with
`--ignore-scripts` into `.cache/` (git-ignored), and its tracing is turned off.

**Result:** the code reading was right. Every one of the 24 answers was within 0.5 m of C-009's direct read at the
same coordinate (`experiments/followups/results/mcp-elevation.json`). For the Matterhorn the tool answered 3,587 m,
890 m below the published height. Fitz Roy came back 914 m low, and 11 of the 24 more than 50 m low.

That is field 5's first branch. The catalog now says the tool gives the ground's height at the coordinate it is handed.
Its own schema offers "a summit" as an example of what to ask, and the answer carries no warning.

The card's step 2 had to change before it ran. npm's `@mapbox/mcp-server` 0.18.1, its latest release, has no
`elevation_tool`. The tool arrived in the source after that release, so the server ran from source at `ea129dc`, the
commit C-003 read, with `npm ci --ignore-scripts` and tracing off.

In plain words: asked how high the Matterhorn's summit is, Mapbox's own MCP tool for AI agents says 3,587 m. The
mountain is 4,478 m.

What stays unknown: whether an agent using the tool would notice. C-010 called it directly, not through a model.

---

### C-011 · How often are the API reference's stated limits wrong?

**Opened:** 2026-11-25 · **Closed:** 2026-11-25

1. **WHERE WE ARE.** `experiments/mcp/docs_params.py` reads the parameter tables of the API reference pages the MCP
   tools call (240 parameters). In C-003 the docs were wrong 2 times in 8 checks the API settled. Both were limits: the
   Search Box query length, and an overlay Static Images called required.
2. **WHAT WE ARE DOING.** Fetch every reference page in docs.mapbox.com/api's sitemap and read all their parameter
   tables. From the descriptions, pull out every stated numeric limit: a maximum, a minimum, a range, or a largest
   count. Then test every one on a GET endpoint this account's public token can call, without writing, creating or
   paying for anything. Send one request at the limit and one just past it, and record status and error message.
3. **WHY.** Unknown now: how often a stated limit disagrees with the API, so whether `kb.mjs` can repeat the tables as
   they stand. After: a count of limits tested, how many the API is stricter than (the docs allow what it refuses),
   and how many it is looser than (it accepts what the docs forbid).
4. **WHAT IS AFFECTED.** T-009 is answered. `kb/catalog.md` gains, or does not, a web-service parameter inventory built
   from the docs. C-003's "the docs were wrong twice in eight" is either a fair rate or a sample that happened to
   catch the worst.
5. **CONCLUSION.** The case that hurts an agent is the API stricter than the docs: code written to the docs then
   fails.
   - **5% or fewer stricter:** `kb.mjs` can repeat the docs' limits as they stand, tagged as the docs' word.
   - **More than 15% stricter:** it must not repeat a limit nobody has checked.
   - **Between the two:** reported as it is, and the limits are repeated with a warning.

   The API being looser than the docs is counted separately and does not decide the branch.
6. **CONSEQUENCE OF NOT DOING IT.** `kb.mjs` stays without the web services, or gets them from pages that are wrong at
   a rate nobody knows.

**Rules set before testing:**
- A limit counts as tested only when the request at the limit succeeds, or fails because of that parameter. A
  failure for any other reason (no route found, no access) leaves it untested. (Corrected before any test ran: the
  first wording said "other than", the reverse of what was meant.)
- Endpoints that need a secret token, write data or bill per session (Search Box `/suggest` and `/retrieve`) are left
  out and counted.
- `permanent=true` geocoding is never sent.

**Needs before it can run:** about 25 page fetches and two requests per testable limit, well inside each API's free
tier.

**Result:** the API is stricter than the docs on 2 of 100 limits tested (`experiments/results.md`, C-011).
- **Stricter:** the Search Box query length (200 characters, not 256), and a Map Matching radius of 0.
- **Looser:** 21 limits, where the API accepted a value past the stated one.
- **Agreed:** the other 77.
- **Not tested:** the EV Charge Finder refused this token (401) on four more.

2% is field 5's first branch. `kb.mjs api` now repeats the docs' parameters as they stand, from
`inventory/api-params.json` (built by `tools/api-docs.mjs`, not committed), and shows C-011's result beside each limit
it tested.

C-003's 2 in 8 was not a fair rate. Those eight were picked because the docs and the MCP tools disagreed, which is
where errors are likeliest.

In plain words: Mapbox's API reference states about a hundred number limits that can be checked with a free public
key, and code that obeys them is refused by the API for two of them.

What stays unknown: allowed values, required parameters and types, which this did not test, and every API a public
token cannot reach.

---

### C-012 · Would one general sentence fix the three Standard settings the model named wrong?

**Opened:** 2026-11-25 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** In C-004, with no help, the model named 3 of the Standard style's 48 settings wrong, each in its one
   session: `showHdRoads`, `colorHdRoads` and `colorMix3dLandmarks`. When unsure, it wrote code that searched
   `map.getSchema('basemap')`'s names for words like "lane". At run time the words are in each entry's
   `metadata['mapbox:title']` ("Lane details", "Lane color", "Landmark color intensity"), not its name (checked
   2026-11-25 in one map load).
2. **WHAT WE ARE DOING.** Run C-004's requests for those three settings three times each, as in C-004. Then run them
   three times each with this sentence added before the prompt's last line, and grade all 18 as C-004 did: "If you are
   unsure of a setting's name, search map.getSchema('basemap') at run time by each entry's metadata['mapbox:title'] and
   metadata['mapbox:description'] as well as by its name, and read the value back with map.getConfigProperty, because
   GL JS ignores a setting name it does not know without any warning."
3. **WHY.** Unknown now: whether the three misses happen reliably, and whether a rule that names no setting fixes
   them. After: two counts out of nine.
4. **WHAT IS AFFECTED.** T-010 is answered. `kb/catalog.md`, the README and `kb.mjs config` mark the three settings as
   named wrong. If the sentence works, it is the first guide entry this repository has found worth writing, and it
   is one line.
5. **CONCLUSION.**
   - **The sentence works:** at most 3 of 9 right without it and at least 8 of 9 with it. A general rule is enough, and
     the entry is that sentence, not a list of names.
   - **The sentence is not enough:** at most 5 of 9 right with it. The names have to be given, as `kb.mjs config`
     does.
   - **C-004's misses were one bad draw:** at least 7 of 9 right without the sentence. Then there is nothing to fix on
     these three, and the sentence cannot be judged here.
   - Anything else is reported as it comes.
6. **CONSEQUENCE OF NOT DOING IT.** C-004's three misses stay single draws whose rate nobody knows, and whether a
   one-line rule fixes them stays a guess.

**Needs before it can run:** 18 Claude sessions on claude-opus-5-5. Two of the three requests cost about $3 a session in
C-004, so about $15 to $25. Each arm is capped at $15 and starts no session once it has spent that. The user said on
2026-11-25 to work through T-005 to T-011 without their input.

**Blocked (2026-11-25):** on the user's yes to the 18 sessions. Claude Code's permission check refused to start them
while the user was away, so nothing has run. The runner is ready: `node evals/config/run.mjs --only
showHdRoads,colorHdRoads,colorMix3dLandmarks --runs 3 --first 3 --max-avg-cost 5 --max-total-cost 15`, then the same
with `--hint`.

**Parked (2026-11-26):** the user chose T-011 next. Nothing of C-012 has run. It resumes with the two commands above
once the user says yes to the 18 sessions.

**Resumed (2026-11-27):** the user said yes ("You have my yes"). Two corrections before it ran. The cap stops new
sessions from starting, and up to four already running still finish, so an arm can end a few dollars past $15. The
worst case is nearer $40 than the $30 I first told the user. And a session the cap skipped would have been graded as
wrong; `evals/config/run.mjs` now leaves skipped and errored sessions out of the grading and reports them as not run.
Both arms run at the same time.

**Result:** 3 of 9 right without the sentence, 8 of 9 with it (`evals/results.md`, C-012). That is field 5's first
branch: the sentence works.

| Setting | Without | With |
|---|---|---|
| `showHdRoads` | 0 of 3 | 3 of 3 |
| `colorHdRoads` | 1 of 3 | 3 of 3 |
| `colorMix3dLandmarks` | 2 of 3 | 2 of 3 |

One session without the sentence was stopped at the 20-minute limit and replaced by one more run of the same request,
which was wrong too.

Five of the six misses without the sentence were C-004's: code that searched the settings' names for "lane" or
"landmark", found nothing, and logged a warning or set a guessed name. The sixth wrote tool calls out as text, in a
session with no tools, and gave no code. With the sentence, all eight right answers searched by each entry's
`metadata['mapbox:title']`, and the one miss gave no code at all ("My previous reply was stopped partway through").
No session with the sentence missed on the name.

So a general rule is enough here, and the guide entry for these settings is that sentence, not a list of names. When
this card was opened it would have been the first guide entry; C-015 and C-016 have since found the building-layer
entry, so it is the second.

The branch's claim needs two narrowings. On `colorMix3dLandmarks` the sentence cannot be shown to help, 2 of 3 either
way. And I wrote the sentence after seeing these three misses; whether it costs anything on the 45 settings the model
already names right is T-019.

In plain words: asked to turn on three of the Standard style's newest settings, the model with no help got it right 3
times in 9, because it looked for the words in the settings' names when they are in their titles. Told in one sentence
to look in the titles and check the result, it got it right 8 times in 9.

What stays unknown: the other 45 settings with the sentence (T-019), other models, and sessions that can look things up.

**Use:** $15.36 for the 18 sessions that reported a cost, and the one stopped at 20 minutes, which reported none
(probably $3 to $4, so about $19 in all). One map load per arm to grade.

---

### C-013 · With no network, does the model still get the three tasks it looked up?

**Opened:** 2026-11-26 · **Closed:** 2026-11-26

1. **WHERE WE ARE.** Without help, the model got all ten of C-005's tasks right. Tasks 2, 3 and 5 (the model colour
   mix, the clip layer, the procedural building's roof and wall colours) came out right only after the session
   downloaded GL JS 3.35.2's own code and read it, in C-005 and again in C-006: 6 of 6 sessions.
2. **WHAT WE ARE DOING.** Run C-005's tasks 2, 3 and 5 once each in `run_eval.mjs`'s offline arm and grade each page
   once, as C-005 did. The offline arm is C-005's without arm with Bash in Claude Code's sandbox and no network, with
   WebFetch and WebSearch denied, and with no reads of the home folder or `/private/tmp`, where this machine keeps
   copies of GL JS and the earlier runs' pages. Before any task runs, one probe session must show the block holds: 8
   attempts to reach the network or those folders fail, and 3 ordinary commands in the session's own folder work.
3. **WHY.** Unknown now: whether the model knows these three features and looked them up out of caution, or could only
   get them by reading the code. After: a count out of 3.
4. **WHAT IS AFFECTED.** T-011 is answered. C-005's result says the run "does not show the model knows those three";
   that sentence gets its answer. The C-005 lines in the README and `kb/catalog.md`, which say three tasks were looked
   up, gain what happens without the lookup. If any task fails, this repository has its first candidate guide entry.
5. **CONCLUSION.**
   - **3 of 3 right:** the model knows these three features, and the lookups were caution. C-005's "no guide" holds for
     an agent with no network too.
   - **0 or 1 of 3 right:** the model got these features from the code, not from what it knows. Each failure, with its
     cause, is a guide entry for agents that cannot read the library. The next card writes those entries and reruns
     the failed tasks offline with them.
   - **2 of 3 right:** the failed task is a candidate entry, but one run cannot say whether it fails reliably. The next
     card reruns it three times before anything is written.
   - A session the sandbox breaks (Bash cannot run at all, say) is reported as not run, not as a failure.
6. **CONSEQUENCE OF NOT DOING IT.** "Needs no help" stays true only of an agent with a shell and a network. Whether an
   agent without them needs these three features told stays unknown.

**Checked before it runs (2026-11-26):** outside the home folder, the only copies of GL JS on this machine are under
`/private/tmp` (`mbx-src`, `mbx-src-inspect`), beside the earlier runs' folders with their pages and transcripts. A
search of `/opt`, `/usr/local`, `/Applications`, `/Library`, `/private/var` and `/Users/Shared` found none. Node and npm
are under the home folder, in `~/.nvm`, and that folder holds no GL JS text. The offline arm lets Bash read it, so
sessions can still run node as the without arm could. The offline sessions' folders go under `/private/var/tmp`, so
that `/private/tmp` can be closed whole.

**Needs before it can run:** one probe session on claude-haiku-5-5 (a few cents), then 3 sessions on claude-opus-5-5.
In C-005 and C-006 these tasks cost $0.59 to $1.47 a session. Offline sessions may run longer, up to the 40-turn
limit, so about $3 to $6 in all. The user said to go ahead on 2026-11-26 ("continue with 011").

**Result:** 2 of the 3 right first time with no network (`evals/results.md`, C-013). Tasks 2 and 3 passed; task 5
failed its check.

Before any task ran, the probe grew from 8 attempts that must fail to 13. The first probe passed, but it showed two
things. Claude Code's permission rules, not the sandbox, had stopped two of the attempts, by reading the path in the
command. And closing `/private/tmp` whole made every Bash command end in an error, which the without arm never saw. The
version that ran closes `/private/tmp` entry by entry, and every folder beside the session's own. In its last probe the
sandbox itself refused a read whose path the permission rules could not see (`evals/results/offline-probe.json`).

Every session first tried to download GL JS, as in C-005 and C-006, and every attempt was refused. Then:
- Tasks 2 and 3 wrote the page from what the model knew, in 7 and 4 turns against C-005's 18 and 26, and both were
  right. For these two the lookups were caution: the model knows `model-color-mix-intensity` and `clip-layer-types`.
- Task 5's session said it could not confirm offline that GL JS 3.35.2 has a procedural building layer, and that a wrong
  guess would show no buildings at all. So it drew the five buildings itself, in a 580-line WebGL custom layer, taking
  10 turns, 16 minutes and $3.20. The screenshot shows five buildings in terracotta and cream with five different roof
  shapes (`evals/results/c013-task5-offline.png`); I have not checked each shape against its building. The check fails
  the page because no GL JS building layer draws the footprints. The task as the session saw it asks for the picture.
  Only the check names the layer.

That is field 5's 2-of-3 branch, with one change to what the candidate entry would be. Offline, the model did not trust
that the building layer exists in this version. Whether it knows how to colour roofs and walls with it (`building-part`,
which C-005's session found only in the code) was never reached. The branch's next step stands: rerun task 5 offline
three times before writing anything (T-013). The task's wording raised a second question: told to use GL JS's building
layer, does the model get it right offline (T-014)?

In plain words: with the network off, the model still built the coloured vans and the cleared site right from memory.
For the planned buildings it would not trust that GL JS has a layer that draws roofs, and drew all five by hand in
WebGL instead. The picture looks like what was asked, but it is not what the check asks for.

What stays unknown: whether task 5 goes this way every time offline, whether the model knows the building layer when
told to use it, and any model but Opus 5.5.

**Use:** $4.52 for the 3 sessions, and about $0.10 for five probe sessions and six one-command test sessions on Haiku.

---

### C-014 · Does task 5 fail the same way every time with no network?

**Opened:** 2026-11-26 · **Closed:** 2026-11-26

1. **WHERE WE ARE.** In C-013 the one offline session on task 5 (planned buildings with real roofs) said it could not
   confirm that GL JS 3.35.2 has a procedural building layer. It drew the roofs in its own 580-line WebGL layer, and the
   check failed it. With a network, 2 of 2 sessions (C-005, C-006) read GL JS's code and used the building layer.
2. **WHAT WE ARE DOING.** Run task 5 three more times in the offline arm, exactly as C-013 did (`run_eval.mjs --set
   tasks-3x --tasks 5 --arms offline --runs 3 --concurrency 1`), grade each page once, and for each failing page record
   what it drew with: GL JS's `building` layer, a custom WebGL layer, or something else.
3. **WHY.** Unknown now: whether avoiding the building layer offline is what the model does, or C-013's session was one
   draw. After: a count out of 3, and with C-013's, out of 4.
4. **WHAT IS AFFECTED.** T-013 is answered. C-013's result names "GL JS 3.35.2 has a procedural building layer" as a
   candidate guide entry; it becomes an entry worth writing, or is dropped. The C-013 lines in `evals/results.md`, the
   README and `kb/catalog.md` gain the rate.
5. **CONCLUSION.** Counting C-013's session, out of 4:
   - **3 or 4 of 4 fail** (0 or 1 of these 3 right): offline, the model reliably does not get task 5. The entry is worth
     writing, and the next card writes it and tests it offline (T-014's form, naming the layer).
   - **2 of 4 fail** (2 of these 3 right): it fails about half the time. The entry is still worth writing, but showing
     that it helps will take more runs than a handful.
   - **1 of 4 fails** (3 of these 3 right): C-013's failure was the rare case, and task 5 gets no entry.
   - Whatever the count, the failing pages say what the entry is. If they avoid the building layer, as C-013's did, the
     entry is that the layer exists. If they use it and get the colours wrong, the entry is `building-part`.
6. **CONSEQUENCE OF NOT DOING IT.** The candidate entry rests on one session. Writing it would build the first guide
   entry on one draw; dropping it would leave offline agents possibly drawing roofs by hand at $3 a page.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5. C-013's task 5 session cost $3.20, so about $10.
The user said to go ahead on 2026-11-26 ("continue with 013"). The offline arm's settings have not changed since its
last probe passed (C-013).

**Result:** 1 of the 3 right first time (`evals/results.md`, C-014). With C-013's session, task 5 failed 3 of 4 times
with no network. That is field 5's first branch: offline, the model does not reliably get task 5, and the entry is
worth writing.

The two failing pages avoided GL JS's building layer, as C-013's had, and drew the five buildings in their own WebGL
layers, 588 and 766 lines long. Both said why. Run 0 suspected the layer existed, and that the task was built around it,
but could not confirm its property names, whether it takes GeoJSON, or how to colour roofs and walls separately. Run 2
named the same doubts. So the entry is that the layer exists, with those three facts.

The passing session changes what the entry is for. From memory, it put GL JS's `building` layer first, with
`building-roof-shape` from the `roof` property and the colour chosen by `building-part`, and the check found every
height, roof shape and colour right. It still did not trust the layer. The page carries a hand-drawn WebGL fallback,
and a pixel test that switches to it if no terracotta shows. The session said the part it trusted least was the
`building-part` colouring. So the model has the right answer in memory, and what fails offline is its confidence in
it. An entry would confirm what the model half-knows, not teach it something new, which is a smaller claim than "the
model does not know the building layer".

The branch's next step stands: write the entry and test it offline, naming the layer (T-014).

In plain words: with no network, the model got the planned buildings right 1 time in 4. Each time it failed, it said it
suspected GL JS had a layer for roofs but could not check, and drew the roofs by hand. The one time it used the layer,
from memory, it got it right.

What stays unknown: whether a sentence naming the layer is enough to make the model use it (T-014), and other models.

**Use:** $10.26 for the 3 sessions. Every offline session on task 5 cost $3.20 to $3.72 and took 16 to 18 minutes, right
or wrong, against $1.06 and $1.47 with a network.

---

### C-015 · Does naming GL JS's building layer make the model use it, and get task 5 right, offline?

**Opened:** 2026-11-26 · **Closed:** 2026-11-26

1. **WHERE WE ARE.** With no network, task 5 came out right 1 time in 4 (C-013, C-014). The three failing sessions
   avoided GL JS's procedural building layer, saying they could not confirm it exists in v3.35.2, takes GeoJSON, or
   colours roofs and walls separately. The passing session wrote the layer right from memory, `building-part` included.
2. **WHAT WE ARE DOING.** Run task 5 three times in the offline arm, as in C-014, with one sentence added to the end of
   the task: "Draw them with GL JS's procedural building layer (`type: 'building'`), which v3.35.2 has and which can draw
   a GeoJSON source." (`run_eval.mjs --set tasks-3x --tasks 5 --arms offline --runs 3 --concurrency 1 --note "..."`).
   Grade each page once with the same check, and for each failing page record whether it used the layer and what it got
   wrong. The sentence settles two of the three doubts and leaves the property names and the colouring to memory.
3. **WHY.** Unknown now: whether naming the layer is enough for the model to use it and get it right offline, or whether
   it also needs the property names or the colouring told. After: a count out of 3, against 1 of 4 without the sentence.
4. **WHAT IS AFFECTED.** T-014 is answered. This repository's first guide entry is either this sentence or the sentence
   plus what the pages got wrong. C-014's reading, that offline failures come from the model not trusting what it
   remembers rather than not knowing it, is tested: it survives only if the pages that use the layer get it right.
5. **CONCLUSION.**
   - **3 of 3 right:** naming the layer is enough. The first guide entry is that sentence, and C-014's reading holds.
   - **2 of 3 right:** naming the layer mostly works, against 1 of 4 without. The entry is the sentence, with the
     failure's cause recorded beside it; three runs cannot say more.
   - **0 or 1 right, the pages using the layer but getting the colours or roofs wrong:** naming is not enough, and the
     entry must also give what they got wrong (`building-part`, most likely). C-014's run 1 was the model's best draw,
     not its usual one.
   - **0 or 1 right, the pages still avoiding the layer:** even when told, the model does not trust the layer offline.
     The entry needs more than a sentence, a working example perhaps, and the next card tests that.
6. **CONSEQUENCE OF NOT DOING IT.** The first guide entry would be written untested: no one would know whether naming the
   layer is enough or the colouring has to be spelled out.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5. C-014's sessions cost $3.22 to $3.72; with the layer
named they may be shorter, so $3 to $11. The user said to go ahead on 2026-11-26 ("start 014"). The offline arm's
settings have not changed since its last probe passed.

**Result:** 2 of the 3 right first time with the layer named, against 1 of 4 without it (`evals/results.md`, C-015).
That is field 5's 2-of-3 branch: naming the layer mostly works.

All three sessions used GL JS's `building` layer, and none drew anything by hand; without the sentence, one session in
four had used the layer. All three took the heights and roof shapes right. The failure was one character. Run 0
coloured each surface by a feature property `building_part`, with an underscore, where GL JS's is `building-part`. The
expression found no value, so every roof came out in the wall colour (`evals/results/c015-task5-named-run0.png`). The
session had said so in its last message: if v3.35.2 doesn't provide that value, every surface comes out cream.

The sessions were also shorter: 3 to 7 minutes and $0.78 to $1.31, against 16 to 18 minutes and $3.20 to $3.72 without
the sentence.

So C-014's reading holds, narrowed. Told that the layer exists, the model used it every time, and wrote it right from
memory 2 times in 3. What it does not reliably remember is the part property's spelling.

**The first guide entry**, as this card leaves it: "GL JS v3.35.2 has a procedural building layer (`type: 'building'`),
which can draw a GeoJSON source." Beside it goes its known failure: 1 of 3 sessions read the part name from
`building_part`, and GL JS's property is `building-part`. Whether adding that to the entry makes task 5 right every time
is T-015.

In plain words: told in one sentence that GL JS has a building layer, the model with no network used it all three
times, in a fifth of the time. Twice it got everything right; once it misspelt one property name and every roof came
out cream.

What stays unknown: whether `building-part` in the entry closes the last failure, whether the entry helps where the
task does not say to use the layer, and other models.

**Use:** $2.88 for the 3 sessions.

---

### C-016 · With `building-part` added to the entry, is task 5 right every time offline?

**Opened:** 2026-11-26 · **Closed:** 2026-11-26

1. **WHERE WE ARE.** Offline, with one sentence naming GL JS's building layer, task 5 came out right 2 of 3 times
   (C-015), against 1 of 4 without it. All three sessions used the layer. The miss coloured by `building_part`, where
   GL JS's property is `building-part`, so every roof came out in the wall colour.
2. **WHAT WE ARE DOING.** Run task 5 three times in the offline arm, as in C-015, with the entry extended by one
   sentence. The note becomes: "Draw them with GL JS's procedural building layer (`type: 'building'`), which v3.35.2 has
   and which can draw a GeoJSON source. It evaluates `building-color` once for each part of a building, with the part's
   name (`roof`, `wall`, `window` or `door`) in the feature property `building-part`." The part names are the four GL
   JS 3.35.2's code sets (checked in its `mapbox-gl.js` on 2026-11-26, as `tasks-3x/validation.md` also records). Grade
   each page once with the same check, and record each failure's cause.
3. **WHY.** Unknown now: whether the entry needs anything beyond the part property for this task. After: a count out of
   3, and each failure's cause.
4. **WHAT IS AFFECTED.** T-015 is answered. The first guide entry's text in C-015's result, `evals/results.md` and the
   README and `kb/catalog.md` lines: it gains the second sentence, or keeps its known gap.
5. **CONCLUSION.**
   - **3 of 3 right:** the two sentences are the entry, with no known gap on this task. Three runs cannot show it never
     fails; it means no failure turned up.
   - **2 of 3 right, the failure something other than the part property:** the part property is settled, and the
     failure names what the entry lacks next.
   - **2 of 3 or fewer, a failure still on the part property** (misspelt, or the part names wrong): telling the model the
     name is not enough, and the entry needs a working expression.
   - **0 or 1 of 3 right for other reasons:** the second sentence made things worse than C-015's 2 of 3. The entry
     stays one sentence, and the failures are written up as they come.
6. **CONSEQUENCE OF NOT DOING IT.** The first guide entry keeps a known gap that one session in three fell into, and
   no one knows whether the obvious fix closes it.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5, about $1 each at C-015's prices, so about $3. The user
said to go ahead on 2026-11-26 ("start 015"). The offline arm's settings have not changed since its last probe passed.

**Result:** 2 of the 3 right first time (`evals/results.md`, C-016). That is field 5's second branch: the failure was
something other than the part property.

All three sessions used GL JS's building layer and coloured it by `building-part`. GL JS's own evaluation of every page
gave the right heights, roof shapes and colours, run 0's included. Run 0 failed because none of its buildings were
drawn. It had added a `clip` layer over its own footprints, meant to remove Standard's 3D trees standing on the plots,
and the clip removed its own buildings too. Loaded again without the clip layer, the same page passes the check. With
the clip limited to the basemap (`clip-layer-scope: ['basemap']`) it still fails (`evals/clip_test.mjs`, three map
loads). The style spec says a clip layer "removes 3D content", and that the basemap scope "will only remove content
from the Mapbox Standard style layers". Here it removed the page's own layer as well. That is one page's evidence
(T-016).

So the part property is settled: with it told, the colouring came out right 3 times in 3, against 2 in 3 in C-015. The
failure names something an agent needs next, though not as part of this entry: a clip layer also removes the page's own
procedural buildings beneath it, whatever its scope says.

One fact found on the way: the style spec marks the `building` layer type `"private": true`. That may be why the model
doubted the layer offline; it is not tested.

**The first guide entry**, as this card leaves it: "GL JS v3.35.2 has a procedural building layer (`type: 'building'`),
which can draw a GeoJSON source. It evaluates `building-color` once for each part of a building, with the part's name
(`roof`, `wall`, `window` or `door`) in the feature property `building-part`." No failure on the building layer turned
up in these three runs, which cannot show it never fails.

In plain words: told the layer's name and how it names roofs and walls, the model with no network coloured every page
right. One page still showed no buildings, because it also added a layer meant to remove trees, and that layer removed
its own buildings too.

What stays unknown: whether the clip behaviour is a fault in GL JS or in its spec (T-016), whether the entry helps where
the task does not say to use the layer, and other models.

**Use:** $2.48 for the 3 sessions, and 5 map loads for the clip test (two in a first try, three in the committed
script).


---

### C-017 · Is a skill opened when its description names the feature the task needs?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** In C-006, sessions given Mapbox's 27 skills opened none of them on tasks 2, 3 and 5 (0 of 3). All
   three downloaded GL JS's code instead. None of those skills' descriptions names what the three tasks need.
2. **WHAT WE ARE DOING.** Run tasks 2, 3 and 5 once each in C-006's with arm, with one skill added to Mapbox's plugin:
   `evals/skills/gl-js-3d-layers/SKILL.md`. Its description names the three features (`model-color-mix-intensity`, the
   `clip` layer with `clip-layer-types`, the procedural `building` layer with `building-part`) and says what each is
   for in the tasks' own terms. Its body has the property names and a snippet for each, on made-up data rather than the
   tasks', and states only facts checked in GL JS 3.35.2's style spec or in `evals/tasks-3x/validation.md`. Before the
   three, one short session with the same plugin copies the skill's description out of its list of skills, to show
   the description reaches the model whole. Read each transcript for whether the new skill was opened, and whether
   before or after any download.
3. **WHY.** Unknown now: whether skills go unopened whatever their descriptions say, or because Mapbox's descriptions
   are general. After: a count out of 3, against C-006's 0 of 3 with only the one skill changed.
4. **WHAT IS AFFECTED.** T-012 is answered. C-006's last sentence in `evals/results.md` ("A skill whose description
   named the feature was not tested"), and the README and `kb/catalog.md` lines on skills going unopened. The form for
   the guide entry built in C-015 and C-016: a skill, or text an agent always sees (the prompt, a CLAUDE.md, a tool's
   description).
5. **CONCLUSION.**
   - **2 or 3 of 3 open the new skill:** the description's wording decides. A guide entry shipped as a skill gets read
     when its description names the feature, and Mapbox's 27 went unopened because theirs are general.
   - **0 of 3:** a skill is skipped even when its description names the exact feature the task needs. A guide entry
     belongs in text an agent always sees, not in a skill. This holds only if the check session shows the description
     reached the model; if it did not, the three sessions say nothing and the card closes on that.
   - **1 of 3:** neither, and more runs are needed.
   - Right first time is recorded but is not the question. The description itself names the properties, so a session
     could get a task right from the description without opening the skill.
6. **CONSEQUENCE OF NOT DOING IT.** The guide entry's form gets chosen blind, and C-006's 0 of 3 keeps two
   explanations: skills are skipped whatever they say, or Mapbox's descriptions were too general.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5, about $1 each at C-006's prices ($2.94 for the
three), and one short check session, about $0.2. The user picked T-012 on 2026-11-27 ("012").

**Result:** 3 of the 3 opened the added skill (`evals/results.md`, C-017), each as its first tool call. That is field
5's first branch. The check session copied the skill's description out of its list whole, all 536 characters, so the
description did reach the model.

None of the three opened any of Mapbox's 27 skills or downloaded anything, and all three were right first time. They
took 16 turns and $0.87 between them, against C-006's 71 turns and $2.94 for the same three tasks.

So skills are not skipped whatever they say. What the model sees of a skill before opening it is its name and
description, and with one skill added whose description names the features, opening went from 0 of 3 to 3 of 3. A
guide entry shipped as a skill gets read on these tasks when its description names the feature.

The branch's claim needs two narrowings. The description both names the properties and describes the tasks in words
close to their own ("removing Mapbox Standard's own 3D buildings and trees inside an area"), so which of the two did the
work is not known. And I wrote it knowing the tasks; a guide written before its tasks are known would have to guess
their words. That is T-017.

One fact on the way, for T-016: task 5's page added a clip layer over its own footprints, as C-016's failing run 0 did,
and passed. It added the clip before its building layer, saying that keeps the clip off the planned buildings; C-016's
run 0 added it after. That points at render order rather than scope, one page each way.

Another, about Claude Code: with the Skill tool denied, a session is given no list of skills at all. The list comes with
the Skill tool.

In plain words: given one more skill whose description named the three features the tasks needed, the model opened it
first on all three tasks, where it had opened none of Mapbox's 27, and finished in under a quarter of the turns.

What stays unknown: whether naming the property or describing the task is what gets a skill opened (T-017), and other
models.

**Use:** $0.87 for the 3 sessions, $0.60 for the 3 check sessions (the first two failed as checks, as above), and 3 map
loads.

**Later (C-029):** repeated at 14:31 UTC, after added skills with a general description had stopped being opened on
tasks 2 and 3: opened first on all three again, nothing downloaded, $0.80.

---

### C-018 · Does a clip layer remove a page's own procedural buildings whatever its scope, when drawn after them?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** In C-016 a clip layer drawn after a page's own `building` layer removed it, and still did with
   `clip-layer-scope: ['basemap']` (one page). In C-017 a page that added its clip before its building layer passed. In
   GL JS 3.35.2's code (`mapbox-gl-dev.js`), the procedural building bucket's `updateReplacement` skips a clip only when
   the clip is drawn before the layer (`region.order < layerIndex`). It reads neither `clip-layer-scope` nor
   `clip-layer-types`. Only the model bucket goes through `skipClipping`, which applies the scope. `isLayerClipped`
   returns false for a fill-extrusion unless its source layer is `building` or `procedural_buildings`.
2. **WHAT WE ARE DOING.** Load eight versions of one page once each in the harness, and count how many of the five
   footprints are drawn terracotta at their centre, seen from above at zoom 16.5 with Standard's labels and trees
   hidden (task 5's measure). The page is task 5's reference page (`tasks-3x/reference/task5.html`). It gets a clip
   layer over its own footprints, `evals/clip_order_test.mjs`. The eight, with the code's prediction:

   | Own layer | Clip | Predicted |
   |---|---|---|
   | building | none | 5 of 5 |
   | building | after it, `clip-layer-types: ['model']` | 0 of 5 |
   | building | after it, `['model']`, `clip-layer-scope: ['basemap']` | 0 of 5 |
   | building | after it, no layout at all | 0 of 5 |
   | building | before it, `['model']` | 5 of 5 |
   | building | before it, `['model']`, scope `['basemap']` | 5 of 5 |
   | fill-extrusion, terracotta | none | 5 of 5 |
   | fill-extrusion, terracotta | after it, `['model']` | 5 of 5 |

3. **WHY.** Unknown now: whether C-016's one page is GL JS's general behaviour, and whether the code reading predicts
   what is drawn. After: eight counts out of 5 against the predictions.
4. **WHAT IS AFFECTED.** T-016 is answered. C-016's result sentence ("a clip layer also removes the page's own
   procedural buildings beneath it, whatever its scope says") gains its condition or is corrected, along with the README's
   and `kb/catalog.md`'s lines on it and `evals/results.md`'s C-016 section. The guide entry may gain a sentence on where
   to add a clip. C-017's skill is not changed, so that T-017 runs against the same body.
5. **CONCLUSION.**
   - **All eight as predicted:** in GL JS 3.35.2 a clip layer removes a procedural building layer drawn before it,
     whatever its scope and types, and never a fill-extrusion over a page's own GeoJSON. The spec's sentence that the
     `basemap` scope "will only remove content from the Mapbox Standard style layers" does not hold for building
     layers. Whether the code or the spec is the intended behaviour, these loads cannot say.
   - **The scoped clip after the layer keeps the buildings:** C-016's failure came from something else on that page,
     and the code reading is wrong on scope.
   - **Any other count off its prediction:** the code reading is wrong there, and the result is written up as found.
6. **CONSEQUENCE OF NOT DOING IT.** An agent that trusts the spec scopes its clip to the basemap and still loses its own
   buildings, and the guide entry cannot say how to avoid that.

**Needs before it can run:** 8 map loads on the account's public token, no Claude sessions. The user said "016, then
017" on 2026-11-27.

**Result:** all eight came out as predicted (`evals/results.md`, C-018). That is field 5's first branch.

| Own layer | Clip layer | Terracotta, of 5 |
|---|---|---|
| building | none | 5 |
| building | after it: `['model']`; with scope `['basemap']`; with no layout | 0, 0, 0 |
| building | before it: `['model']`; with scope `['basemap']` | 5, 5 |
| fill-extrusion | none; after it | 5, 5 |

So in GL JS 3.35.2 a clip layer removes a procedural building layer drawn before it, a page's own included, whatever
its `clip-layer-scope` and `clip-layer-types`, and keeps one drawn after it. The spec's sentence on the `basemap` scope
does not hold for building layers. Whether the code or the spec says what Mapbox intends, these loads cannot say.

C-016's failing page and C-017's passing one fit this. The first added its clip after its building layer, the second
before. Every removed building was still returned by `queryRenderedFeatures`, which is why task 5's "all five
queryable" test let C-016's page through and only the roof colours caught it.

A sentence the guide entry could carry, from this card and not yet tried on a session: "A clip layer removes a
procedural building layer drawn before it, whatever its `clip-layer-scope` says, so add the clip before your own
building layer."

In plain words: a layer meant to clear Mapbox's own trees and buildings from a plot also clears your own buildings if
it is added after them, even when it is told to touch only Mapbox's, and leaves them alone if it is added before them.

What stays unknown: whether this is a GL JS bug or the spec's wording, other GL JS versions, and models and symbols
(the scope is read from the code there, not loaded).

**Use:** 8 map loads.

---

### C-019 · Which half of C-017's description gets the skill opened: the feature names or the task's words?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** In C-017 a skill whose description named the features tasks 2, 3 and 5 need, and also described
   the tasks in words close to their own, was opened 3 of 3 times, first, where Mapbox's 27 skills were opened 0 of 3
   (C-006).
2. **WHAT WE ARE DOING.** Run tasks 2, 3 and 5 once each in C-017's setup with the skill's description cut two ways,
   one arm each, the skill's name and body unchanged:
   - **names:** "Mapbox GL JS v3.35 reference for `addModel`, the `model` layer, `model-rotation`, `model-color` and
     `model-color-mix-intensity`; the `clip` layer and `clip-layer-types`; and the procedural `building` layer with
     `building-roof-shape`, `building-color` and `building-part`."
   - **task words:** "Mapbox GL JS v3.35: how to place a 3D model file at many points, each turned to its own heading
     and coloured from its own properties; how to remove Mapbox Standard's own 3D buildings and trees inside an area;
     and how to draw 3D buildings from your own footprints with real roof shapes and separate roof and wall colours."

   Before each arm, the one-turn check copies the description out of the session's list of skills. Read each
   transcript for whether the skill was opened, and when.
3. **WHY.** Unknown now: whether a description that names the features, which is what a guide written before its tasks
   can carry, gets a skill opened, or whether it takes the task's own words. After: two counts out of 3, per task.
4. **WHAT IS AFFECTED.** T-017 is answered. C-017's narrowing ("which of the two did the work is not known") in
   CARD.md, `evals/results.md` and `kb/catalog.md`. How a guide entry's skill description should be written, if it is
   shipped as a skill.
5. **CONCLUSION.**
   - **Both arms 2 or 3 of 3:** either half is enough. A description that names the features gets a skill opened on
     these tasks, so a guide written before its tasks can be shipped as a skill.
   - **Names 0 or 1, task words 2 or 3:** the task's words do the work. A skill gets opened when its description
     guesses how the task will be put, and naming the features is not enough.
   - **Names 2 or 3, task words 0 or 1:** the feature names do the work, though tasks 2 and 3 never name their features.
   - **Both 0 or 1:** it took both halves together, or C-017's 3 of 3 was luck. Either way, a description cannot be
     counted on.
   - Per task, the words the description shares with the task text are recorded, since `building` and `model` are in
     both arms and in tasks 5 and 2.
6. **CONSEQUENCE OF NOT DOING IT.** A guide shipped as a skill would get its description written to C-017's recipe
   without knowing whether its features' names alone would get it read, which is all a guide written ahead of its tasks
   can offer.

**Needs before it can run:** 6 Claude sessions on claude-opus-5-5, about $0.3 each if the skill is opened and about $1
each if not (C-017, C-006), so $2 to $6, and 2 one-turn check sessions, about $0.4. The user said "016, then 017" on
2026-11-27.

**Result:** both arms opened the skill 3 of 3 times, each as the first tool call (`evals/results.md`, C-019). That is
field 5's first branch. Both checks copied their description out whole. All six sessions were right first time,
downloaded nothing, and cost $1.72 between them.

So either half of C-017's description is enough on these tasks. The names arm shares one word with each task's text
(`model` with task 2, `building` with tasks 3 and 5), and task 3 opened it though nothing in its text is named in the
description. A description that names the features, which is what a guide written before its tasks can carry, got the
skill opened every time.

The branch's claim needs one narrowing, and it is a large one. All three descriptions open with "Mapbox GL JS v3.35",
which matches the prompt's "Mapbox GL JS v3.35.2", and all three belong to a skill named `gl-js-3d-layers`. None of
Mapbox's 27 has either. Either one alone might be what gets the skill opened, whatever the rest of the description
says. Until that is tested, the claim is that these descriptions get the skill opened, not that the feature names do.
That is T-018.

In plain words: whether the skill's description listed the API's names or described the tasks in plain words, the
model opened it first on all three tasks. Something both versions share may be what made it open it.

What stays unknown: whether the version in the description, or the skill's name, is enough on its own (T-018), and
other models.

**Use:** $1.72 for the 6 sessions and $0.37 for the 2 check sessions.

---

### C-020 · Is it the skill's name, or "Mapbox GL JS v3.35" in its description, that gets it opened?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** Three descriptions of one skill were each opened 3 of 3 times on tasks 2, 3 and 5 (C-017, C-019),
   where Mapbox's 27 skills were opened 0 of 3 (C-006). All three open with "Mapbox GL JS v3.35", matching the prompt's
   "Mapbox GL JS v3.35.2", and belong to a skill named `gl-js-3d-layers`. None of Mapbox's 27 has either.
2. **WHAT WE ARE DOING.** Run tasks 2, 3 and 5 once each in C-017's setup, in three arms. Each arm gives the same skill
   body a general description that names no feature and uses none of the tasks' words:
   - **A, name and version:** `gl-js-3d-layers`, "Mapbox GL JS v3.35 patterns and snippets for web maps: setting up a
     map, adding sources and layers, and styling them."
   - **B, name only:** `gl-js-3d-layers`, "Mapbox GL JS patterns and snippets for web maps: setting up a map, adding
     sources and layers, and styling them."
   - **C, neither:** `web-map-patterns`, B's description.

   Before each arm, the one-turn check copies the description out of the session's list of skills. Read each
   transcript for whether the skill was opened, and whether the session downloaded GL JS's code.
3. **WHY.** Unknown now: whether C-017 and C-019's descriptions were opened for what they said, or for the version or the
   name they all share. After: three counts out of 3.
4. **WHAT IS AFFECTED.** T-018 is answered. C-019's narrowing in CARD.md, `evals/results.md` and `kb/catalog.md`
   ("either one alone might be what gets the skill opened"). C-017's claim that a description naming the feature gets a
   skill read keeps its cause, or loses it to the name or the version.
5. **CONCLUSION.**
   - **A 2 or 3, B 0 or 1:** the version in the description gets the skill opened, whatever else it says.
   - **B 2 or 3, C 0 or 1:** the name gets it opened. A name in the task's terms (`3d-layers`) is enough.
   - **A, B and C all 0 or 1:** neither alone does it. What C-017 and C-019's descriptions said is what got the skill
     opened, and their claims stand without this narrowing.
   - **C 2 or 3:** any skill added beside Mapbox's 27 gets opened on these tasks, which C-006's 0 of 3 does not explain;
     reported as it comes.
   - Any other pattern is reported as it comes.
6. **CONSEQUENCE OF NOT DOING IT.** The finding that a skill's description decides whether it is read (C-017, C-019)
   rests on descriptions that all share a version string and a name, so the advice for writing one could be wrong.

**Needs before it can run:** 9 Claude sessions on claude-opus-5-5, about $0.3 each where the skill is opened and about
$1 where it is not (C-017, C-006), so $3 to $9, and 3 one-turn check sessions, about $0.6. The user said "start 018" on
2026-11-27.

**Result:** all three arms opened the skill 3 of 3 times (`evals/results.md`, C-020): A first in each session, B after
one look at the data, and C, with a plain name and no version, too. That is the "C 2 or 3" branch: any skill added
beside Mapbox's 27 got opened on these tasks, which C-006's 0 of 3 does not explain. All nine were right first time.
Arm C downloaded GL JS's code in 2 of 3 sessions, A and B in none.

The setups match C-006's: Claude Code 2.1.332, the same model, tools and plugins. The one difference is the added skill.

**What this breaks.** C-017's result said "a guide entry shipped as a skill gets read on these tasks when its
description names the feature", and C-019's narrowed it to the descriptions tried. Both stand as counts, 3 of 3 and 3 of
3, but not as a claim about descriptions. A general description with a plain name was read 3 of 3 times as well, so
naming the feature is not what got the skill read. What did is not known.

Three explanations are left. C-006's 0 of 3 was chance, on three sessions. Something unseen changed between 25 and 27
November; the Claude Code version, model and plugins are the same, so it would be on the server's side. Or something
about the added skill other than its words, such as its place at the end of the list. Running C-006's setup again
today, with Mapbox's 27 alone, separates the first two from the third: that is T-020.

In plain words: a skill added to Mapbox's 27 was opened on all three tasks however its description was written, even
with a plain name and a general description. So the wording was not what made the model read it, and why it read none
of Mapbox's own skills two days ago is now the open question.

What stays unknown: why Mapbox's 27 were not opened in C-006 (T-020), and other models.

**Use:** $3.03 for the 9 sessions and $0.53 for the 3 check sessions.

**Later (C-027, C-029):** this card's three counts of 3 of 3 were morning counts. In the afternoon the general
description was opened only on task 5 (C-027), and C-017's description, naming the features, on all three (C-029). So in the
afternoon the wording did matter.

---

### C-021 · Does C-012's sentence cost anything on the 45 settings the model already names right?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** With one sentence telling it to search `map.getSchema('basemap')` by each entry's title and read
   the value back, the model got the three settings it named wrong right 8 of 9 times, against 3 of 9 without (C-012).
   Without help it named the other 45 of the Standard style's 48 settings right, once each (C-004).
2. **WHAT WE ARE DOING.** Run C-004's requests for those 45 settings once each with the sentence, set up as in C-012
   (`node evals/config/run.mjs --hint --only <the 45> --runs 1 --max-avg-cost 1 --max-total-cost 15`), and grade them as
   C-004 did. For each miss, read the answer for its cause. Also count how many answers searched the schema at all.
3. **WHY.** Unknown now: whether the sentence, written for three settings, breaks any of the others, for example by
   sending the model to search when it knew the name and having the search pick the wrong entry. After: a count out of
   45, and each miss's cause.
4. **WHAT IS AFFECTED.** T-019 is answered. C-012's guide entry, the sentence, is kept as it is, or narrowed (for
   example to settings added since a given version) before anyone uses it. The README, `kb/catalog.md` and
   `evals/results.md` lines on C-012.
5. **CONCLUSION.**
   - **44 or 45 right, and no miss caused by the search:** the sentence costs nothing seen on the other 45, and the
     entry stays as it is. One session each cannot show it never costs anything.
   - **Two or more wrong because the search picked a wrong entry or found none and gave up:** the sentence costs on
     settings the model already knew, and needs narrowing before it is used.
   - **Misses with other causes** (no code, a session that ran too long): reported as found, and not counted against the
     sentence.
6. **CONSEQUENCE OF NOT DOING IT.** The one guide entry for Standard's settings gets used on all 48 when it was only
   tested on 3, and a cost on the others would show up only as settings silently not changing.

**Needs before it can run:** 45 Claude sessions on claude-opus-5-5. C-004's 48 cost $8.34 in all, a median of $0.02;
C-012's right answers with the sentence cost $0.05 to $0.13. So about $4, and up to the $15 cap if several run long.
The user said "019" on 2026-11-27.

**Result:** by C-004's check 43 of the 45 were right; by what the two misses do, all 45 (`evals/results.md`, C-021).
Neither miss was the second branch's: both searches found the right setting.

- `theme` built its own greyscale colour table (`theme: 'custom'`) where the check wants `'monochrome'`. Loaded, it
  left no coloured pixel, as `'monochrome'` does; Standard untouched had 73.9% coloured.
- `roadsBrightness` raises the setting only while the light preset is dusk or night. It stayed 0.4 at the default
  `day`, where the check reads it, and went to 0.88 at `night`.

So they fall in the third branch, misses with other causes, and are not counted against the sentence. The sentence
costs nothing seen in what the answers do on the other 45, and the entry stays as it is.

It does change every answer. All 45 searched the schema by title, though the sentence says "if you are unsure" and
C-004 named 44 of these 45 without help. The median answer went from 63 characters to 2,428, and the 45 cost $6.52
against C-004's $4.83. Two of those searches did what was asked in a way C-004's check, which wants one value, does not
credit.

The card's premise was off by one. C-004 got 44 of these 45 right, not 45; the 45th, `showIndoorLabels`, ended in an API
safeguard error and had no answer. Here it was right.

In plain words: told to look settings up by their titles, the model looked up every one of the other 45, even the ones
it knew, and each change it made did what was asked. Two of them did it in a way the old check could not see.

What stays unknown: whether C-004's check should judge by what the map shows rather than by one value (T-021), more
than one session per setting, and other models.

**Use:** $6.52 for the 45 sessions; one map load to grade them and four to load the two misses.

---

### C-022 · Run again today, does C-006's setup still open none of Mapbox's 27 skills?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** In C-017 to C-020 a skill added beside Mapbox's 27 was opened in 21 of 21 sessions on tasks 2, 3
   and 5, whatever its name or description; none of those sessions opened one of Mapbox's 27. In C-006, on 25 November,
   Mapbox's 27 alone were opened 0 of 3 times on the same tasks. Both used Claude Code 2.1.332, claude-opus-5-5 and the
   same 11 plugins; C-006 listed 67 skills at start-up, C-020 68.
2. **WHAT WE ARE DOING.** Run `node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with`, C-006's command
   unchanged, and read each transcript for whether a skill was opened (a Skill tool call, or a read of a skill's files),
   which one, and whether the session downloaded GL JS's code.
3. **WHY.** Unknown now: whether C-006's 0 of 3 holds today. If it does, the added skill differs from Mapbox's 27 in
   something other than its words. If it does not, C-006's 0 of 3 was chance or something has changed since 25
   November. After: a count out of 3.
4. **WHAT IS AFFECTED.** T-020 is answered. C-020's three explanations for C-006's 0 of 3 in CARD.md and
   `evals/results.md`. C-006's result ("a guide shipped as a skill like Mapbox's would not have been read on these
   tasks") in CARD.md, `evals/results.md`, the README and `kb/catalog.md`. C-017 to C-020's comparisons with C-006.
5. **CONCLUSION.**
   - **0 of 3 open a skill:** C-006's result holds today. Mapbox's 27 still go unread on these tasks while any skill
     added beside them is read, so it is something about the added skill other than its words, such as its place at the
     end of the list or that it is the only skill of its plugin's 28 that names GL JS v3.35 work narrowly enough.
     C-017 to C-020's comparisons with C-006 stand.
   - **2 or 3 open a skill:** C-006's 0 of 3 does not hold today. It was chance on three sessions, or something on the
     server's side changed between 25 and 27 November. C-017 to C-020 then show only that a skill was opened, not that
     the added skill was what got one opened, and C-006's claim about guides shipped as skills falls with it.
   - **1 of 3:** settles neither, and says more runs of both setups are needed before any of C-006 or C-017 to C-020's
     comparisons is used.
6. **CONSEQUENCE OF NOT DOING IT.** The advice this repository gives on shipping a guide as a skill rests on C-006's
   0 of 3 against C-017 to C-020's 21 of 21, two days apart, and nothing says the 0 of 3 would come out the same today.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5, about $1 each at C-006's prices ($2.94 for the
three). The user said "020" on 2026-11-27.

**Result:** 0 of the 3 opened a skill (`evals/results.md`, C-022). None called the Skill tool or read a skill's files,
and no visible text mentions a skill. All three downloaded GL JS's code again, at the 2nd or 3rd tool call, and all
three were right first time. With C-006 that is 0 of 6 for Mapbox's 27 alone, on two days, against 21 of 21 for a skill
added beside them (C-017 to C-020).

That is field 5's first branch: C-006's result holds today, and C-017 to C-020's comparisons with it stand.

The branch's example cause does not. It named the added skill's place at the end of the list, and C-017 and C-020's
records already ruled that out when the card was written: `gl-js-3d-layers` was listed 3rd of 68, first of the 28
`mapbox:` skills, and `web-map-patterns` 30th, last of them, and both were opened 3 of 3 times.

**What this corrects in C-020.** A session sees each skill only as its name and description, in its place in the list;
all 27 of Mapbox's skills, like the added one, carry nothing else in their front matter. With the place ruled out, what makes the added skill different has to be in those words after all. C-020 said "the
wording is not what got the added skill read". What C-020 showed is narrower: none of the feature names, the version or
the name `gl-js-3d-layers` was needed. Its general description, "Mapbox GL JS patterns and snippets for web maps:
setting up a map, adding sources and layers, and styling them", still differs from all 27 of Mapbox's. Theirs name a
framework, a platform, a use case or a task such as migration; this one names the kind of work the three tasks are, a
GL JS web map with sources and layers. Whether that is what gets it opened is untested, and it is T-022.

The setup was not quite C-006's. The same Claude Code 2.1.332, model and 67 skills in the same order, but a 12th plugin
(`cc-plugin-easel`, which adds no skill) and a different tool list: WebFetch was gone, and `McpTaskCheck`,
`PublishPlugin` and `ShareOnboardingGuide` were added. C-020, five hours earlier, still had C-006's 27 tools. No C-006
session used WebFetch; all fetched with curl, as these did.

In plain words: run again today, the model again opened none of Mapbox's 27 skills on the three tasks and read GL JS's
code instead, while every skill added beside them in the last four cards was opened. The added skill's place in the
list is not why, so it has to be something in its name or description, read next to Mapbox's. Which part is not known.

What stays unknown: what in the added skill's description gets it opened (T-022), more than three sessions a setup, and
other models.

**Use:** $2.25 for the 3 sessions.

**Later (C-027):** the 21 of 21 this card set its 0 of 3 against all ran on the morning of 27 November. In the afternoon
added skills were opened only on task 5, 3 of 9. On task 5 the contrast held at every time tried: an added skill 9 of
9, Mapbox's skills 0 of 3.

---

### C-023 · Would judging C-004's answers by what they do to the map change any earlier count?

**Opened / Closed:** 2026-11-27

1. **WHERE WE ARE.** C-004's check marks an answer right when the one setting its request meant holds the value asked.
   In C-021 it marked two answers wrong that did what was asked when loaded. Three cards' counts rest on it: C-004's 44
   of 48, C-012's 3 of 9 without the sentence and 8 of 9 with it, and C-021's 43 of 45.
2. **WHAT WE ARE DOING.** Re-judge, by what its code does to the map, every answer counted in C-004, C-012 and C-021 whose
   grading record shows anything other than the one setting changed to the value asked. That is the 11 marked wrong
   other than C-021's two, and the 13 marked right that changed a second setting or name another `set…` or `addLayer`
   call. Each is judged from its code and the record the grading page wrote: which settings changed, what was thrown and
   what GL JS and the code printed. It is loaded again only where those cannot say which branch ran.
3. **WHY.** Unknown now: whether the one-value check miscounted anywhere besides C-021's two. After: how many verdicts
   flip, out of 24.
4. **WHAT IS AFFECTED.** T-021's second half. C-004's 44 of 48 and C-012's 3 of 9 and 8 of 9 in CARD.md,
   `evals/results.md`, the README and `kb/catalog.md`. C-012's sentence is the one guide entry for Standard's settings,
   and its evidence is the gap between 3 of 9 and 8 of 9.
5. **CONCLUSION.**
   - **No verdict flips:** every earlier count stands. In three cards the check's only misses are C-021's two, both from
     answers that did the job a second way.
   - **Any flips:** the counts are restated, C-012's first, because the guide entry rests on it.
6. **CONSEQUENCE OF NOT DOING IT.** C-012's 3 of 9 against 8 of 9 rests on a check now known to miss right answers, and
   nothing says whether it missed any there.

The records were read while sizing this card, so field 5 was written knowing that none of the eleven wrong answers
calls a map method other than the config ones. It needs no Claude session. It needs a map load only if the code and records
leave a fallback branch unsettled.

**Result:** no verdict flips, 0 of 24 (`evals/results.md`, C-023). Every earlier count stands: C-004's 44 of 48 and
C-012's 3 of 9 and 8 of 9. Across the three cards, C-021's two are the only answers the check got wrong, out of 111.

The eleven marked wrong change nothing on the map by any route. None calls anything on the map but reads of its style
and config and `setConfigProperty`, and the grading page found no setting changed after any of them.
- Five set names that do not exist (`showLanes`, `showLaneMarkings`, `colorModeLandmarks`, `colorLanes`, …), which GL
  JS ignores.
- Three searched the schema by name, found nothing and printed a warning.
- Two are not code: C-004's `showIndoorLabels` session ended in an API safeguard error, and one C-012 answer with the
  sentence is prose saying the session could not finish.
- One more, C-012's `showHdRoads` run 1 without the sentence, is 139,534 characters of tool calls written out as text.

The 13 marked right that did something more all did what was asked:
- `theme-data`, twice, also set `theme` to `'custom'`. A colour table applies only under `'custom'`.
- `showLandmarkIconLabels`, twice, also set `showLandmarkIcons` to true. The request was "keep the landmark icons, but
  hide the text names under them".
- `show3dObjects` also turned off 3D buildings, trees and landmarks one by one. The request was to turn off everything
  3D.
- Three of C-021's colour answers carry a fallback that draws their own fill layer if the setting does not take. Each
  fallback starts with a `console.warn`, the grading page caught no warning from any of the three, and each setting
  read back the colour asked. So no fallback ran.
- The other five name a helper of their own (`setAndVerify`, `setSinglePoiLabelColor`, `setIndoorLabelSelectColor`)
  that the record's scan of `set…` calls picked up. On the map they call only `getSchema`, the two config methods and,
  in one, a wait for the style to load.

No map load was needed.

In plain words: going back over every answer the old check could have judged wrongly, none of the earlier counts
changes. The only answers it got wrong are the two C-021 found, both of which reached the result a second way.

What stays unknown: which of the 48 checks would mark a second right answer wrong if the check is run again (T-023),
and answers it marked right with no extra change, which this card did not reread.

**Use:** no Claude session and no map load.

---

### C-024 · Is one of Mapbox's own skills opened when given the description C-020's added skill was opened with?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** On tasks 2, 3 and 5 a skill added beside Mapbox's 27 was opened 21 of 21 times, and Mapbox's 27
   alone 0 of 6 (C-006, C-022). A session sees each skill only as a name and a description, and the added skill's
   place in the list is ruled out (C-022). In C-020's arm C the added skill was named `web-map-patterns` and described
   "Mapbox GL JS patterns and snippets for web maps: setting up a map, adding sources and layers, and styling them.",
   and was opened 3 of 3 times.
2. **WHAT WE ARE DOING.** Run `node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --description
   "mapbox-web-integration-patterns=<arm C's description>"`. That is C-006's setup with one change: Mapbox's own
   `mapbox-web-integration-patterns` keeps its name and body, and its description is replaced by arm C's. No skill is
   added. Before it, the one-turn check copies that description out of a session's list of skills. Read each transcript
   for whether a skill was opened, which one, and whether the session downloaded GL JS's code.
3. **WHY.** Unknown now: whether arm C's description gets a skill opened whichever skill carries it, or only with a
   name like `web-map-patterns`. After: a count out of 3.
4. **WHAT IS AFFECTED.** T-022 is answered or narrowed. C-022's "what gets the added skill opened is in its name or
   description" in CARD.md, `evals/results.md`, the README and `kb/catalog.md`. Any advice this repository gives on
   describing a guide shipped as a skill.
5. **CONCLUSION.**
   - **2 or 3 open `mapbox-web-integration-patterns`:** the description gets a skill opened on these tasks under a
     Mapbox name too. A description of the kind of work, a GL JS web map with sources and layers, is opened where
     Mapbox's descriptions by framework, platform or use case are not, and a guide shipped as a skill should be
     described that way.
   - **0 or 1:** the description alone does not do it under a Mapbox name. What is left is the name (`web-map-patterns`
     against `mapbox-…-patterns`), or the two together. The next test would be the added skill with a Mapbox
     description.
   - **Another of Mapbox's skills opened:** reported as it comes.
6. **CONSEQUENCE OF NOT DOING IT.** The advice for getting a skill read stays "something in its name or description",
   which tells no one how to write one.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5, about $0.4 each if the skill is opened and $0.75 if
not (C-020's arm C, C-022), so $1 to $2.5, and one check session, about $0.2. The user said "022" on 2026-11-27.

**Result:** 0 of the 3 opened a skill (`evals/results.md`, C-024). The check copied the new description out of the
session's list exactly, and the plugin copy each session loaded had it. None of the three called the Skill tool or
read a skill's files, and no visible text mentions a skill. All three downloaded GL JS's code at the 2nd or 3rd tool
call, as in C-006 and C-022, and all three were right first time.

That is field 5's second branch. The same description on an added skill named `web-map-patterns` was opened 3 of 3
times (C-020, arm C). On Mapbox's `mapbox-web-integration-patterns` it was opened 0 of 3. So the description alone does
not get a skill opened on these tasks.

The two setups differ in little else. Arm C's skill was listed 30th of 68, and this one 29th of 67, so the place is
nearly the same. What is left:
- the name: `web-map-patterns` against `mapbox-web-integration-patterns`. All 27 of Mapbox's skills start with
  `mapbox-`, and neither added skill tried so far did;
- or the list around it: in arm C, Mapbox's own framework description for `mapbox-web-integration-patterns` was listed
  too, beside the general one, and here it was not.

This time the setup matched C-006's exactly: the same 11 plugins and 27 tools, WebFetch among them. The 12th plugin and
the changed tools C-022 saw four hours earlier were gone.

In plain words: the description that got an added skill opened every time got one of Mapbox's own skills opened none
of the times. So the words of the description are not enough on their own. What is left is the added skill's name, or
the skills listed around it.

What stays unknown: whether it is the name or the skills around it (T-024), more than three sessions a setup, and
other models.

**Use:** $2.66 for the 3 sessions and $0.21 for the check session.

**Later (C-027):** this card's reading does not hold. Its 0 of 3 at 13:06 UTC was set against arm C's 3 of 3 at
04:14, and arm C itself was opened 1 of 3 times at 13:46. Added skills were opened on every task in the morning and only
on task 5 in the afternoon, so the comparison was of two times of day, not two descriptions.

---

### C-025 · Which of C-004's 48 checks would mark a second right answer wrong?

**Opened / Closed:** 2026-11-27, unstarted

1. **WHERE WE ARE.** Judged by what they do to the map, none of the 24 earlier verdicts that could have been wrong
   flips (C-023). C-004's check has missed two right answers, both in C-021, where C-012's sentence was on: a custom
   greyscale colour table for `theme`, and a `roadsBrightness` raised only at dusk and night.
2. **WHAT WE ARE DOING.** For each of the 48 requests, read the request beside its setting's schema entry, write down
   any other setting or combination that would do what it asks and that the check would not credit, and load each such
   answer once to see whether it does.
3. **WHY.** Unknown now: how many of the 48 checks accept only one of several right answers. After: a count out of 48.
4. **WHAT IS AFFECTED.** `evals/config/requests.json` and `evals/config/grade.mjs`, if checks are widened. No count
   already made (C-023).
5. **CONCLUSION.** If none beyond the two known, the check can be run again once those two are widened. If more, they
   are widened too, or listed as checks whose misses must be loaded.
6. **CONSEQUENCE OF NOT DOING IT.** None that matters now. No new run of the check is planned, and C-023 showed that
   no count already made depends on it. If it is run again, each miss gets loaded and looked at, as C-021 did, and that
   catches a second route on any setting. Skipping this forever costs that one step on a run nobody has planned.

Closed unstarted on field 6. The user chose T-023 on 2026-11-27.

While filling field 6 I read the 48 entries, and two more requests may have a second route. Neither has been tried
or loaded:
- `show3dObjects` ("turn off everything 3D at once") could be met by turning off `show3dBuildings`, `show3dTrees` and
  `show3dLandmarks` one by one. Its schema entry says it also covers indoor areas, which are off by default.
- `showAdminBoundaries` ("remove the country and state border lines") could be met by a transparent
  `colorAdminBoundaries`.

`showPointOfInterestLabels` has no second route through `densityPointOfInterestLabels`, whose range is 1 to 5.

**Result:** none; closed unstarted. T-023 is parked until the check is to be run again.

**Use:** none.

---

### C-026 · Is an added skill still opened when its name starts with `mapbox-` like Mapbox's 27?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** C-020's general description ("Mapbox GL JS patterns and snippets for web maps: setting up a map,
   adding sources and layers, and styling them.") was opened 3 of 3 times on tasks 2, 3 and 5 on an added skill named
   `web-map-patterns`, listed 30th of 68. It was opened 0 of 3 times on Mapbox's own `mapbox-web-integration-patterns`,
   listed 29th of 67 (C-024). All 27 of Mapbox's skills start with `mapbox-`, and no added skill tried so far did.
2. **WHAT WE ARE DOING.** Run `node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill
   evals/skills/c026-prefixed/mapbox-web-map-patterns`. That is C-020's arm C with one change: the skill's folder and
   name are `mapbox-web-map-patterns`, and its description and body are the same. Before it, the one-turn check
   copies the description out of a session's list of skills. Read each transcript for whether a skill was opened,
   which one, and whether the session downloaded GL JS's code.
3. **WHY.** Unknown now: whether the added skill is opened because its name sets it apart from Mapbox's `mapbox-`
   skills, or because of something left in the list around it. After: a count out of 3.
4. **WHAT IS AFFECTED.** T-024 is answered. C-024's "what is left is the added skill's name, or the skills listed
   around it" in CARD.md, `evals/results.md`, the README and `kb/catalog.md`. Any advice this repository gives on naming
   a guide shipped as a skill.
5. **CONCLUSION.**
   - **0 or 1 open it:** the prefix gets it opened. On these tasks a skill whose name sets it apart from Mapbox's
     `mapbox-` skills is opened, and the same skill under a `mapbox-` name is not. A guide shipped as a skill beside
     Mapbox's should not be named like them.
   - **2 or 3 open it:** the prefix is not it. Against C-024, what is left is the rest of the name
     (`mapbox-web-integration-patterns` against `mapbox-web-map-patterns`), or Mapbox's own framework description,
     which is listed beside this skill but was replaced in C-024.
   - **Another of Mapbox's skills opened:** reported as it comes.
6. **CONSEQUENCE OF NOT DOING IT.** The advice for getting a guide read as a skill stays split between its name and
   the skills around it, and the choice of name is made blind.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5, about $0.4 each if the skill is opened and $0.9 if
not (C-020's arm C, C-024), so $1.2 to $2.7, and one check session, about $0.2. The user said "024" on 2026-11-27.

**Result:** 1 of the 3 opened the skill (`evals/results.md`, C-026). Task 5 opened `mapbox-web-map-patterns` as its
second tool call and then downloaded GL JS's code. Tasks 2 and 3 opened no skill and downloaded GL JS's code at the
second tool call. All three were right first time. The check copied the description out of the session's list exactly.

The skill was listed 30th of 68, the same place as `web-map-patterns` in C-020's arm C, and the tools and plugins
matched C-006's. So against arm C the name was the only difference, and the count went from 3 of 3 to 1 of 3.

That falls in field 5's first branch as written, but more weakly than the branch says. The `mapbox-` prefix made the
skill less often opened here, not never. And on three sessions against three, a split of 3 against 1 would come up
about one time in five by chance if the name made no difference (Fisher's exact test, one-sided, p = 0.2). Put
together with C-024, where Mapbox's own `mapbox-web-integration-patterns` carried the same description, a `mapbox-`
name with this description was opened 1 of 6 times and the plain name 3 of 3. That split would come up about one time
in twenty by chance (p = 0.048). C-024 also differs in what else is listed, though, so it is not a clean repeat.

So the claim this supports is narrow. On these tasks the same skill, in the same place, was opened less often under a
`mapbox-` name than under a plain one. That fits the name setting the added skill apart from Mapbox's 27, but three
sessions each do not establish it. Field 5's advice, that a guide shipped beside Mapbox's skills should not be named
like them, is consistent with this and not yet shown.

In plain words: when the added skill was given a name starting with "mapbox-", like all of Mapbox's own skills, the
model opened it on one of the three tasks instead of all three.

What stays unknown: whether 3 of 3 against 1 of 3 holds over more sessions (T-025), and other models.

**Use:** $2.09 for the 3 sessions and $0.21 for the check session.

**Later (C-027):** this card's reading does not hold. Run at the same time, the plain and `mapbox-` names were opened 1
of 3 times each. The 3 of 3 it was set against came from 04:14 UTC, before added skills stopped being opened on tasks 2
and 3.

---

### C-027 · Over six sessions each, is the added skill opened less often under a `mapbox-` name?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** On tasks 2, 3 and 5, an added skill with C-020's general description was opened 3 of 3 times
   named `web-map-patterns` (C-020, arm C) and 1 of 3 times named `mapbox-web-map-patterns` (C-026). It had the same
   body and the same place in the list, 30th of 68. If the name made no difference, that split would come up about
   one time in five (Fisher's exact test, one-sided, p = 0.2).
2. **WHAT WE ARE DOING.** Run both arms once more on the same three tasks, at the same time:
   `node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill <skill>`, once with
   `evals/skills/c020-neither/web-map-patterns` and once with `evals/skills/c026-prefixed/mapbox-web-map-patterns`.
   Count the sessions that open the added skill, and add them to C-020's and C-026's three each.
3. **WHY.** Unknown now: whether the `mapbox-` name lowers how often the skill is opened, or whether 3 against 1 was
   chance. After: two counts out of 6.
4. **WHAT IS AFFECTED.** T-025 is answered. C-026's result and the advice on naming a guide shipped as a skill, in
   CARD.md, `evals/results.md`, the README and `kb/catalog.md`.
5. **CONCLUSION.** In counts out of 6, plain name first:
   - **6 against 2 or fewer, or 5 against 1 or fewer** (p ≤ 0.04): the `mapbox-` name lowers how often the skill is
     opened on these tasks. A guide shipped beside Mapbox's skills should not be named like them, on this model.
   - **The two within one of each other:** the gap in C-026 was chance. The name is not what sets the added skill
     apart, and C-024's 0 of 3 for Mapbox's own skill is left with only what else was listed around it.
   - **Anything between** (6 against 3, 5 against 2, 4 against 1 or 2; p from 0.09 to 0.28): reported as counts, and
     the name stays unsettled.
6. **CONSEQUENCE OF NOT DOING IT.** C-026's advice on naming rests on three sessions against three, a split that
   chance gives one time in five, and it would be passed on as if it were shown.

**Needs before it can run:** 6 Claude sessions on claude-opus-5-5, about $0.4 where the skill is opened and $0.8 where
it is not (C-020, C-026), so about $3.5. Both descriptions were already copied out exactly (C-020, C-026), so no check
sessions; each transcript's start-up list is read instead. The user said "025" on 2026-11-27.

**Result:** run side by side, each name was opened 1 of 3 times (`evals/results.md`, C-027). In both arms task 5
opened the skill as its second tool call, and tasks 2 and 3 opened no skill and downloaded GL JS's code. All six were
right first time. The start-up record matched C-006's tools and plugins, with one skill of the user's,
`system-design-brain`, added since C-026.

Added to the earlier three each, the plain name was opened 4 of 6 times and the `mapbox-` name 2 of 6. That is field
5's third branch: reported as counts, and the name stays unsettled (p = 0.28). The pair run at the same time, though,
is 1 against 1, so this run gives no sign of the name mattering at all.

**What the branches did not cover.** The plain-named arm, unchanged since C-020, went from 3 of 3 at 04:14 UTC to 1 of
3 at 13:46. Set out by time, every run with an added skill splits the same way:

| 27 November, UTC | Runs | Task 2 | Task 3 | Task 5 |
|---|---|---|---|---|
| 03:00 to 04:14, added skill, six versions | C-017, C-019, C-020 | 6 of 6 | 6 of 6 | 6 of 6 |
| 13:28 to 13:46, added skill, two names | C-026, C-027 | 0 of 3 | 0 of 3 | 3 of 3 |
| any time, Mapbox's skills only | C-006, C-022, C-024 | 0 of 3 | 0 of 3 | 0 of 3 |

On tasks 2 and 3, 12 of 12 in the morning against 0 of 6 in the afternoon would come up about once in 18,000 by chance
if nothing had changed. Something did. The start-up record shows the same Claude Code 2.1.332, model, tools, plugins
and skills, apart from the names tried and the one user skill. So whatever changed is not in that record. It could be
the Skill tool's own text, which the record does not include, or something on the server's side.

**What this breaks.** Two earlier readings compared an afternoon run with a morning one:
- C-024's "the description alone does not get a skill opened" set its 0 of 3 at 13:06 against arm C's 3 of 3 at 04:14.
  In the afternoon arm C itself got 1 of 3, so C-024 shows nothing about the description.
- C-026's "the name, weakly" set its 1 of 3 at 13:28 against the same 3 of 3. At the same time, the two names came
  out 1 of 3 each.

What still holds:
- Mapbox's skills alone were opened 0 of 9 times, on two days and at three times of day.
- On task 5, an added skill was opened every time, 9 of 9, morning and afternoon, under every name and description
  tried. Mapbox's were opened 0 of 3. That split would come up about one time in 220 by chance.
- The morning runs' comparisons with each other stand as counts. C-017 to C-020's descriptions and names were all
  opened 3 of 3, and the skill's place in the list made no difference then.

In plain words: in the afternoon the model opened the added skill only on the buildings task, whatever it was called,
where in the morning it had opened it on all three tasks. So the afternoon comparisons of names and descriptions were
really comparisons of morning with afternoon.

What stays unknown: what changed between 04:14 and 13:28 UTC (T-026), and whether the morning's behaviour comes back.

**Use:** $3.89 for the 6 sessions.

---

### C-028 · Does anything the transcripts record split the morning sessions from the afternoon ones?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** On tasks 2 and 3 an added skill was opened in all 12 sessions run between 03:00 and 04:14 UTC on
   27 November, and in none of the 6 run between 13:28 and 13:46 (C-027). The start-up record is the same apart from
   the names tried and one skill installed on this machine in between.
2. **WHAT WE ARE DOING.** Compare the 27 transcripts of sessions with an added skill (18 morning, 9 afternoon) on
   every field they record beyond the start-up list: the model named on each assistant turn, the result's per-model
   usage, service tier and cost fields, and the text of every system event. List each field whose values split the
   morning from the afternoon.
3. **WHY.** Unknown now: whether something recorded, such as a different model answering, separates the two halves of
   the day. After: a list of the fields that split them, which may be empty.
4. **WHAT IS AFFECTED.** T-026. C-027's "what changed is not in that record" in CARD.md, `evals/results.md`, the README
   and `kb/catalog.md`.
5. **CONCLUSION.**
   - **A field splits them** (another model, tier or setting in the afternoon): that is the likeliest cause. The
     morning counts (C-017 to C-020) and the afternoon ones (C-024 to C-027) are each counts for their own setup, and
     the report says which.
   - **No field splits them:** what changed is not recorded in the transcripts. Only a run can say more, and the next
     card is C-017's skill once more now.
6. **CONSEQUENCE OF NOT DOING IT.** Anyone repeating C-017 could get either 3 of 3 or only task 5, with no way to tell
   why, and the cheapest place to look would have been skipped.

**Needs before it can run:** nothing; the transcripts are on disk. The user said "026" on 2026-11-27.

**Result:** no recorded field splits them (`evals/results.md`, C-028). That is field 5's second branch.

In all 27 sessions, every assistant turn names `claude-opus-5-5`, and the result's model usage names it alone. Every
turn reports service tier `standard`, speed `standard` and inference region `global`. Fast mode was off throughout.

The prompt each session started with was the same size. C-020's arm C at 04:14 UTC began task 2 with 46,153 tokens,
and C-026 at 13:28 with 46,158: five more, about what the `mapbox-` prefix adds. C-027's runs began 266 tokens higher,
which matches the one skill installed in between. The cached first part of the prompt was 13,524 tokens in every
session. So the system prompt, the tools' text and the list of skills did not change in length between the morning and
the afternoon, beyond the names tried. A change to the Skill tool's text that kept its exact length is the only kind
this leaves open.

What does differ is what the sessions did after the start, and that follows from not opening the skill. The afternoon
sessions took more steps, had more thinking blocks (7 to 13, against 2 to 4 in the morning, apart from one with 9),
and most started background downloads of GL JS. The thinking text itself is not recorded, only its signature, so why
each session chose as it did cannot be read.

The card's other planned step, having a session copy out the Skill tool's text as a baseline, is not needed. Every
transcript already records the prompt's size, and that would show a change in the tool's text unless it kept exactly
the same length.

In plain words: by everything the session logs record, the model, its settings and the prompt it was given were the
same in the morning and the afternoon, and yet in the afternoon it stopped opening the added skill on two of the three
tasks.

What stays unknown: what changed, which only a run can narrow (C-029: C-017's skill once more now).

**Use:** none.

---

### C-029 · In the afternoon, is C-017's skill, whose description names the features, still opened on all three tasks?

**Opened:** 2026-11-27 · **Closed:** 2026-11-27

1. **WHERE WE ARE.** Every added skill run between 03:00 and 04:14 UTC on 27 November was opened on all three tasks
   (18 of 18), and every one run between 13:28 and 13:46 only on task 5 (3 of 9) (C-027). The model, its settings and
   the prompt's size were the same (C-028). The afternoon runs all had C-020's general description. None had C-017's,
   which names the features the tasks need (`clip`, `model-color-mix-intensity`, procedural `building`).
2. **WHAT WE ARE DOING.** Run `node evals/run_eval.mjs --set tasks-3x --tasks 2,3,5 --arms with --extra-skill
   evals/skills/gl-js-3d-layers`, C-017's command unchanged, and read each transcript for whether the skill was opened
   and whether the session downloaded GL JS's code.
3. **WHY.** Unknown now: whether whatever changed stops any added skill being opened on tasks 2 and 3, or only one with
   a general description. After: a count out of 3, by task.
4. **WHAT IS AFFECTED.** T-026. C-017's result, that a guide shipped as a skill gets read on these tasks when its
   description names the feature, in CARD.md, `evals/results.md`, the README and `kb/catalog.md`.
5. **CONCLUSION.**
   - **Opened on all three:** a description naming the features is opened on these tasks in the afternoon too. What
     changed hit only the general description, and C-017's result stands for both halves of the day.
   - **Opened on task 5 only, or on none:** what changed hits any added skill on tasks 2 and 3. C-017's 3 of 3 is a
     morning count, and its result cannot be relied on as advice.
   - **Opened on two:** reported as it comes.
6. **CONSEQUENCE OF NOT DOING IT.** C-017 is the result someone would act on when shipping a guide as a skill, and it
   rests on a morning whose behaviour has not been seen since.

**Needs before it can run:** 3 Claude sessions on claude-opus-5-5, $0.87 if opened as in C-017 and about $2.5 if not
(C-022). The description was copied out exactly in C-017. The user said "026" on 2026-11-27.

**Result:** opened on all three, 3 of 3, each as the first tool call (`evals/results.md`, C-029). No session downloaded
anything, and all three were right first time, for $0.80 against C-017's $0.87. The skill was listed 5th of 69, and the
tools and plugins matched C-006's.

That is field 5's first branch. A description naming the features was opened on these tasks in the afternoon, as in the
morning, and C-017's result stands for both halves of the day.

Put beside the afternoon's other runs, the description did matter after all:

| 27 November, afternoon, UTC | Description | Task 2 | Task 3 | Task 5 |
|---|---|---|---|---|
| 13:28 to 13:46 (C-026, C-027) | general, two names | 0 of 3 | 0 of 3 | 3 of 3 |
| 14:31 (C-029) | names the features | 1 of 1 | 1 of 1 | 1 of 1 |

On tasks 2 and 3, 2 of 2 against 0 of 6 would come up about one time in 28 by chance. In the morning both kinds were
opened on every task (C-017, C-020). So what C-020 seemed to show, that the wording is not what gets an added skill
read, held only in the morning. The afternoon's runs say a description naming the features is read on all three tasks,
and a general one only on the buildings task.

What changed between 04:14 and 13:28 is still not known. Nothing the transcripts record changed (C-028), and its effect
was on the general description, not on C-017's.

In plain words: in the afternoon the skill whose description named the features was still opened first on every task
and saved the session from reading GL JS's code, while the skill with a general description was opened only on the
buildings task. So the advice that held all day is to name the features in the description.

What stays unknown: what changed, and whether the morning's behaviour comes back on another day (T-026, parked), and
other models.

**Use:** $0.80 for the 3 sessions.
