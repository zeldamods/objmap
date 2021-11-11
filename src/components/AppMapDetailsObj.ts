import * as L from 'leaflet';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component from 'vue-class-component';
import 'leaflet-path-transform';

import { MapMarkerObj, MapMarkerSearchResult } from '@/MapMarker';
import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import { MapMgr, ObjectData, ObjectMinData, PlacementLink } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';

enum MapLinkDefType {
  BasicSig = 0x0,
  AxisX = 0x1,
  AxisY = 0x2,
  AxisZ = 0x3,
  '-AxisX' = 0x4,
  '-AxisY' = 0x5,
  '-AxisZ' = 0x6,
  GimmickSuccess = 0x7,
  VelocityControl = 0x8,
  BasicSigOnOnly = 0x9,
  Remains = 0xA,
  DeadUp = 0xB,
  LifeZero = 0xC,
  Stable = 0xD,
  ChangeAtnSig = 0xE,
  Create = 0xF,
  Delete = 0x10,
  MtxCopyCreate = 0x11,
  Freeze = 0x12,
  ForbidAttention = 0x13,
  SyncLink = 0x14,
  CopyWaitRevival = 0x15,
  OffWaitRevival = 0x16,
  Recreate = 0x17,
  AreaCol = 0x18,
  SensorBind = 0x19,
  ForSale = 0x1A,
  ModelBind = 0x1B,
  PlacementLOD = 0x1C,
  DemoMember = 0x1D,
  PhysSystemGroup = 0x1E,
  StackLink = 0x1F,
  FixedCs = 0x20,
  HingeCs = 0x21,
  LimitHingeCs = 0x22,
  SliderCs = 0x23,
  PulleyCs = 0x24,
  BAndSCs = 0x25,
  BAndSLimitAngYCs = 0x26,
  CogWheelCs = 0x27,
  RackAndPinionCs = 0x28,
  Reference = 0x29,
  Invalid = 0x2A,
}

function numOrArrayToArray(x: number | [number, number, number] | undefined): [number, number, number] | undefined {
  return typeof x == 'number' ? [x, x, x] : x;
}

function isAreaObject(obj: ObjectMinData) {
  return obj.name == 'Area' || obj.name == 'SpotBgmTag' || obj.name.startsWith('AirWall') || obj.name == 'PointWindSetTag';
}

class StaticData {
  persistentAreaMarkers: L.Path[] = [];
  history: ObjectData[] = [];
}

const staticData = new StaticData();

@Component({
  components: {
    ObjectInfo,
  },
})
export default class AppMapDetailsObj extends AppMapDetailsBase<MapMarkerObj | MapMarkerSearchResult> {
  private minObj: ObjectMinData | null = null;
  private obj: ObjectData | null = null;
  private genGroup: ObjectData[] = [];
  private genGroupSet: Map<number, ObjectData> = new Map();

  private dropTables: { [key: string]: any } = {};
  private links: PlacementLink[] = [];
  private linksToSelf: PlacementLink[] = [];
  private linkTagInputs: PlacementLink[] = [];
  private isInvertedLogicTag = false;

  private areaMarkers: L.Path[] = [];
  private staticData = staticData;

  async init() {
    this.minObj = this.marker.data.obj;
    this.obj = null;
    this.genGroup = [];
    this.genGroupSet.clear();
    this.dropTables = {};
    this.links = [];
    this.linksToSelf = [];
    this.linkTagInputs = [];
    this.areaMarkers.forEach(m => m.remove());
    this.areaMarkers = [];
    if (this.minObj.objid) {
      this.obj = (await MapMgr.getInstance().getObjByObjId(this.minObj.objid))!;
    } else {
      this.obj = (await MapMgr.getInstance().getObj(this.minObj.map_type,
        // @ts-ignore ( map_name: string? )
        this.minObj.map_name,
        this.minObj.hash_id))!;
      // Set the objid from the fetched data otherwise Vue does not update
      this.minObj.objid = this.obj.objid;
    }
    this.dropTables = await MapMgr.getInstance().getObjDropTables(this.getRankedUpActorNameForObj(this.minObj), this.getDropTableName());
    this.genGroup = await MapMgr.getInstance().getObjGenGroup(this.obj.map_type, this.obj.map_name, this.obj.hash_id);
    for (const obj of this.genGroup) {
      this.genGroupSet.set(obj.hash_id, obj);
    }

    this.initLinks();
    this.initLinksToSelf();
    this.initLinkTagLinks();
    this.isInvertedLogicTag = this.obj.name === 'LinkTagNAnd' || this.obj.name === 'LinkTagNOr';

    this.initAreaMarkers();
  }

