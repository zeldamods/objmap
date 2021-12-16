
import * as L from 'leaflet';

/// Wrapper class for objects that should not be observed by Vue.
export class Unobservable<T> {
  public readonly data: T;
  constructor(data: T) {
    this.data = data;
    Object.freeze(this);
  }
}

export type LeafletContextMenuCbArg = { latlng: L.LatLng };

export function copyToClipboard(text: string) {
  let textarea = document.createElement("textarea");
  textarea.textContent = text;
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (ex) {
    // *shrug*
  } finally {
    document.body.removeChild(textarea);
  }
}

export function genColor(numOfSteps: number, step: number) {
  // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
  // Adam Cole, 2011-Sept-14
  // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  var r, g, b;
  var h = step / numOfSteps;
  var i = ~~(h * 6);
  var f = h * 6 - i;
  var q = 1 - f;
  switch (i % 6) {
    case 0: r = 1; g = f; b = 0; break;
    case 1: r = q; g = 1; b = 0; break;
    case 2: r = 0; g = 1; b = f; break;
    case 3: r = 0; g = q; b = 1; break;
    case 4: r = f; g = 0; b = 1; break;
    case 5: r = 1; g = 0; b = q; break;
  }
  // @ts-ignore
  return "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
}

export function shadeColor(color: string, percent: number) {
  // from https://stackoverflow.com/questions/5560248
  const num = parseInt(color.slice(1), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function areaTooltip(area: any): string {
  let auto_areas = ['Fish', 'Bird', 'Insect', 'Animal', 'Enemy', 'Material'];
  if (area.type == "Safe") {
    return "Safe Area";
  } else if (auto_areas.includes(area.type)) {
    let parts = area.items.map((item: any) => `- ${item.real_name}: ${item.num}`).join("<br/>");
    return [`Auto ${area.type}`, parts, `<small>Field Map Area ${area.field_map_area}</small>`].join("<br/>");
  }
  return 'Area';
}

export function areaMapToLayers(areas: any): L.Path[] {
  const nentries = Object.entries(areas).length;
  let layers: L.Path[] = Object.values(areas).map((feature: any, i) => {
    let layer: L.Circle | L.Polygon = toShape(feature.shape, feature.loc, feature.scale, feature.rotate);
    let color = feature.color || genColor(nentries, i);
    layer.setStyle({
      color: color,
      fillOpacity: 0.2,
      weight: 2,
      // @ts-ignore
      contextmenu: true,
    });
    layerHover(layer, areaTooltip(feature));
    return layer;
  });
  return layers;
}


export function layerHover(layer: L.Path, data: string) {
  layer.bindTooltip(data);
  layer.on('mouseover', () => {
    layer.setStyle({ weight: 4, fillOpacity: 0.3 });
  });
  layer.on('mouseout', () => {
    layer.setStyle({ weight: 2, fillOpacity: 0.2 });
  });
}

//
// Functions for creating Leaflet objects
//
function yrotate(p: [number, number], angle: number): [number, number] {
  let ang = angle * Math.PI / 180.0;
  let x = p[0];
  let y = p[1];
  let ca = Math.cos(ang);
  let sa = Math.sin(ang);
  return [x * ca - y * sa, x * sa + y * ca];
}

export function cylinder(loc: number[], scale: number[], rotate: number[]): L.Circle | L.Polygon {
  return capsule(loc, scale, rotate);
}

export function circle(loc: number[], scale: number[], rotate: number[]): L.Circle {
  let x0 = loc[0];
  let z0 = loc[2];
  let sx = scale[0];
  return L.circle(L.latLng(z0, x0), { radius: sx });
}

export function capsule(loc: number[], scale: number[], rotate: number[]): L.Circle | L.Polygon {
  if (Math.abs(rotate[0] - Math.PI / 2) < 0.01) { // 
    scale = [scale[1] + scale[2], scale[1], scale[2]];
    return rectangle(loc, scale, [0, 0, 0]);
  } else {
    return circle(loc, scale, rotate);
  }
}

export function rectangle(loc: number[], scale: number[], rotate: number[]): L.Polygon {
  let x0 = loc[0];
  //let y0 = loc[1];
  let z0 = loc[2];
  let sx = scale[0];
  //let sy = scale[1];
  let sz = scale[2];
  // Rotate around the y axis (clockwise);
  let angle = -rotate[1];
  let pts: [number, number][] = [
    [-sx, -sz],
    [+sx, -sz],
    [+sx, +sz],
    [-sx, +sz],
  ];
  pts = pts
    .map(p => yrotate(p, angle))
    .map(p => [x0 + p[0], z0 + p[1]]);
  let latlng = pts.map(p => L.latLng(p[1], p[0]));
  return L.polygon(latlng);
}

export function toShape(shape: string, loc: number[], scale: number[], rotate: number[]): L.Circle | L.Polygon {
  if (shape == "Circle") {
    return circle(loc, scale, rotate);
  } else if (shape == "Sphere") {
    return circle(loc, scale, rotate);
  } else if (shape == "Cylinder") {
    return cylinder(loc, scale, rotate);
  } else if (shape == "Capsule") {
    return capsule(loc, scale, rotate);
  } else if (shape == "Box") {
    return rectangle(loc, scale, rotate);
  } else if (shape == "Hull") {
    //return null;
  }
  return circle(loc, scale, rotate);
}


export function svgIcon(fill: string): L.DivIcon {
  let stroke: string = shadeColor(fill, -10) as string;
  // Note: Attach styles directly to paths, as styles within <style></style> are overwritten by new SVG Icons
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30" height="40" viewBox="0 0 50.29 81.47">
    <defs>
      <linearGradient id="linear-gradient" x1="281.94" y1="307.83" x2="281.94" y2="383.66" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff" stop-opacity="0.2"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
    <g id="bg"><path fill="${fill}" d="M282.11,383.48s19.55-37,21-41.5c14.34-45.08-56.28-44.9-42.58-.1C262.09,347.07,282.11,383.48,282.11,383.48Z" transform="translate(-256.73 -306.23)"/></g>
    <g id="grad"><path fill="url(#linear-gradient)" d="M282.11,383.48s19.55-37,21-41.5c14.34-45.08-56.28-44.9-42.58-.1C262.09,347.07,282.11,383.48,282.11,383.48Z" transform="translate(-256.73 -306.23)"/></g>
    <g id="outWhiteBorder"><path stroke-miterlimit="10" fill="none" stroke="#fff" stroke-opacity="0.15" stroke-width="5px" d="M282.11,383.48s19.55-37,21-41.5c14.34-45.08-56.28-44.9-42.58-.1C262.09,347.07,282.11,383.48,282.11,383.48Z" transform="translate(-256.73 -306.23)"/></g>
    <g id="outBorder"><path fill="none" stroke-miterlimit="10" stroke="${stroke}" stroke-width="2px" d="M282.11,383.48s19.55-37,21-41.5c14.34-45.08-56.28-44.9-42.58-.1C262.09,347.07,282.11,383.48,282.11,383.48Z" transform="translate(-256.73 -306.23)"/></g>
    <g id="inWhiteBorder"><circle class="cls-3" cx="25.27" cy="24.83" r="9.15"/></g>
    <g id="inBorder"><circle fill="#fff" stroke="${stroke}" stroke-width="2px" cx="25.27" cy="24.83" r="9.15"/></g>
  </svg>
`;
  const svgIcon = L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [12, 40],
  });
  return svgIcon;
}

export enum LeafletType {
  Rectangle,
  Polygon,
  Polyline,
  Circle,
  CircleMarker,
  Marker,
  Path,
  Layer,
}

// https://leafletjs.com/examples/extending/class-diagram.html
// https://stackoverflow.com/a/56987060
export function leafletType(layer: L.Layer): LeafletType {
  if (layer instanceof L.Rectangle) {
    return LeafletType.Rectangle;
  } else if (layer instanceof L.Polygon) {
    return LeafletType.Polygon;
  } else if (layer instanceof L.Polyline) {
    return LeafletType.Polyline;
  } else if (layer instanceof L.Circle) {
    return LeafletType.Circle;
  } else if (layer instanceof L.CircleMarker) {
    return LeafletType.CircleMarker;
  } else if (layer instanceof L.Marker) {
    return LeafletType.Marker;
  } else if (layer instanceof L.Path) {
    return LeafletType.Path;
  }
  return LeafletType.Layer;
}
