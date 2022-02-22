export const TILE_SIZE = 256;
export const MAP_SIZE = [24000, 20000];

export const GAME_FILES = process.env.VUE_APP_GAME_FILES;

export type Point = [number, number, number];

export function isValidXYZ(x: number, y: number, z: number) {
  return Math.abs(x) <= 6000 && Math.abs(z) <= 5000;
}

export function isValidPoint(p: Point) {
  return isValidXYZ(p[0], p[1], p[2]);
}

export function pointToMapUnit(p: Point) {
  const col = ((p[0] + 5000) / 1000) >>> 0;
  const row = ((p[2] + 4000) / 1000) >>> 0;
  return String.fromCharCode('A'.charCodeAt(0) + col)
    + '-'
    + String.fromCharCode('1'.charCodeAt(0) + row);
}

export const enum MarkerType {
  Water = 0,
  Artifact = 1,
  Magma = 2,
  Location = 3,
  Timber = 4,
  Region = 5,
  Region2 = 6,
  Mountain = 7,
}
const MARKER_TYPE_STRS = [
  'Water', 'Artifact', 'Magma', 'Location', 'Timber', 'Region', 'Region', 'Mountain'
];
export function markerTypetoStr(type: MarkerType) {
  return MARKER_TYPE_STRS[type];
}

export const enum ShowLevel {
  Region = 1,
  Area = 2,
  Location = 4,
  SecondaryLocation = 8,
}

export const DEFAULT_ZOOM = 3;
export const MIN_ZOOM = 2;
export const MAX_ZOOM = 10;

export function shouldShowLocationMarker(showLevel: ShowLevel, zoom: number) {
  switch (showLevel) {
    case ShowLevel.Region:
      return zoom === 2;
    case ShowLevel.Area:
      return zoom === 3 || zoom === 4;
    case ShowLevel.Location:
      return zoom >= 5;
    case ShowLevel.SecondaryLocation:
      return zoom >= 7;
  }
}

export class LocationMarkerBase {
  protected l: any;

  constructor(data: any) {
    this.l = data;
  }

  getMessageId(): string { return this.l.MessageID; }
  getXYZ(): Point { return [this.l.Translate.X, this.l.Translate.Y, this.l.Translate.Z]; }
}

export class LocationMarker extends LocationMarkerBase {
  getId(): string {
    return `${this.l.Icon}:${this.l.MessageId || ''}:${this.l.Translate.X}:${this.l.Translate.Y}:${this.l.Translate.Z}`;
  }
  getSaveFlag(): string { return this.l.SaveFlag; }
  getIcon(): string { return this.l.Icon; }
}

export class LocationPointer extends LocationMarkerBase {
  getId(): string {
    return `${this.l.MessageID}:${this.l.ShowLevel}:${this.l.Translate.X}:${this.l.Translate.Y}:${this.l.Translate.Z}`;
  }

  getShowLevel(): ShowLevel { return this.l.ShowLevel; }
  getType(): MarkerType {
    const type = this.l.PointerType;
    return type === undefined ? this.l.Type : type;
  }

  shouldShowAtZoom(zoom: number): boolean {
    return shouldShowLocationMarker(this.getShowLevel(), zoom);
  }
}
