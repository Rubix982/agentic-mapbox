# Method

Everything here is about one Mapbox GL JS: 3.35.2, with style spec 14.35.2, run in headless Chromium on Apple Silicon.
A fact about another version is marked with that version. Every fact carries its evidence:

| Tag | Meaning | Where it comes from |
|---|---|---|
| `[inv]` | read from the library itself: a layer type, property, default, range, expression, method, option or event | `tools/inventory.mjs` reads `node_modules/`; the output is `inventory/` (not committed, see below) and `tools/kb.mjs` searches it |
| `[exp: path]` | measured here, by a script anyone with a token can run again | `experiments/<area>/<name>.mjs`, result in `experiments/<area>/results/<name>.json` |
| `[doc: link]` | from Mapbox's documentation or pricing page, with the date it was read | docs.mapbox.com, mapbox.com/pricing |
| `[skill: name]` | what one of Mapbox's own Agent Skills says | github.com/mapbox/mapbox-agent-skills, at the commit named |

A fact with no tag is a guess and is written as one ("probably", "untested").

## Experiments

One question per script. A script loads a page with GL JS in headless Chromium, does one thing, and records what
happened: each fact is one plain sentence that could come out false, with the numbers behind it (map state read back
from the map, console errors, a screenshot of at most 512 px). A failed attempt is a result too: the error and what fixed
it are the fact.

Every experiment that calls Mapbox's servers costs map loads or requests against the account's free tier. Each result
records how many it used.

`experiments/lib.mjs` holds what they share: `mapExperiment` builds the page, opens it once through
`evals/harness/run_page.mjs`, and lets the script's check measure it, and `apiExperiment` makes web-service requests from
Node. Each writes `results/<name>.json` with the question, the facts (`holds: true` or `false`), the numbers, which Mapbox
requests were refused (HTTP 400 or above, apart from any the check asked for on purpose), and what it used. The token, and
anything else marked secret such as the account name, is replaced before anything is written. A fact restated after a
first run says in its script what the first version asked, and `experiments/results.md` lists those.

## What this repository never contains

An access token (it lives in `.env`, which is ignored), Mapbox's library code, or the inventory text read from it: that
text is Mapbox's, under the Mapbox TOS, and `tools/inventory.mjs` regenerates it from the installed packages.
Nor Mapbox's documentation pages (`.cache/mcp-docs/`), nor the transcripts of Claude sessions (`evals/runs/`). Account
names and Anthropic request IDs are masked in results. Screenshots are committed with the attribution Mapbox asks for
static images: the logo and text inside the image, and a credit beside it (`experiments/results.md`, `gallery.html`).
