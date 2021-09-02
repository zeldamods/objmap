import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component from 'vue-class-component';

import { MsgMgr } from '@/services/MsgMgr';
import { Settings } from '@/util/settings';

function makeMainFieldDungeonEntry(mapName: string) {
  const text = MsgMgr.getInstance().getMsg(`StaticMsg/LocationMarker:${mapName}`);
  return { value: mapName, text: `${text} (${mapName})` };
}

function makeCDungeonEntry(n: number) {
  const mapName = 'Dungeon' + n.toString().padStart(3, '0');
  const text = MsgMgr.getInstance().getMsg(`StaticMsg/Dungeon:${mapName}`);
  const sub = MsgMgr.getInstance().getMsg(`StaticMsg/Dungeon:${mapName}_sub`);
  return { value: mapName, text: `${text} (${mapName} - ${sub})` };
}

@Component
export default class AppMapSettings extends Vue {
  colorMode: string = '';
  s: Settings | null = null;

  optionsMapType = Object.freeze([
    { value: 'MainField', text: 'Hyrule (MainField)' },
    { value: 'MainFieldDungeon', text: 'Divine Beasts (MainFieldDungeon)' },
    { value: 'CDungeon', text: 'Shrines (CDungeon)' },
    { value: 'AocField', text: 'Trial of the Sword (AocField)' },
  ]);

  optionsMapNameForMapType: { [type: string]: any } = Object.freeze({
    'MainField': [
      { value: '', text: 'All' },
    ],
    'MainFieldDungeon': [{ value: '', text: 'All' }].concat(['RemainsWind', 'RemainsWater', 'RemainsElectric', 'RemainsFire', 'FinalTrial'].map(makeMainFieldDungeonEntry)),
    'CDungeon': [{ value: '', text: 'All' }].concat([...Array(136).keys()].map(makeCDungeonEntry)),
    'AocField': [
      { value: '', text: 'All' },
    ],
  });

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

  private resetMapName() {
    this.s!.mapName = this.optionsMapNameForMapType[this.s!.mapType][0].value;
  }
}
