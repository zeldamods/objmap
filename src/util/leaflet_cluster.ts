import L from 'leaflet';
import 'leaflet.markercluster';

/// Returns a MarkerClusterGroup whose main purpose is to cull invisible objects.
export function makeClusterGroup(pad: number = 1, disableCluster = true): L.MarkerClusterGroup {
  const cg = L.markerClusterGroup({
    disableClusteringAtZoom: disableCluster ? -10 : 6,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    removeOutsideVisibleBounds: true,
    spiderfyOnMaxZoom: false,
    chunkedLoading: true,
    // @ts-ignore
    chunkInterval: 0,
  });
  // Override _getExpandedVisibleBounds to reduce the number of rendered markers for better perf.
  // @ts-ignore
  cg._getExpandedVisibleBounds = function () {
    // @ts-ignore
    return this._checkBoundsMaxLat(this._map.getBounds().pad(pad));
  };
  return cg;
}
