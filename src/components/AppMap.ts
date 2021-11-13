import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-sidebar-v2';
import 'leaflet-sidebar-v2/css/leaflet-sidebar.css';

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import VueRouter from 'vue-router';
const { isNavigationFailure, NavigationFailureType } = VueRouter;

import debounce from 'lodash/debounce';
import Vue from 'vue';
import Component, { mixins } from 'vue-class-component';

import { MapBase, SHOW_ALL_OBJS_FOR_MAP_UNIT_EVENT } from '@/MapBase';
import * as MapIcons from '@/MapIcon';
import * as MapMarkers from '@/MapMarker';
import { MapMarker, SearchResultUpdateMode } from '@/MapMarker';
import { MapMarkerGroup } from '@/MapMarkerGroup';
import { SearchResultGroup, SearchExcludeSet, SEARCH_PRESETS } from '@/MapSearch';
import * as save from '@/save';

import MixinUtil from '@/components/MixinUtil';
import AppMapDetailsDungeon from '@/components/AppMapDetailsDungeon';
import AppMapDetailsObj from '@/components/AppMapDetailsObj';
import AppMapFilterMainButton from '@/components/AppMapFilterMainButton';
import AppMapSettings from '@/components/AppMapSettings';
import ModalGotoCoords from '@/components/ModalGotoCoords';
import ObjectInfo from '@/components/ObjectInfo';

import { MapMgr, ObjectData, ObjectMinData } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';

import * as map from '@/util/map';
import { Point } from '@/util/map';
import { Settings } from '@/util/settings';
import * as ui from '@/util/ui';
import { calcLayerLength } from '@/util/polyline';
import '@/util/leaflet_tile_workaround.js';
import AppMapPopup from '@/components/AppMapPopup';

interface ObjectIdentifier {
  mapType: string;
  mapName: string;
  hashId: number;
}

function valueOrDefault<T>(value: T | undefined, defaultValue: T) {
  return value === undefined ? defaultValue : value;
}

interface MarkerComponent {
  cl: any;
  detailsComponent?: string;
  preloadPad?: number;
  enableUpdates?: boolean;

  filterIcon: string,
  filterLabel: string,
}

const MARKER_COMPONENTS: { [type: string]: MarkerComponent } = Object.freeze({
  'Location': {
    cl: MapMarkers.MapMarkerLocation,
    preloadPad: 0.6,
    filterIcon: MapIcons.CHECKPOINT.options.iconUrl,
    filterLabel: 'Locations',
  },
  'Dungeon': {
    cl: MapMarkers.MapMarkerDungeon,
    detailsComponent: 'AppMapDetailsDungeon',
    enableUpdates: false,
    filterIcon: MapIcons.DUNGEON.options.iconUrl,
    filterLabel: 'Shrines',
  },
  'Place': {
    cl: MapMarkers.MapMarkerPlace,
    filterIcon: MapIcons.VILLAGE.options.iconUrl,
    filterLabel: 'Places',
  },
  'DungeonDLC': {
    cl: MapMarkers.MapMarkerDungeonDLC,
    detailsComponent: 'AppMapDetailsDungeon',
    enableUpdates: false,
    filterIcon: MapIcons.DUNGEON_DLC.options.iconUrl,
    filterLabel: 'DLC Shrines',
  },
  'Tower': {
    cl: MapMarkers.MapMarkerTower,
    enableUpdates: false,
    filterIcon: MapIcons.TOWER.options.iconUrl,
    filterLabel: 'Towers',
  },
  'Shop': {
    cl: MapMarkers.MapMarkerShop,
    filterIcon: MapIcons.SHOP_YOROZU.options.iconUrl,
    filterLabel: 'Shops',
  },
  'Labo': {
    cl: MapMarkers.MapMarkerLabo,
    enableUpdates: false,
    filterIcon: MapIcons.LABO.options.iconUrl,
    filterLabel: 'Tech Labs',
  },
  'Korok': {
    cl: MapMarkers.MapMarkerKorok,
    detailsComponent: 'AppMapDetailsObj',
    enableUpdates: false,
    filterIcon: MapIcons.KOROK.options.iconUrl,
    filterLabel: 'Koroks',
  },
});

