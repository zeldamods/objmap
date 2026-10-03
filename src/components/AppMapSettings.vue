<template>
  <section>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-hard-mode" v-model="s.hardMode">
      <label class="custom-control-label" for="settings-hard-mode">Master Mode</label>
    </div>
    <p>If enabled, show Master Mode only objects and automatically rank up enemies. Note: this does not affect search.</p>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-last-boss-mode" v-model="s.lastBossMode">
      <label class="custom-control-label" for="settings-last-boss-mode">LastBoss Mode</label>
    </div>
    <p>If enabled, objects that do not spawn after entering the castle sanctum will be hidden.</p>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-oho-mode" v-model="s.ohoMode">
      <label class="custom-control-label" for="settings-oho-mode">Show One-Hit Obliterator mode actors</label>
    </div>
    <hr>

    <h4 class="subsection-heading">Map</h4>
    <select class="custom-select custom-select-sm mb-2" v-model="s.mapType" @change="resetMapName">
      <option v-for="o in optionsMapType" :key="o.value" :value="o.value">{{o.text}}</option>
    </select>
    <select class="custom-select custom-select-sm mb-2" v-model="s.mapName">
      <option v-for="o in optionsMapNameForMapType[s.mapType]" :key="o.value" :value="o.value">{{o.text}}</option>
    </select>
    This setting only affects search. Objects will be displayed using the main Hyrule map.
    <hr>

    <h4 class="subsection-heading">Object Color Mode</h4>
    <div role="radiogroup" class="mb-4">
      <div class="custom-control custom-radio custom-control-inline">
        <input type="radio" class="custom-control-input" name="settings-color-mode" id="settings-color-per-actor" value="per-actor" v-model="colorMode" @change="onColorModeChange(colorMode)">
        <label class="custom-control-label" for="settings-color-per-actor">Color by actor type</label>
      </div>
      <div class="custom-control custom-radio custom-control-inline">
        <input type="radio" class="custom-control-input" name="settings-color-mode" id="settings-color-per-group" value="per-group" v-model="colorMode" @change="onColorModeChange(colorMode)">
        <label class="custom-control-label" for="settings-color-per-group">Color by search group</label>
      </div>
    </div>
    <h4 class="subsection-heading">Object Display</h4>
    <p class="mb-1">Some changes only take effect after a reload.</p>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-actor-names" v-model="s.useActorNames">
      <label class="custom-control-label" for="settings-actor-names">Use internal actor names</label>
    </div>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-hex-hash-ids" v-model="s.useHexForHashIds">
      <label class="custom-control-label" for="settings-hex-hash-ids">Show hash IDs in hex</label>
    </div>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-tooltip-xz" @change="toggleXZ">
      <label class="custom-control-label" for="settings-tooltip-xz">Show object location in tooltips</label>
    </div>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-tooltip-y" @change="toggleY">
      <label class="custom-control-label" for="settings-tooltip-y">Show object heights in tooltips</label>
    </div>
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="settings-unload-radius" v-model="s.showUnloadRadius">
      <label class="custom-control-label" for="settings-unload-radius">Show object unload radius</label>
    </div>
    <hr>
    <section>
      <h4 class="subsection-heading">Custom Search Presets</h4>
      <div class="d-flex mb-1" v-for="(preset, idx) in s.customSearchPresets" :key="idx">
        <input placeholder="Label" style="flex: 4" class="form-control form-control-sm mr-2" v-model="s.customSearchPresets[idx][0]">
        <input placeholder="Query" style="flex: 6" class="form-control form-control-sm mr-2" v-model="s.customSearchPresets[idx][1]">
        <button type="button" class="btn btn-danger btn-sm" @click="s.customSearchPresets.splice(idx, 1)"><i class="fa fa-trash"></i></button>
      </div>
      <button type="button" class="btn btn-secondary btn-sm mt-2" @click="s.customSearchPresets.push(['', ''])"><i class="fa fa-plus"></i> Add</button>
    </section>
  </section>
</template>
<script src="./AppMapSettings.ts"></script>
