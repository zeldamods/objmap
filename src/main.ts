import 'bootstrap/dist/css/bootstrap.css';
import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/regular.css';
import '@fortawesome/fontawesome-free/css/solid.css';

import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

import { MapMgr } from '@/services/MapMgr';
import { MsgMgr } from '@/services/MsgMgr';

async function main() {
  await initServices();
  await initUi();
}

async function initServices() {
  await Promise.all([
    MsgMgr.getInstance().init(),
    MapMgr.getInstance().init(),
  ]);
}

async function initUi() {
  const app = createApp(App).use(router);
  await router.isReady();
  app.mount('#app');
}

main();
