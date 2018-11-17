import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/regular.css';
import '@fortawesome/fontawesome-free/css/solid.css';

import Vue from 'vue';
import Component from 'vue-class-component'

import App from './App.vue';
import router from './router';

import {MapMgr} from '@/services/MapMgr';
import {MsgMgr} from '@/services/MsgMgr';

async function main() {
  await initServices();
  initUi();
}

async function initServices() {
  await Promise.all([
    MsgMgr.getInstance().init(),
    MapMgr.getInstance().init(),
  ]);
}

function initUi() {
  Vue.use(BootstrapVue);

  Vue.config.productionTip = false;

  Component.registerHooks([
    'beforeRouteEnter',
    'beforeRouteLeave',
    'beforeRouteUpdate',
  ]);

  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app');
}

main();
