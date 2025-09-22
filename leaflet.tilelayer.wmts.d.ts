// leaflet-wmts.d.ts
// Type definitions for leaflet-wmts.js
// Project: Leaflet WMTS TileLayer
// Minimum TypeScript Version: 4.4

import * as L from "leaflet";

export type WMTSMatrixLabel = string | number;

export interface WMTSOptions extends L.TileLayerOptions {
  layer: string;
  tileMatrixSet: string;
  style?: string;
  format?: string;
  /** Maps Leaflet zoom -> WMTS TILEMATRIX identifier (string or number). */
  tileMatrixLabels?: WMTSMatrixLabel[];
  /** When true, use Leaflet XYZ mapping directly (GoogleMapsCompatible). */
  googleMapsCompatible?: boolean;
  /** Extra static query params (e.g., tokens). */
  extraParams?: Record<string, string | number | boolean>;
  /** crossOrigin attribute value; true maps to empty string. */
  crossOrigin?: string | true;
  /** Base query string appended to the URL before WMTS params. */
  baseQuery?: string;
}

export class WMTS extends L.TileLayer {
  constructor(url: string, options: WMTSOptions);
  /** Override to inject crossorigin. */
  createTile(coords: L.Coords, done: L.DoneCallback): HTMLImageElement;
  /** Returns a fully composed WMTS tile URL. */
  getTileUrl(coords: L.Coords): string;
  /** Update WMTS params and optionally redraw. */
  setParams(params: Partial<WMTSOptions> & Record<string, any>, noRedraw?: boolean): this;
}

export function wmts(url: string, options: WMTSOptions): WMTS;
