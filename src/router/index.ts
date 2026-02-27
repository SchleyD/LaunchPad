import { createRouter, createWebHistory } from 'vue-router'
import ProjectListView from '../views/ProjectListView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import PMReviewView from '../views/PMReviewView.vue'
import TemplateManagementView from '../views/TemplateManagementView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: ProjectListView,
    },
    {
      path: '/project/:id',
      name: 'project-detail',
      component: ProjectDetailView,
    },
    {
      path: '/pm-review',
      name: 'pm-review',
      component: PMReviewView,
    },
    {
      path: '/templates',
      name: 'templates',
      component: TemplateManagementView,
    },
  ],
})

export default router
