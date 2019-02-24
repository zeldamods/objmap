import Vue from 'vue';
import {Prop} from 'vue-property-decorator';
import Component from 'vue-class-component';

import {MapMarkerObj, MapMarkerSearchResult} from '@/MapMarker';
import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import {MapMgr, ObjectData, ObjectMinData, PlacementLink} from '@/services/MapMgr';
import {MsgMgr} from '@/services/MsgMgr';
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

@Component({
  components: {
    ObjectInfo,
  },
})
export default class AppMapDetailsObj extends AppMapDetailsBase<MapMarkerObj|MapMarkerSearchResult> {
  private minObj: ObjectMinData|null = null;
  private obj: ObjectData|null = null;
  private genGroup: ObjectData[] = [];
  private genGroupSet: Map<number, ObjectData> = new Map();

  private links: PlacementLink[] = [];
  private linksToSelf: PlacementLink[] = [];
  private linkTagInputs: PlacementLink[] = [];
  private isInvertedLogicTag = false;

  async init() {
    this.minObj = this.marker.data.obj;
    this.obj = null;
    this.genGroup = [];
    this.genGroupSet.clear();
    this.links = [];
    this.linksToSelf = [];
    this.linkTagInputs = [];

    this.obj = (await MapMgr.getInstance().getObjByObjId(this.minObj.objid))!;
    this.genGroup = await MapMgr.getInstance().getObjGenGroup('MainField', this.obj.map_name, this.obj.hash_id);
    for (const obj of this.genGroup) {
      this.genGroupSet.set(obj.hash_id, obj);
    }

    this.initLinks();
    this.initLinksToSelf();
    this.initLinkTagLinks();
    this.isInvertedLogicTag = this.obj.name === 'LinkTagNAnd' || this.obj.name === 'LinkTagNOr';
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

  jumpToObj(obj: ObjectData) {
    this.$parent.$emit('AppMap:open-obj', obj);
  }

  arrayOrNumToStr(d: number[]|number, digits: number) {
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
      return `MainField_${this.obj.name}_${this.obj.hash_id}`;
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
}
