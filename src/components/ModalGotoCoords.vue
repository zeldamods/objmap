<template>
  <div>
    <div class="modal fade modalpane" :class="{show: isShow}" :style="{display: isBlock ? 'block' : 'none'}" role="dialog" aria-modal="true" aria-labelledby="modal-goto-title" tabindex="-1" @keydown.esc="hide" @click.self="hide">
      <div class="modal-dialog modal-md">
        <div class="modal-content">
          <header class="modal-header">
            <h5 class="modal-title" id="modal-goto-title">Enter target coordinates.</h5>
            <button type="button" aria-label="Close" class="close" @click="hide">×</button>
          </header>
          <div class="modal-body">
            <form class="form-inline justify-content-center" @submit.prevent="onSubmit">
              <input type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" placeholder="X coordinate" v-model="x" ref="formGotoX" required @paste="onPaste">
              <input type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" placeholder="Z coordinate" v-model="z" required>
              <button type="submit" class="btn btn-primary">Go</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show" v-if="isBlock"></div>
  </div>
</template>
<style lang="less" src="./ModalPane.less"></style>
<script src="./ModalGotoCoords.ts"></script>
