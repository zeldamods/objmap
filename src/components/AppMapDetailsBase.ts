import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component, { mixins } from 'vue-class-component';

import MixinUtil from '@/components/MixinUtil';
import { ObjectMinData } from '@/services/MapMgr';

@Component({
  watch: {
    // @ts-ignore
    marker: function() { this.init(); },
  }
})
export default class AppMapDetailsBase<MarkerClass> extends mixins(MixinUtil) {
  @Prop()
  protected marker!: MarkerClass;
  protected init() { }

  private created() {
    this.init();
  }
}
