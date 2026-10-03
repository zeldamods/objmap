import Modal from 'bootstrap/js/dist/modal';
import { defineComponent } from 'vue';

import * as map from '@/util/map';
import * as ui from '@/util/ui';

export default defineComponent({
  name: 'ModalGotoCoords',
  emits: ['submitted'],

  setup() {
    return {
      modal: ui.late<Modal>(),
      wantShown: false,
      opener: null as HTMLElement | null,
    };
  },

  data() {
    return {
      x: "",
      z: "",
    };
  },

  mounted() {
    const el = this.$el as HTMLElement;
    this.modal = new Modal(el);
    // Bootstrap ignores show() and hide() mid-transition; wantShown lets the last call win once it ends.
    el.addEventListener('hide.bs.modal', () => {
      this.wantShown = false;
    });
    el.addEventListener('shown.bs.modal', () => {
      if (!this.wantShown) {
        this.modal.hide();
        return;
      }
      (this.$refs.formGotoX as HTMLInputElement).focus();
    });
    el.addEventListener('hidden.bs.modal', () => {
      if (this.wantShown) {
        this.modal.show();
        return;
      }
      this.opener?.focus();
      this.opener = null;
    });
  },

  beforeUnmount() {
    this.modal.dispose();
  },

  methods: {
    show(): void {
      const active = document.activeElement;
      if (active instanceof HTMLElement && !this.$el.contains(active))
        this.opener = active;
      this.wantShown = true;
      this.modal.show();
    },
    hide(): void {
      this.wantShown = false;
      this.modal.hide();
    },

    onPaste(evt: ClipboardEvent): void {
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
    },

    onSubmit(): void {
      const x = parseFloat(this.x);
      const z = parseFloat(this.z);
      if (isNaN(x) || isNaN(z) || !map.isValidXYZ(x, 0, z)) {
        alert("Invalid coordinates");
        return;
      }
      this.$emit('submitted', [x, 0, z]);
      this.x = this.z = "";
      this.hide();
    },
  },
});
