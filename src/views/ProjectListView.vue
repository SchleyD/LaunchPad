<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import ProgressBar from '@/components/ProgressBar.vue'
import CreateProjectModal from '@/components/CreateProjectModal.vue'

const router = useRouter()
const store = useProjectStore()

const showCreateModal = ref(false)
const projects = computed(() => store.activeProjects)

const getProgressForProject = (projectId: string) => {
  return store.getProjectProgress(projectId)
}

function handleProjectCreated(projectId: string) {
  router.push(`/project/${projectId}`)
}
</script>

<template>
  <div class="max-w-6xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-surface-900">Projects</h1>
        <p class="text-sm text-surface-500 mt-1">Active project implementations</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        + New Project
      </button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full">
        <thead class="bg-surface-50 border-b border-surface-200">
          <tr>
            <th class="table-header px-4 py-3 text-left">Project</th>
            <th class="table-header px-4 py-3 text-left">Customer</th>
            <th class="table-header px-4 py-3 text-left">Work Order</th>
            <th class="table-header px-4 py-3 text-left">Owner</th>
            <th class="table-header px-4 py-3 text-left w-40">Progress</th>
            <th class="table-header px-4 py-3 text-left w-24">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr 
            v-for="project in projects" 
            :key="project.id"
            class="hover:bg-surface-50 cursor-pointer transition-colors"
            @click="$router.push(`/project/${project.id}`)"
          >
            <td class="px-4 py-4">
              <div class="font-medium text-surface-900">{{ project.name }}</div>
              <div class="text-xs text-surface-500 mt-0.5">
                {{ project.type === 'Hardware' ? 'Hardware + Software' : 'Software Only' }}
              </div>
            </td>
            <td class="px-4 py-4 text-sm text-surface-700">
              {{ project.customer }}
            </td>
            <td class="px-4 py-4">
              <span class="text-sm font-mono text-surface-600">{{ project.workOrderId }}</span>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-xs font-medium text-primary-700">{{ project.owner }}</span>
                </div>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-3">
                <ProgressBar :value="getProgressForProject(project.id)" class="flex-1" />
                <span class="text-sm font-medium text-surface-700 w-10 text-right">
                  {{ getProgressForProject(project.id) }}%
                </span>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-2">
                <span 
                  v-if="project.blocked" 
                  class="badge-danger"
                >
                  Blocked
                </span>
                <span 
                  v-else-if="store.isProjectStalled(project)" 
                  class="badge-warning"
                >
                  Stalled
                </span>
                <span 
                  v-else 
                  class="badge-success"
                >
                  Active
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="projects.length === 0" class="p-12 text-center">
        <p class="text-surface-500">No active projects</p>
      </div>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal 
      :open="showCreateModal" 
      @close="showCreateModal = false"
      @created="handleProjectCreated"
    />
  </div>
</template>
