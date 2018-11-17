<template>
  <div id="app" class="d-flex h-100 flex-column">
    <div id="content" class="flex-fill d-flex">
      <keep-alive>
        <router-view/>
      </keep-alive>
    </div>
  </div>
</template>

<style src="./App.css"></style>
<script>
export default {
  name: 'App',
};
</script>
