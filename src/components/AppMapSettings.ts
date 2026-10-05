import { defineComponent } from 'vue';

import { MsgMgr } from '@/services/MsgMgr';
import { appMapBus } from '@/util/bus';
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

export default defineComponent({
  name: 'AppMapSettings',

  data() {
    return {
      colorMode: '',
      s: Settings.getInstance(),

      optionsMapType: Object.freeze([
        { value: 'MainField', text: 'Hyrule (MainField)' },
        { value: 'MainFieldDungeon', text: 'Divine Beasts (MainFieldDungeon)' },
        { value: 'CDungeon', text: 'Shrines (CDungeon)' },
        { value: 'AocField', text: 'Trial of the Sword (AocField)' },
      ]),

      optionsMapNameForMapType: Object.freeze({
        'MainField': [
          { value: '', text: 'All' },
        ],
        'MainFieldDungeon': [{ value: '', text: 'All' }].concat(['RemainsWind', 'RemainsWater', 'RemainsElectric', 'RemainsFire', 'FinalTrial'].map(makeMainFieldDungeonEntry)),
        'CDungeon': [{ value: '', text: 'All' }].concat([...Array(136).keys()].map(makeCDungeonEntry)),
        'AocField': [
          { value: '', text: 'All' },
        ],
      }) as { [type: string]: any },
    };
  },

  created() {
    Settings.getInstance().registerCallback(() => this.loadSettings());
    this.loadSettings();
  },

  methods: {
    toggleY(): void {
      appMapBus.emit('AppMap:toggle-y-values');
    },
    toggleXZ(): void {
      appMapBus.emit('AppMap:toggle-xz-values');
    },

    loadSettings(): void {
      this.colorMode = Settings.getInstance().colorPerActor ? 'per-actor' : 'per-group';
    },

    onColorModeChange(mode: string): void {
      Settings.getInstance().colorPerActor = mode === 'per-actor';
    },

    resetMapName(): void {
      this.s.mapName = this.optionsMapNameForMapType[this.s.mapType][0].value;
    },
  },
});
