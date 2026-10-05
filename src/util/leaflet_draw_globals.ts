// leaflet-draw 1.0.4 assigns to the undeclared globals `type` and `radius`, which throws once
// bundled into strict-mode modules unless the globals already exist.
Object.assign(globalThis, { type: undefined, radius: undefined });
