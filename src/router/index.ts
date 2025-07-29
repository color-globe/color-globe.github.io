import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/cylinder',
      name: 'cylinder',
      component: () => import('../views/CylinderView.vue'),
    },
    {
      path: '/bicone',
      name: 'bicone',
      component: () => import('../views/BiconeView.vue'),
    },
    {
      path: '/globe',
      name: 'globe',
      component: () => import('../views/GlobeView.vue'),
    },
    {
      path: '/globe2',
      name: 'globe2',
      component: () => import('../views/Globe2View.vue'),
    },
    {
      path: '/globe3',
      name: 'globe3',
      component: () => import('../views/Globe3View.vue'),
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('../views/DocsView.vue'),
    },
  ],
})

export default router
