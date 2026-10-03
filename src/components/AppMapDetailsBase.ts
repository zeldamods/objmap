import { defineComponent, PropType } from 'vue';

import MixinUtil from '@/components/MixinUtil';

export function defineDetailsBase<MarkerClass>() {
  return defineComponent({
    name: 'AppMapDetailsBase',
    mixins: [MixinUtil],
    props: {
      marker: { type: Object as PropType<MarkerClass>, required: true },
    },
    watch: {
      marker() { this.init(); },
    },
    created() {
      this.init();
    },
    methods: {
      init(): void | Promise<void> { },
    },
  });
}
