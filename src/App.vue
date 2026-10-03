<template>
  <div class="d-flex h-100 flex-column">
    <div id="content" class="flex-fill d-flex">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component"/>
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style src="./App.css"></style>
<script>
export default {
  name: 'App',
};
</script>
