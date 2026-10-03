import Tooltip from 'bootstrap/js/dist/tooltip';
import { nextTick, type Directive, type DirectiveBinding } from 'vue';

const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const;

function getOptions(binding: DirectiveBinding<string>): Partial<Tooltip.Options> {
  return {
    placement: PLACEMENTS.find(p => binding.modifiers[p]) ?? 'top',
    trigger: binding.modifiers.hover ? 'hover' : 'hover focus',
    container: 'body',
  };
}

export const vTooltip: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    // Bootstrap moves the title out of the way of the native tooltip and turns it into an aria-label on icon-only elements.
    el.title = binding.value;
    Tooltip.getOrCreateInstance(el, getOptions(binding));
    // An element hidden under a pointer that doesn't move never gets mouseleave, which would leave its tooltip up.
    el.addEventListener('show.bs.tooltip', e => {
      if (!el.checkVisibility())
        e.preventDefault();
    });
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue)
      Tooltip.getInstance(el)?.setContent({ '.tooltip-inner': binding.value });
    // After the tick, as an ancestor's v-show only applies after this hook.
    nextTick(() => {
      if (!el.checkVisibility())
        Tooltip.getInstance(el)?.hide();
    });
  },
  beforeUnmount(el) {
    Tooltip.getInstance(el)?.dispose();
  },
};