function getMarkerDetailsComponent(marker: MapMarker): string {
  if (marker instanceof MapMarkers.MapMarkerObj || marker instanceof MapMarkers.MapMarkerSearchResult)
    return 'AppMapDetailsObj';

  for (const component of Object.values(MARKER_COMPONENTS)) {
    if (marker instanceof component.cl)
      return valueOrDefault(component.detailsComponent, '');
  }
  return '';
}

class LayerProps {
  title: string;
  text: string;
  pathLength: number;
  constructor() {
    this.title = "";
    this.text = "";
    this.pathLength = 0;
  }
  lengthAsString(): string {
    if (this.pathLength <= 0.0) {
      return "";
    }
    return `${this.pathLength.toFixed(2)} m`;
  }
  tooltip(): string {
    return (this.title || 'Unnamed') + " " + this.lengthAsString();
  }
  fromGeoJSON(feat: any) {
    this.title = feat.properties.title || '';
    this.text = feat.properties.text || '';
    this.pathLength = feat.properties.pathLength || 0;
  }
}
function addGeoJSONFeatureToLayer(layer: any) {
  if (!layer.feature) {
    layer.feature = { type: 'Feature' };
  }
  if (!layer.feature.properties) {
    layer.feature.properties = new LayerProps();
  }
}



function layerSetTooltip(layer: L.Marker | L.Polyline) {
  if (layer.feature) {
    layer.setTooltipContent(layer.feature.properties.tooltip());
  }
}

function layerSetPopup(layer: L.Marker | L.Polyline, popup: AppMapPopup) {
  layer.bindPopup(popup.$el as HTMLElement, { minWidth: 200 });
  // @ts-ignore
  // popup instance is needed later to update the length
  layer.popup = popup;
}

function addPopupAndTooltip(layer: L.Marker | L.Polyline) {
  if (layer && layer.feature) {
    let popup = new AppMapPopup({ propsData: layer.feature.properties });
    // Initiate the Element as $el
    popup.$mount();
    // Respond to `title` and `text` messages
    popup.$on('title', (txt: string) => {
      if (layer && layer.feature) {
        layer.feature.properties.title = txt;
        layerSetTooltip(layer);
      }
    });
    popup.$on('text', (txt: string) => {
      if (layer && layer.feature) {
        layer.feature.properties.text = txt;
      }
    });
    // Create Popup and Tooltip
    layerSetPopup(layer, popup);
    layer.bindTooltip(layer.feature.properties.tooltip());
  }
}


@Component({
  components: {
    AppMapDetailsDungeon,
    AppMapDetailsObj,
    AppMapFilterMainButton,
    AppMapSettings,
    ModalGotoCoords,
    ObjectInfo,
  },
})
export default class AppMap extends mixins(MixinUtil) {
  private map!: MapBase;
  private updatingRoute = false;
  private zoom = map.DEFAULT_ZOOM;

  private sidebar!: L.Control.Sidebar;
  private sidebarActivePane = '';
  private sidebarPaneScrollPos: Map<string, number> = new Map();
  private drawControlEnabled = false;
  private drawControl: any;
  private drawLayer!: L.GeoJSON;
  private drawLineColor = '#3388ff';

  private previousGotoMarker: L.Marker | null = null;
  private greatPlateauBarrierShown = false;

  private detailsComponent = '';
  private detailsMarker: ui.Unobservable<MapMarker> | null = null;
  private detailsPaneOpened = false;
  private detailsPinMarker: ui.Unobservable<L.Marker> | null = null;

  private markerComponents = MARKER_COMPONENTS;
  private markerGroups: Map<string, MapMarkerGroup> = new Map();

  private searching = false;
  private searchQuery = '';
  private searchThrottler!: () => void;
  private searchLastSearchFailed = false;
  private searchResults: ObjectMinData[] = [];
  private searchResultMarkers: ui.Unobservable<MapMarkers.MapMarkerSearchResult>[] = [];
  private searchGroups: SearchResultGroup[] = [];
  private searchPresets = SEARCH_PRESETS;
  private searchExcludedSets: SearchExcludeSet[] = [];
  private readonly MAX_SEARCH_RESULT_COUNT = 2000;

  private hardModeExcludeSet!: SearchExcludeSet;
  private lastBossExcludeSet!: SearchExcludeSet;
  private ohoExcludeSet!: SearchExcludeSet;

