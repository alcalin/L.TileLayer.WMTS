# L.TileLayer.WMTS

A modern, lightweight **Leaflet WMTS TileLayer** plugin.

- ✅ Spec-compliant WMTS KVP (`SERVICE`, `REQUEST`, `VERSION`, …)
- ✅ Works out-of-the-box with **GoogleMapsCompatible/WebMercator**
- ✅ Supports **custom TILEMATRIX labels** for non-GMC grids
- ✅ `extraParams`, `baseQuery`, `crossOrigin`, error hooks
- 🧩 Ships **both ESM (for npm/bundlers)** and **UMD (for browsers/demos)** builds

---

## Install (npm)

```bash
npm i l.tilelayer.wmts leaflet
```

> Peer dep: you must also install `leaflet` in your app.

### Usage (bundlers, ESM)

```js
import * as L from "leaflet";
import { wmts } from "l.tilelayer.wmts";

const map = L.map("map").setView([40.7128, -74.0060], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

// GoogleMapsCompatible (WebMercator) example
const layer = wmts("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/WMTS/tile/1.0.0/", {
  layer: "USGSTopo",
  style: "default",
  tileMatrixSet: "default028mm",
  format: "image/png",
  googleMapsCompatible: true,
  crossOrigin: true
});

layer.addTo(map);
```

---

## Browser Demo (UMD build)

A prebuilt UMD bundle is available under `dist/`.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>WMTS Plugin Demo</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
  <div id="map" style="height:100vh"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="./dist/leaflet.tilelayer.wmts.min.js"></script>
  <script>
    const map = L.map("map").setView([40.7, -74], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    const layer = LTileLayerWMTS.wmts(
      "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/WMTS/tile/1.0.0/",
      {
        layer: "USGSTopo",
        style: "default",
        tileMatrixSet: "default028mm",
        format: "image/png",
        googleMapsCompatible: true
      }
    );
    layer.addTo(map);
  </script>
</body>
</html>
```

On GitHub Pages, the demo will use the UMD build.

---

## Options

**`WMTSOptions`** (in addition to `L.TileLayerOptions`):

| Option | Type | Default | Description |
|---|---|---|---|
| `layer` | `string` | — | WMTS layer name |
| `tileMatrixSet` | `string` | — | WMTS matrix set |
| `style` | `string` | `"default"` | WMTS style |
| `format` | `string` | `"image/png"` | Tile MIME type |
| `tileMatrixLabels` | `(string\|number)[]` | `undefined` | Map Leaflet zoom → `TILEMATRIX` |
| `googleMapsCompatible` | `boolean` | `true` | Use XYZ mapping directly |
| `extraParams` | `Record<string, any>` | `{}` | Extra query params (e.g., token) |
| `crossOrigin` | `string\|true` | `undefined` | Sets `crossorigin` on tile images |
| `baseQuery` | `string` | `undefined` | Appended before WMTS KVPs |

---

## Project Structure

```
/src
  leaflet.tilelayer.wmts.js      # ESM source
  leaflet.tilelayer.wmts.d.ts    # TypeScript typings
/dist
  leaflet.tilelayer.wmts.umd.js  # UMD build (Rollup output)
  leaflet.tilelayer.wmts.min.js  # Minified UMD build (for browser/demo)
/demo
  index.html                     # GitHub Pages demo (loads dist build)
```

---

## Troubleshooting

- **`Failed to resolve module specifier "leaflet"`**  
  Use this package in a bundler-based app (npm install). For browser demos, include the UMD build under `dist/`.

- **CORS errors in demos**  
  Serve your HTML via `http://localhost` (e.g., `npx http-server`) rather than `file://`.

---

## License

Beerware
