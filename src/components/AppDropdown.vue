<template>
  <div class="dropdown btn-group" :class="{show: isOpen}" @keydown.esc="hide">
    <button type="button" class="btn dropdown-toggle" :class="['btn-' + variant, size ? 'btn-' + size : '']" aria-haspopup="menu" :aria-expanded="isOpen ? 'true' : 'false'" @click="toggle">
      <slot name="button-content">{{text}}</slot>
    </button>
    <ul role="menu" tabindex="-1" class="dropdown-menu" data-bs-popper="static" :class="{show: isOpen}" :style="{left: menuShift + 'px'}" ref="menu" @click="hide">
      <slot></slot>
    </ul>
  </div>
</template>
<style scoped>
.dropdown-menu:focus {
  outline: none;
}
</style>
<script src="./AppDropdown.ts"></script>
