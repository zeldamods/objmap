<template>
  <section >
    <hr>
    <h4 class="subsection-heading">{{shop_name()}}</h4>
    <div v-if="shop_name() != 'Beedle Shop Data' && tables().length > 1">
      <select class="custom-select custom-select-sm mb-2 select_table" v-model="table">
        <option v-for="t in tables()" :key="t" :value="t">{{t}}</option>
      </select>
    </div>
    <div class="table">
        <div v-for="idx in length()" :key="idx" class="table-row">
          <div class="cell">{{name(idx)}}</div>
          <div class="cell">{{num(idx)}}</div>
          <div class="cell"><img width="15" src="rupee.svg"></div>
          <div class="cell">{{price(idx)}}</div>
        </div>
      </div>
  </section>
</template>
<style scoped>
  .table {
      color: white;
      display: table;
      width: 100%;
  }
  .table-row {
      display: table-row;
  }
  .table-row .cell {
      display: table-cell;
  }
  select {
      color: white;
      background: rgba(0,0,0,0.7);
      border: rgba(255,255,255,0.2) 1px solid;
  }
  select option {
      background: rgba(0,0,0,0.7);
  }

</style>
<script src="./ShopData.ts"></script>
