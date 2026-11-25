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
