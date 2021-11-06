export type SettingChangeCb = () => void;
export type SettingBeforeSaveCb = () => void;

export class Settings {
  private static instance: Settings;
  static getInstance() {
    if (!this.instance) {
      const instance = new this();
      this.instance = new Proxy(instance, instance.makeProxyHandler());
    }
    return this.instance;
  }

  /// Register a callback that will be invoked whenever a setting is modified.
  registerCallback(cb: SettingChangeCb) {
    this.callbacks.push(cb);
  }
  registerBeforeSaveCallback(cb: SettingBeforeSaveCb) {
    this.beforeSaveCallbacks.push(cb);
  }

  shownGroups!: Set<string>;
  drawLayerGeojson!: string;

  colorPerActor!: boolean;

  useActorNames!: boolean;
  useHexForHashIds!: boolean;

  mapType!: string;
  mapName!: string;

  hardMode!: boolean;
  ohoMode!: boolean;
  lastBossMode!: boolean;

  customSearchPresets!: Array<[string, string]>;

  left!: boolean;
  hylianMode!: boolean;
  drawControlsShown!: boolean;

  decompBannerHidden!: boolean;

  private constructor() {
    this.load();
    window.addEventListener('beforeunload', (event) => {
      this.save();
    });
  }

  private load() {
    const dataStr = localStorage.getItem(Settings.KEY);
    const data = dataStr ? JSON.parse(dataStr) : {};

    this.shownGroups = parse(data.shownGroups, (d) => new Set(d),
      new Set(['Location', 'Dungeon', 'DungeonDLC', 'Place', 'Tower', 'Shop', 'Labo']));
    this.drawLayerGeojson = parse(data.drawLayerGeojson, Id, '');
    this.colorPerActor = parse(data.colorPerActor, Id, true);
    this.useActorNames = parse(data.useActorNames, Id, false);
    this.useHexForHashIds = parse(data.useHexForHashIds, Id, true);
    this.hardMode = parse(data.hardMode, Id, false);
    this.ohoMode = parse(data.ohoMode, Id, false);
    this.lastBossMode = parse(data.lastBossMode, Id, false);
    this.customSearchPresets = parse(data.customSearchPresets, Id, []);
    this.left = parse(data.left, Id, true);
    this.mapType = parse(data.mapType, Id, 'MainField');
    this.mapName = parse(data.mapName, Id, '');
    this.hylianMode = false;
    this.drawControlsShown = parse(data.drawControlsShown, Id, false);
    this.decompBannerHidden = parse(data.decompBannerHidden, Id, false);

    this.invokeCallbacks();
  }

  private save() {
    for (const cb of this.beforeSaveCallbacks)
      cb();
    const data = {
      shownGroups: Array.from(this.shownGroups),
      drawLayerGeojson: this.drawLayerGeojson,
      colorPerActor: this.colorPerActor,
      useActorNames: this.useActorNames,
      useHexForHashIds: this.useHexForHashIds,
      hardMode: this.hardMode,
      ohoMode: this.ohoMode,
      lastBossMode: this.lastBossMode,
      customSearchPresets: this.customSearchPresets,
      left: this.left,
      mapType: this.mapType,
      mapName: this.mapName,
      hylianMode: this.hylianMode,
      drawControlsShown: this.drawControlsShown,
      decompBannerHidden: this.decompBannerHidden,
    };
    // Merge with existing data to avoid data loss.
    const existingDataStr = localStorage.getItem(Settings.KEY);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
    localStorage.setItem(Settings.KEY, JSON.stringify(Object.assign(existingData, data)));
  }

  private invokeCallbacks() {
    for (const cb of this.callbacks)
      cb();
  }

  private makeProxyHandler(): ProxyHandler<Settings> {
    return {
      set: (target, prop, value) => {
        const r = Reflect.set(target, prop, value);
        if (!r)
          return false;
        this.invokeCallbacks();
        return true;
      },
    };
  }

  private static KEY = 'storage';
  private beforeSaveCallbacks: SettingBeforeSaveCb[] = [];
  private callbacks: SettingChangeCb[] = [];
}

function parse<T>(data: any, parseFn: (data: any) => T, defaultVal: T) {
  if (data !== undefined)
    return parseFn(data);
  return defaultVal;
}

/// Identity function.
function Id(data: any) { return data; }
