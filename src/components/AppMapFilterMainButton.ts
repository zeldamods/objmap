import Vue from 'vue';
import {Prop} from 'vue-property-decorator';
import Component from 'vue-class-component';

import {Settings} from '@/util/settings';

@Component
export default class AppMapFilterMainButton extends Vue {
  @Prop({default: '', type: String})
  private icon!: string;
  @Prop({type: String, required: true})
  private label!: string;
  @Prop({type: String, required: true})
  private type!: string;

  private active = false;

  created() {
    this.active = Settings.getInstance().shownGroups.has(this.type);
  }

  private onClick() {
    this.active = !this.active;
    if (this.active) {
      Settings.getInstance().shownGroups.add(this.type);
    } else {
      Settings.getInstance().shownGroups.delete(this.type);
    }
    this.$emit('toggle');
  }
}
