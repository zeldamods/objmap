import Dropdown from 'bootstrap/js/dist/dropdown';
import { defineComponent } from 'vue';

import * as ui from '@/util/ui';

export default defineComponent({
  name: 'AppDropdown',
  props: {
    text: { type: String, default: '' },
    variant: { type: String, default: 'secondary' },
    size: { type: String, default: '' },
  },

  setup() {
    return {
      dropdown: ui.late<Dropdown>(),
    };
  },

  mounted() {
    const toggle = this.$refs.toggle as HTMLElement;
    const menu = this.$refs.menu as HTMLElement;
    this.dropdown = new Dropdown(toggle);
    // Bootstrap only refocuses the toggle on Escape; choosing an item would otherwise drop focus to the body.
    toggle.addEventListener('hidden.bs.dropdown', () => {
      if (menu.contains(document.activeElement))
        toggle.focus();
    });
  },

  beforeUnmount() {
    this.dropdown.dispose();
  },
});
