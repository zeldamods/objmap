import { defineComponent } from 'vue';

import * as map from '@/util/map';

// Bootstrap's .fade transition duration.
const FADE_DURATION_MS = 150;

export default defineComponent({
  name: 'ModalGotoCoords',
  emits: ['submitted'],

  setup() {
    return {
      hideTimer: 0,
    };
  },

  data() {
    return {
      x: "",
      z: "",

      isBlock: false,
      isShow: false,
    };
  },

  methods: {
    show(): void {
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
    },
    hide(): void {
      if (!this.isBlock)
        return;
      this.isShow = false;
      window.clearTimeout(this.hideTimer);
      this.hideTimer = window.setTimeout(() => {
        this.isBlock = false;
        document.body.classList.remove('modal-open');
      }, FADE_DURATION_MS);
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
