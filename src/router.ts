import Vue from 'vue';
import Router from 'vue-router';

import AppMap from '@/components/AppMap.vue';

Vue.use(Router);

export default new Router({
  // mode: 'history',
  routes: [
    { path: '/map', redirect: '/map/zx,0,0' },
    {
      path: '/map/z:zoom,:x,:z',
      name: 'map',
      component: AppMap,
    },
    { path: '*', redirect: '/map' },
  ],
});
