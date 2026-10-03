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

  data() {
    return {
      active: false,
    };
  },

  created() {
    this.active = Settings.getInstance().shownGroups.has(this.type);
  },

  methods: {
    onClick(): void {
      this.active = !this.active;
      if (this.active) {
        Settings.getInstance().shownGroups.add(this.type);
      } else {
        Settings.getInstance().shownGroups.delete(this.type);
      }
      this.$emit('toggle');
    },
  },
});
