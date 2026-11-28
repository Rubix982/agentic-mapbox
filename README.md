# agentic-mapbox

Mapbox for AI agents: what Mapbox GL JS 3.35.2 says about itself, what Mapbox offers and what it costs, and a test of
whether code an agent writes with Mapbox's own Agent Skills renders what was asked.

Mapbox already publishes 27 Agent Skills, an MCP server and a CLI for agents (`kb/catalog.md`). This repository started
by testing those rather than repeating them. On ten everyday GL JS tasks written blind, Claude (Opus 5.5) got 10 of 10
right without help and 10 of 10 with Mapbox's skills, which it never opened (`CARD.md` C-001, `evals/results.md`). So
for tasks like these there is no gap for a guide to fill. A second blind set on the newest parts of GL JS 3.x (3D models,
clip, wind particles, procedural buildings, style imports, the Interactions API) also came out 10 of 10 (C-005), though
three of those sessions got there by downloading and reading GL JS's own code. Run again with Mapbox's skills
installed, those three still downloaded the code and opened no skill (C-006). With the network off (C-013, C-014),
two of them came out right from what the model knew. The third, the procedural building's roofs, came out right 1 time
in 4. Three times the model would not trust that GL JS has a layer for them and drew the roofs itself in WebGL, which
the check fails. The one time it used the layer, from memory, it was right. Told in one sentence that the
layer exists (C-015), the model used it all three times and was right twice; the miss spelt `building-part` with an
underscore. With `building-part` added to the sentence (C-016), all three coloured their buildings
right; the one miss added a `clip` layer, which removed its own buildings even when scoped to the basemap. GL JS's
code and eight map loads (C-018) say why: a clip removes every procedural building layer drawn before it, whatever its
scope, and none drawn after it.

Back with the network on, one more skill was put beside Mapbox's 27 (C-017 to C-029). Mapbox's own skills were never
opened on these three tasks, 0 of 9 on two days. A skill whose description names the features the tasks need was
opened first on every task, morning and afternoon, 6 of 6 (C-017, C-029). Those sessions downloaded nothing, and each
set of three cost $0.80 to $0.87 against C-006's $2.94. Other added skills depended on the hour. On the morning of 27
November every one was opened on every task, 15 of 15, whether its description gave only the API's names, only the
tasks' words (C-019), or a general description under a plain name (C-020). That afternoon a general description was
opened only on the buildings task, 3 of 9, under either name (C-026, C-027). Nothing the sessions' transcripts record
changed between the two: the same model, settings and prompt size (C-028). So the afternoon's tests of the name and the
description (C-024, C-026) were comparisons with the morning, and what changed is not known (T-026, parked).

Then a tour (C-002): 22 small experiments over 21 of Mapbox's capabilities, each run once with a free account's public
token, each recording facts that could have come out false and a screenshot (`experiments/results.md`,
`experiments/gallery.html`). Everything was served except the account's own listings. Two height readings came out
wrong: Mapbox's DEM has the Matterhorn 252 m low, and Tilequery's contours never reach a summit. Read on 24 summits
(C-009), the DEM is low on sharp ones: 8 of 11 by more than 50 m, Fitz Roy by 549 m, though the two in the US were
within 11 m. Broad summits came out a median 21 m low. On low ground, where flood maps need it to the metre (C-030), it
was within half a metre of USGS's lidar at 54% of 468 points in six flood-prone US places, and within a metre at 84%.
No place reached the 90% within half a metre set beforehand, and removing each place's median difference helped only
in two. A flood line drawn on it a metre at a time puts about one point in eight on the wrong side. With the lidar
averaged over Mapbox's own 8 m pixel, over 25 m or over 100 m, the share was 54%, 56% and 60% (C-031, C-034), so the
heights are off, not only too coarse for a street. Nor is it a different zero: no one of NAVD 88, EGM 96 and EGM 2008 fits
the shift in four of the six places (C-033). In six low-lying Dutch places, against the national lidar survey (C-032),
it was worse: within half a metre at 23% of 443 points, and more than 3 m off at 86, almost always too high, with
medians of +2.0 m in Rotterdam and +2.9 m in Amsterdam. Two of Mapbox's MCP tools, elevation and ground-location, read
their heights from the same tiles (C-010). In six English places, against the Environment Agency's lidar (C-038), it was
worse again: 16% of 507 points within half a metre, with Ordnance Datum Newlyn, a zero Mapbox's DEM page names, as the
reference.

