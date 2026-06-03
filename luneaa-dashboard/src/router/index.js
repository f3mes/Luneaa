
import { createRouter, createWebHistory } from 'vue-router'
import Overview from '../views/Overview.vue'
import Terminal from '../views/Terminal.vue'
import Moderation from '../views/Moderation.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'overview', component: Overview },
    { path: '/moderation', name: 'moderation', component: Moderation },
    { path: '/terminal', name: 'terminal', component: Terminal },
  ]
})

export default router