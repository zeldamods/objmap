import { defineComponent } from 'vue';

const BOUNDARY_PADDING = 5;

function getScrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const style = getComputedStyle(p);
    if (/auto|scroll|hidden/.test(style.overflowX + style.overflowY))
      return p;
  }
  return document.documentElement;
}

export default defineComponent({
  name: 'AppDropdown',
  props: {
    text: { type: String, default: '' },
    variant: { type: String, default: 'secondary' },
    size: { type: String, default: '' },
  },

  data() {
    return {
      isOpen: false,
      menuShift: 0,
    };
  },

  beforeDestroy() {
    document.removeEventListener('click', this.onDocumentClick);
  },

  methods: {
    toggle(): void {
      if (this.isOpen)
        this.hide();
      else
        this.show();
    },

    show(): void {
      this.isOpen = true;
      this.menuShift = 0;
      document.addEventListener('click', this.onDocumentClick);
      this.$nextTick(() => {
        this.keepMenuInBoundary();
        (this.$refs.menu as HTMLElement).focus();
      });
    },

    hide(): void {
      this.isOpen = false;
      document.removeEventListener('click', this.onDocumentClick);
    },

    onDocumentClick(e: MouseEvent): void {
      if (!this.$el.contains(e.target as Node))
        this.hide();
    },

    // Like Popper's preventOverflow: the sidebar would otherwise clip menus opened near its edge.
    keepMenuInBoundary(): void {
      const menu = this.$refs.menu as HTMLElement;
      const bounds = getScrollParent(this.$el as HTMLElement).getBoundingClientRect();
      const rect = menu.getBoundingClientRect();
      let shift = Math.min(0, bounds.right - BOUNDARY_PADDING - rect.right);
      shift = Math.max(shift, bounds.left + BOUNDARY_PADDING - rect.left);
      this.menuShift = shift;
    },
  },
});
