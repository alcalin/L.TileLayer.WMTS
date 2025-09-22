import resolve from "@rollup/plugin-node-resolve";

/**
 * Builds a UMD bundle for browser demos:
 *   dist/leaflet.tilelayer.wmts.umd.js
 * Global name: LTileLayerWMTS
 * Usage in browser:
 *   <script src="leaflet.js"></script>
 *   <script src="dist/leaflet.tilelayer.wmts.min.js"></script>
 *   const layer = LTileLayerWMTS.wmts(url, options);
 */
export default {
  input: "src/leaflet.tilelayer.wmts.js",
  output: {
    file: "dist/leaflet.tilelayer.wmts.umd.js",
    format: "umd",
    name: "LTileLayerWMTS",
    sourcemap: true,
    globals: { leaflet: "L" }
  },
  external: ["leaflet"],
  plugins: [resolve()]
};
