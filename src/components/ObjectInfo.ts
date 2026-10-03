import { defineComponent, PropType } from 'vue';

import { rankUpEnemyForHardMode } from '@/level_scaling';
import MixinUtil from '@/components/MixinUtil';
import { MsgMgr } from '@/services/MsgMgr';
import { ObjectData, ObjectMinData, PlacementLink } from '@/services/MapMgr';

export default defineComponent({
  name: 'ObjectInfo',
  mixins: [MixinUtil],
  props: {
    obj: { type: Object as PropType<ObjectData | ObjectMinData | null>, default: null },
    link: { type: Object as PropType<PlacementLink | null>, default: null },
    className: { type: String, default: 'search-result' },
    isStatic: { type: Boolean, default: true },
    dropAsName: { type: Boolean, default: false },
    withPermalink: { type: Boolean, default: false },
  },
  emits: ['click'],

  data() {
    return {
      metadata: null as any,
    };
  },

  computed: {
    data(): ObjectData | ObjectMinData {
      return (this.link ? this.link.otherObj : this.obj)!;
    },
  },

  watch: {
    data() {
      this.metadata = null;
    },
  },

  created() {
    if ((!this.obj && !this.link) || (this.obj && this.link))
      throw new Error('needs an object *or* a placement link');
  },

  methods: {
    async loadMetaIfNeeded(): Promise<void> {
      if (!this.metadata) {
        const data = this.data;
        const metadata = await MsgMgr.getInstance().getObjectMetaData(this.getRankedUpActorNameForObj(data));
        if (data === this.data)
          this.metadata = metadata;
      }
    },

    meta(item: string): any {
      this.loadMetaIfNeeded();
      // Return values may still be null if metadata is not available
      return (this.metadata) ? this.metadata[item] : null;
    },


    name(rankUp: boolean): string {
      if (this.dropAsName)
        return this.drop();

      const objName = this.data.name;
      if (objName === 'LocationTag' && this.data.messageid) {
        const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', this.data.messageid)
          || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.data.messageid);
        return `Location: ${locationName}`;
      }

      return this.getName(rankUp ? this.getRankedUpActorNameForObj(this.data) : this.data.name);
    },

    drop(): string {
      let s = '';
      if (!this.data.drop)
        return s;

      s += this.data.drop[0] == 2 ? 'Drop table: ' : '';
      s += this.getName(this.data.drop[1]);

      return s;
    },
  },
});