  private areaMapLayer = new ui.Unobservable(L.layerGroup());
  private areaMapLayersByData: ui.Unobservable<Map<any, L.Layer[]>> = new ui.Unobservable(new Map());
  shownAreaMap = '';
  areaWhitelist = '';
  showKorokIDs = false;

  private mapUnitGrid = new ui.Unobservable(L.layerGroup());
  showMapUnitGrid = false;

  private mapSafeAreas = new ui.Unobservable(L.layerGroup());
  showSafeAreas = false;

  private tempObjMarker: ui.Unobservable<MapMarker> | null = null;

  private settings: Settings | null = null;

  // Replace current markers
  private importReplace: boolean = true;

  setViewFromRoute(route: any) {
    const x = parseFloat(route.params.x);
    const z = parseFloat(route.params.z);
    if (isNaN(x) || isNaN(z)) {
      this.$router.replace({ name: 'map' });
      return;
    }

    let zoom = parseInt(route.params.zoom);
    if (isNaN(zoom))
      zoom = 3;

    this.map.setView([x, z], zoom);
  }
  updateRoute() {
    this.updatingRoute = true;
    // @ts-ignore
    this.$router.replace({
      name: 'map',
      params: {
        x: this.map.center[0],
        z: this.map.center[1],
        zoom: this.map.m.getZoom(),
      },
      query: this.$route.query,
    }).catch(err => {
      if (!isNavigationFailure(err, NavigationFailureType.duplicated)) {
        console.error(err);
      }
    });
    this.updatingRoute = false;
  }

  initMapRouteIntegration() {
    this.setViewFromRoute(this.$route);
    this.map.zoom = this.map.m.getZoom();
    this.map.center = this.map.toXZ(this.map.m.getCenter());
    this.map.registerMoveEndCb(() => this.updateRoute());
    this.map.registerZoomEndCb(() => this.updateRoute());
    this.updateRoute();
  }

  initMarkers() {
    this.map.registerZoomCb(() => this.updateMarkers());
    this.updateMarkers();
  }

  // Similar to updateMarkers() but only called
  //   on toggle of KorokIDs
  updateKorokIDs() {
    let type = "Korok";
    const info = MapMgr.getInstance().getInfoMainField();
    if (Settings.getInstance().shownGroups.has(type)) {
      this.markerGroups.get(type)!.destroy();
      this.markerGroups.delete(type);

      const markers: any[] = info.markers[type];
      const component = MARKER_COMPONENTS[type];
      const group = new MapMarkerGroup(
        markers.map((m: any) => new (component.cl)(this.map, m, { showLabel: this.showKorokIDs })),
        valueOrDefault(component.preloadPad, 1.0),
        valueOrDefault(component.enableUpdates, true));
      this.markerGroups.set(type, group);
      group.addToMap(this.map.m);
      group.update();
    }
  }

  updateMarkers() {
    const info = MapMgr.getInstance().getInfoMainField();
    for (const type of Object.keys(info.markers)) {
      if (!Settings.getInstance().shownGroups.has(type)) {
        // Group exists and needs to be removed.
        if (this.markerGroups.has(type)) {
          this.markerGroups.get(type)!.destroy();
          this.markerGroups.delete(type);
        }
        continue;
      }

      // Nothing to do -- the group already exists.
      if (this.markerGroups.has(type))
        continue;

      const markers: any[] = info.markers[type];
      const component = MARKER_COMPONENTS[type];
      const group = new MapMarkerGroup(
        markers.map((m: any) => new (component.cl)(this.map, m, { showLabel: this.showKorokIDs })),
        valueOrDefault(component.preloadPad, 1.0),
        valueOrDefault(component.enableUpdates, true));
      this.markerGroups.set(type, group);
      group.addToMap(this.map.m);
    }

    for (const group of this.markerGroups.values())
      group.update();
  }

  initSidebar() {
    this.sidebar = L.control.sidebar({
      closeButton: true,
      container: 'sidebar',
      position: 'left',
    })
    this.sidebar.addTo(this.map.m);
    const el = (document.getElementById('sidebar-content'))!;
    const origOpen = this.sidebar.open;
    // Fires before switching the active pane.
    this.sidebar.open = (id: string) => {
      this.sidebarPaneScrollPos.set(this.sidebarActivePane, el.scrollTop);
      return origOpen.apply(this.sidebar, [id]);
    };
    // Fires after switching the active pane.
    this.sidebar.on('content', (e) => {
      // @ts-ignore
      const id: string = e.id;
      this.sidebarActivePane = id;
      el.scrollTop = this.sidebarPaneScrollPos.get(this.sidebarActivePane) || 0;
    });
    this.updateSidebarClass();
    this.updateHylianMode();
  }

