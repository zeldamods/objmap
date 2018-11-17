<template>
  <section>
    <h4 class="subsection-heading">Object Color Mode</h4>
    <b-radio-group class="mb-4" v-model="colorMode" @change="onColorModeChange">
      <b-radio value="per-actor">Color by actor type</b-radio>
      <b-radio value="per-group">Color by search group</b-radio>
    </b-radio-group>
    <h4 class="subsection-heading">Object Display</h4>
    <p class="mb-1">Some changes only take effect after a reload.</p>
    <b-checkbox switch v-model="s.useActorNames">Use internal actor names</b-checkbox>
    <b-checkbox switch v-model="s.useHexForHashIds">Show hash IDs in hex</b-checkbox>
  </section>
</template>
<script src="./AppMapSettings.ts"></script>
