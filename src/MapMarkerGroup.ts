import * as L from 'leaflet';
import { MapMarker } from '@/MapMarker';
import { makeClusterGroup } from '@/util/leaflet_cluster';

export class MapMarkerGroup {
  public markerGroup: L.MarkerClusterGroup;
  private markers: MapMarker[] = [];
  private shownMarkers: boolean[] = [];
  private enableUpdates: boolean;
  private isInitialUpdate: boolean = true;

  constructor(markers: MapMarker[], preloadPad: number = 1, enableUpdates = true) {
    this.markerGroup = makeClusterGroup(preloadPad);
    this.markers = markers;
    this.enableUpdates = enableUpdates;
  }

  destroy() {
    this.markerGroup.remove();
    this.markerGroup.clearLayers();
    this.markers = [];
    this.shownMarkers = [];
  }

  addToMap(map: L.Map) { this.markerGroup.addTo(map); }
  removeFromMap(map: L.Map) { this.markerGroup.removeFrom(map); }
  showOnMap(map: L.Map, doShow: boolean) {
    if (doShow)
      this.addToMap(map);
    else
      this.removeFromMap(map);
  }

  update() {
    if (!this.enableUpdates && !this.isInitialUpdate)
      return;

    const addMarkers: Array<L.Layer> = [];
    const remMarkers: Array<L.Layer> = [];

    for (const [i, marker] of this.markers.entries()) {
      const shouldShow = marker.shouldBeShown();
      if (shouldShow == this.shownMarkers[i])
        continue;
      if (shouldShow)
        addMarkers.push(marker.getMarker());
      else
        remMarkers.push(marker.getMarker());
      this.shownMarkers[i] = shouldShow;
    }

    this.markerGroup.removeLayers(remMarkers);
    this.markerGroup.addLayers(addMarkers);
    this.isInitialUpdate = false;
  }
}
