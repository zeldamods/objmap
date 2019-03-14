export const CURRENT_OBJMAP_SV_VERSION = 3;

export interface SearchGroup {
  label: string;
  query: string;
  enabled: boolean|undefined;
}

export interface SearchExcludeSet {
  label: string;
  query: string;
}

export interface SaveData {
  OBJMAP_SV_VERSION: number;
  drawData: GeoJSON.FeatureCollection;

  // v2+
  searchGroups: SearchGroup[];
  searchExcludeSets: SearchExcludeSet[];
}
