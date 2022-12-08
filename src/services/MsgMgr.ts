import { GAME_FILES } from '@/util/map';

type File = { [label: string]: string };

export class MsgMgr {
  private static instance: MsgMgr;
  static getInstance() {
    if (!this.instance)
      this.instance = new this();
    return this.instance;
  }

  private names: { [actorName: string]: string } = {};
  private files: Map<string, File> = new Map();
  private climate: any | null = null;
  private area: any | null = null;
  private metadata: any | null = null;

  async init() {
    const PREFIX = `${GAME_FILES}/text/`;
    const fileList: string[] = await fetch(PREFIX + 'list.json').then(r => r.json());
    const fileLoadPromises = [];
    for (const path of fileList) {
      const file = path.replace('.json', '');
      fileLoadPromises.push(fetch(PREFIX + path).then(r => r.json()).then((d) => {
        this.files.set(file, Object.freeze(d));
      }));
    }
    fileLoadPromises.push(fetch(`${GAME_FILES}/names.json`).then(r => r.json()).then((d) => {
      this.names = d;
    }));
    await Promise.all(fileLoadPromises);
  }

  private getFile(file: string) {
    return this.files.get(file);
  }

  getMsgWithFile(file: string, label: string): string {
    const f = this.getFile(file);
    return f === undefined ? "???" : f[label];
  }

  async getAreaData(item: number) {
    if (!this.area) {
      const res = await fetch(`${GAME_FILES}/area_data.json`);
      this.area = await res.json();
    }
    if (this.area) {
      return this.area.find((val: any) => val.AreaNumber == item);
    }
    return null;
  }

  async getClimateData(item: number) {
    if (!this.climate) {
      const res = await fetch(`${GAME_FILES}/climate_data.json`);
      this.climate = await res.json();
    }
    if (this.climate) {
      return this.climate[`ClimateDefines_${item}`];
    }
    return null;
  }

  async getObjectMetaData(item: string) {
    if (!this.metadata) {
      const res = await fetch(`${GAME_FILES}/object_meta.json`);
      this.metadata = await res.json();
    }
    if (this.metadata) {
      return this.metadata[item];
    }
    return null;
  }

  /// Get a message by its message ID (e.g. EventFlowMsg/AncientBall_Kakariko:Label).
  getMsg(id: string): string {
    const [file, label] = id.split(':');
    return this.getMsgWithFile(file, label);
  }

  getName(actorName: string): string {
    return this.names[actorName];
  }
}
