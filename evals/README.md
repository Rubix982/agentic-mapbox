# Evals: the harness contract

What a task, its check, and its reference and wrong pages must look like, so that `evals/run_eval.mjs` can run them.

## What the agent sees

Each session is a fresh `claude -p` in an empty folder, given this prompt (`PROMPT` in `run_eval.mjs`) with the task's
text up to its `Check:` sentence:

```
Write a web page that uses Mapbox GL JS v3.35.2 to do the task below.

Your page will be opened exactly once, by a test harness, in headless Chromium at 800 x 600 px. Do not open it
yourself. The harness serves this folder over HTTP and loads ./index.html. Your page must:
- be one file, ./index.html, loading Mapbox GL JS v3.35.2 from
  https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.js and https://api.mapbox.com/mapbox-gl-js/v3.35.2/mapbox-gl.css
  (no build step, no other map library);
- take its access token from window.MAPBOX_ACCESS_TOKEN, which is set before your scripts run (do not hard-code a token);
- make the map fill the window, and assign the map to window.map.
Any file the task names is already in this folder. Write ./index.html, then stop and say it is written. Its first run is
what counts.

Task:
<the task>
```

## Files

| Path | What |
|---|---|
| `tasks/tasks.md` | the ten tasks, each as `**N. Title (area).** text… Check: …` on its own paragraph, as in the Blender guide's sets |
| `tasks/data/taskN/` | files a task names (GeoJSON, CSV, images); copied into the session's folder before it starts and served beside `index.html` |
| `tasks/checks.mjs` | `export default { 1: async (t) => ({ passed, reasons, numbers }), … }` |
| `tasks/reference/taskN.html` | a correct page for task N |
| `tasks/reference/wrongN.html` | a page with one plausible mistake for task N, which its check must fail |
| `tasks/validation.md` | the reference and wrong runs, and what each check measured on them |

## What a check gets

`t` is passed after `window.map` exists and the map has fired `idle` once (style, sources and tiles loaded, camera at
rest). A page that never sets `window.map` within 30 s, or never goes idle within 60 s, fails before its check runs.

| | |
|---|---|
| `t.eval(fn, arg)` | runs `fn` in the page (Playwright `page.evaluate`); use it to read `window.map`: `getStyle()`, `getLayer`, `getPaintProperty`, `getConfigProperty`, `getTerrain`, `getFog`, `getProjection`, `getCenter`, `getZoom`, `queryRenderedFeatures`, `project`, source data |
| `t.idle(ms)` | waits for the next `idle` (after a click or a camera move); resolves `true`, or `false` on timeout |
| `t.page` | the Playwright page: `t.page.mouse.click(x, y)`, `t.page.locator('.mapboxgl-popup')`, `t.page.waitForTimeout(ms)` |
| `t.screenshot()` | a decoded PNG of the 800 x 600 viewport (`{ width, height, data }`, RGBA) |
| `t.patch(x, y, r, img?)` | mean `[R, G, B]` (0–255) of a (2r+1)² patch at (x, y), top-left origin |
| `t.errors` | `{ console: [...], page: [...], requests: [...] }`: console errors, uncaught exceptions, HTTP ≥ 400 responses |

A check returns `{ passed: boolean, reasons: [strings saying what failed], numbers: { what it measured } }`.

## Running

```bash
node evals/harness/run_page.mjs FOLDER --checks evals/tasks/checks.mjs --task N --shot out.png   # one page
node evals/run_eval.mjs --arms reference,wrong          # every reference and wrong page; no Claude session
node evals/run_eval.mjs --arms reference --tasks 3      # one task
```

Each page run is one GL JS map load (plus whatever web-service requests it makes) on the account in `.env`.
