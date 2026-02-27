import { createRouter, createWebHistory } from 'vue-router'
import ProjectListView from '../views/ProjectListView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import PMReviewView from '../views/PMReviewView.vue'
import TemplateManagementView from '../views/TemplateManagementView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'projects',
      component: ProjectListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/project/:id',
      name: 'project-detail',
      component: ProjectDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pm-review',
      name: 'pm-review',
      component: PMReviewView,
      meta: { requiresAuth: true },
    },
    {
      path: '/templates',
      name: 'templates',
      component: TemplateManagementView,
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const currentUserId = localStorage.getItem('currentUserId')
  const isAuthenticated = !!currentUserId
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'projects' })
  } else {
    next()
  }
})

export default router
