import * as VueRouter from 'vue-router'
import Home from '../pages/home/index.vue'
import Detail from '../pages/detail/index.vue'
import Root from '../App.vue'

const routes = [
  { path: '/', name: 'root', component: '<router-view />', redirect: { name: 'home' } },
  { path: '/home', name: 'home', component: Home },
  { path: '/detail', name: 'detail', component: Detail }
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory('/'),
  // @ts-ignore
  routes,
})

export default router