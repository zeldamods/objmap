import * as L from 'leaflet';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component from 'vue-class-component';
import 'leaflet-path-transform';

import { MapMarkerObj, MapMarkerSearchResult } from '@/MapMarker';
import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import ShopData from '@/components/ShopData';
import { MapMgr, ObjectData, ObjectMinData, PlacementLink } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';

import * as curves from '@/util/curves';
import * as svg from '@/util/svg';

import { ColorScale } from '@/util/colorscale';
require('leaflet-hotline')

const KUH_TAKKAR_ELEVATOR_HASH_ID = 0x96d181a0;
const DRAGON_HASH_IDS = [
  0x4fb21727, // Farosh
  0xc119deb6, // Farosh Far
  0x54d56291, // Dinraal
  0xfc79f706, // Dinraal Far
  0xe61a0932, // Naydra
  0x86b9a466, // Naydra Far
];

const rock_target = ["Obj_LiftRockWhite_Korok_A_01", "Obj_LiftRockGerudo_Korok_A_01", "Obj_LiftRockEldin_Korok_A_01"];
const rock_source = ["Obj_LiftRockWhite_A_01", "Obj_LiftRockGerudo_A_01", "Obj_LiftRockEldin_A_01"];

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
  const areaObjectNames = ["Area", "BoxWater", "SpotBgmTag", "PointWindSetTag", "AreaCulling_InnerHide",
    "AreaCulling_InnerOn", "AreaCulling_OuterNPCMementary", "FarModelCullingArea"];
  return areaObjectNames.includes(obj.name) || obj.name.startsWith('AirWall');
}

class StaticData {
  persistentAreaMarkers: L.Path[] = [];
  history: ObjectData[] = [];
  persistentKorokMarkers: any[] = [];
  colorScale: ColorScale | null = null;
  persistentRailMarkers: { [key: string]: any }[] = [];
  persistentRailLimits: { [key: string]: any } = {};
}

const staticData = new StaticData();

@Component({
  components: {
    ObjectInfo,
    ShopData,
  },
})
export default class AppMapDetailsObj extends AppMapDetailsBase<MapMarkerObj | MapMarkerSearchResult> {
  private minObj: ObjectMinData | null = null;
  private obj: ObjectData | null = null;
  private genGroup: ObjectData[] = [];
  private genGroupSet: Map<number, ObjectData> = new Map();

  private dropTables: { [key: string]: any } = {};
  private shopData: { [key: string]: any } = {};
  private links: PlacementLink[] = [];
  private linksToSelf: PlacementLink[] = [];
  private linkTagInputs: PlacementLink[] = [];
  private isInvertedLogicTag = false;

  private areaMarkers: L.Path[] = [];
  private staticData = staticData;

  private korokMarkers: any[] = [];
  private rails: { [key: string]: any }[] = [];
  private railMarkers: any[] = [];
  private railLimits: { [key: string]: any } = {};

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
    this.rails = [];
    this.railMarkers.forEach(m => m.remove());
    this.railMarkers = [];
    this.shopData = {};
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
    if (!this.minObj.korok_type && this.obj.korok_type) {
      this.minObj.korok_type = this.obj.korok_type;
    }
    if (!this.minObj.korok_id && this.obj.korok_id) {
      this.minObj.korok_id = this.obj.korok_id;
    }

    this.dropTables = await MapMgr.getInstance().getObjDropTables(this.getRankedUpActorNameForObj(this.minObj), this.getDropTableName());
    this.genGroup = await MapMgr.getInstance().getObjGenGroup(this.obj.map_type, this.obj.map_name, this.obj.hash_id);
    for (const obj of this.genGroup) {
      this.genGroupSet.set(obj.hash_id, obj);
    }

    const location = this.getLocationSub();
    if (location != '') {
      if (location.includes('Stable') || location == "Oasis") {
        this.shopData = await MapMgr.getInstance().getObjShopData();
      }
    }

    if (this.obj.data.LinksToRail || DRAGON_HASH_IDS.includes(this.obj.hash_id)) {
      this.rails = await MapMgr.getInstance().getObjRails(this.obj.hash_id);
    }

    this.initLinks();
    this.initLinksToSelf();
    this.initLinkTagLinks();
    this.isInvertedLogicTag = this.obj.name === 'LinkTagNAnd' || this.obj.name === 'LinkTagNOr';

