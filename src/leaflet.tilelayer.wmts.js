import * as L from "leaflet";

export class WMTS extends L.TileLayer {
  constructor(url, options = {}) {
    super(url, options);

    const {
      layer, tileMatrixSet, style = "default", format = "image/png",
      time, tileMatrixLabels, googleMapsCompatible = true, useGetCapabilities = false,
      extraParams, baseQuery, crossOrigin, requestEncoding, ...tileLayerOpts
    } = options;

    if (!layer) throw new Error("WMTS: 'layer' is required.");
    if (!tileMatrixSet && !useGetCapabilities) throw new Error("WMTS: Either 'tileMatrixSet' or 'useGetCapabilities' is required.");

    L.setOptions(this, tileLayerOpts);

    this._labels = tileMatrixLabels;
    this._gmc = googleMapsCompatible === true;

    // Normalize encoding; detect from URL tokens if unspecified.
    const enc = String(requestEncoding ?? "").toUpperCase();
    const urlHasRestTokens = /\{(layer|style|time|tilematrixset|tilematrix|z|x|y)\}/i.test(url);
    this._encoding = enc === "RESTFUL" ? "REST" : enc;
    if (this._encoding !== "REST" && this._encoding !== "KVP") {
      this._encoding = urlHasRestTokens ? "REST" : "KVP";
    }

    this._baseUrl = baseQuery && baseQuery.length
      ? `${url}${url.includes("?") ? "&" : "?"}${baseQuery}`
      : url;

    const size = this.getTileSize();
    this._wmtsParams = {
      SERVICE: "WMTS",
      REQUEST: "GetTile",
      VERSION: "1.0.0",
      LAYER: String(layer),
      STYLE: style ? String(style) : undefined,
      TILEMATRIXSET: tileMatrixSet ? String(tileMatrixSet) : undefined,
      FORMAT: format ? String(format) : undefined,
      WIDTH: String(size.x),
      HEIGHT: String(size.y)
    };

    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        this._wmtsParams[k.toUpperCase()] = String(v);
      }
    }

    this._rest = {
      layer: String(layer),
      style: style ? String(style) : undefined,
      time: time ? String(time) : undefined,
      tileMatrixSet: tileMatrixSet ? String(tileMatrixSet) : undefined
    };

    if (crossOrigin !== undefined) {
      this.options.crossOrigin = crossOrigin === true ? "" : crossOrigin;
    }

    // If requested, load capabilities to fill in missing info.
    this._useGetCapabilities = useGetCapabilities;
    if (useGetCapabilities) {
      this._capabilitiesLoaded = false;
      this._loadCapabilities();
    }
  }

  createTile(coords, done) {
    const tile = super.createTile(coords, done);
    if (this.options.crossOrigin && !tile.crossOrigin) {
      tile.crossOrigin = this.options.crossOrigin;
    }
    return tile;
  }

  getTileUrl(coords) {
    if (this._useGetCapabilities && !this._capabilitiesLoaded) {
      // Capabilities not yet loaded; return a blank tile URL.
      return L.Util.emptyImageUrl;
    }

    const z = this._tileZoom;
    const matrix = this._labels && this._labels[z] !== undefined ? this._labels[z] : z;

    if (!this._gmc && !this._labels) {
      throw new Error("WMTS: Non-GoogleMapsCompatible grids require tileMatrixLabels mapping.");
    }

    // REST branch: expand ALL placeholders in one go (incl. {s})
    if (this._encoding === "REST") {
      const ctx = {
        s: this._getSubdomain(coords),
        layer: this._rest.layer,
        style: this._rest.style,
        time: this._rest.time,
        tilematrixset: this._rest.tileMatrixSet,
        tileMatrixSet: this._rest.tileMatrixSet, // camelCase too, if template uses it
        z, x: coords.x, y: coords.y,
        tilematrix: String(matrix),
        tileMatrix: String(matrix)
      };
      return L.Util.template(this._baseUrl, ctx);
    }

    // KVP branch: URL must NOT contain REST placeholders besides optional {s}
    const hasNonSubdomainTokens = /\{(?!s\})[^}]+\}/.test(this._baseUrl);
    if (hasNonSubdomainTokens) {
      throw new Error("WMTS KVP: base URL contains REST placeholders. Use REST encoding or a KVP base.");
    }

    const url = L.Util.template(this._baseUrl, { s: this._getSubdomain(coords) });
    const params = {
      ...this._wmtsParams,
      TILEMATRIX: String(matrix),
      TILEROW: String(coords.y),
      TILECOL: String(coords.x)
    };
    return url + L.Util.getParamString(params, url);
  }

  setParams(params = {}, noRedraw) {
    if (params.requestEncoding) {
      const enc = String(params.requestEncoding).toUpperCase();
      this._encoding = enc === "RESTFUL" ? "REST" : enc;
    }

    if (params.layer) {
      this._wmtsParams.LAYER = String(params.layer);
      this._rest.layer = String(params.layer);
    }
    if (params.style) {
      this._wmtsParams.STYLE = String(params.style);
      this._rest.style = String(params.style);
    }
    if (params.tileMatrixSet) {
      this._wmtsParams.TILEMATRIXSET = String(params.tileMatrixSet);
      this._rest.tileMatrixSet = String(params.tileMatrixSet);
    }
    if (params.format) this._wmtsParams.FORMAT = String(params.format);
    if (params.time !== undefined) this._rest.time = params.time ? String(params.time) : undefined;

    if (params.tileMatrixLabels) this._labels = params.tileMatrixLabels;
    if (typeof params.googleMapsCompatible === "boolean") this._gmc = params.googleMapsCompatible;

    if (params.extraParams) {
      for (const [k, v] of Object.entries(params.extraParams)) {
        this._wmtsParams[k.toUpperCase()] = String(v);
      }
    }

    if (params.useGetCapabilities !== undefined && params.useGetCapabilities !== this._useGetCapabilities) {
      this._useGetCapabilities = params.useGetCapabilities;
      this._capabilitiesLoaded = false;
      // If requested, load capabilities to fill in missing info.
      if (this._useGetCapabilities) {
        this._loadCapabilities();
      }
    }

    if (params.baseQuery !== undefined) {
      const sep = this._url.includes("?") ? "&" : "?";
      this._baseUrl = `${this._url}${sep}${params.baseQuery ?? ""}`;
    }

    if (!noRedraw) this.redraw();
    return this;
  }

  /**
   * Load WMTS GetCapabilities document and extract TileMatrixSet info.
   */
  async _loadCapabilities() {
    // Fetch GetCapabilities document
    const capabilitiesUrl = this._baseUrl + L.Util.getParamString({
      SERVICE: "WMTS",
      REQUEST: "GetCapabilities",
      VERSION: "1.0.0"
    });

    const response = await fetch(capabilitiesUrl);
    if (!response.ok) {
      throw new Error(`WMTS: Failed to load WMTS capabilities: ${response.statusText}`);
    }
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "application/xml");

    // Extract TileMatrixSet info
    // The labels for all TileMatrixSets
    const tileMatrixSetsLabels = Object.fromEntries(
      Array.from(doc.querySelectorAll("Contents > TileMatrixSet"))
        .map(tileMatrixSet => [
          tileMatrixSet.querySelector("Identifier")?.textContent,
          Array.from(tileMatrixSet.querySelectorAll("TileMatrix > Identifier"))
            .map(tileMatrix => tileMatrix?.textContent)
        ]));
    // Find which TileMatrixSet is used by our layer
    const layers = Object.fromEntries(
    Array.from(doc.querySelectorAll("Contents > Layer"))
      .map(layer => [
        layer.querySelector("Identifier")?.textContent,
        {
          tileMatrixSet: layer.querySelector("TileMatrixSetLink > TileMatrixSet")?.textContent,
          defaultStyle: layer.querySelector("Style[isDefault='true'] > Identifier")?.textContent ?? layer.querySelector("Style > Identifier")?.textContent,
          formats: Array.from(layer.querySelectorAll("Format")).map(format => format.textContent),
          // If we wanted, we could extract more info here (e.g. min and max row and col for
          // each tile matrix)
        }
      ]));
    const layer = layers[this._wmtsParams.LAYER];
    const tileMatrixLabels = tileMatrixSetsLabels[this._wmtsParams.TILEMATRIXSET ?? layer.tileMatrixSet]; // The labels for the set used by our layer

    // Only set params that were not explicitly provided.
    // We make the assumption that even if the user explicitly provided "default" for
    // style, they probably want whatever the server labels as the default style for
    // that layer.
    if (this._wmtsParams.STYLE === "default") {
      this._wmtsParams.STYLE = String(layer.defaultStyle);
      this._rest.style = String(layer.defaultStyle);
    }
    if (!this._wmtsParams.TILEMATRIXSET) {
      this._wmtsParams.TILEMATRIXSET = String(layer.tileMatrixSet);
      this._rest.tileMatrixSet = String(layer.tileMatrixSet);
    }
    // User could have explicitly provided format as image/png, so this is a hack to
    // only override if it's not supported.
    if (this._wmtsParams.FORMAT === "image/png" && !layer.formats.includes("image/png")) {
      this._wmtsParams.FORMAT = String(layer.formats[0]);
    }
    if (!this._labels) {
      this._labels = tileMatrixLabels;
    }

    // Finish
    this._capabilitiesLoaded = true;
    this.redraw();
  }
}

export function wmts(url, options) {
  return new WMTS(url, options);
}
