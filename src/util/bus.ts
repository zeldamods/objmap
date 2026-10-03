import mitt, { Handler } from 'mitt';

import { ObjectData } from '@/services/MapMgr';

export interface ObjectIdentifier {
  mapType: string;
  mapName: string;
  hashId: number;
}

type AppMapEvents = {
  'AppMap:switch-pane': string;
  'AppMap:toggle-y-values': undefined;
  'AppMap:toggle-xz-values': undefined;
  'AppMap:open-obj': ObjectData;
  'AppMap:show-gen-group': ObjectIdentifier;
};

type AppMapHandlers = { [K in keyof AppMapEvents]?: Handler<AppMapEvents[K]> };

export const appMapBus = mitt<AppMapEvents>();

export function onAppMapEvents(handlers: AppMapHandlers): () => void {
  const types = Object.keys(handlers) as Array<keyof AppMapEvents>;
  for (const type of types)
    appMapBus.on(type, handlers[type] as Handler<any>);
  return () => {
    for (const type of types)
      appMapBus.off(type, handlers[type] as Handler<any>);
  };
}
