import { createRouter, createWebHistory } from 'vue-router'
import ProjectListView from '../views/ProjectListView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import PMReviewView from '../views/PMReviewView.vue'
import TemplateManagementView from '../views/TemplateManagementView.vue'
import UserManagementView from '../views/UserManagementView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'

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
      meta: { requiresAuth: true, requiresManager: true },
    },
    {
      path: '/templates',
      name: 'templates',
      component: TemplateManagementView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: UserManagementView,
      meta: { requiresAuth: true, requiresManager: true },
    },
  ],
})

// Navigation guard for authentication and role-based access
router.beforeEach(async (to, _from, next) => {
  const currentUserId = localStorage.getItem('currentUserId')
  const isAuthenticated = !!currentUserId
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'projects' })
  } else if (to.meta.requiresManager && currentUserId) {
    // Check if user is a manager using auth store
    const authStore = useAuthStore()
    await authStore.initialize() // Ensure data is loaded
    const user = authStore.getUserById(currentUserId)
    const isManager = user?.role === 'Admin' || user?.role === 'PM'
    
    if (!isManager) {
      next({ name: 'projects' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
