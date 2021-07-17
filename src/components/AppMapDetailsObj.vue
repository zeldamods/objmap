<template>
  <div>
    <div v-if="staticData.history.length" style="right: 40px" class="leaflet-sidebar-close" @click="goBack()" v-b-tooltip.hover title="Go back to previous object"><i class="fa fa-arrow-left"></i></div>

    <h2 class="location-sub" v-if="getLocationSub()">{{getLocationSub()}}</h2>
    <ObjectInfo :obj="minObj" :key="minObj.objid" className="obj-main-info" withPermalink />

    <section v-if="obj" class="mt-2">
      <section v-if="isActuallyRankedUp(obj)">Actor: {{getRankedUpActorNameForObj(obj)}} (ranked up)</section>
      <section v-if="!isActuallyRankedUp(obj)">Actor: {{obj.data.UnitConfigName}}</section>
      <section>Position: {{obj.data.Translate[0].toFixed(2)}}, {{obj.data.Translate[1].toFixed(2)}}, {{obj.data.Translate[2].toFixed(2)}}</section>
      <section v-if="obj.data.Scale != null">Scale: {{arrayOrNumToStr(obj.data.Scale, 2)}}</section>
      <section v-if="obj.data.Rotate != null">Rotate: {{arrayOrNumToStr(obj.data.Rotate, 5)}}</section>
      <section v-if="obj.data.UniqueName">Unique name: {{obj.data.UniqueName}}</section>

      <p v-if="isAreaReprPossiblyWrong()"><i class="fa fa-exclamation-circle"></i> Area representation may be inaccurate because of rotation parameters.</p>

      <section class="mt-2" v-show="areaMarkers.length || staticData.persistentAreaMarkers.length">
        <b-btn v-show="areaMarkers.length" size="sm" block variant="dark" @click="keepAreaMarkersAlive()">Keep area representation loaded</b-btn>
        <b-btn v-show="staticData.persistentAreaMarkers.length" size="sm" block variant="dark" @click="forgetPersistentAreaMarkers()">Hide area representation</b-btn>
      </section>

      <section class="obj-actor-specific-info">
        <!-- AreaObserverTag -->
        <p class="mt-2" v-if="obj.name == 'ActorObserverTag' && links.length">Sends basic signal if the configured actors are inside the specified Area.</p>

        <!-- LinkTag -->
        <section v-if="obj.name.startsWith('LinkTag')">
          <p class="mt-2" v-if="linkTagInputs.length && linkTagSaveFlag()">{{linkTagSaveFlagAction()}} the <code>{{linkTagSaveFlag()}}</code> flag when input evaluation gives a positive output.</p>
          <p class="mt-2" v-if="links.length && linkTagSaveFlag()">
            Activates target links if the <code>{{linkTagSaveFlag()}}</code> flag is set.
            <span v-show="linkTagInputs.length">In that case, input evaluation is skipped.</span>
            <br>
            Evaluates to {{isInvertedLogicTag ? 'OFF' : 'ON'}} when the flag is set and {{isInvertedLogicTag ? 'ON' : 'OFF'}} otherwise.
          </p>
          <section v-show="linkTagInputs.length">
            <hr>
            <h4 class="subsection-heading">Inputs</h4>
            <div class="search-results">
              <ObjectInfo v-for="(link, idx) in linkTagInputs" :key="'linktag-input'+idx" :link="link" :isStatic="false" @click.native="jumpToObj(link.otherObj)" />
            </div>
          </section>
          <section v-show="links.length">
            <h4 class="subsection-heading">Triggers</h4>
            <div class="search-results">
              <ObjectInfo v-for="(link, idx) in links" :key="'linktag-output'+idx" :link="link" :isStatic="false" @click.native="jumpToObj(link.otherObj)" />
            </div>
          </section>

        </section>

        <!-- EventTag, SignalFlowchart -->
        <div class="mt-2" v-if="(obj.name == 'EventTag' || obj.name == 'SignalFlowchart') && obj.data['!Parameters']">
          <p v-if="obj.name == 'EventTag'">Activates event <code>{{obj.data['!Parameters'].EventFlowName}}&lt;{{obj.data['!Parameters'].EventFlowEntryName}}&gt;</code> when signalled.</p>
          <p v-if="obj.name == 'SignalFlowchart'">Runs <code>{{obj.data['!Parameters'].EventFlowName}}&lt;{{obj.data['!Parameters'].EventFlowEntryName}}&gt;</code> in a loop and emits a basic signal when a signal is sent from the event flow.</p>

          <a target="_blank" :href="`https://eventviewer.zeldamods.org/viewer.html?data=/d/${obj.data['!Parameters'].EventFlowName}.json&params=1&entry=${obj.data['!Parameters'].EventFlowEntryName}`" class="btn btn-block btn-sm btn-info"><i class="fa fa-external-link-alt"></i> View in EventViewer</a>
        </div>
      </section>

      <section v-if="obj.data['!Parameters']">
        <hr>
        <h4 class="subsection-heading">Parameters</h4>
        <pre class="obj-params">{{JSON.stringify(obj.data['!Parameters'], undefined, 2)}}</pre>
      </section>

      <section v-if="obj.drop_table">
        <h4 class="subsection-heading">Drop Table</h4>
        <pre class="obj-params" v-html=" drop_table_format()"></pre>
      </section>
    </section>

    <section v-if="isSearchResult()">
      <br>
      <b-btn size="sm" block @click="emitBackToSearch()"><i class="fa fa-chevron-circle-left"></i> Back to search</b-btn>
    </section>

    <section v-show="linksToSelf.length">
      <hr>
      <h4 class="subsection-heading"><i class="fas fa-sign-in-alt"></i> Linked by</h4>
      <div class="search-results">
        <ObjectInfo v-for="(link, idx) in linksToSelf" :key="'linktoself'+idx" :link="link" :isStatic="false" @click.native="jumpToObj(link.otherObj)" />
      </div>
    </section>

    <section v-show="links.length">
      <hr>
      <h4 class="subsection-heading"><i class="fas fa-sign-out-alt"></i> Links to</h4>
      <div class="search-results">
        <ObjectInfo v-for="(link, idx) in links" :key="'link'+idx" :link="link" :isStatic="false" @click.native="jumpToObj(link.otherObj)" />
      </div>
    </section>

    <section v-show="genGroup.length">
      <hr>
      <h4 class="subsection-heading">Generation group</h4>
      <div class="search-results">
        <ObjectInfo v-for="otherObj in genGroup" :key="otherObj.objid" :obj="otherObj" :isStatic="false" @click.native="jumpToObj(otherObj)" />
      </div>
    </section>
  </div>
</template>
<style lang="less">
.obj-main-info {
  font-size: 90%;
  .search-result-name {
    display: none;
  }
}

.obj-params {
  color: #dcdcdc;
}
</style>
<script src="./AppMapDetailsObj.ts"></script>