  beforeDestroy() {
    this.areaMarkers.forEach(m => m.remove());
  }

  getLocationSub() {
    const obj = this.marker.data.obj;
    if (obj.name === 'LocationTag' && obj.messageid) {
      const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', obj.messageid)
        || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', obj.messageid);
      return locationName;
    }
    return '';
  }

  isSearchResult() {
    return this.marker.data instanceof MapMarkerSearchResult;
  }

  emitBackToSearch() {
    this.$parent.$emit('AppMap:switch-pane', 'spane-search');
  }

  jumpToObj(obj: ObjectData, updateHistory = true) {
    if (updateHistory && this.obj)
      this.staticData.history.push(this.obj);
    this.$parent.$emit('AppMap:open-obj', obj);
  }

  goBack() {
    this.jumpToObj(this.staticData.history.pop()!, false);
  }

  arrayOrNumToStr(d: number[] | number, digits: number) {
    if (d == null)
      return '';
    if (Array.isArray(d))
      return d.map(x => x.toFixed(digits)).join(', ');
    return d.toFixed(digits);
  }

  linkTagSaveFlagAction(): string {
    if (!this.obj)
      return '???';
    if (this.obj.data['!Parameters']!.IncrementSave || this.obj.name == 'LinkTagCount')
      return 'Increments';
    switch (this.obj.data['!Parameters']!.SaveFlagOnOffType) {
      case 0:
        if (this.obj.name == 'LinkTagAnd' || this.obj.name == 'LinkTagNAnd' || this.obj.name == 'LinkTagXOr')
          return 'Sets';
        if (this.obj.name == 'LinkTagOr' || this.obj.name == 'LinkTagNOr')
          return 'Clears';
        return '???';
      case 1:
        return 'Sets';
      case 2:
        return 'Clears';
      default:
        return '???';
    }
  }

  linkTagSaveFlag(): string {
    if (!this.obj)
      return '';
    switch (this.obj.data['!Parameters']!.MakeSaveFlag) {
      case 0:
        return this.obj.data['!Parameters']!.SaveFlag || '';
      case 1:
        return 'Clear_{CURRENT_MAP_NAME}';
      case 2:
        return 'Open_{DUNGEON_NAME}';
      case 3:
        return `${this.obj.map_type}_${this.obj.name}_${this.obj.hash_id}`;
      default:
        return 'UNEXPECTED_MAKE_SAVE_FLAG';
    }
  }

  private initLinks() {
    const links = this.obj!.data.LinksToObj;
    if (!links)
      return;

    for (const link of links) {
      const destObj = (this.genGroupSet.get(link.DestUnitHashId))!;
      this.links.push(new PlacementLink(destObj, link, link.DefinitionName));
    }
  }

  private initLinksToSelf() {
    for (const obj of this.genGroup) {
      const links = obj.data.LinksToObj;
      if (!links)
        continue;

      for (const link of links) {
        if (link.DestUnitHashId === this.obj!.hash_id)
          this.linksToSelf.push(new PlacementLink(obj, link, link.DefinitionName));
      }
    }
  }

  private initLinkTagLinks() {
    if (!this.obj!.name.startsWith('LinkTag'))
      return;

    for (const link of this.linksToSelf) {
      const type: number = (<any>MapLinkDefType)[link.ltype];
      if (type <= 0xe)
        this.linkTagInputs.push(link);
    }
  }

  private initAreaMarkers() {
    if (!this.obj)
      return;

    this.addDungeonElevatorLoadAreaMarker(this.obj);

    if (isAreaObject(this.obj))
      this.addAreaMarker(this.obj);

    this.linksToSelf.filter(l => isAreaObject(l.otherObj)).forEach((link) => {
      this.addAreaMarker(link.otherObj);
    });

    if (this.obj.name == 'LocationTag') {
      this.genGroup.filter(isAreaObject).forEach((o) => {
        this.addAreaMarker(o);
      });
    }
  }

  private addDungeonElevatorLoadAreaMarker(obj: ObjectData) {
    let radius = 0.0;
    if (obj.name == 'DgnObj_EntranceElevator_A_01') {
      radius = 64.0;
    } else if (obj.name == 'DgnObj_EntranceElevatorSP') {
      radius = 528.0;
      if (obj.data['!Parameters']!.EventFlowName == 'Demo603_0') {
        radius = 1500.0;
      }
    }

    if (radius == 0.0)
      return;

    const mb = this.marker.data.mb;
    const [x, y, z] = obj.data.Translate;
    const areaMarker = L.circle(mb.fromXZ([x, z]), { radius }).addTo(mb.m);
    areaMarker.bringToBack();
    this.areaMarkers.push(areaMarker);
  }

