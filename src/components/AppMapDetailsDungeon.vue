<template>
  <section>
    <h2 class="location-sub">{{sub}}</h2>
    <p>Dungeon number: {{marker.data.dungeonNum}}</p>
    <hr>
    <h4 class="subsection-heading">Treasure Chests</h4>
    <div class="search-results">
      <ObjectInfo v-for="tbox in tboxObjs" :key="tbox.objid" :obj="tbox" drop-as-name />
    </div>
  </section>
</template>
<style lang="less">
</style>
<script src="./AppMapDetailsDungeon.ts"></script>
