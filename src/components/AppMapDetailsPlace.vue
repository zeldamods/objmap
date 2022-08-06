<template>
  <section>
    <section v-if="minobj">
      <h2 class="location-sub" >{{minobj.messageid}}</h2>
      <ObjectInfo :obj="minobj" :key="minobj.objid" className="obj-main-info" />
    </section>
    <section v-if="minobj" class="mt-2">
      Position: {{minobj.pos[0].toFixed(2)}} {{minobj.pos[1].toFixed(2)}} {{minobj.pos[2].toFixed(2)}}
    </section>
    <section v-if="shopDataExists()">
      <ShopData :data="shopData[this.sub]" />
    </section>
    <section v-if="shrine && shrineSub && shrineObj">
      <hr>
      <h4 class="subsection-heading">Nearest Shrine</h4>
      <div>
        <div>{{shrine}}</div>
        <div class="ml-3">
          {{shrineSub}}
          <ObjectInfo :obj="shrineObj" :key="shrineObj.objid" className="obj-main-info"/>
        </div>
      </div>
    </section>

  </section>
</template>
<style lang="less">
</style>
<script src="./AppMapDetailsPlace.ts"></script>