Then three more civic checks (C-035 to C-037). Mapbox's geocoder put 97% of 500 random New Orleans addresses and 99% of
500 New York ones within 50 m of the city's own point. An automated WCAG 2.1 AA check passed 78 of the 81 map pages
Claude sessions wrote here; the three failures copy the zoom-blocking viewport line from Mapbox's own example, and no
automated rule tests whether a map's content reaches someone who cannot see it. Given New York's real 311 export of a
week of Brooklyn potholes, 70 of 135 rows with no location and positions in the city's own feet-based grid, Claude
mapped it right 9 times out of 9 (`evals/civic/`).

Then a check of Mapbox's MCP server (C-003): its 16 web-service tools let an agent set 101 of the 240 parameters Mapbox
documents for the endpoints they call. Where the tools' schemas and the docs disagreed, the API sided with the docs six
times and with the tools twice (`experiments/results.md`).

And a test of the Standard style's 48 settings (C-004). Asked in plain words for each, the model with no help wrote a
working call for 44. For three of the newest it invented names, which GL JS ignores without a warning
(`evals/results.md`). `kb.mjs config` now lists all 48. Asked three more times each (C-012), those three came out right
3 times in 9. With one sentence telling the model to search the style's schema by each setting's title and check the
result, they came out right 8 times in 9. On the other 45 settings (C-021) the sentence broke nothing that was loaded,
though every answer became a search, and two did what was asked in a way the check does not credit. Rereading every
earlier answer whose record showed more than the one setting changed (C-023), none of the earlier counts changes.

And the API reference itself (C-011). Of 100 numeric limits it states that a public token can test, the API refused
code that obeyed two: the Search Box query length and a Map Matching radius of 0. `kb.mjs api` now repeats its
parameters, with those results beside them.

What is in it:

| | |
|---|---|
| `kb/catalog.md` | every Mapbox web service with its free tier and price; the libraries; what GL JS reports about itself; the agent tooling Mapbox publishes and what its skills cover |
| `tools/inventory.mjs` | reads GL JS and its style spec from `node_modules/` into `inventory/`: every layer type, property, expression, source, Map method, option and event |
| `tools/kb.mjs` | searches the inventory, and with `api` the API reference's parameters (`tools/api-docs.mjs` reads them) |
| `METHOD.md` | how facts are tagged with their evidence, and what is never committed |
| `evals/` | the harness (headless Chromium, one run per page), ten blind tasks with checks and reference and wrong pages, the session runner, and the results |
| `experiments/` | the tour: one script per question, in `standard/`, `3d/`, `data/` and `api/`, each writing its facts and screenshots to `results/`; `run.mjs` runs them and writes the table and `gallery.html` |
| `experiments/followups/` | checks that came after the tour (C-007 to C-011, C-030 to C-034, C-036, C-038): selecting a building at two pitches, the DEM on 24 summits and on low ground, one call to the MCP elevation tool, the API reference's limits |
| `experiments/mcp/` | the MCP tools against the API reference: `tool_schemas.mjs` (the tools' schemas as JSON Schema), `docs_params.py` (the docs' parameter tables), `compare.mjs`, `settle.mjs` |
| `CARD.md`, `threads.md` | the questions asked one at a time, and the ones still open |

## Use

