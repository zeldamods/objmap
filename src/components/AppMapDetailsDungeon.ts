import Component from 'vue-class-component';

import {MapMarkerDungeon} from '@/MapMarker';
import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import {MapMgr, ObjectMinData} from '@/services/MapMgr';
import {MsgMgr} from '@/services/MsgMgr';
import * as ui from '@/util/ui';

@Component({
  components: {
    ObjectInfo,
  },
})
export default class AppMapDetailsDungeon extends AppMapDetailsBase<MapMarkerDungeon> {
  private id = '';
  private sub = '';
  private tboxObjs: ObjectMinData[] = [];

  protected init() {
    this.id = this.marker.data.lm.getMessageId();
    this.sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.id + '_sub');

    MapMgr.getInstance().getObjs('CDungeon', this.id, 'actor:^"TBox_"').then(d => this.tboxObjs = d);
  }
}
