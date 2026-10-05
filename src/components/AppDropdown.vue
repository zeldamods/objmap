<template>
  <div class="dropdown btn-group">
    <button type="button" class="btn dropdown-toggle" :class="['btn-' + variant, size ? 'btn-' + size : '']" data-bs-toggle="dropdown" aria-expanded="false" ref="toggle">
      <slot name="button-content">{{text}}</slot>
    </button>
    <ul role="menu" class="dropdown-menu" ref="menu">
      <slot></slot>
    </ul>
  </div>
</template>
<script src="./AppDropdown.ts"></script>
