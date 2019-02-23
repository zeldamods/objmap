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

export interface SearchPresetGroup {
  label: string;
  presets: SearchPreset[];
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

function makeActorQuery(actors: string[]): string {
  return actors.map(x => `actor:^${x}`).join(' OR ');
}

function makeNameQuery(names: string[]): string {
  return names.map(x => `name:"^${x}"`).join(' OR ');
}

export const SEARCH_PRESETS: ReadonlyArray<SearchPresetGroup> = Object.freeze([
  {
    label: '<i class="far fa-gem"></i>',
    presets: [
      {label: 'Treasure Chests', query: 'actor:^"TBox_"'},
      {label: 'Arrows', query: 'Arrow'},
      {label: 'Ore Deposits', query: 'name:"Ore Deposit"'},
      {label: 'Weapons (excluding enemies)', query: 'Weapon_ NOT actor:^"Enemy_"'},
    ],
  },
  {
    label: '<i class="fas fa-apple-alt"></i>',
    presets: [
      {label: 'Cooking Pots', query: 'actor:Item_CookSet'},
      {label: 'Fruits', query: 'actor:^Item_Fruit_*'},
      {label: 'Enduring Ingredients', query: makeNameQuery(['Endura', 'Tireless Frog'])},
      {label: 'Fireproof Ingredients', query: makeNameQuery(['Fireproof', 'Smotherwing Butterfly'])},
      {label: 'Hasty Ingredients', query: makeNameQuery(['Hightail Lizard', 'Hot-Footed Frog', 'Fleet-Lotus Seeds', 'Rushroom', 'Swift Carrot', 'Swift Violet'])},
      {label: 'Hasty Ingredients (Lvl2 only)', query: makeNameQuery(['Hot-Footed Frog', 'Fleet-Lotus Seeds', 'Swift Violet'])},
      {label: 'Hearty Ingredients', query: 'name:^Hearty'},
      {label: 'Mighty Ingredients', query: makeNameQuery(['Mighty', 'Razorshroom', 'Razorclaw Crab', 'Bladed Rhino Beetle']),},
      {label: 'Tough Ingredients', query: makeNameQuery(['Ironshroom', 'Fortified Pumpkin', 'Rugged Rhino Beetle', 'Ironshell Crab', 'Armored', 'Armoranth'])},
    ],
  },
  {
    label: '<i class="fa fa-ellipsis-h"></i>',
    presets: [
      {label: 'Memory Locations', query: 'name:"Memory"'},
      {label: 'Goddess Statues', query: 'name:"Goddess Statue"'},
      {label: 'Rafts', query: 'name:Raft'},
      {label: 'Enemies', query: 'actor:^"Enemy_"'},
      {label: 'BtB Enemies', query: makeActorQuery(['Enemy_Bokoblin', 'Enemy_Lizalfos', 'Enemy_Moriblin', 'Enemy_Giant', 'Enemy_Wizzrobe'])},
      {label: 'Launchable Objects', query: makeActorQuery(LAUNCHABLE_OBJS.split('\n'))},
    ],
  },
]);

export class SearchExcludeSet {
  constructor(public query: string, public label: string) {
  }

  size() {
    return this.ids.size;
  }

  ids!: Set<number>;

  async init() {
    this.ids = new Set(await MapMgr.getInstance().getObjids('MainField', '', this.query));
  }
}

export class SearchResultGroup {
  constructor(public query: string, public label: string) {
  }

  size() {
    return this.markers.data ? this.markers.data.length : 0;
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
