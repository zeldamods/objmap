import Vue from 'vue'
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import MixinUtil from '@/components/MixinUtil';
import * as ui from '@/util/ui';

@Component
export default class ShopData extends mixins(MixinUtil) {
  @Prop()
  private data!: any;

  @Prop()
  private shop_ui_name!: any;

  table: string = "Normal"

  private created() {
    if (Object.keys(this.data || []).length) {
      if (this.data.Normal)
        this.table = "Normal"
      else
        this.table = Object.keys(this.data)[0]
    }
  }
  shop_name() {
    if (this.shop_ui_name)
      return this.shop_ui_name
    if (this.data.Cooking && this.data.Compound) {
      return "Beedle Shop Data"
    }
    return "Shop"
  }
  length() {
    if (this.data[this.table])
      return this.data[this.table].ColumnNum;
    return 0
  }
  name(i: number) {
    const n = i.toString().padStart(3, '0')
    return ui.getName(this.data[this.table][`ItemName${n}`]);
  }
  num(i: number) {
    const n = i.toString().padStart(3, '0')
    return this.data[this.table][`ItemNum${n}`];
  }
  price(i: number) {
    const n = i.toString().padStart(3, '0')
    return this.data[this.table][`ItemPrice${n}`];
  }
  tables() {
    return Object.keys(this.data).filter(v => v != "Header")
  }
}
