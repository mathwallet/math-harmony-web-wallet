// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import vueResource from 'vue-resource'
import i18n from 'static/js/i18n'
import webUtil from 'static/js/util'
import globalData from 'static/js/config.js'
import webCoin from 'static/js/coinUnit.js'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'static/css/index.css'
import clipboard from 'clipboard'
import { Alert, Confirm, Toast, Loading } from "wc-messagebox";
import "wc-messagebox/style.css";

Vue.config.productionTip = false
Vue.use(vueResource)

/*注册到vue原型上*/
Vue.prototype.globalData = globalData;
Vue.prototype.clipboard = clipboard;
Vue.prototype.webUtil = webUtil;
Vue.prototype.webCoin = webCoin;


/* eslint-disable no-new */
var vue1 = new Vue({
  el: '#app',
  i18n,
  router,
  components: { App },
  template: '<App/>'
});

Vue.use(Alert, {
  title: vue1.$t('prompt'),
  btnText: 'OK'
});
Vue.use(Confirm, {
  title: vue1.$t('Confirm'),
});
Vue.use(Toast, {
  location: 'bottom',
  toastStyle: {
    height: '60px',
    width: '160px',
    fontSize: '16px'
  },
});
