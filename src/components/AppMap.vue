<template>
<div class="flex-fill" :class="'zoom-level-'+zoom">
  <div class="banner" v-show="!settings.decompBannerHidden">
    Help us understand the BotW engine! <a href="https://github.com/zeldaret/botw" target="_blank">Contribute to the decompilation project now</a>

    <button type="button" aria-label="Close" class="close" @click="settings.decompBannerHidden = true">×</button>
  </div>

  <div id="lmap" class="h-100"></div>

  <ModalGotoCoords ref="modalGoto" @submitted="gotoOnSubmit"/>

  <div id="sidebar" class="leaflet-sidebar collapsed">
    <div class="leaflet-sidebar-tabs">
      <ul role="tablist">
        <li class="d-none"><a href="#spane-details" role="tab"><i class="fa fa-map-marker-alt"></i></a></li>
        <li class="d-none"><a href="#spane-search-help" role="tab"></a></li>
        <li><a href="#spane-search" role="tab"><i class="fa fa-search"></i></a></li>
        <li><a href="#spane-filter" role="tab"><i class="fa fa-filter"></i></a></li>
        <li class="disabled"><a href="#spane-dummy" role="tab"><i class="fa fa-tasks"></i></a></li>
        <li><a href="#spane-draw" role="tab"><i class="fa fa-draw-polygon"></i></a></li>
        <li><a href="#spane-tools" role="tab"><i class="fa fa-tools"></i></a></li>
        <li><a href="#spane-settings" role="tab"><i class="fa fa-cog"></i></a></li>
      </ul>
      <ul role="tablist">
        <li @click.capture.prevent.stop="toggleHylianMode()"><a href="#dummy" v-b-tooltip.hover.right title="Yahaha! You found me!"><i class="fas fa-seedling"></i></a></li>
        <li v-show="settings.left" @click.capture.prevent.stop="toggleSidebarSide()"><a href="#toggle-sidebar-side" v-b-tooltip.hover.right title="Move to the right side"><i class="far fa-caret-square-right"></i></a></li>
        <li v-show="!settings.left" @click.capture.prevent.stop="toggleSidebarSide()"><a href="#toggle-sidebar-side" v-b-tooltip.hover.left title="Move to the left side"><i class="far fa-caret-square-left"></i></a></li>
      </ul>
    </div>
    <div class="leaflet-sidebar-content" id="sidebar-content">

      <div class="leaflet-sidebar-pane" id="spane-search-help">
        <h1 class="leaflet-sidebar-header">Help</h1>

        <h4 class="subsection-heading">Basic search</h4>
        <p>
          Type what you are looking for in the search box. Examples:<br>
          <code>Bokoblin</code><br>
          <code>"Blue Bokoblin"</code> (use quotes for exact phrases)<br>
          <code>"Soldier's Bow"</code> (' must be quoted)<br>
          <code>Lizalfos "Royal Bow"</code> for Lizalfos <i>with</i> Royal Bows
        </p>

        <p>Internal actor names (e.g. Enemy_Bokoblin_Middle) also work.</p>

        <h4 class="subsection-heading">Column filters</h4>
        <p>Column filters allow you to search for particular attributes.<br>
          Syntax: <code>COLUMN<b>:</b>QUERY</code><br>
          Example: <code>^Bokoblin scale:0</code></p>
        <p>Available columns:</p>
        <p>
          <code>map</code>: Map name (e.g. MainField/E-4)<br>
          <code>static</code>: 1 if the object is in a Static map unit, 0 if Dynamic<br>
          <code>actor</code>: Actor name (e.g. Weapon_Sword_001)<br>
          <code>name</code>: User visible name (e.g. Traveler's Sword)<br>
          <code>data</code>: Internal object data<br>
          <code>drop</code>: Drops or treasure chest content<br>
          <code>equip</code>: Enemy equipment<br>
          <code>onehit</code>: Appears only during the One-Hit Obliterator challenge (1 or 0)<br>
          <code>lastboss</code>: Spawns after entering Sanctum (1 or 0)<br>
          <code>hard</code>: Only spawns in Master Mode (1 or 0)<br>
          <code>no_rankup</code>: Won't rank up for Master Mode (1 or 0)<br>
          <code>scale</code>: Will scale up (1 or 0)<br>
          <code>bonus</code>: Minimum bonus modifier tier (0, 1, 2 or 3)<br>
          <code>region</code>: Tower region name (e.g. Tabantha, Lanayru, Hateno) <br>
          <code>fieldarea</code>: Field Map area (0 - 93)<br>
          <code>lotm</code>: Spawns with Lord of the Mountain (1 or 0)<br>
        </p>
        <p>For more information on columns <code>hard</code>, <code>no_rankup</code>, <code>scale</code> and <code>bonus</code>, please read <a href="https://zeldamods.org/wiki/Difficulty_scaling">the article on <i>difficulty scaling</i></a>.</p>

        <h4 class="subsection-heading">Boolean operators</h4>
        <p>
          <code>Lynel <b>OR</b> "Lynel Bow"</code> for Lynels or Lynel Bows<br>
          <code>Lynel <b>NOT</b> "Lynel Bow"</code> to exclude Lynels that have Lynel Bows<br>
          <code>Lynel <b>AND</b> "Lynel Bow"</code> for Lynels that have Lynel Bows (note: AND is optional)
        </p>

        <h4 class="subsection-heading">Special characters</h4>
        <p>
          <code><b>^</b>Bokoblin</code> to match only names with the <i>first word</i> equal to Bokoblin<br>
          <code>TBox_<b>*</b></code> for TBox_Field_Wood, TBox_Field_Iron, etc.
        </p>

        <b-btn block size="sm" variant="primary" @click="switchPane('spane-search')"><i class="fa fa-chevron-left"></i> Back</b-btn>
      </div>

      <div class="leaflet-sidebar-pane" id="spane-search">
          <div class="search-header">
            <input type="search" class="form-control search-main-input" placeholder="Search" @input="searchOnInput" v-model="searchQuery">
            <div class="d-flex justify-content-end">
              <b-btn size="sm" variant="link" @click="switchPane('spane-search-help')">Help</b-btn>
              <b-dropdown v-for="presetGroup in searchPresets" :key="presetGroup.label" size="sm" variant="link">
                <template slot="button-content"><span v-html="presetGroup.label"></span></template>
                <b-dd-item v-for="preset in presetGroup.presets" :key="preset.label" @click="searchAddGroup(preset.query, preset.label)">{{preset.label}}</b-dd-item>
              </b-dropdown>
              <b-dropdown size="sm" variant="link" text="Custom" v-if="settings && settings.customSearchPresets.length">
                <b-dd-item v-for="preset in settings.customSearchPresets" :key="preset[0]" @click="searchAddGroup(preset[1], preset[0])">{{preset[0]}}</b-dd-item>
              </b-dropdown>
            </div>
          </div>

          <p class="text-center" v-show="settings.mapType !== 'MainField'">Searching map: {{settings.mapType}} {{settings.mapName}}</p>

          <section class="search-groups" v-show="searchGroups.length || searchExcludedSets.length">
            <div class="search-group d-flex align-items-center" v-for="(group, idx) in searchGroups" :key="'searchgroup' + idx">
              <b-form-checkbox class="ml-2 d-inline-block search-enable-checkbox" v-model="group.enabled" @change="searchToggleGroupEnabledStatus(idx)"></b-form-checkbox>
              <span class="d-inline-block">
                <span>{{group.label}}</span>
                <a class="ml-2" @click="searchRemoveGroup(idx)"><i class="text-danger fa fa-times"></i></a>
                <a class="ml-2" style="font-size: 90%" v-if="group.query" @click="searchViewGroup(idx)"><i class="fa fa-edit"></i></a>
                <span class="ml-2">({{group.size()}})</span>
              </span>
            </div>
            <div class="search-group" v-for="(set, idx) in searchExcludedSets" :key="'searchexclude' + idx">
              <div v-if="!set.hidden">[Hidden] {{set.label}} <a @click="searchRemoveExcludeSet(idx)"><i class="text-danger fa fa-times"></i></a> ({{set.size()}})</div>
            </div>
          </section>

          <section class="search-results">
            <p class="text-center mb-3 h5" v-show="searchQuery && !searching && !searchResults.length">No results.</p>
            <p class="text-center" v-show="!searching && searchLastSearchFailed">Could not understand search query.</p>
            <p class="text-center" v-show="!searching && searchLastSearchFailed">Hint: If your query contains <code>'</code>, try putting the whole query in quotes (e.g. <code>"traveler's shield"</code>)</p>

            <div v-show="searchResults.length">
              <p class="text-center mb-1">
                <span v-show="this.searchResults.length >= this.MAX_SEARCH_RESULT_COUNT">Showing only the first {{MAX_SEARCH_RESULT_COUNT}} results.<br></span>
                <b-btn size="sm" variant="link" @click="searchOnAdd"><i class="fa fa-plus"></i> Add to map</b-btn>
                <b-btn size="sm" variant="link" @click="searchOnExclude"><i class="far fa-eye-slash"></i> Hide</b-btn>
              </p>
              <ObjectInfo v-for="(result, idx) in searchResults" :obj="result" :is-static="false" :key="result.objid" @click.native="searchJumpToResult(idx)" />
            </div>
          </section>
      </div>

      <div class="leaflet-sidebar-pane" id="spane-filter">
        <h1 class="leaflet-sidebar-header">Filter</h1>
        <div class="row">
          <AppMapFilterMainButton v-for="(v, type) in markerComponents" :key="type" :type="type" :label="v.filterLabel" :icon="v.filterIcon" @toggle="updateMarkers" />
        </div>
        <hr>
        <h4 class="subsection-heading">Visible map areas</h4>
        <b-radio-group stacked class="mb-4" v-model="shownAreaMap" @change="onShownAreaMapChanged">
          <b-radio value="">None</b-radio>
          <b-radio value="FieldMapArea">Field map areas</b-radio>
          <b-radio value="MapTower">Map tower areas</b-radio>
          <b-radio value="LoadBalancer">Load balancer areas</b-radio>
        </b-radio-group>
        <b-form-group label="Filter map areas" label-for="mapareafilter">
          <div class="d-flex mb-1">
            <input type="search" style="flex: 1" class="form-control form-control-sm mr-2" id="mapareafilter" placeholder="Example: 1,2,3,64" v-model="areaWhitelist">
            <b-btn size="sm" variant="primary" @click="updateAreaMapVisibility()"><i class="fa fa-filter"></i></b-btn>
          </div>
        </b-form-group>
        <b-checkbox switch v-model="showMapUnitGrid" @change="onShowMapUnitGridChanged">Show map unit grid</b-checkbox>
      </div>

      <div class="leaflet-sidebar-pane" id="spane-draw">
        <h1 class="leaflet-sidebar-header">Draw</h1>
        <b-btn size="sm" block variant="primary" @click="toggleDraw()"><i class="fa fa-draw-polygon"></i> Toggle draw controls</b-btn>
        <hr>
        <h4 class="subsection-heading">Polyline color</h4>
        <input type="color" v-model="drawLineColor" @change="drawOnColorChange"> <b-btn size="sm" variant="link" @click="drawLineColor = '#3388ff'">Reset to default</b-btn>
        <hr>
        <h4 class="subsection-heading">Data import/export</h4>
        <p>Exported data includes search groups and drawn objects.</p>
        <div class="row no-gutters">
          <div class="col mr-3">
            <b-btn size="sm" variant="secondary" block @click="drawExport()"><i class="fas fa-file-export"></i> Export</b-btn>
          </div>
          <div class="col">
            <b-btn size="sm" variant="danger" block @click="drawImport()"><i class="fas fa-file-import"></i> Import</b-btn>
            <b-form-checkbox v-model="importReplace">Replace existing data</b-form-checkbox>
          </div>
        </div>
        <input type="file" id="fileinput" accept=".json" hidden @change="drawImportCb">
      </div>

      <div class="leaflet-sidebar-pane" id="spane-tools">
        <h1 class="leaflet-sidebar-header">Tools</h1>
        <b-button size="sm" variant="secondary" block @click="closeSidebar(); $refs.modalGoto.show()">Go to coordinates...</b-button>
        <hr>
        <p><b-button size="sm" variant="secondary" block @click="closeSidebar(); showGreatPlateauBarrier()" v-b-tooltip.hover title="Right click on the Plateau to hide the barrier.">Show Great Plateau barrier</b-button></p>
        <p>The Great Plateau barrier prevents Link from leaving the Great Plateau before he has acquired the paraglider. For more information, read the <a href="https://zeldamods.org/wiki/The_Great_Plateau_barrier">article</a>.</p>

        <hr>
        <h4 class="subsection-heading">About this map</h4>
        <p>This object map is an <a href="https://github.com/zeldamods/objmap">open source project</a>. Contributions are welcome.</p>
        <p>For technical documentation about <i>Breath of the Wild</i> and mechanic breakdowns, refer to the <a href="https://zeldamods.org/">ZeldaMods wiki</a>.</p>
      </div>

      <div class="leaflet-sidebar-pane" id="spane-settings">
        <h1 class="leaflet-sidebar-header">Settings</h1>
        <AppMapSettings/>
      </div>

      <div class="leaflet-sidebar-pane" id="spane-details">
        <div class="leaflet-sidebar-close" @click="closeSidebar()"><i class="fa fa-times"></i></div>
        <h1 v-if="detailsMarker" class="location-title leaflet-sidebar-header" :title="detailsMarker.data.title"><span>{{detailsMarker.data.title}}</span></h1>
        <component v-if="detailsComponent" :is="detailsComponent" v-bind:marker="detailsMarker"></component>
      </div>

      <div class="leaflet-sidebar-pane" id="spane-dummy">
      </div>

    </div>
  </div>
</div>
</template>
<script src="./AppMap.ts"></script>
<style lang="less" src="./AppMapSidebar.less"></style>
<style lang="less">
.banner {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0%);
  z-index: 1000;
  background-color: #01151fe0;
  border: 0;
  padding: 10px 20px;
  font-family: Roboto, sans-serif;
  color: white;
  text-align: center;

  .close {
    margin-left: 20px;
    color: white;
  }
}

.leaflet-container {
  background: black !important;
  box-shadow: 0 0 50px 10px black;
}

.leaflet-container a {
  color: inherit;
}

.leaflet-edit-move, .leaflet-editing-icon {
  z-index: 2000 !important;
}

.leaflet-tooltip {
  font-family: CalamityB;
  color: white;
  background: #0000007f;
  border: none;
}

.leaflet-tooltip::before {
  border: none;
}

.map-tooltip {
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  color: #ccbb72;
  text-align: center;
  font-size: 16px;
  font-family: Roboto;
  font-weight: 500;
  text-shadow:
   -1px -1px 0 #63561f,
    1px -1px 0 #63561f,
    -1px 1px 0 #63561f,
     1px 1px 0 #63561f;
  transition: opacity 0.1s linear;
}

.map-location {
  &:extend(.map-tooltip);
  margin-top: 5px;
  color: #ccbb72;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;

  // Regions
  &.show-level-1, &.show-level-2 {
    font-size: 18px;
  }

  // MarkerType
  &.type-Water, &.type-Artifact, &.type-Timber {
    font-size: 14px;
    letter-spacing: 0.03em;
  }
  &.type-Mountain {
    font-size: 18px;
  }

  .location-marker-type {
    font-family: Sheikah;
    display: block;
    font-size: 9px;
    text-shadow: none;
    color: #c6b981;
    opacity: 0.7;
    margin-top: -4px;
  }
}

.map-marker {
  &:extend(.map-tooltip);
  color: #d8cb91;
  font-size: 13px;
  font-weight: 300;

  .zoom-level-1 &, .zoom-level-2 &, .zoom-level-3 &, .zoom-level-4 & {
    opacity: 0 !important;
  }
}

.mapicon-Dungeon {
  .zoom-level-6 &, .zoom-level-7 &, .zoom-level-8 &, .zoom-level-9 &, .zoom-level-10 & {
    filter: drop-shadow(0 0 7px #0088e88c);
  }
}

.hylian-mode {
  #sidebar, .location-title, .leaflet-tooltip, .map-tooltip {
    font-family: Sheikah !important;
  }

  .location-title {
    font-size: 20px !important;
  }

  .obj-main-info {
    font-size: 85%;
  }

  #sidebar {
    font-size: 13px;
  }

  .map-filter-main-button {
    font-size: 11px;
  }

  #sidebar .dropdown-menu {
    font-size: 12px;
  }

  .map-location {
    font-size: 80%;
  }
}
</style>
