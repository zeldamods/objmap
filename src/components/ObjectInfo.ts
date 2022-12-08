import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component, { mixins } from 'vue-class-component';

import { rankUpEnemyForHardMode } from '@/level_scaling';
import MixinUtil from '@/components/MixinUtil';
import { MsgMgr } from '@/services/MsgMgr';
import { ObjectData, ObjectMinData, PlacementLink } from '@/services/MapMgr';
import { Settings } from '@/util/settings';

@Component
export default class ObjectInfo extends mixins(MixinUtil) {
  @Prop()
  private obj!: ObjectData | ObjectMinData | null;

  @Prop()
  private link!: PlacementLink | null;

  @Prop({ type: String, default: 'search-result' })
  private className!: string;

  @Prop({ type: Boolean, default: true })
  private isStatic!: boolean;

  @Prop({ type: Boolean, default: false })
  private dropAsName!: boolean;

  @Prop({ type: Boolean, default: false })
  private withPermalink!: boolean;

  private data!: ObjectData | ObjectMinData;

  private xmeta: any | null = null;

  private created() {
    if ((!this.obj && !this.link) || (this.obj && this.link))
      throw new Error('needs an object *or* a placement link');

    if (this.link)
      this.data = this.link.otherObj;
    if (this.obj)
      this.data = this.obj;
  }

  async get_meta() {
    if (!this.xmeta) {
      const rname = this.getRankedUpActorNameForObj(this.data);
      this.xmeta = await MsgMgr.getInstance().getObjectMetaData(rname);
    }
  }

  private meta(item: string) {
    if (!this.xmeta) {
      this.get_meta();
    }
    if (this.xmeta) {
      return (this.xmeta[item]) ? this.xmeta[item] : null;
    }
    return null;
  }


  private name(rankUp: boolean) {
    if (this.dropAsName)
      return this.drop();

    const objName = this.data.name;
    if (objName === 'LocationTag' && this.data.messageid) {
      const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', this.data.messageid)
        || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.data.messageid);
      return `Location: ${locationName}`;
    }

    return this.getName(rankUp ? this.getRankedUpActorNameForObj(this.data) : this.data.name);
  }

  private isHardMode() {
    return Settings.getInstance().hardMode;
  }

  private drop() {
    let s = '';
    if (!this.data.drop)
      return s;

    s += this.data.drop[0] == 2 ? 'Drop table: ' : '';
    s += this.getName(this.data.drop[1]);

    return s;
  }
}
