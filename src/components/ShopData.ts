import { defineComponent, PropType } from 'vue'
import * as ui from '@/util/ui';

export default defineComponent({
  name: 'ShopData',
  props: {
    data: { type: Object as PropType<Record<string, any>> },
    shop_ui_name: { type: String as PropType<string | null>, default: null },
  },

  data() {
    return {
      table: "Normal",
    };
  },

  created() {
    if (Object.keys(this.data || []).length) {
      if (this.data!.Normal)
        this.table = "Normal"
      else
        this.table = Object.keys(this.data!)[0]
    }
  },

  methods: {
    shop_name(): string {
      if (this.shop_ui_name)
        return this.shop_ui_name
      if (this.data!.Cooking && this.data!.Compound) {
        return "Beedle Shop Data"
      }
      return "Shop"
    },
    length(): number {
      if (this.data![this.table])
        return this.data![this.table].ColumnNum;
      return 0
    },
    name(i: number): string {
      const n = i.toString().padStart(3, '0')
      return ui.getName(this.data![this.table][`ItemName${n}`]);
    },
    num(i: number): any {
      const n = i.toString().padStart(3, '0')
      return this.data![this.table][`ItemNum${n}`];
    },
    price(i: number): any {
      const n = i.toString().padStart(3, '0')
      return this.data![this.table][`ItemPrice${n}`];
    },
    tables(): string[] {
      return Object.keys(this.data!).filter(v => v != "Header")
    },
  },
});
