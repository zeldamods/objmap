import Vue from 'vue';
import {Prop} from 'vue-property-decorator';
import Component from 'vue-class-component';

import {Settings} from '@/util/settings';

@Component
export default class AppMapSettings extends Vue {
  colorMode: string = '';
  s: Settings|null = null;

  created() {
    this.s = Settings.getInstance();
    Settings.getInstance().registerCallback(() => this.loadSettings());
    this.loadSettings();
  }

  private loadSettings() {
    this.colorMode = Settings.getInstance().colorPerActor ? 'per-actor' : 'per-group';
  }

  private onColorModeChange(mode: string) {
    Settings.getInstance().colorPerActor = mode === 'per-actor';
  }
}
