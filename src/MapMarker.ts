import * as L from 'leaflet';

import {rankUpEnemyForHardMode} from '@/level_scaling';
import {MapBase} from '@/MapBase';
import * as MapIcons from '@/MapIcon';
import {MapMgr, ObjectData, ObjectMinData} from '@/services/MapMgr';
import {MsgMgr} from '@/services/MsgMgr';
import {CanvasMarker, CanvasMarkerOptions} from '@/util/CanvasMarker';
import {Point} from '@/util/map';
import * as math from '@/util/math';
import * as map from '@/util/map';
import * as ui from '@/util/ui';
import {Settings} from '@/util/settings';

export abstract class MapMarker {
  public title = '';
  public readonly mb: MapBase;

  constructor(mb: MapBase) {
    this.mb = mb;
  }

  abstract getMarker(): L.Marker|L.CircleMarker;
  shouldBeShown(): boolean { return true; }

  protected commonInit(): void {
    this.getMarker().on({'click': () => this.mb.emitMarkerSelectedEvent(this)});
  }
}

class MapMarkerImpl extends MapMarker {
  constructor(mb: MapBase, title: string, xz: Point, options: L.MarkerOptions = {}) {
    super(mb);
    this.title = title;
    this.marker = L.marker(this.mb.fromXZ(xz), Object.assign(options, {
      title,
      contextmenu: true,
    }));
    super.commonInit();
  }

  getMarker() { return this.marker; }

  protected setTitle(title: string) {
    this.title = title;
    this.marker.options.title = title;
  }

  protected marker: L.Marker;
}

class MapMarkerCanvasImpl extends MapMarker {
  constructor(mb: MapBase, title: string, pos: Point, options: CanvasMarkerOptions = {}) {
    super(mb);
    this.title = title;
    this.marker = new CanvasMarker(mb.fromXZ(pos), Object.assign(options, {
      bubblingMouseEvents: false,
      contextmenu: true,
    }));
    this.marker.bindTooltip(title, { pane: 'front2' });
    super.commonInit();
  }

  getMarker() { return this.marker; }

  protected marker: L.CircleMarker;
}

class MapMarkerGenericLocationMarker extends MapMarkerImpl {
  public readonly lm: map.LocationMarker;

  private static ICONS_AND_LABELS: {[type: string]: [L.Icon, string]} = {
    'Village': [MapIcons.VILLAGE, ''],
    'Hatago': [MapIcons.HATAGO, ''],
    'Castle': [MapIcons.CASTLE, ''],
    'CheckPoint': [MapIcons.CHECKPOINT, ''],
    'Tower': [MapIcons.TOWER, ''],
    'Labo': [MapIcons.LABO, ''],
    'Dungeon': [MapIcons.DUNGEON, ''],
    'ShopBougu': [MapIcons.SHOP_BOUGU, 'Armor Shop'],
    'ShopColor': [MapIcons.SHOP_COLOR, 'Dye Shop'],
    'ShopJewel': [MapIcons.SHOP_JEWEL, 'Jewelry Shop'],
    'ShopYadoya': [MapIcons.SHOP_YADOYA, 'Inn'],
    'ShopYorozu': [MapIcons.SHOP_YOROZU, 'General Store'],
  };

  constructor(mb: MapBase, l: any, showLabel: boolean, zIndexOffset?: number) {
    const lm = new map.LocationMarker(l);
    const [icon, label] = MapMarkerGenericLocationMarker.ICONS_AND_LABELS[lm.getIcon()];
    const msgId = lm.getMessageId();
    const msg = msgId ? MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', msgId) : label;
    super(mb, msg, lm.getXZ(), {
      icon,
      zIndexOffset,
    });
    if (showLabel) {
      this.marker.bindTooltip(msg, {
        permanent: true,
        direction: 'center',
        className: `map-marker type-${lm.getIcon()}`,
      });
    }
    this.lm = lm;
  }
}

export class MapMarkerPlateauRespawnPos extends MapMarkerCanvasImpl {
  constructor(mb: MapBase, pos: Point) {
    super(mb, 'Plateau Respawn Location', pos, {
      fillColor: '#ff0000',
      fill: true,
      fillOpacity: 1,
      stroke: false,
      radius: 5,
    });
  }
}

