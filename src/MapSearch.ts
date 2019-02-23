import * as L from 'leaflet';
import {MapBase} from '@/MapBase';
import {SearchResultUpdateMode} from '@/MapMarker';
import * as MapMarkers from '@/MapMarker';
import {MapMgr} from '@/services/MapMgr';
import * as ui from '@/util/ui';

export interface SearchPreset {
  label: string;
  query: string;
}

const LAUNCHABLE_OBJS = `TwnObj_City_GoronPot_A_M_Act_01
FldObj_BoardIron_A_01
FldObj_FallingRock_*
FldObj_KorokStoneLift_A_01
FldObj_PushRock*
Kibako*
Obj_BoardIron_*
Obj_BoxIron_*
Obj_BreakBoxIron*
Obj_LiftRock*
Obj_RockCover
Barrel`;

export const SEARCH_PRESETS: ReadonlyArray<SearchPreset> = Object.freeze([
  {label: 'Treasure Chests', query: 'actor:^"TBox_"'},
  {label: 'Arrows', query: 'Arrow'},
  {label: 'Cooking Pots', query: 'actor:Item_CookSet'},
  {label: 'Goddess Statues', query: 'name:"Goddess Statue"'},
  {label: 'Rafts', query: 'name:Raft'},
  {label: 'Memory Locations', query: 'name:"Memory"'},
  {label: 'Weapons (excluding Enemies)', query: 'Weapon_ NOT actor:^"Enemy_"'},
  {label: 'Enemies', query: 'actor:^"Enemy_"'},
  {label: 'BtB Enemies', query: 'actor:^"Enemy_Bokoblin" OR actor:^"Enemy_Lizalfos" OR actor:^"Enemy_Moriblin" OR actor:^"Enemy_Giant" OR actor:^"Enemy_Wizzrobe"'},
  {label: 'Launchable Objects', query: LAUNCHABLE_OBJS.split('\n').map(x => `actor:^${x}`).join(' OR ')},
]);

export class SearchExcludeSet {
  constructor(public query: string, public label: string) {
  }

  ids!: Set<number>;

  async init() {
    this.ids = new Set(await MapMgr.getInstance().getObjids('MainField', '', this.query));
  }
}

export class SearchResultGroup {
  constructor(public query: string, public label: string) {
  }

  remove() {
    if (this.markerGroup) {
      this.markerGroup.data.remove();
      this.markerGroup.data.clearLayers();
    }
  }

  update(mode: SearchResultUpdateMode, excludedSets: SearchExcludeSet[]) {
    const isExcluded = (marker: MapMarkers.MapMarkerObj) => {
      return excludedSets.some(set => set.ids.has(marker.obj.objid));
    };
    for (const [i, marker] of this.markers.data.entries()) {
      const shouldShow = mode & SearchResultUpdateMode.UpdateVisibility
        ? !isExcluded(marker) : this.shownMarkers.data[i];
      if (shouldShow != this.shownMarkers.data[i]) {
        if (shouldShow)
          this.markerGroup.data.addLayer(marker.getMarker());
        else
          this.markerGroup.data.removeLayer(marker.getMarker());
        this.shownMarkers.data[i] = shouldShow;
      }
      if (shouldShow)
        marker.update(this.fillColor, this.strokeColor, mode);
    }
  }

  async init(map: MapBase) {
    this.fillColor = ui.shadeColor(ui.genColor(10, SearchResultGroup.COLOR_COUNTER++), -5);
    this.strokeColor = ui.shadeColor(this.fillColor, -20);
    const results = await MapMgr.getInstance().getObjs('MainField', '', this.query);
    this.markers = new ui.Unobservable(
        results.map(r => new MapMarkers.MapMarkerObj(map, r, this.fillColor, this.strokeColor)));
    this.markerGroup = new ui.Unobservable(new L.LayerGroup());
    this.markerGroup.data.addTo(map.m);
  }

  private static COLOR_COUNTER = 0;
  private markerGroup!: ui.Unobservable<L.LayerGroup>;
  private markers!: ui.Unobservable<MapMarkers.MapMarkerObj[]>;
  private shownMarkers: ui.Unobservable<boolean[]> = new ui.Unobservable([]);
  private fillColor = '';
  private strokeColor = '';
}
