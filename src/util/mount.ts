import { Component, createApp, h, reactive, toHandlerKey } from 'vue';

export interface MountedComponent<Props> {
  el: HTMLElement;
  props: Props;
  unmount(): void;
}

export function mountComponent<Props extends object>(
  component: Component,
  props: Props,
  listeners: Record<string, (...args: any[]) => void> = {},
): MountedComponent<Props> {
  const reactiveProps = reactive({ ...props }) as Props;
  const onListeners = Object.fromEntries(Object.entries(listeners).map(([name, fn]) => [toHandlerKey(name), fn]));
  const app = createApp({
    render: () => h(component, { ...reactiveProps, ...onListeners }),
  });
  const vm = app.mount(document.createElement('div'));
  return { el: vm.$el as HTMLElement, props: reactiveProps, unmount: () => app.unmount() };
}