  private addAreaMarker(obj: ObjectData) {
    const mb = this.marker.data.mb;
    const [x, y, z] = obj.data.Translate;
    const params = obj.data['!Parameters'];
    const shape: string = params ? params.Shape : 'Box';
    const scale = numOrArrayToArray(obj.data.Scale);
    const rotate = numOrArrayToArray(obj.data.Rotate);

    if (!scale)
      return;

    let areaMarker: L.Path;
    // Super rough approximation. This could be improved by actually projecting the 3D shape...
    // A lot of shapes do not use any rotate feature though,
    // and for those this naïve approach should suffice.
    if (shape == 'Sphere') {
      areaMarker = L.circle(mb.fromXZ([x, z]), { radius: scale[0] }).addTo(mb.m);
    } else if (shape == 'Cylinder' || shape == 'Capsule') {
      if (rotate && Math.abs(rotate[0] - 1.57080) <= 0.01) {
        const southWest = L.latLng(z + scale[2], x - scale[1] - scale[2]);
        const northEast = L.latLng(z - scale[2], x + scale[1] + scale[2]);
        areaMarker = L.rectangle(L.latLngBounds(southWest, northEast)).addTo(mb.m);
      } else {
        areaMarker = L.circle(mb.fromXZ([x, z]), { radius: scale[0] }).addTo(mb.m);
      }
    } else if (shape == 'Box') {
      const southWest = L.latLng(z + scale[2], x - scale[0]);
      const northEast = L.latLng(z - scale[2], x + scale[0]);
      areaMarker = L.rectangle(L.latLngBounds(southWest, northEast), {
        // @ts-ignore
        transform: true,
      }).addTo(mb.m);
      if (rotate) {
        // XXX: horrible hack to rotate a rectangle.
        // @ts-ignore
        areaMarker.transform._map = areaMarker._map;
        const center = (<L.Rectangle>(areaMarker)).getCenter();
        // @ts-ignore
        areaMarker.transform._transformPoints(areaMarker, -rotate[0], null, center, center);
      }
    } else if (shape == 'Hull') {
      // Deliberately unhandled.
      return;
    } else {
      return;
    }

    areaMarker.bringToBack();
    this.areaMarkers.push(areaMarker);
  }

  isAreaReprPossiblyWrong(): boolean {
    if (!this.obj || !isAreaObject(this.obj))
      return false;

    const params = this.obj.data['!Parameters'];

    const shape: string = params ? params.Shape : 'Box';

    if (!this.obj.data.Rotate)
      return false;

    if (shape == 'Sphere' || shape == 'Hull')
      return false;

    if (shape == 'Box') {
      return typeof this.obj.data.Rotate != 'number';
    }

    return true;
  }

  keepAreaMarkersAlive() {
    this.staticData.persistentAreaMarkers.push(...this.areaMarkers);
    this.areaMarkers = [];
  }

  forgetPersistentAreaMarkers() {
    this.areaMarkers.length = this.areaMarkers.length;
    this.staticData.persistentAreaMarkers.forEach(m => m.remove());
    this.staticData.persistentAreaMarkers = [];
  }

  static getName(name: string) {
    return MsgMgr.getInstance().getName(name) || name;
  }

  dropTableExists() {
    return Object.keys(this.dropTables).length > 0;
  }

  formatDropTable(): string {
    let lines = [];
    let names = Object.keys(this.dropTables);
    for (var i = 0; i < names.length; i++) {
      let table = this.dropTables[names[i]];
      let repeatNum = table.repeat_num;
      if (repeatNum[0] == repeatNum[1]) {
        lines.push(`<span style="text-decoration: underline;"><b>${names[i]}</b> - x${repeatNum[0]}</span>`);
      } else {
        lines.push(`<span style="text-decoration: underline;"><b>${names[i]}</b> - x${repeatNum[0]}-${repeatNum[1]}</span>`);
      }
      let items = Object.keys(table.items).sort(function(a, b) { return table.items[b] - table.items[a]; });
      for (var j = 0; j < items.length; j++) {
        lines.push(`  ${table.items[items[j]].toFixed(1).padStart(4, ' ')}% - ${this.getName(items[j])}`);
      }
    }
    return lines.join("\n");
  }

  getDropTableName() {
    if (!this.obj || !this.obj.data || !this.obj.data['!Parameters']) {
      return "";
    }
    const params: { [key: string]: any } = this.obj.data['!Parameters'];
    let dropTableName = "Normal";
    let keys = ['ArrowName', 'DropTable'];
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] in params) {
        return params[keys[i]];
      }
    }
    return "Normal";
  }
}
