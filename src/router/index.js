import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

export default new Router({
  routes: [{
    path: '/',
    name: 'harmony',
    component: resolve => require(['@/components/harmony'], resolve)
  }]
})
