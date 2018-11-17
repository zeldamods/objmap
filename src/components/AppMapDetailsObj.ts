import Vue from 'vue';
import {Prop} from 'vue-property-decorator';
import Component from 'vue-class-component';

import {MapMarkerObj, MapMarkerSearchResult} from '@/MapMarker';
import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import {MapMgr, ObjectData, ObjectMinData, PlacementLink} from '@/services/MapMgr';
import {MsgMgr} from '@/services/MsgMgr';
import * as ui from '@/util/ui';

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

  async init() {
    this.minObj = this.marker.data.obj;
    this.obj = null;
    this.genGroup = [];
    this.genGroupSet.clear();
    this.links = [];
    this.linksToSelf = [];

    this.obj = await MapMgr.getInstance().getObjByObjId(this.minObj.objid);
    this.genGroup = await MapMgr.getInstance().getObjGenGroup('MainField', this.obj.map_name, this.obj.hash_id);
    for (const obj of this.genGroup) {
      this.genGroupSet.set(obj.hash_id, obj);
    }

    this.initLinks();
    this.initLinksToSelf();
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
}
