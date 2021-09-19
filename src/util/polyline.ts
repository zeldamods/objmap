import * as L from 'leaflet';


function pointDist(a: L.LatLng, b: L.LatLng): number {
  let dx = a.lng - b.lng;
  let dy = a.lat - b.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointArrayLength(p: L.LatLng[] | L.LatLng[][] | L.LatLng[][][]): number {
  let dist = 0.0;
  if (p.length == 0) {
    return dist;
  }
  if (p[0] instanceof L.LatLng) {
    for (let i = 1; i < p.length; i++) {
      dist += pointDist(p[i - 1] as L.LatLng, p[i] as L.LatLng);
    }
    return dist;
  }
  for (let i = 0; i < p.length; i++) {
    dist += pointArrayLength(p[i] as L.LatLng[] | L.LatLng[][]);
  }
  return dist;
}

function polyLineLength(layer: L.Polyline) {
  return pointArrayLength(layer.getLatLngs());
}

export function calcLayerLength(layer: L.Marker | L.Polyline) {
  if (!layer.feature) {
    return;
  }
  if (layer instanceof L.Polyline) {
    layer.feature.properties.pathLength = polyLineLength(layer);
  } else {
    layer.feature.properties.length = 0;
  }
  // Tell Popup the length parameter
  let z: any = layer;
  if (z.popup) {
    z.popup.pathLength = layer.feature.properties.pathLength;
  }
}