```bash
npm install --ignore-scripts          # GL JS 3.35.2, style spec 14.35.2, TypeScript (for reading GL JS's types)
node tools/inventory.mjs              # writes inventory/ (about 2 seconds)

node tools/kb.mjs find dash           # anything whose name or doc mentions it
node tools/kb.mjs prop line-dasharray # type, default, range, expression inputs, GL JS version that added it
node tools/kb.mjs layer building      # every property of one layer type
node tools/kb.mjs option style        # a Map constructor option and its default
node tools/kb.mjs method setConfigProperty
node tools/kb.mjs class Marker
node tools/kb.mjs section terrain     # light, light-3d, fog, terrain, projection, camera, import, snow, rain, ...
node tools/kb.mjs events
node tools/kb.mjs config              # the Standard style's 48 settings (fetched by inventory.mjs when .env has a token)
node tools/kb.mjs config showHdRoads  # one, with whether a model named it wrong without help
node tools/api-docs.mjs               # reads the API reference's 25 pages into inventory/api-params.json
node tools/kb.mjs api matching radiuses   # web-service parameters, with C-011's test of a stated limit beside it

node experiments/run.mjs              # every experiment, about 6 minutes, 19 map loads and 25 requests
node experiments/run.mjs 3d/clip      # one
open experiments/gallery.html         # the questions, facts and screenshots

node experiments/mcp/tool_schemas.mjs # needs the MCP server cloned at .cache/vendor/mcp-server (commit in the script)
node experiments/mcp/compare.mjs      # fetches 14 docs pages into .cache/ once, then compares
node experiments/mcp/settle.mjs       # 11 read-only requests
node experiments/followups/<name>.mjs # C-007 to C-011's checks: same-building selection, the DEM on 24 summits, the
                                      # MCP elevation tool, the API reference's limits (each script says what it needs)
node experiments/followups/dem-lowland.mjs  # C-030: the DEM against USGS's lidar at 600 points, about 2 to 7 minutes
node experiments/followups/dem-lowland-pixel.mjs  # C-031: the same points, lidar averaged over Mapbox's pixel, about 5 minutes
node experiments/followups/dem-lowland-nl.mjs     # C-032: six Dutch places against AHN's lidar, about 5 to 10 minutes
node experiments/followups/dem-datum-us.mjs       # C-033: the US shifts against NAVD 88, EGM 96 and EGM 2008, about 1 minute
node experiments/followups/dem-lowland-wide.mjs   # C-034: the US points with lidar averaged over 50 and 100 m, about 4 minutes
node experiments/followups/geocode-addresses.mjs  # C-036: 1,000 official addresses geocoded, counts only, about 8 minutes
node experiments/followups/dem-lowland-england.mjs  # C-038: six English places, needs .venv (pip install -r requirements.txt), about 30 minutes
node evals/a11y/run.mjs                           # C-035: axe-core on every page sessions wrote (82 map loads)
node evals/run_eval.mjs --set civic --arms reference,wrong   # C-037's set, checked against its own pages; no sessions

node evals/config/run.mjs --validate  # the settings test's grader, on right and wrong answers; no sessions
node evals/config/run.mjs             # 48 Claude sessions (about $1 to $9), then grading
```

The inventory and its search need no Mapbox account. Running maps does: put a public token in `.env` as
`MAPBOX_ACCESS_TOKEN=pk....` (ignored by git).

## Licence

MIT (`LICENSE`), for the code and the writing here.

Not covered by it:
- **Mapbox GL JS and its style spec,** which are under the Mapbox Terms of Service. Neither they nor the inventory text
  read from them are committed; `tools/inventory.mjs` regenerates that text from the installed packages, and the
  Standard style's settings from the Styles API.
- **The screenshots in `experiments/*/results/`,** which are map images © [Mapbox](https://www.mapbox.com/about/maps)
  © [OpenStreetMap](http://www.openstreetmap.org/copyright), with satellite imagery © Maxar.
- **`experiments/mcp/results/tool-schemas.json`,** which reproduces the tool schemas of Mapbox's MCP server, MIT ©
  Mapbox (`experiments/mcp/results/THIRD_PARTY.md`).

Mapbox's docs pages, read for C-003, stay in the git-ignored `.cache/`. Only parameter names, types and constraints
taken from them are committed.
