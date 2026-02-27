import { createRouter, createWebHistory } from 'vue-router'
import ProjectListView from '../views/ProjectListView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import PMReviewView from '../views/PMReviewView.vue'
import TemplateManagementView from '../views/TemplateManagementView.vue'
import UserManagementView from '../views/UserManagementView.vue'
import LoginView from '../views/LoginView.vue'
import { mockUsers } from '../data/mockData'

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

// Helper to check if user is a manager (Admin or PM)
function isUserManager(userId: string): boolean {
  const user = mockUsers.find(u => u.id === userId)
  return user?.role === 'Admin' || user?.role === 'PM'
}

// Navigation guard for authentication and role-based access
router.beforeEach((to, _from, next) => {
  const currentUserId = localStorage.getItem('currentUserId')
  const isAuthenticated = !!currentUserId
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'projects' })
  } else if (to.meta.requiresManager && currentUserId && !isUserManager(currentUserId)) {
    // Redirect non-managers trying to access manager-only pages
    next({ name: 'projects' })
  } else {
    next()
  }
})

export default router
