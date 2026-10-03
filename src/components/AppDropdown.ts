import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import Component from 'vue-class-component';

const BOUNDARY_PADDING = 5;

function getScrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const style = getComputedStyle(p);
    if (/auto|scroll|hidden/.test(style.overflowX + style.overflowY))
      return p;
  }
  return document.documentElement;
}

@Component
export default class AppDropdown extends Vue {
  @Prop({ type: String, default: '' })
  private text!: string;
  @Prop({ type: String, default: 'secondary' })
  private variant!: string;
  @Prop({ type: String, default: '' })
  private size!: string;

  private isOpen = false;
  private menuShift = 0;

  beforeDestroy() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  toggle() {
    if (this.isOpen)
      this.hide();
    else
      this.show();
  }

  show() {
    this.isOpen = true;
    this.menuShift = 0;
    document.addEventListener('click', this.onDocumentClick);
    this.$nextTick(() => {
      this.keepMenuInBoundary();
      (this.$refs.menu as HTMLElement).focus();
    });
  }

  hide() {
    this.isOpen = false;
    document.removeEventListener('click', this.onDocumentClick);
  }

  private onDocumentClick(e: MouseEvent) {
    if (!this.$el.contains(e.target as Node))
      this.hide();
  }

  // Like Popper's preventOverflow: the sidebar would otherwise clip menus opened near its edge.
  private keepMenuInBoundary() {
    const menu = this.$refs.menu as HTMLElement;
    const bounds = getScrollParent(this.$el as HTMLElement).getBoundingClientRect();
    const rect = menu.getBoundingClientRect();
    let shift = Math.min(0, bounds.right - BOUNDARY_PADDING - rect.right);
    shift = Math.max(shift, bounds.left + BOUNDARY_PADDING - rect.left);
    this.menuShift = shift;
  }
}
