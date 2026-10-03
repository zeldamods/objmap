<template>
  <div>
    <div class="modal fade modalpane" :class="{show: isShow}" :style="{display: isBlock ? 'block' : 'none'}" role="dialog" aria-modal="true" aria-labelledby="modal-goto-title" tabindex="-1" @keydown.esc="hide" @click.self="hide">
      <div class="modal-dialog modal-md">
        <div class="modal-content">
          <header class="modal-header">
            <h5 class="modal-title" id="modal-goto-title">Enter target coordinates.</h5>
            <button type="button" aria-label="Close" class="btn-close" data-bs-theme="dark" @click="hide"></button>
          </header>
          <div class="modal-body">
            <form class="row row-cols-sm-auto g-2 align-items-center justify-content-center" @submit.prevent="onSubmit">
              <div class="col-12"><input type="text" class="form-control" placeholder="X coordinate" v-model="x" ref="formGotoX" required @paste="onPaste"></div>
              <div class="col-12"><input type="text" class="form-control" placeholder="Z coordinate" v-model="z" required></div>
              <div class="col-12"><button type="submit" class="btn btn-primary">Go</button></div>
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