export class MapMarkerLocation extends MapMarkerCanvasImpl {
  public readonly lp: map.LocationPointer;

  constructor(mb: MapBase, l: any) {
    const lp = new map.LocationPointer(l);
    const markerTypeStr = map.markerTypetoStr(lp.getType());
    const visibleMarkerTypeStr = l.PointerType ? 'Place' : markerTypeStr;
    const msg = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', lp.getMessageId());

    super(mb, msg, lp.getXZ(), {stroke: false, fill: false});
    this.marker.unbindTooltip();
    this.marker.bindTooltip(msg + `<span class="location-marker-type">${visibleMarkerTypeStr}</span>`, {
      permanent: true,
      direction: 'center',
      className: `map-location show-level-${lp.getShowLevel()} type-${markerTypeStr}`,
    });
    this.lp = lp;
  }

  shouldBeShown() {
    return this.lp.shouldShowAtZoom(this.mb.zoom);
  }
}

export class MapMarkerDungeon extends MapMarkerGenericLocationMarker {
  public readonly dungeonNum: number;

  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1000);
    // Yes, extracting the dungeon number from the save flag is what Nintendo does.
    const dungeonNum = parseInt(this.lm.getSaveFlag().replace('Location_Dungeon', ''), 10);
    this.marker.setIcon(dungeonNum >= 120 ? MapIcons.DUNGEON_DLC : MapIcons.DUNGEON);
    this.setTitle(MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.lm.getMessageId()));
    this.marker.options.title = '';
    this.dungeonNum = dungeonNum;
    const sub = MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', this.lm.getMessageId() + '_sub');
    this.marker.bindTooltip(`${this.title}<br>${sub}`, { pane: 'front2' });
  }
}

export class MapMarkerDungeonDLC extends MapMarkerDungeon {
  constructor(mb: MapBase, l: any) {
    super(mb, l);
  }
}

export class MapMarkerPlace extends MapMarkerGenericLocationMarker {
  private isVillage: boolean;

  constructor(mb: MapBase, l: any) {
    const isVillage = l['Icon'] == 'Village';
    super(mb, l, isVillage);
    this.isVillage = isVillage;
  }

  shouldBeShown() {
    if (this.isVillage)
      return this.mb.zoom < 7;
    return true;
  }
}

export class MapMarkerTower extends MapMarkerGenericLocationMarker {
  constructor(mb: MapBase, l: any) {
    super(mb, l, false, 1001);
  }
}

export class MapMarkerLabo extends MapMarkerGenericLocationMarker {
  constructor(mb: MapBase, l: any) {
    super(mb, l, false);
  }
}

export class MapMarkerShop extends MapMarkerGenericLocationMarker {
  constructor(mb: MapBase, l: any) {
    super(mb, l, false);
  }

  shouldBeShown() {
    return this.mb.zoom >= 7;
  }
}

const KOROK_ICON = (() => {
  const img = new Image();
  img.src = '/icons/mapicon_korok.png';
  return img;
})();

export class MapMarkerKorok extends MapMarkerCanvasImpl {
  public readonly info: any;

  constructor(mb: MapBase, info: any) {
    super(mb, 'Korok', [info.Translate.X, info.Translate.Z], {
      icon: KOROK_ICON,
      iconWidth: 20,
      iconHeight: 20,
    });
    this.info = info;
  }
}

function getName(name: string) {
  if (Settings.getInstance().useActorNames)
    return name;
  return MsgMgr.getInstance().getName(name) || name;
}

function setObjMarkerTooltip(title: string, layer: L.Layer, obj: ObjectMinData) {
  const tooltipInfo = [title];
  if (obj.name === 'LocationTag' && obj.messageid) {
    const locationName = MsgMgr.getInstance().getMsgWithFile('StaticMsg/LocationMarker', obj.messageid)
      || MsgMgr.getInstance().getMsgWithFile('StaticMsg/Dungeon', obj.messageid);
    tooltipInfo.push(`${locationName}`);
  }
  if (obj.drop) {
    if (obj.drop[0] == 1)
      tooltipInfo.push(getName(obj.drop[1]));
    else if (obj.drop[0] == 2)
      tooltipInfo.push('Drop table: ' + obj.drop[1]);
  }
  if (obj.equip) {
    for (const e of obj.equip)
      tooltipInfo.push(getName(e));
  }
  layer.setTooltipContent(tooltipInfo.join('<br>'));
}

