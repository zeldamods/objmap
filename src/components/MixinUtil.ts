import Vue from 'vue';
import Component from 'vue-class-component';

import {rankUpEnemyForHardMode} from '@/level_scaling';
import {ObjectMinData} from '@/services/MapMgr';
import {MsgMgr} from '@/services/MsgMgr';
import {Settings} from '@/util/settings';

@Component
export default class MixinUtil extends Vue {
  getName(name: string) {
    if (Settings.getInstance().useActorNames)
      return name;
    return MsgMgr.getInstance().getName(name) || name;
  }

  getRankedUpActorNameForObj(obj: ObjectMinData) {
    if (!Settings.getInstance().hardMode || obj.disable_rankup_for_hard_mode)
      return obj.name;
    return rankUpEnemyForHardMode(obj.name);
  }

  getMapNameForObj(obj: ObjectMinData) {
    if (obj.map_type == 'CDungeon') {
      const uiName = MsgMgr.getInstance().getMsg(`StaticMsg/Dungeon:${obj.map_name}`);
      return `${uiName} (${obj.map_name})`;
    }

    if (obj.map_type == 'MainFieldDungeon') {
      const uiName = MsgMgr.getInstance().getMsg(`StaticMsg/LocationMarker:${obj.map_name}`);
      return `${uiName} (${obj.map_name})`;
    }

    return obj.map_name;
  }

  getMapStaticStringForObj(obj: ObjectMinData) {
    return obj.map_static ? 'Static' : 'Dynamic';
  }

  isActuallyRankedUp(obj: ObjectMinData) {
    return this.getRankedUpActorNameForObj(obj) != obj.name;
  }

  formatObjId(id: number) {
    if (!Settings.getInstance().useHexForHashIds)
      return id.toString(10);
    return '0x' + id.toString(16).padStart(8, '0');
  }
}
