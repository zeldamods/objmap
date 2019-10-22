import Vue from 'vue';
import Component from 'vue-class-component';

import * as map from '@/util/map';

@Component
export default class ModalGotoCoords extends Vue {
  private x: string = "";
  private z: string = "";

  show() {
    // @ts-ignore
    this.$refs.modalGoto.show();
  }
  hide() {
    // @ts-ignore
    this.$refs.modalGoto.hide();
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
    if (isNaN(x) || isNaN(z) || !map.isValidXZ(x, z)) {
      alert("Invalid coordinates");
      return;
    }
    this.$emit('submitted', [x, z]);
    this.x = this.z = "";
    this.hide();
  }
}
