import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rastercoords';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';

import { CanvasMarker } from '@/util/CanvasMarker';
import * as map from '@/util/map';
import { Point } from '@/util/map';
import * as ui from '@/util/ui';
import '@/util/leaflet_tile_workaround.js';
import { Settings } from './util/settings';

declare module 'leaflet' {
  export type RasterCoords = any;
  export let RasterCoords: any;
}

export const SHOW_ALL_OBJS_FOR_MAP_UNIT_EVENT = 'objmap::SHOW_ALL_OBJS_FOR_MAP_UNIT';
export const MARKER_SELECTED_EVENT = 'objmap::markerSelected';

export class MapBase {
  m!: L.Map;
  private rc!: L.RasterCoords;
  center: Point = [0, 0, 0];
  zoom: number = map.DEFAULT_ZOOM;
  private zoomChangeCbs: Array<(zoom: number) => void> = [];

  toXZ(latlng: L.LatLng): Point {
    return [latlng.lng, 0, latlng.lat];
  }
  fromXZ(pos: Point): L.LatLngExpression {
    return [pos[2], pos[0]];
  }

  setView(pos: Point, zoom = -1) {
    this.center = pos;
    this.setZoomProp(zoom == -1 ? this.m.getZoom() : zoom);
    this.m.setView(this.fromXZ(this.center), this.zoom);
  }

  emitMarkerSelectedEvent(marker: any) { this.m.fireEvent(MARKER_SELECTED_EVENT, { marker }); }
  registerMarkerSelectedCb(cb: (marker: any) => void) { this.m.on(MARKER_SELECTED_EVENT, (e: any) => cb(e.marker)); }

  registerZoomChangeCb(cb: (zoom: number) => void) { this.zoomChangeCbs.push(cb); }
  registerMoveEndCb(cb: any) { this.m.on('moveend', cb); }
  registerZoomCb(cb: any) { this.m.on('zoom', cb); }
  // Fires shortly after zoomstart with the target zoom level.
  registerZoomAnimCb(cb: any) { this.m.on('zoomanim', cb); }
  registerZoomEndCb(cb: any) { this.m.on('zoomend', cb); }

  constructor(element: string) {
    this.constructMap(element);
    this.initBaseMap();
  }

  private constructMap(element: string) {
    const crs = L.Util.extend({}, L.CRS.Simple);
    // @ts-ignore
    crs.transformation = new L.Transformation(4 / map.TILE_SIZE, map.MAP_SIZE[0] / map.TILE_SIZE,
      4 / map.TILE_SIZE, map.MAP_SIZE[1] / map.TILE_SIZE);

    L.Canvas.include({
      _botwDrawCanvasImageMarker(layer: CanvasMarker) {
        // @ts-ignore
        if (layer._empty())
          return;
        // @ts-ignore
        const p: L.Point = layer._point;
        const ctx: CanvasRenderingContext2D = this._ctx;
        const img: HTMLImageElement = (layer.options.icon)!;
        if (layer.options.iconWidth && layer.options.iconHeight) {
          ctx.drawImage(img, p.x - layer.options.iconWidth / 2, p.y - layer.options.iconHeight / 2,
            layer.options.iconWidth, layer.options.iconHeight);
        } else {
          ctx.drawImage(img, p.x - img.width / 2, p.y - img.height / 2);
        }
      },
    });

    let padding = 0.7;
    if (L.Browser.safari && L.Browser.mobile && L.Browser.retina) {
      padding = 0.1;
    }
    const renderer = L.canvas({
      // Set a larger padding to avoid markers fading in too late when dragging
      padding,
    });

    this.m = new L.Map(element, {
      attributionControl: false,
      zoomControl: false,
      zoom: map.DEFAULT_ZOOM,
      minZoom: map.MIN_ZOOM,
      maxZoom: map.MAX_ZOOM,
      maxBoundsViscosity: 1.0,
      crs,

      renderer,
      preferCanvas: true,

      // @ts-ignore
      contextmenu: true,
      contextmenuItems: [
        {
          text: 'Copy coordinates',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            const [x, z] = this.toXZ(latlng);
            ui.copyToClipboard(`${x},${z}`);
          },
        },
        {
          text: 'Center map here',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            this.m.panTo(latlng);
          }
        },
        {
          text: 'Show all objects in map unit',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            this.m.fire(SHOW_ALL_OBJS_FOR_MAP_UNIT_EVENT, { latlng });
          },
        }
      ],
    });

    this.rc = new L.RasterCoords(this.m, map.MAP_SIZE);
    this.rc.setMaxBounds();

    this.registerZoomAnimCb((evt: L.ZoomAnimEvent) => {
      this.setZoomProp(evt.zoom);
    });
    this.registerMoveEndCb(() => {
      this.center = this.toXZ(this.m.getCenter());
    });
  }

  private initBaseMap() {
    // Add a base image to make tile loading less noticeable.
    const BASE_PANE = 'base';
    this.m.createPane(BASE_PANE).style.zIndex = '0';
    const southWest = this.rc.unproject([0, this.rc.height]);
    const northEast = this.rc.unproject([this.rc.width, 0]);
    const bounds = new L.LatLngBounds(southWest, northEast);
    const baseImage = L.imageOverlay('/game_files/maptex/base.png', bounds, {
      pane: BASE_PANE,
    });
    baseImage.addTo(this.m);

    const baseLayer = L.tileLayer('/game_files/maptex/{z}/{x}/{y}.png', {
      maxNativeZoom: 7,
    });
    baseLayer.addTo(this.m);

    this.m.createPane('front').style.zIndex = '1000';
    this.m.createPane('front2').style.zIndex = '1001';
  }

  private setZoomProp(zoom: number) {
    this.zoom = zoom;
    for (const cb of this.zoomChangeCbs)
      cb(zoom);
  }
}
