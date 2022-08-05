import Vue from 'vue'
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import MixinUtil from '@/components/MixinUtil';
import * as ui from '@/util/ui';

@Component
export default class ShopData extends mixins(MixinUtil) {
  @Prop()
  private data!: any;

  length() {
    return this.data.Normal.ColumnNum;
  }
  name(i: number) {
    const n = i.toString().padStart(3, '0')
    return ui.getName(this.data.Normal[`ItemName${n}`]);
  }
  num(i: number) {
    const n = i.toString().padStart(3, '0')
    return this.data.Normal[`ItemNum${n}`];
  }
  price(i: number) {
    const n = i.toString().padStart(3, '0')
    return this.data.Normal[`ItemPrice${n}`];
  }
}
