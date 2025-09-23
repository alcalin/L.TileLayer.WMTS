// leaflet-wmts.d.ts
// Type definitions for leaflet-wmts.js
// Project: Leaflet WMTS TileLayer
// Minimum TypeScript Version: 4.4

import * as L from "leaflet";

import * as L from "leaflet";

/**
 * Options for WMTS layers, extending standard Leaflet TileLayerOptions.
 */
export interface WMTSOptions extends L.TileLayerOptions {
  /** WMTS layer name */
  layer: string;
  /** WMTS matrix set identifier */
  tileMatrixSet: string;
  /** WMTS style (default: "default") */
  style?: string;
  /** Tile MIME type (default: "image/png") */
  format?: string;
  /** Explicit mapping of Leaflet zoom levels to WMTS TILEMATRIX identifiers */
  tileMatrixLabels?: (string | number)[];
  /** If true, assume GoogleMapsCompatible (WebMercator XYZ) grid */
  googleMapsCompatible?: boolean;
  /** Additional query parameters (e.g., token) */
  extraParams?: Record<string, any>;
  /** Custom query string appended before WMTS KVPs */
  baseQuery?: string;
  /**
   * Cross-origin setting for tile requests.
   * Matches Leaflet's definition: boolean | "anonymous" | "use-credentials"
   */
  crossOrigin?: boolean | L.CrossOrigin;
}

/**
 * WMTS TileLayer class.
 */
export class WMTS extends L.TileLayer {
  constructor(url: string, options: WMTSOptions);
  setParams(params: Record<string, any>, noRedraw?: boolean): this;
}

/**
 * Factory function for WMTS layers.
 */
export function wmts(url: string, options: WMTSOptions): WMTS;
