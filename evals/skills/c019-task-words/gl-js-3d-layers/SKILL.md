---
name: gl-js-3d-layers
description: "Mapbox GL JS v3.35: how to place a 3D model file at many points, each turned to its own heading and coloured from its own properties; how to remove Mapbox Standard's own 3D buildings and trees inside an area; and how to draw 3D buildings from your own footprints with real roof shapes and separate roof and wall colours."
---

# GL JS v3.35: models on points, clipping Standard, procedural buildings

Each section has a snippet on made-up data and the facts it depends on. Everything here holds for GL JS 3.35.2.

## glTF models on GeoJSON points

```js
map.on('style.load', () => {
  map.addModel('kiosk', new URL('kiosk.glb', location.href).href);
  map.addSource('kiosks', { type: 'geojson', data: 'kiosks.geojson' }); // Point features
  map.addLayer({
    id: 'kiosks',
    type: 'model',
    source: 'kiosks',
    layout: { 'model-id': 'kiosk' },
    paint: {
      'model-rotation': [0, 0, ['get', 'bearing']],
      'model-color': ['match', ['get', 'state'], 'closed', '#757575', '#1e88e5'],
      'model-color-mix-intensity': 1
    }
  });
});
```

- `map.addModel(id, url)` registers a glTF or GLB file; a `model` layer on a GeoJSON or vector source draws one copy
  at each point, chosen by `model-id`.
- `model-color` is a tint, and it is not used unless `model-color-mix-intensity` is above 0. Its default is 0, so a
  `model-color` on its own changes nothing. 1 gives the full tint.
- `model-rotation` is `[x, y, z]` in degrees and can be data-driven. A positive z turns the model clockwise seen from
  above, and glTF's −Z axis points north, so `[0, 0, bearing]` turns a model that faces north in its file to a
  bearing given in degrees clockwise from north.
- A glTF primitive with no index buffer does not load ("Cannot read properties of undefined (reading 'bufferView')").

## Removing Standard's 3D buildings and trees inside an area

```js
map.on('style.load', () => {
  map.addSource('plot', { type: 'geojson', data: 'plot.geojson' }); // a Polygon
  map.addLayer({ id: 'plot-clip', type: 'clip', source: 'plot', layout: { 'clip-layer-types': ['model'] } });
});
```

- A `clip` layer removes 3D content under its polygon from the layers drawn before it.
- Add it without a `slot`. On Standard, a layer with no slot is drawn after all of Standard's layers, which is what the
  clip needs. In Standard's `middle` slot it removes nothing, because Standard's 3D layers are drawn after that slot.
- Standard's trees are instanced models. They are removed only when `clip-layer-types` includes `'model'`; `'symbol'`
  removes symbols as well.
- `clip-layer-scope` is empty by default, and then the clip applies to every layer.
- Fill-extrusions are removed only when they come from a `building` or `procedural_buildings` source layer. Standard's
  3D buildings do; a fill-extrusion over your own GeoJSON is not removed.

## 3D buildings from your own GeoJSON footprints

```js
map.on('style.load', () => {
  map.addSource('plan', { type: 'geojson', data: 'plan.geojson' }); // Polygon footprints
  map.addLayer({
    id: 'plan',
    type: 'building',
    source: 'plan',
    layout: {
      'building-height': ['get', 'height'],
      'building-roof-shape': ['get', 'roof']
    },
    paint: {
      'building-color': ['match', ['get', 'building-part'], 'roof', '#6d4c41', 'wall', '#fafafa', '#bdbdbd']
    }
  });
});
```

- GL JS 3.35.2 has a procedural building layer, `type: 'building'`, and it can draw a GeoJSON source. The style spec
  marks the layer type private, but the layer works.
- `building-height` and `building-base` are in metres. `building-roof-shape` is one of `flat`, `hipped`, `gabled`,
  `parapet`, `mansard`, `skillion` or `pyramidal`, and can be read from a feature property.
- `building-color` is evaluated once for each part of a building, with the part's name in the feature property
  `building-part`: `roof`, `wall`, `window` or `door`. The spec does not name this property.
- The layer is lit by the style's 3D lights. On Standard it is lit. On a style with no `lights`, such as Mapbox Light
  (light-v11), it was seen drawing solid black, in software WebGL.
- `building-facade: true` draws no windows on plain GeoJSON footprints. The facades come from LineString features in
  the same source, which Mapbox's own procedural-buildings tileset has and plain footprints do not.
