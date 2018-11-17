type File = {[label: string]: string};

export class MsgMgr {
  private static instance: MsgMgr;
  static getInstance() {
    if (!this.instance)
      this.instance = new this();
    return this.instance;
  }

  private names: {[actorName: string]: string} = {};
  private files: Map<string, File> = new Map();

  async init() {
    const PREFIX = '/game_files/text/';
    const fileList: string[] = await fetch(PREFIX + 'list.json').then(r => r.json());
    const fileLoadPromises = [];
    for (const path of fileList) {
      const file = path.replace('.json', '');
      fileLoadPromises.push(fetch(PREFIX + path).then(r => r.json()).then((d) => {
        this.files.set(file, Object.freeze(d));
      }));
    }
    fileLoadPromises.push(fetch('/game_files/names.json').then(r => r.json()).then((d) => {
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

  /// Get a message by its message ID (e.g. EventFlowMsg/AncientBall_Kakariko:Label).
  getMsg(id: string): string {
    const [file, label] = id.split(':');
    return this.getMsgWithFile(file, label);
  }

  getName(actorName: string): string {
    return this.names[actorName];
  }
}
