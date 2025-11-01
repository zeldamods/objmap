<template>
  <section >
    <hr>
    <h4 class="subsection-heading">{{shop_name()}}</h4>
    <div v-if="shop_name() != 'Beedle Shop Data' && tables().length > 1">
      <b-form-select v-model="table" :options="tables()" class="mb-2 select_table" size="sm"> </b-form-select>
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
  .select_table {
      color: white;
      background: rgba(0,0,0,0.2);
      border: rgba(255,255,255,0.2) 1px solid;

      -webkit-appearance: none; /* For Chrome, Safari */
      -moz-appearance: none;    /* For Firefox */
      appearance: none;         /* Standard property */
      background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><polygon points="0,2 4,6 8,2" fill="white"/></svg>') no-repeat right 10px center;
      background-size: 10px;
      padding-right: 30px;   /* Make space for the custom arrow */
  }

</style>
<script src="./ShopData.ts"></script>
