import { GAME_FILES } from '@/util/map';

type File = { [label: string]: any };

const metaFileList = {
  'area': 'area_data.json',
  'climate': 'climate_data.json',
  'metadata': 'object_meta.json'
};

export class MetaMgr {
  private static instance: MetaMgr;
  static getInstance() {
    if(!this.instance) {
      this.instance = new this()
    }
    return this.instance;
  }

  private files: Map<string, File> = new Map();

  async init() {
    const fileLoadPromises = []
    for(const [file, path] of Object.entries(metaFileList)) {
      fileLoadPromises.push(fetch(GAME_FILES + '/' + path).then(r => r.json()).then((d) => {
        this.files.set(file, Object.freeze(d))
      }))
    }
    await Promise.all( fileLoadPromises )
  }
  private getFile(file: string) {
    return this.files.get(file)
  }
  getClimateData(item: number)  {
    const data = this.getFile('climate');
    if(!data) { return }
    return data[`ClimateDefines_${item}`];
  }
  getAreaData(item: number) {
    const data = this.getFile('area')
    if(!data) { return }
    return data.find((val: any) => val.AreaNumber == item);
  }
  getObjectMetaData(item: string): any {
    const data = this.getFile('metadata');
    if(!data) { return }
    return data[item]
  }
}
