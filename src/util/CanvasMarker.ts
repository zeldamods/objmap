import * as L from 'leaflet';

export interface CanvasMarkerOptions extends L.CircleMarkerOptions {
  icon?: HTMLImageElement;
  iconWidth?: number;
  iconHeight?: number;
}

export class CanvasMarker extends L.CircleMarker {
  options!: CanvasMarkerOptions;

  _updatePath() {
    if (!this.options.icon) {
      // @ts-ignore
      super._updatePath();
      return;
    }

    // @ts-ignore
    this._renderer._botwDrawCanvasImageMarker(this);
  }
}
