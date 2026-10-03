import Vue from 'vue';
import Component from 'vue-class-component';

import * as map from '@/util/map';

// Bootstrap's .fade transition duration.
const FADE_DURATION_MS = 150;

@Component
export default class ModalGotoCoords extends Vue {
  private x: string = "";
  private z: string = "";

  private isBlock = false;
  private isShow = false;
  private hideTimer = 0;

  show() {
    window.clearTimeout(this.hideTimer);
    this.hideTimer = 0;
    this.isBlock = true;
    document.body.classList.add('modal-open');
    this.$nextTick(() => {
      (this.$refs.formGotoX as HTMLInputElement).focus();
      if (this.hideTimer)
        return;
      // Lay the modal out without .show first, or the fade/slide-in transition won't run.
      void (this.$el as HTMLElement).offsetHeight;
      this.isShow = true;
    });
  }
  hide() {
    if (!this.isBlock)
      return;
    this.isShow = false;
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      this.isBlock = false;
      document.body.classList.remove('modal-open');
    }, FADE_DURATION_MS);
  }

  private onPaste(evt: ClipboardEvent) {
    if (!evt.clipboardData)
      return;
    let X, Z;
    const data = evt.clipboardData.getData('text');
    const array = data.replace('[', '').replace(']', '').replace(' ', '').split(',');
    if (array.length === 2)
      [X, Z] = array;
    else if (array.length === 3)
      [X, , Z] = array;

    if (X !== undefined && Z !== undefined) {
      this.x = X;
      this.z = Z;
      evt.preventDefault();
    }
  }

  private onSubmit() {
    const x = parseFloat(this.x);
    const z = parseFloat(this.z);
    if (isNaN(x) || isNaN(z) || !map.isValidXYZ(x, 0, z)) {
      alert("Invalid coordinates");
      return;
    }
    this.$emit('submitted', [x, 0, z]);
    this.x = this.z = "";
    this.hide();
  }
}
