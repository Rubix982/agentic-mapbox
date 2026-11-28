# civic: three tasks on a real city export

Each task below is one paragraph, `**N. Title (area).** text… Check: …`. An agent sees the paragraph up to `Check:`;
the check itself is `checks.mjs`. The files are in `data/taskN/`, written by `make_data.mjs` from New York City's 311
Service Requests (data.cityofnewyork.us, `erm2-nwe9`): every Street Condition / Pothole report in Brooklyn created from 1
to 7 November 2026, 135 rows, fetched on 28 November 2026. Of the 135, 70 have no location at all and 27 are still open.
Nothing in the files was altered except that task 2's file has the latitude, longitude and location columns removed.

**1. Pothole reports with and without a location (points from a city CSV).** `potholes.csv` is New York City's 311
export of every pothole report made in Brooklyn from 1 to 7 November 2026. On Mapbox's Standard style, show each report
that has a location as a circle of radius 6 px in #c62828, and fit the view to them. Leave out reports with no location,
and show how many were left out in an element with id `skipped`, written like `12 without a location`. Keep each
report's `unique_key` as a property of its feature. Check: the basemap is Standard; the circles drawn are exactly the 65
reports with a location, by `unique_key`, each within 5 m of the city's latitude and longitude, all in view, with radius
6 px (±0.5) and colour #c62828 (±12 a channel); no GeoJSON source holds more than those 65 reports; and `#skipped`'s
text contains 70.

**2. Pothole reports placed from the city's own X and Y (coordinates in a file).** `potholes-xy.csv` is the same 311
export of Brooklyn pothole reports from 1 to 7 November 2026, with the latitude, longitude and location columns removed,
so a report's position is given only by its `x_coordinate_state_plane` and `y_coordinate_state_plane`. On Mapbox's
Standard style, show each report that has a position as a circle of radius 6 px in #1565c0, and fit the view to them.
Keep each report's `unique_key` as a property of its feature. Check: the basemap is Standard; the circles drawn are
exactly the 65 reports with a position, by `unique_key`, each within 15 m of where the city's own latitude and longitude
put it (in `truth.json`, not given to the agent), all in view, radius 6 px (±0.5), colour #1565c0 (±12 a channel).

**3. How fast each pothole was closed (colour from two dates).** `potholes.csv` is New York City's 311 export of every
pothole report made in Brooklyn from 1 to 7 November 2026. On Mapbox's Standard style, show each report that has a
location as a circle of radius 6 px, coloured by how long it took from `created_date` to `closed_date`: closed within 24
hours #2e7d32, closed after more than 24 hours #f9a825, and still open (no `closed_date`) #c62828. Fit the view to
them, and keep each report's `unique_key` as a property of its feature. Check: the basemap is Standard; the circles drawn
are exactly the 65 reports with a location, by `unique_key`, all in view, radius 6 px (±0.5); and each circle's colour,
as GL JS evaluates it for that feature, is its category's within 12 a channel (43 within 24 hours, 13 after, 9 open).