  closeSidebar() {
    this.sidebar.close();
  }

  toggleSidebarSide() {
    Settings.getInstance().left = !Settings.getInstance().left;
    this.updateSidebarClass();
  }

  toggleHylianMode() {
    Settings.getInstance().hylianMode = !Settings.getInstance().hylianMode;
    this.updateHylianMode();
  }

  updateSidebarClass() {
    const el = (document.getElementById('sidebar'))!;
    if (Settings.getInstance().left) {
      el.classList.remove('leaflet-sidebar-right');
      el.classList.add('leaflet-sidebar-left');
    } else {
      el.classList.add('leaflet-sidebar-right');
      el.classList.remove('leaflet-sidebar-left');
    }
  }

  updateHylianMode() {
    const el = (document.getElementById('app'))!;
    if (Settings.getInstance().hylianMode) {
      el.classList.add('hylian-mode');
    } else {
      el.classList.remove('hylian-mode');
    }
  }

  switchPane(pane: string) {
    this.sidebar.open(pane);
  }

  private initGeojsonFeature(layer: any) {
    if (!(layer.setStyle))
      return;

    layer.on('mouseover', () => {
      layer.setStyle({ weight: 5 });
    });
    layer.on('mouseout', () => {
      layer.setStyle({ weight: 3 });
    });
    if (!layer.bindContextMenu) {
      return;
    }
    // @ts-ignore
    layer.bindContextMenu({
      contextmenu: true,
      contextmenuItems: [{
        text: 'Change color to current polyline color',
        index: 0,
        callback: () => {
          layer.setStyle({ color: this.drawLineColor });
        },
      }, {
        separator: true,
        index: 1,
      }],
    });
  }

  initDrawTools() {
    this.drawLayer = new L.GeoJSON(undefined, {
      style: (feature) => {
        // @ts-ignore
        return feature.style || {};
      },
      onEachFeature: (feature, layer) => { this.initGeojsonFeature(layer); },
    });
    const savedData = Settings.getInstance().drawLayerGeojson;
    if (savedData)
      this.drawFromGeojson(JSON.parse(savedData));
    this.drawLayer.addTo(this.map.m);
    const options = {
      position: 'topleft',
      draw: {
        circlemarker: false,
        rectangle: { showRadius: false },
      },
      edit: {
        featureGroup: this.drawLayer,
      },
    };
    // @ts-ignore
    this.drawControl = new L.Control.Draw(options);
    this.map.m.on({
      // @ts-ignore
      'draw:created': (e: any) => {
        addGeoJSONFeatureToLayer(e.layer);
        calcLayerLength(e.layer);
        addPopupAndTooltip(e.layer);
        this.drawLayer.addLayer(e.layer);
        this.initGeojsonFeature(e.layer);
      },
      'draw:edited': (e: any) => {
        e.layers.eachLayer((layer: L.Marker | L.Polyline) => {
          calcLayerLength(layer);
          layerSetTooltip(layer);
        });
      },
    });
    this.drawOnColorChange();
    Settings.getInstance().registerBeforeSaveCallback(() => {
      Settings.getInstance().drawLayerGeojson = JSON.stringify(this.drawToGeojson());
    });
    this.updateDrawControlsVisibility();
  }

  private drawFromGeojson(data: any) {
    if (this.importReplace) {
      this.drawLayer.clearLayers();
    }
    data.features.forEach((feat: any) => {
      // Create Layer
      let layer: any = L.GeoJSON.geometryToLayer(feat);
      // Only set style for Polylines not Markers
      if (layer.setStyle) {
        let color = this.drawLineColor;
        if (feat.style && feat.style.color) {
          color = feat.style.color;
        }
        layer.setStyle({ color: color });
      }
      // Create Feature.Properties on Layer
      addGeoJSONFeatureToLayer(layer);
      // Copy Properties from GeoJSON
      layer.feature.properties.fromGeoJSON(feat);
      calcLayerLength(layer);
      addPopupAndTooltip(layer);
      this.drawLayer.addLayer(layer);
      this.initGeojsonFeature(layer);
    });
  }

