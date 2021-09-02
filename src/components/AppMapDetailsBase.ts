import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component, { mixins } from 'vue-class-component';

import MixinUtil from '@/components/MixinUtil';
import { ObjectMinData } from '@/services/MapMgr';
import * as ui from '@/util/ui';

@Component({
  watch: {
    // @ts-ignore
    marker: function() { this.init(); },
  }
})
export default class AppMapDetailsBase<MarkerClass> extends mixins(MixinUtil) {
  @Prop()
  protected marker!: ui.Unobservable<MarkerClass>;
  protected init() { }

  private created() {
    this.init();
  }
}
