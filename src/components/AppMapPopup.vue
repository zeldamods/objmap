<template>
  <div>
    <input class="w-100" placeholder="Title ..." v-model="title">
    <textarea class="w-100" placeholder="Description ..." v-model="text"></textarea>
    <div v-if="pathLength > 0">
      Length: {{pathLength.toFixed(2)}}
    </div>
  </div>
</template>

<style lang="less">
  textarea {
    min-height: 75px;
  }
</style>
<script src="./AppMapPopup.ts"></script>
