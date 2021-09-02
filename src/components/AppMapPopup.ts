
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  props: {
    title: String,
    text: String,
  },
  watch: {
    title: function(new_val: string, old_val: string) {
      this.$emit('title', new_val);
    },
    text: function(new_val: string, old_val: string) {
      this.$emit('text', new_val);
    }
  },
})

export default class AppMapPopup extends Vue { }