function hashString(s: string) {
  // https://stackoverflow.com/a/7616484/1636285
  var hash = 0, i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash >>> 0;
}

export const enum SearchResultUpdateMode {
  UpdateStyle = 1 << 0,
  UpdateVisibility = 1 << 1,
  UpdateTitle = 1 << 2,
}

export class MapMarkerObj extends MapMarkerCanvasImpl {
  constructor(mb: MapBase, public readonly obj: ObjectMinData, fillColor: string, strokeColor: string) {
    super(mb, '', obj.pos, {
      radius: 7,
      weight: 2,
      fillOpacity: 0.7,
      fillColor,
      color: strokeColor,

      // @ts-ignore
      contextmenuItems: [
        {
          text: 'Show no-revival area',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            const [x, z] = mb.toXZ(latlng);
            const col = math.clamp(((x + 5000) / 1000)|0, 0, 9);
            const row = math.clamp(((z + 4000) / 1000)|0, 0, 7);

            let minx = (col-1) * 1000 - 4500;
            let maxx = (col+1) * 1000 - 4500;
            minx = math.clamp(minx, -5000, 5000);
            maxx = math.clamp(maxx, -5000, 5000);

            let minz = (row-1) * 1000 - 3500;
            let maxz = (row+1) * 1000 - 3500;
            minz = math.clamp(minz, -4000, 4000);
            maxz = math.clamp(maxz, -4000, 4000);

            const pt1 = mb.fromXZ([minx, minz]);
            const pt2 = mb.fromXZ([maxx, maxz]);
            const rect = L.rectangle(L.latLngBounds(pt1, pt2), {
              color: "#ff7800",
              weight: 2,
              // @ts-ignore
              contextmenu: true,
              contextmenuItems: [{
                text: 'Hide no-revival area',
                callback: () => { rect.remove(); },
              }],
            });
            rect.addTo(mb.m);
          },
          index: 0,
        },
        {
          text: 'Show generation group',
          callback: ({ latlng }: ui.LeafletContextMenuCbArg) => {
            mb.m.fire('AppMap:show-gen-group', {
              mapType: this.obj.map_type,
              mapName: this.obj.map_name,
              hashId: this.obj.hash_id,
            });
          },
          index: 0,
        },
      ],
    });
    this.marker.bringToFront();
    this.updateTitle();
  }

  updateTitle() {
    const actor = (Settings.getInstance().hardMode && !this.obj.disable_rankup_for_hard_mode)
        ? rankUpEnemyForHardMode(this.obj.name)
        : this.obj.name;
    this.title = getName(actor);
    setObjMarkerTooltip(this.title, this.marker, this.obj);
  }

  update(groupFillColor: string, groupStrokeColor: string, mode: SearchResultUpdateMode) {
    if (mode & SearchResultUpdateMode.UpdateTitle)
      this.updateTitle();

    if (mode & SearchResultUpdateMode.UpdateStyle) {
      let fillColor = groupFillColor;
      let color = groupStrokeColor;
      if (Settings.getInstance().colorPerActor) {
        fillColor = ui.genColor(1000, hashString(this.title) % 1000);
        color = ui.shadeColor(fillColor, -15);
      }

      this.marker.setStyle({
        fillColor,
        color,
      });
    }

    const radius = Math.min(Math.max(this.mb.zoom, 4), 7);
    this.marker.setRadius(radius);
    this.marker.setStyle({
      weight: radius >= 5 ? 2 : 0,
    });
  }
}

export class MapMarkerSearchResult extends MapMarkerObj {
  constructor(mb: MapBase, obj: ObjectMinData) {
    super(mb, obj, '#e02500', '#ff2a00');
  }
}