  private drawToGeojson(): GeoJSON.FeatureCollection {
    const data = <GeoJSON.FeatureCollection>(this.drawLayer.toGeoJSON());
    // XXX: Terrible hack to add colors to LineStrings.
    let i = 0;
    this.drawLayer.eachLayer(layer => {
      // @ts-ignore
      data.features[i].style = {
        // @ts-ignore
        color: layer.options.color,
      };
      ++i;
    });
    return data;
  }

  toggleDraw() {
    Settings.getInstance().drawControlsShown = !Settings.getInstance().drawControlsShown;
    this.updateDrawControlsVisibility();
  }

  updateDrawControlsVisibility() {
    if (Settings.getInstance().drawControlsShown)
      this.drawControl.addTo(this.map.m);
    else
      this.drawControl.remove();
  }

  drawImport() {
    const input = <HTMLInputElement>(document.getElementById('fileinput'));
    input.click();
  }

  private async drawImportCb() {
    const input = <HTMLInputElement>(document.getElementById('fileinput'));
    if (!input.files!.length)
      return;
    try {
      const rawData = await (new Response(input.files![0])).json();
      const version: number | undefined = rawData.OBJMAP_SV_VERSION;
      if (!version) {
        this.drawFromGeojson(rawData);
      } else {
        const data = <save.SaveData>(rawData);
        this.drawFromGeojson(data.drawData);
        if (version >= 2) {
          data.searchGroups.forEach(g => {
            this.searchAddGroup(g.query, g.label, g.enabled);
          });
          data.searchExcludeSets.forEach(g => {
            this.searchAddExcludedSet(g.query, g.label);
          });
        }
      }
    } catch (e) {
      alert(e);
    } finally {
      input.value = '';
    }
  }

