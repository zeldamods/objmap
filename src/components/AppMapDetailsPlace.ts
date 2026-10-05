import { defineComponent } from 'vue';

import { MapMarkerPlace } from '@/MapMarker';
import { defineDetailsBase } from '@/components/AppMapDetailsBase';
import ObjectInfo from '@/components/ObjectInfo.vue';
import ShopData from '@/components/ShopData.vue';
import { MapMgr, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';

const STABLE_SHRINES: { [stable: string]: string } = {
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
};

export default defineComponent({
  name: 'AppMapDetailsPlace',
  components: {
    ObjectInfo,
    ShopData,
  },
  extends: defineDetailsBase<MapMarkerPlace>(),
  data() {
    return {
      id: '',
      sub: '',
      shopData: {} as { [key: string]: any },
      minobj: null as ObjectMinData | null,
      shrine: null as string | null,
      shrineSub: null as string | null,
      shrineObj: null as ObjectMinData | null,
    };
  },
  methods: {
    async init(): Promise<void> {
      this.id = this.marker.lm.getMessageId();
      this.sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', this.id);
      this.shopData = {};
      if (this.sub.includes('Stable') || this.sub == 'Kara Kara Bazaar') {
        this.shopData = await MapMgr.getInstance().getObjShopData();
      }

      MapMgr.getInstance().getObjs('MainField', '', this.id + ' actor: LocationTag').then(d => {
        this.minobj = d[0];
      });
      this.shrine = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', STABLE_SHRINES[this.sub]);
      this.shrineSub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', STABLE_SHRINES[this.sub] + '_sub');
      MapMgr.getInstance().getObjs('MainField', '', STABLE_SHRINES[this.sub] + ' actor: LocationTag')
        .then(d => this.shrineObj = d[0]);

    },

    shopDataExists(): boolean {
      return Object.keys(this.shopData).length > 0;
    },
  },
});
