export const CURRENT_OBJMAP_SV_VERSION = 1;

export interface SaveData {
  OBJMAP_SV_VERSION: number;
  drawData: GeoJSON.FeatureCollection;
};
