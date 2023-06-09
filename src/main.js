import Vue from 'vue';
import Buefy from 'buefy';
import './assets/scss/main.scss';

import App from './App.vue';

Vue.config.productionTip = false;
Vue.use(Buefy);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
