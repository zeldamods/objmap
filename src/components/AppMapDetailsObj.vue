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

      <p class="mt-2" v-if="obj.name == 'LinkTagAnd' && !links.length && obj.data['!Parameters'].SaveFlag">Sets the <i>{{obj.data['!Parameters'].SaveFlag}}</i> flag.</p>
      <p class="mt-2" v-if="obj.name == 'LinkTagAnd' && links.length && obj.data['!Parameters'].SaveFlag">Activates target links if the <i>{{obj.data['!Parameters'].SaveFlag}}</i> flag is set.</p>
      <p class="mt-2" v-if="obj.name == 'ActorObserverTag' && links.length">Sends basic signal if the configured actors are inside the specified Area.</p>

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
      <h4 class="subsection-heading">Linked by</h4>
      <div class="search-results">
        <ObjectInfo v-for="(link, idx) in linksToSelf" :key="'linktoself'+idx" :link="link" :isStatic="false" @click.native="jumpToObj(link.otherObj)" />
      </div>
    </section>

    <section v-show="links.length">
      <hr>
      <h4 class="subsection-heading">Links to</h4>
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
