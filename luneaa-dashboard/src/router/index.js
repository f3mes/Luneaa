
import { createRouter, createWebHistory } from 'vue-router'
import Overview from '../views/Overview.vue'
import Settings from '../views/Settings.vue'
import Moderation from '../views/Moderation.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'overview', component: Overview },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/moderation', name: 'moderation', component: Moderation },
  ]
})

export default router