    this.initAreaMarkers();

    this.marker.data.mb.m.on('ColorScale:change', async (args: any) => {
      this.updateColorlineStyle({ palette: args.palette });
    });

    this.korokMarkers.forEach(m => m.remove());
    this.korokMarkers = [];
    this.initKorokMarkers();
    this.initRails();
  }

  initRails() {
    if (!this.obj)
      return;

    if (this.obj.korok_type && this.obj.korok_type == "Moving Lights")
      return;

    let palette = (this.staticData.colorScale) ? this.staticData.colorScale.palette() : {
      0: 'pink', 1: 'white'
    };
    let opts = {
      min: 0, max: 800,
      palette: palette,
      weight: 4,
      outlineWidth: 0,
      palettes: {
        sunset: {
          0.0000: '#f3e79b', 0.1666: '#fac484', 0.3333: '#f8a07e', 0.5000: '#eb7f86',
          0.6666: '#ce6693', 0.8333: '#a059a0', 1.0000: '#5c53a5'
        }
      },
      name: "sunset",
      pane: 'tilePane',
    };

    let map = this.marker.data.mb;
    this.railLimits = {};
    this.railMarkers = this.rails.map((rail: any) => {
      let pts = curves.railPath(rail); //[x,y,z] y is UpDown
      let yvals = pts.map((pt: any) => pt[1]);
      if (this.railLimits.min === undefined) { this.railLimits.min = yvals[0]; }
      if (this.railLimits.max === undefined) { this.railLimits.max = yvals[0]; }
      this.railLimits.min = Math.min(this.railLimits.min, ...yvals);
      this.railLimits.max = Math.max(this.railLimits.max, ...yvals);
      // Draw polyline [x,z,y] but z is North-South and y is Up-Down
      pts = pts.map((pt: any) => [pt[2], pt[0], pt[1]]);
      // @ts-ignore
      return L.hotline(pts, opts).addTo(map.m);
    });
    if (this.railMarkers.length) {
      if (!this.staticData.colorScale) {
        this.staticData.colorScale = new ColorScale(opts, { position: 'bottomleft' }).addTo(map.m);
        this.updateColorlineStyle({ palette: this.staticData.colorScale.palette() });
      }
      this.updateColorScale();
    }
  }

  updateColorlineStyle(style: any) {
    this.staticData.persistentRailMarkers.forEach((line: any) => {
      line.setStyle(style).redraw();
    });
    this.railMarkers.forEach((line: any) => {
      line.setStyle(style).redraw();
    });
  }

  getColorlineLimits(): any | null {
    let prl = this.staticData.persistentRailLimits;
    // Min/Max, filter out undefined
    //   if all are undefined, return infinity/-infinity
    let amin = Math.min(...[prl.min, this.railLimits.min].filter(isFinite));
    let amax = Math.max(...[prl.max, this.railLimits.max].filter(isFinite));
    if (!isFinite(amin) || !isFinite(amax)) {
      return null;
    }
    return { min: amin, max: amax };
  }

  setColorlineLimits(limits: any) {
    this.updateColorlineStyle(limits);
    if (this.staticData.colorScale) {
      this.staticData.colorScale.minmax(limits.min, limits.max);
    }
  }

  updateColorScale() {
    let limits = this.getColorlineLimits();
    if (limits) {
      this.setColorlineLimits(limits);
    }
  }

  beforeDestroy() {
    this.areaMarkers.forEach(m => m.remove());
    this.korokMarkers.forEach(m => m.remove());
    this.railMarkers.forEach(m => m.remove());
    // Rails
    this.railLimits = {};
    this.updateColorScale();
    if (!this.staticData.persistentRailMarkers.length) {
      this.forgetColorScale();
    }
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
      if (obj.hash_id == KUH_TAKKAR_ELEVATOR_HASH_ID) {
        /* Kuh Takkar, elevator in the same gen group as the ice actor
           which has an unload radius of 1500m -- so the elevator has
           a 1500m radius.
        */
        radius = 1500.0;
      }
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
    const areaMarker = L.circle(mb.fromXYZ([x, 0, z]), { radius }).addTo(mb.m);
    areaMarker.bringToBack();
    this.areaMarkers.push(areaMarker);
  }

  private addAreaMarker(obj: ObjectData) {
    const mb = this.marker.data.mb;
    const [x, y, z] = obj.data.Translate;
    const params = obj.data['!Parameters'];
    const shape: string = (params && params.Shape) ? params.Shape : 'Box';
    const scale = numOrArrayToArray(obj.data.Scale);
    const rotate = numOrArrayToArray(obj.data.Rotate);

    if (!scale)
      return;

    let areaMarker: L.Path;
    // Super rough approximation. This could be improved by actually projecting the 3D shape...
    // A lot of shapes do not use any rotate feature though,
    // and for those this naïve approach should suffice.
    if (shape == 'Sphere') {
      areaMarker = L.circle(mb.fromXYZ([x, 0, z]), { radius: scale[0] }).addTo(mb.m);
    } else if (shape == 'Cylinder' || shape == 'Capsule') {
      if (rotate && Math.abs(rotate[0] - 1.57080) <= 0.01) {
        const southWest = L.latLng(z + scale[2], x - scale[1] - scale[2]);
        const northEast = L.latLng(z - scale[2], x + scale[1] + scale[2]);
        areaMarker = L.rectangle(L.latLngBounds(southWest, northEast)).addTo(mb.m);
      } else {
        areaMarker = L.circle(mb.fromXYZ([x, 0, z]), { radius: scale[0] }).addTo(mb.m);
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

    const shape: string = (params && params.Shape) ? params.Shape : 'Box';

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

  forgetColorScale() {
    if (this.staticData.colorScale) {
      this.staticData.colorScale.remove();
      this.staticData.colorScale = null;
    }
  }


  static getName(name: string) {
    return MsgMgr.getInstance().getName(name) || name;
  }

  dropTableExists() {
    return Object.keys(this.dropTables).length > 0;
  }

  shopDataExists() {
    return Object.keys(this.shopData).length > 0;
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

  findItemByHash(group: any[], links: any[], name: string): any {
    let hashes = links.map(link => link.DestUnitHashId);
    let out = group.find(g => g.data.UnitConfigName == name && hashes.includes(g.hash_id));
    return (out) ? out : null;
  }

  getNextFlowerInKorokFlowerTrail(group: any[], flower: any): any {
    let or = this.findItemByHash(group, flower.data.LinksToObj, "LinkTagOr");
    if (!or) {
      return null;
    }
    let lag = this.findItemByHash(group, or.data.LinksToObj, "SwitchTimeLag");
    if (!lag) {
      return null;
    }
    let and = this.findItemByHash(group, lag.data.LinksToObj, "LinkTagAnd");
    if (!and) {
      return null;
    }
    let plant = this.findItemByHash(group, and.data.LinksToObj, "Obj_Plant_Korok_A_01");
    return plant;
  }

  isLastFlowerInKorokFlowerTrail(flower: any): boolean {
    return flower.data['!Parameters'].IsLastKorokFlower;
  }

  getFlowersInKorokFlowerTrail(group: any[], flower: any): any[] {
    let flowers = [flower];
    while (flower && !this.isLastFlowerInKorokFlowerTrail(flower)) {
      let f = this.getNextFlowerInKorokFlowerTrail(group, flower);
      flowers.push(f);
      flower = f;
    }
    return flowers;
  }

  getKorokIcon(obj_name: string, style: string = "", text: string = ""): L.DivIcon {
    let html = "";
    let className = "";
    if (obj_name == "FldObj_KorokStartingBlock_A_01") {
      html = '<div class="stump"><i class="fa fa-leaf big-leaf"></i></div>';
    } else if (obj_name == "FldObj_KorokGoal_A_01") {
      html = svg.raceGoal;
    } else if (obj_name == "Obj_Plant_Korok_A_01") {
      html = `<div><i class="fa fa-leaf korokicon" style="${style}"></i>${text}</div>`;
    } else if (rock_target.includes(obj_name)) {
      html = '<i class="fa fa-bullseye" style="font-size: 1.6em; color: rgba(255,255,255,0.6);"></i>';
    } else if (rock_source.includes(obj_name)) {
      html = '<i class="fa fa-cloud" style="font-size: 1.6em; color: #bbb; text-shadow: black 0px 0px 3px; "></i>';
    }
    return L.divIcon({
      html: html, className: className, iconSize: [30, 30], iconAnchor: [15, 15],
    });
  }

  getKorokMarkerWithIcon(obj: any, style: string = "", text: string = "") {
    let icon = this.getKorokIcon(obj.data.UnitConfigName, style, text);
    return L.marker([obj.data.Translate[2], obj.data.Translate[0]], { icon: icon });
  }

  initKorokMarkers() {
    if (!this.obj)
      return;
    const use_icon = true;
    let map = this.marker.data.mb;
    if (this.obj.korok_type == "Goal Ring (Race)") {
      let names = ["FldObj_KorokStartingBlock_A_01", "FldObj_KorokGoal_A_01"];
      let objs = this.genGroup.filter((obj: any) => names.includes(this.getName(obj.name)));
      // Start and End Markers
      let markers = objs.map((obj: any) => this.getKorokMarkerWithIcon(obj).addTo(map.m));
      this.korokMarkers.push(...markers);

      // Connecting Line
      let ll = objs.map((obj: any) => [obj.data.Translate[2], obj.data.Translate[0]]);
      let line = L.polyline(ll, { color: '#cccccc', weight: 1.5 }).addTo(map.m);
      this.korokMarkers.push(line);
    } else if (this.obj.korok_type == "Moving Lights") {
      this.rails.forEach((rail: any) => {
        let pts = curves.railPath(rail).map((pt: any) => [pt[2], pt[0]]);
        let line = L.polyline(pts, { color: "#cccccc", weight: 2.0 }).addTo(map.m);
        this.korokMarkers.push(line);
      });
    } else if (this.obj.korok_type == "Rock Pattern") {
      const rocks = [...rock_target, ...rock_source];
      let objs = this.genGroup.filter((obj: any) => rocks.includes(this.getName(obj.name)))
      let markers = objs.map((obj: any) => this.getKorokMarkerWithIcon(obj).addTo(map.m));
      this.korokMarkers.push(...markers);
    } else if (this.obj.korok_type == "Flower Trail") {
      let group = this.genGroup;
      let start = group.find((g: any) => this.getName(g.name) == "Obj_Plant_Korok_A_01" &&
        g.data['!Parameters'].IsNoAppearEffect);

      let flowers = this.getFlowersInKorokFlowerTrail(group, start);
      let style = "color: #E2DF41; font-size: 2em; display: inline;";
      let style_end = "color: #eeeeee; font-size: 2em;  display: inline;";
      flowers.forEach((obj: any, i: number) => {
        let s = (i + 1 == flowers.length) ? style_end : style;
        if (use_icon) {
          let m = this.getKorokMarkerWithIcon(obj, s, `<span style="color: #ccc; font-size: 1.2em;">${i + 1}</span>`).addTo(map.m);
          this.korokMarkers.push(m);
        } else {
          let m = L.marker([obj.data.Translate[2], obj.data.Translate[0]]).addTo(map.m);
          this.korokMarkers.push(m);
        }
      });
      let ll = flowers.map((obj: any) => {
        let x = obj.data.Translate[0];
        let z = obj.data.Translate[2];
        return [z, x];
      });
      let line = L.polyline(ll, { color: "#cccccc", weight: 1.5 }).addTo(map.m);
      this.korokMarkers.push(line);
    }
  }

  keepKorokMarkersAlive() {
    this.staticData.persistentKorokMarkers.push(... this.korokMarkers);
    this.korokMarkers = [];
  }

  forgetPersistentKorokMarkers() {
    let map = this.marker.data.mb;
    this.staticData.persistentKorokMarkers.forEach(m => m.remove());
    this.staticData.persistentKorokMarkers = [];
  }

  keepRailMarkersAlive() {
    this.staticData.persistentRailMarkers.push(... this.railMarkers);
    this.staticData.persistentRailLimits = this.getColorlineLimits() || {};
    this.railMarkers = [];
    this.railLimits = {};
  }

  forgetPersistentRailMarkers() {
    this.staticData.persistentRailMarkers.forEach(m => m.remove());
    this.staticData.persistentRailMarkers = [];
    this.staticData.persistentRailLimits = {};
    this.forgetColorScale();
  }
}
