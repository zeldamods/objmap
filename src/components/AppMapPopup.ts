import { defineComponent } from 'vue';

export interface AppMapPopupProps {
  title?: string;
  text?: string;
  pathLength?: number;
}

export default defineComponent({
  name: 'AppMapPopup',
  props: {
    title: String,
    text: String,
    pathLength: Number,
  },
  emits: ['title', 'text'],
  data() {
    return {
      currentTitle: this.title,
      currentText: this.text,
    };
  },
  watch: {
    currentTitle(val: string) {
      this.$emit('title', val);
    },
    currentText(val: string) {
      this.$emit('text', val);
    },
  },
});
