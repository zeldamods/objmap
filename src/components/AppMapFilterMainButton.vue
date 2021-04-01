<template>
  <div class="col-6 map-filter-main-button-col">
    <div class="map-filter-main-button d-flex align-items-center" @click="onClick" :class="{active: active}">
      <span class="map-filter-icon-container"><img v-if="icon" :src="icon" :class="'map-filter-icon-' + type"></span> {{label}}
    </div>
  </div>
</template>
<style lang="less">
.map-filter-main-button-col {
  margin-bottom: 7px;
  &:not(:nth-child(even)) {
    padding-right: 3px;
  }
  &:not(:nth-child(odd)) {
    padding-left: 3px;
  }
}

.map-filter-main-button {
  border-radius: 3px;
  border: 1px solid #a2a2a27a;
  background: rgba(0, 0, 0, 0.35);
  font-size: 16px;
  padding: 2px 5px;
  cursor: pointer;

  .map-filter-icon-container {
    width: 32px;
    height: 32px;
    text-align: center;
    margin-right: 3px;
  }

  img {
    height: 32px;
    width: 32px;
  }

  .map-filter-icon-Korok {
    height: 20px;
    width: 20px;
    position: relative;
    top: 5px;
  }

  &.active {
    background-color: #009bff5c;
    box-shadow: inset 0 0 5px 2px #ffffffa1;
  }
}
</style>
<script src="./AppMapFilterMainButton.ts"></script>
