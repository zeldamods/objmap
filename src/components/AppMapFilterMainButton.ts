import { defineComponent } from 'vue';

import { Settings } from '@/util/settings';

export default defineComponent({
  name: 'AppMapFilterMainButton',
  props: {
    icon: { default: '', type: String },
    label: { type: String, required: true },
    type: { type: String, required: true },
  },
  emits: ['toggle'],

  computed: {
    active(): boolean {
      return Settings.getInstance().shownGroups.has(this.type);
    },
  },

  methods: {
    onClick(): void {
      if (this.active) {
        Settings.getInstance().shownGroups.delete(this.type);
      } else {
        Settings.getInstance().shownGroups.add(this.type);
      }
      this.$emit('toggle');
    },
  },
});
