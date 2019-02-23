<template>
  <div>
    <h2 class="location-sub" v-if="getLocationSub()">{{getLocationSub()}}</h2>
    <ObjectInfo :obj="minObj" :key="minObj.objid" className="obj-main-info" />

    <section v-if="obj" class="mt-2">
      <section>Actor: {{obj.data.UnitConfigName}}</section>
      <section>Position: {{obj.data.Translate[0].toFixed(2)}}, {{obj.data.Translate[1].toFixed(2)}}, {{obj.data.Translate[2].toFixed(2)}}</section>
      <section v-if="obj.data.Scale != null">Scale: {{arrayOrNumToStr(obj.data.Scale, 2)}}</section>
      <section v-if="obj.data.Rotate != null">Rotate: {{arrayOrNumToStr(obj.data.Rotate, 5)}}</section>
      <section v-if="obj.data.UniqueName">Unique name: {{obj.data.UniqueName}}</section>

      <p class="mt-2" v-if="obj.name == 'LinkTagAnd' && linksToSelf.length && obj.data['!Parameters'].SaveFlag">Sets the <code>{{obj.data['!Parameters'].SaveFlag}}</code> flag when signalled.</p>
      <p class="mt-2" v-if="obj.name == 'LinkTagAnd' && links.length && obj.data['!Parameters'].SaveFlag">Activates target links if the <code>{{obj.data['!Parameters'].SaveFlag}}</code> flag is set.</p>
      <p class="mt-2" v-if="obj.name == 'ActorObserverTag' && links.length">Sends basic signal if the configured actors are inside the specified Area.</p>

      <div class="mt-2" v-if="(obj.name == 'EventTag' || obj.name == 'SignalFlowchart') && obj.data['!Parameters']">
        <p v-if="obj.name == 'EventTag'">Activates event <code>{{obj.data['!Parameters'].EventFlowName}}&lt;{{obj.data['!Parameters'].EventFlowEntryName}}&gt;</code> when signalled.</p>
        <p v-if="obj.name == 'SignalFlowchart'">Runs <code>{{obj.data['!Parameters'].EventFlowName}}&lt;{{obj.data['!Parameters'].EventFlowEntryName}}&gt;</code> in a loop and emits a basic signal when a signal is sent from the event flow.</p>

        <a target="_blank" :href="`https://eventviewer.zeldamods.org/viewer.html?data=/d/${obj.data['!Parameters'].EventFlowName}.json&params=1&entry=${obj.data['!Parameters'].EventFlowEntryName}`" class="btn btn-block btn-sm btn-info"><i class="fa fa-external-link-alt"></i> View in EventViewer</a>
      </div>

      <section v-if="obj.data['!Parameters']">
        <hr>
        <h4 class="subsection-heading">Parameters</h4>
        <pre class="obj-params">{{JSON.stringify(obj.data['!Parameters'], undefined, 2)}}</pre>
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
