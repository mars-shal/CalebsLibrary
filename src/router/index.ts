import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/browse', name: 'browse', component: () => import('@/views/BrowseView.vue') },
  { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
  { path: '/subject/:id', name: 'subject', component: () => import('@/views/SubjectView.vue') },
  { path: '/paper/:id', name: 'paper', component: () => import('@/views/PaperView.vue') },
  { path: '/upload', name: 'upload', component: () => import('@/views/UploadView.vue') },
  { path: '/profile/:id', name: 'profile', component: () => import('@/views/ProfileView.vue') },
  { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
  { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
