<template>
<div class="flex-fill" :class="'zoom-level-'+zoom">
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
        <li :class="{active: drawControlEnabled}"><a href="#spane-dummy" role="tab" @click.prevent="toggleDraw()"><i class="fa fa-draw-polygon"></i></a></li>
        <li><a href="#spane-tools" role="tab"><i class="fa fa-tools"></i></a></li>
        <li><a href="#spane-settings" role="tab"><i class="fa fa-cog"></i></a></li>
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
        </p>
        <p>For more information on the last 4 columns, please read <a href="https://zeldamods.org/wiki/Difficulty_scaling">the article on <i>difficulty scaling</i></a>.</p>

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
              <b-dropdown size="sm" variant="link" text="Presets">
                <b-dd-item v-for="preset in searchPresets" :key="preset.label" @click="searchAddGroup(preset.query, preset.label)">{{preset.label}}</b-dd-item>
              </b-dropdown>
            </div>
          </div>

          <section class="search-groups" v-show="searchGroups.length || searchExcludedSets.length">
            <div class="search-group" v-for="(group, idx) in searchGroups" :key="'searchgroup' + idx">
              {{group.label}} <a @click="searchRemoveGroup(idx)"><i class="text-danger fa fa-times"></i></a>&nbsp;<a style="font-size: 90%" @click="searchViewGroup(idx)"><i class="fa fa-edit"></i></a> ({{group.size()}})
            </div>
            <div class="search-group" v-for="(set, idx) in searchExcludedSets" :key="'searchexclude' + idx">
              [Hidden] {{set.label}} <a @click="searchRemoveExcludeSet(idx)"><i class="text-danger fa fa-times"></i></a> ({{set.size()}})
            </div>
          </section>

          <section class="search-results">
            <p class="text-center mb-3 h5" v-show="searchQuery && !searching && !searchResults.length">No results.</p>
            <p class="text-center" v-show="!searching && searchLastSearchFailed">Could not understand search query.</p>

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
      </div>

      <div class="leaflet-sidebar-pane" id="spane-tools">
        <h1 class="leaflet-sidebar-header">Tools</h1>
        <b-button size="sm" variant="secondary" block @click="closeSidebar(); $refs.modalGoto.show()">Go to coordinates...</b-button>
        <hr>
        <p><b-button size="sm" variant="secondary" block @click="closeSidebar(); showGreatPlateauBarrier()">Show Great Plateau barrier</b-button></p>
        <p>The Great Plateau barrier prevents Link from leaving the Great Plateau before he has acquired the paraglider. For more information, read the <a href="https://zeldamods.org/wiki/The_Great_Plateau_barrier">article</a>.</p>
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
.leaflet-container {
  background: black !important;
  box-shadow: 0 0 50px 10px black;
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
</style>
