import Vue, { Component } from 'vue';

export interface MountedComponent<Props> {
  el: HTMLElement;
  props: Props;
}

export function mountComponent<Props extends object>(
  component: Component,
  props: Props,
  listeners: Record<string, (...args: any[]) => void> = {},
): MountedComponent<Props> {
  const reactiveProps = Vue.observable({ ...props });
  const vm = new Vue({
    render: h => h(component, { props: reactiveProps, on: listeners }),
  }).$mount();
  return { el: vm.$el as HTMLElement, props: reactiveProps };
}
