import Component from 'vue-class-component';

import { MapMarkerPlace } from '@/MapMarker';
import AppMapDetailsBase from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo';
import ShopData from '@/components/ShopData';
import { MapMgr, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';
import * as ui from '@/util/ui';


@Component({
  components: {
    ObjectInfo,
    ShopData,
  },
})
export default class AppMapDetailsPlace extends AppMapDetailsBase<MapMarkerPlace> {
  private id = '';
  private sub = '';
  private shopData: any = {};
  private minobj: ObjectMinData | null = null;
  private shrine: any | null = null;
  private shrineSub: any | null = null;
  private shrineObj: any | null = null;
  private tower: any | null = null
  private shrines: any = {
    'Woodland Stable': 'Dungeon056',
    'East Akkala Stable': 'Dungeon013',
    'South Akkala Stable': 'Dungeon048',
    'Foothill Stable': 'Dungeon031',
    'Wetland Stable': 'Dungeon049',
    'Riverside Stable': 'Dungeon057',
    'Dueling Peaks Stable': 'Dungeon045',
    'Lakeside Stable': 'Dungeon050',
    'Highland Stable': 'Dungeon054',
    'Gerudo Canyon Stable': 'Dungeon010',
    'Outskirt Stable': 'Dungeon027',
    'Tabantha Bridge Stable': 'Dungeon037',
    'Serenne Stable': 'Dungeon011',
    'Snowfield Stable': 'Dungeon042',
    'Rito Stable': 'Dungeon008',
  }

  protected async init() {
    this.id = this.marker.data.lm.getMessageId();
    this.sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', this.id);
    this.shopData = {};
    if (this.sub.includes('Stable') || this.sub == 'Kara Kara Bazaar') {
      this.shopData = await MapMgr.getInstance().getObjShopData();
    }

    MapMgr.getInstance().getObjs('MainField', '', this.id + ' actor: LocationTag').then(d => {
      this.minobj = d[0];
    });
    this.shrine = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.shrines[this.sub]);
    this.shrineSub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.shrines[this.sub] + '_sub');
    MapMgr.getInstance().getObjs('MainField', '', this.shrines[this.sub] + ' actor: LocationTag')
      .then(d => this.shrineObj = d[0]);

  }

  shopDataExists() {
    return Object.keys(this.shopData).length > 0;
  }
}
