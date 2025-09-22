(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet')) :
  typeof define === 'function' && define.amd ? define(['exports', 'leaflet'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LTileLayerWMTS = {}, global.L));
})(this, (function (exports, L) { 'use strict';

  function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n.default = e;
    return Object.freeze(n);
  }

  var L__namespace = /*#__PURE__*/_interopNamespaceDefault(L);

  // leaflet-wmts.js
  // Production-ready WMTS TileLayer for Leaflet.
  // Key points:
  // - Spec-compliant KVP (SERVICE, REQUEST, VERSION, ...)
  // - Works out-of-the-box with GoogleMapsCompatible/WebMercator grids (XYZ mapping)
  // - For non-GMC grids, supply tileMatrixLabels so TILEMATRIX matches server identifiers
  // - Supports extraParams (e.g., auth token), baseQuery, crossOrigin, and tileerror handling


  class WMTS extends L__namespace.TileLayer {
    constructor(url, options) {
      // Apply core TileLayer options (opacity, zIndex, subdomains, etc.)
      super(url, options);

      // Destructure WMTS-specific options; keep standard TileLayer options in tileLayerOpts
      const {
        layer,
        tileMatrixSet,
        style = "default",
        format = "image/png",
        tileMatrixLabels,
        googleMapsCompatible = true,
        extraParams,
        baseQuery,
        crossOrigin,
        ...tileLayerOpts
      } = options || {};

      // Set TileLayer options (e.g., subdomains) on 'this.options'
      L__namespace.setOptions(this, tileLayerOpts);

      // Optional labels mapping Leaflet zoom -> TILEMATRIX (string or numeric IDs)
      this._labels = tileMatrixLabels;
      // Fast path: when true, use Leaflet XYZ (z/x/y) directly for TILEMATRIX/COL/ROW
      this._gmc = googleMapsCompatible === true;

      // Normalize base URL and append any static baseQuery before WMTS params
      this._baseUrl = url;
      if (baseQuery && baseQuery.length) {
        const sep = url.includes("?") ? "&" : "?";
        this._baseUrl = `${url}${sep}${baseQuery}`;
      }

      // Leaflet already handles devicePixelRatio; use tileSize as-is for WIDTH/HEIGHT
      const size = this.getTileSize();
      this._wmtsParams = {
        SERVICE: "WMTS",
        REQUEST: "GetTile",
        VERSION: "1.0.0",
        LAYER: String(layer),
        STYLE: String(style),
        TILEMATRIXSET: String(tileMatrixSet),
        FORMAT: String(format),
        WIDTH: String(size.x),
        HEIGHT: String(size.y)
      };

      // Merge extra static params (e.g., TOKEN) into WMTS KVPs
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          this._wmtsParams[k.toUpperCase()] = String(v);
        }
      }

      // Set crossorigin attribute on <img> tags if requested (needed for canvas operations)
      if (crossOrigin) {
        this.options.crossOrigin = crossOrigin === true ? "" : crossOrigin;
      }
    }

    onAdd(map) {
      // Keep a reference to map CRS for consumers that inspect it
      this._crs = this.options.crs || map.options.crs;

      // Hook: allow consumers to attach monitoring to tile errors
      this.on("tileerror", (e) => {
        // Example: console.warn("WMTS tileerror", e.coords, e?.error);
      });

      return super.onAdd(map);
    }

    createTile(coords, done) {
      const tile = super.createTile(coords, done);
      // Ensure crossorigin is set on each tile image if configured
      if (this.options.crossOrigin && !tile.crossOrigin) {
        tile.crossOrigin = this.options.crossOrigin;
      }
      return tile;
    }

    getTileUrl(coords) {
      // Leaflet's internal zoom index for current tile
      const z = this._tileZoom;

      // If labels provided, use them to map zoom -> TILEMATRIX; otherwise use zoom number
      const matrix =
        this._labels && this._labels[z] !== undefined ? this._labels[z] : z;

      // For GMC grids, Leaflet's coords map 1:1 to WMTS COL/ROW
      const tileRow = coords.y;
      const tileCol = coords.x;

      // If not GMC and no labels given, we can't compute generic grid transforms safely
      if (!this._gmc && !this._labels) {
        throw new Error(
          "WMTS: Non-GoogleMapsCompatible grids require tileMatrixLabels mapping."
        );
      }

      // Expand subdomain and build full request URL
      const url = L__namespace.Util.template(this._baseUrl, {
        s: this._getSubdomain(coords)
      });

      // Compose KVP params for WMTS GetTile
      const params = {
        ...this._wmtsParams,
        TILEMATRIX: String(matrix),
        TILEROW: String(tileRow),
        TILECOL: String(tileCol)
      };

      // Safely append params (handles '?'/'&' automatically)
      return url + L__namespace.Util.getParamString(params, url);
    }

    setParams(params, noRedraw) {
      // Map friendly keys to WMTS KVP where applicable
      if (params.layer) this._wmtsParams.LAYER = String(params.layer);
      if (params.style) this._wmtsParams.STYLE = String(params.style);
      if (params.tileMatrixSet)
        this._wmtsParams.TILEMATRIXSET = String(params.tileMatrixSet);
      if (params.format) this._wmtsParams.FORMAT = String(params.format);

      // Update labels and compatibility mode
      if (params.tileMatrixLabels) this._labels = params.tileMatrixLabels;
      if (typeof params.googleMapsCompatible === "boolean")
        this._gmc = params.googleMapsCompatible;

      // Merge any new extraParams
      if (params.extraParams) {
        for (const [k, v] of Object.entries(params.extraParams)) {
          this._wmtsParams[k.toUpperCase()] = String(v);
        }
      }

      // Replace baseQuery if provided
      if (params.baseQuery) {
        const sep = this._url.includes("?") ? "&" : "?";
        this._baseUrl = `${this._url}${sep}${params.baseQuery}`;
      }

      if (!noRedraw) this.redraw();
      return this;
    }
  }

  function wmts(url, options) {
    return new WMTS(url, options);
  }

  exports.WMTS = WMTS;
  exports.wmts = wmts;

}));
//# sourceMappingURL=leaflet.tilelayer.wmts.umd.js.map
