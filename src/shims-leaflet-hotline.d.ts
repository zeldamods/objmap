declare module 'leaflet-hotline' {
  import * as L from 'leaflet';
  export default function leafletHotline(leaflet: typeof L): typeof L;
}