  drawExport() {
    const data: save.SaveData = {
      OBJMAP_SV_VERSION: save.CURRENT_OBJMAP_SV_VERSION,
      drawData: this.drawToGeojson(),
      searchGroups: this.searchGroups.map(g => ({
        label: g.label,
        query: g.query,
        enabled: g.enabled,
      })),
      searchExcludeSets: this.searchExcludedSets.filter(g => !g.hidden).map(g => ({
        label: g.label,
        query: g.query,
      })),
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'objmap_save.json';
    a.click();
  }

  drawOnColorChange() {
    this.drawControl.setDrawingOptions({
      polyline: {
        shapeOptions: {
          color: this.drawLineColor,
          opacity: 1.0,
        },
      },
    });
  }

  showGreatPlateauBarrier() {
    if (!this.greatPlateauBarrierShown) {
      const RESPAWN_POS: Point = [-1021.7286376953125, 1792.6009521484375];
      const respawnPosMarker = new MapMarkers.MapMarkerPlateauRespawnPos(this.map, RESPAWN_POS);
      const topLeft = this.map.fromXZ([-1600, 1400]);
      const bottomRight = this.map.fromXZ([-350, 2400]);
      const rect = L.rectangle(L.latLngBounds(topLeft, bottomRight), {
        fill: false,
        stroke: true,
        color: '#c50000',
        weight: 2,
        // @ts-ignore
        contextmenu: true,
        contextmenuItems: [{
          text: 'Hide barrier and respawn point',
          callback: () => {
            respawnPosMarker.getMarker().remove();
            rect.remove();
            this.greatPlateauBarrierShown = false;
          },
        }],
      });
      rect.addTo(this.map.m);
      respawnPosMarker.getMarker().addTo(this.map.m);
      this.greatPlateauBarrierShown = true;
    }
    this.map.setView([-965, 1875], 5);
  }

  gotoOnSubmit(xz: Point) {
    this.map.setView(xz);
    if (this.previousGotoMarker)
      this.previousGotoMarker.remove();
    this.previousGotoMarker = L.marker(this.map.fromXZ(xz), {
      // @ts-ignore
      contextmenu: true,
      contextmenuItems: [{
        text: 'Hide',
        callback: () => { this.previousGotoMarker!.remove(); this.previousGotoMarker = null; },
      }],
    }).addTo(this.map.m);
  }

  initMarkerDetails() {
    this.map.registerMarkerSelectedCb((marker: MapMarker) => {
      this.openMarkerDetails(getMarkerDetailsComponent(marker), marker);
    });
    this.map.m.on({ 'click': () => this.closeMarkerDetails() });
  }

  openMarkerDetails(component: string, marker: MapMarker, zoom = -1) {
    this.closeMarkerDetails(true);
    this.detailsMarker = new ui.Unobservable(marker);
    this.detailsComponent = component;
    this.switchPane('spane-details');
    this.detailsPaneOpened = true;
    this.detailsPinMarker = new ui.Unobservable(L.marker(marker.getMarker().getLatLng(), {
      pane: 'front',
    }).addTo(this.map.m));
    if (zoom == -1)
      this.map.m.panTo(marker.getMarker().getLatLng());
    else
      this.map.m.setView(marker.getMarker().getLatLng(), zoom);
  }

  closeMarkerDetails(forOpen = false) {
    if (!this.detailsPaneOpened)
      return;
    this.detailsComponent = '';
    this.detailsMarker = null;
    if (!forOpen) {
      this.sidebar.close();
    }
    if (this.detailsPinMarker) {
      this.detailsPinMarker.data.remove();
      this.detailsPinMarker = null;
    }
    this.detailsPaneOpened = false;
  }

  initSearch() {
    this.searchThrottler = debounce(() => this.search(), 200);

    this.map.registerZoomCb(() => {
      for (const group of this.searchGroups)
        group.update(0, this.searchExcludedSets);
    });
  }

  searchGetQuery() {
    let query = this.searchQuery;
    if (/^0x[0-9A-Fa-f]{6}/g.test(query))
      query = parseInt(query, 16).toString(10);
    return query;
  }

  searchJumpToResult(idx: number) {
    const marker = this.searchResultMarkers[idx];
    this.openMarkerDetails(getMarkerDetailsComponent(marker.data), marker.data, 6);
  }

  searchOnInput() {
    this.searching = true;
    this.searchThrottler();
  }

  searchOnAdd() {
    this.searchAddGroup(this.searchGetQuery());
    this.searchQuery = '';
    this.search();
  }

  searchOnExclude() {
    this.searchAddExcludedSet(this.searchGetQuery());
    this.searchQuery = '';
    this.search();
  }

  async searchAddExcludedSet(query: string, label?: string) {
    if (this.searchExcludedSets.some(g => !!g.query && g.query == query))
      return;

    const set = new SearchExcludeSet(query, query);
    this.searchExcludedSets.push(set);
    await set.init();
    for (const group of this.searchGroups)
      group.update(SearchResultUpdateMode.UpdateVisibility, this.searchExcludedSets);
  }

  async searchAddGroup(query: string, label?: string, enabled = true) {
    if (this.searchGroups.some(g => !!g.query && g.query == query))
      return;

    const group = new SearchResultGroup(query, label || query, enabled);
    await group.init(this.map);
    group.update(SearchResultUpdateMode.UpdateStyle | SearchResultUpdateMode.UpdateVisibility, this.searchExcludedSets);
    this.searchGroups.push(group);
  }

  searchToggleGroupEnabledStatus(idx: number) {
    const group = this.searchGroups[idx];
    group.update(SearchResultUpdateMode.UpdateVisibility, this.searchExcludedSets);
  }

  searchViewGroup(idx: number) {
    const group = this.searchGroups[idx];
    this.searchQuery = group.query;
    this.search();
  }

  searchRemoveGroup(idx: number) {
    const group = this.searchGroups[idx];
    group.remove();
    this.searchGroups.splice(idx, 1);
  }

  searchRemoveExcludeSet(idx: number) {
    this.searchExcludedSets.splice(idx, 1);
    for (const group of this.searchGroups)
      group.update(SearchResultUpdateMode.UpdateVisibility, this.searchExcludedSets);
  }

  async search() {
    this.searching = true;
    this.searchResultMarkers.forEach(m => m.data.getMarker().remove());
    this.searchResultMarkers = [];

    const query = this.searchGetQuery();
    try {
      this.searchResults = await MapMgr.getInstance().getObjs(this.settings!.mapType, this.settings!.mapName, query, false, this.MAX_SEARCH_RESULT_COUNT);
      this.searchLastSearchFailed = false;
    } catch (e) {
      this.searchResults = [];
      this.searchLastSearchFailed = true;
    }

    for (const result of this.searchResults) {
      const marker = new ui.Unobservable(new MapMarkers.MapMarkerSearchResult(this.map, result));
      this.searchResultMarkers.push(marker);
      marker.data.getMarker().addTo(this.map.m);
    }

    this.searching = false;
  }

  initContextMenu() {
    this.map.m.on(SHOW_ALL_OBJS_FOR_MAP_UNIT_EVENT, (e) => {
      let mapType = Settings.getInstance().mapType;
      if (mapType !== 'MainField' && mapType !== 'AocField') {
        this.searchAddGroup(`map:"${mapType}/${Settings.getInstance().mapName}"`);
        return;
      }

      // @ts-ignore
      const latlng: L.LatLng = e.latlng;
      const xz = this.map.toXZ(latlng);
      if (!map.isValidPoint(xz))
        return;
      this.searchAddGroup(`map:"${mapType}/${map.pointToMapUnit(xz)}"`);
    });
  }

  initEvents() {
    this.$on('AppMap:switch-pane', (pane: string) => {
      this.switchPane(pane);
    });

    this.$on('AppMap:open-obj', async (obj: ObjectData) => {
      if (this.tempObjMarker)
        this.tempObjMarker.data.getMarker().remove();
      this.tempObjMarker = new ui.Unobservable(new MapMarkers.MapMarkerObj(this.map, obj, '#e02500', '#ff2a00'));
      this.tempObjMarker.data.getMarker().addTo(this.map.m);
      this.openMarkerDetails(getMarkerDetailsComponent(this.tempObjMarker.data), this.tempObjMarker.data);
    });

    this.map.m.on('click', () => {
      if (this.tempObjMarker)
        this.tempObjMarker.data.getMarker().remove();
    });

    this.$on('AppMap:show-gen-group', async (id: ObjectIdentifier) => {
      const group = new SearchResultGroup('', `Generation group for ${id.mapType}/${id.mapName}:${id.hashId}`);
      await group.init(this.map);
      const objs = await MapMgr.getInstance().getObjGenGroup(id.mapType, id.mapName, id.hashId);
      group.setObjects(this.map, objs);
      group.update(SearchResultUpdateMode.UpdateStyle | SearchResultUpdateMode.UpdateVisibility, this.searchExcludedSets);
      this.searchGroups.push(group);
    });
    this.map.m.on('AppMap:show-gen-group', (args) => {
      this.$emit('AppMap:show-gen-group', args);
    });
  }

  initSettings() {
    this.hardModeExcludeSet = new SearchExcludeSet('hard:1', '', true);
    this.lastBossExcludeSet = new SearchExcludeSet('lastboss:0', '', true);
    this.ohoExcludeSet = new SearchExcludeSet('onehit:1', '', true);
    Promise.all([this.hardModeExcludeSet.init(), this.lastBossExcludeSet.init(), this.ohoExcludeSet.init()]).then(() => {
      for (const group of this.searchGroups)
        group.update(SearchResultUpdateMode.UpdateVisibility, this.searchExcludedSets);
    });

    this.reloadSettings();
    Settings.getInstance().registerCallback(() => this.reloadSettings());
  }

  private reloadSettings() {
    this.searchExcludedSets = this.searchExcludedSets.filter(set =>
      set != this.hardModeExcludeSet && set != this.lastBossExcludeSet && set != this.ohoExcludeSet);

    if (!Settings.getInstance().hardMode)
      this.searchExcludedSets.push(this.hardModeExcludeSet);
    if (Settings.getInstance().lastBossMode)
      this.searchExcludedSets.push(this.lastBossExcludeSet);
    if (!Settings.getInstance().ohoMode)
      this.searchExcludedSets.push(this.ohoExcludeSet);

    for (const group of this.searchGroups)
      group.update(SearchResultUpdateMode.UpdateVisibility | SearchResultUpdateMode.UpdateStyle | SearchResultUpdateMode.UpdateTitle, this.searchExcludedSets);

    this.searchResultMarkers.forEach(m => m.data.updateTitle());
  }

  initAreaMap() {
    this.areaMapLayer.data.addTo(this.map.m);
  }

  async loadAreaMap(name: string) {
    this.areaMapLayer.data.clearLayers();
    this.areaMapLayersByData.data.clear();
    if (!name)
      return;

    const areas = await MapMgr.getInstance().fetchAreaMap(name);
    const entries = Object.entries(areas);
    let i = 0;
    for (const [data, features] of entries) {
      const layers: L.GeoJSON[] = features.map((feature) => {
        return L.geoJSON(feature, {
          style: function(_) {
            return { weight: 2, fillOpacity: 0.2, color: ui.genColor(entries.length, i) };
          },
          // @ts-ignore
          contextmenu: true,
        });
      });
      this.areaMapLayersByData.data.set(data, layers);
      for (const layer of layers) {
        layer.bindTooltip('Area ' + data.toString());
        layer.on('mouseover', () => {
          layers.forEach(l => {
            l.setStyle({ weight: 4, fillOpacity: 0.3 });
          });
        });
        layer.on('mouseout', () => {
          layers.forEach(l => l.setStyle({ weight: 2, fillOpacity: 0.2 }));
        });
      }
      ++i;
    }
    this.updateAreaMapVisibility();
  }

  updateAreaMapVisibility() {
    const hasWhitelist = !!this.areaWhitelist;
    const shown = this.areaWhitelist.trim().split(',').map(s => s.trim());
    this.areaMapLayer.data.clearLayers();
    for (const [data, layers] of this.areaMapLayersByData.data.entries()) {
      if (!hasWhitelist || shown.includes(data))
        layers.forEach(l => this.areaMapLayer.data.addLayer(l));
    }
  }

  onShownAreaMapChanged() {
    this.$nextTick(() => this.loadAreaMap(this.shownAreaMap));
  }
  async initMapSafeAreas() {
    const areas = await MapMgr.getInstance().fetchAreaMap("AutoSafe");
    let layers: L.Path[] = ui.areaMapToLayers(areas);
    layers.forEach(l => this.mapSafeAreas.data.addLayer(l));
  }

  initMapUnitGrid() {
    for (let i = 0; i < 10; ++i) {
      for (let j = 0; j < 8; ++j) {
        const topLeft: Point = [-5000.0 + i * 1000.0, -4000.0 + j * 1000.0];
        const bottomRight: Point = [-5000.0 + (i + 1) * 1000.0, -4000.0 + (j + 1) * 1000.0];
        const rect = L.rectangle(L.latLngBounds(this.map.fromXZ(topLeft), this.map.fromXZ(bottomRight)), {
          fill: true,
          stroke: true,
          color: '#009dff',
          fillOpacity: 0.13,
          weight: 2,
          // @ts-ignore
          contextmenu: true,
        });
        rect.bringToBack();
        rect.bindTooltip(map.pointToMapUnit(topLeft), {
          permanent: true,
          direction: 'center',
        });
        this.mapUnitGrid.data.addLayer(rect);
      }
    }
  }

  onShowMapUnitGridChanged() {
    this.$nextTick(() => {
      this.mapUnitGrid.data.remove();
      if (this.showMapUnitGrid)
        this.mapUnitGrid.data.addTo(this.map.m);
    });
  }

  onShowSafeAreas() {
    this.$nextTick(() => {
      this.mapSafeAreas.data.remove();
      if (this.showSafeAreas) {
        if (this.mapSafeAreas.data.getLayers().length <= 0) {
          this.initMapSafeAreas();
        }
        this.mapSafeAreas.data.addTo(this.map.m);
      }
    });
  }

  created() {
    this.settings = Settings.getInstance();
  }

  mounted() {
    this.map = new MapBase('lmap');
    this.map.registerZoomChangeCb((zoom) => this.zoom = zoom);
    this.initMapRouteIntegration();
    this.initMarkers();
    this.initAreaMap();
    this.initMapUnitGrid();
    this.initSidebar();
    this.initDrawTools();
    this.initMarkerDetails();
    this.initSearch();
    this.initContextMenu();
    this.initEvents();
    this.initSettings();

    if (this.$route.query.q) {
      this.searchQuery = this.$route.query.q.toString();
      this.search();
      this.switchPane('spane-search');
    }

    if (this.$route.query.id) {
      // format: MapType,MapName,HashId
      const [mapType, mapName, hashId] = this.$route.query.id.toString().split(',');
      MapMgr.getInstance().getObj(mapType, mapName, parseInt(hashId, 0)).then((obj) => {
        if (obj)
          this.$emit('AppMap:open-obj', obj);
      });
    }
  }

  beforeDestroy() {
    this.map.m.remove();
  }

  beforeRouteUpdate(to: any, from: any, next: any) {
    if (!this.updatingRoute)
      this.setViewFromRoute(to);
    next();
  }
}
