<template>
  <section >
    <hr>
    <h4 class="subsection-heading">Beedle Shop Data</h4>
    <div class="table">
        <div v-for="idx in length()" :key="idx" class="row">
          <div class="cell">{{name(idx)}}</div>
          <div class="cell">{{num(idx)}}</div>
          <div class="cell"><img width="15" src="rupee.svg"></div>
          <div class="cell">{{price(idx)}}</div>
        </div>
      </div>
  </section>
</template>
<style>
  .table {
      color: white;
      display: table;
      width: 100%;
  }
  .row {
      display: table-row;
  }
  .cell {
      display: table-cell;
  }
</style>
<script src="./ShopData.ts"></script>
