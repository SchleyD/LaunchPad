<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import type { Task, TaskStatus } from '@/types'
import ProgressBar from '@/components/ProgressBar.vue'
import TaskList from '@/components/TaskList.vue'
import PhaseTaskList from '@/components/PhaseTaskList.vue'
import TaskDrawer from '@/components/TaskDrawer.vue'
import ProjectTimeTab from '@/components/ProjectTimeTab.vue'
import ProjectInfoTab from '@/components/ProjectInfoTab.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()

const activeTab = ref<'tasks' | 'info' | 'time' | 'emails'>('tasks')
const taskViewMode = ref<'phases' | 'table'>('phases')
const selectedTaskId = ref<string | null>(null)
const statusFilter = ref<TaskStatus | 'all'>('all')
const milestoneFilter = ref<number | 'all'>('all')

const project = computed(() => {
  const id = route.params.id as string
  console.log('[v0] ProjectDetailView looking for id:', id)
  const found = store.getProjectById(id)
  console.log('[v0] Found project:', found?.id || 'NOT FOUND')
  return found
})

const progress = computed(() => {
  if (!project.value) return 0
  return store.getProjectProgress(project.value.id)
})

const milestones = computed(() => {
  if (!project.value) return []
  return project.value.type === 'Hardware' 
    ? [20, 40, 60, 80, 90, 100]
    : [20, 60, 80, 90, 100]
})

const filteredTasks = computed(() => {
  if (!project.value) return []
  
  let tasks = [...project.value.tasks]
  
  if (statusFilter.value !== 'all') {
    tasks = tasks.filter(t => t.status === statusFilter.value)
  }
  
  if (milestoneFilter.value !== 'all') {
    tasks = tasks.filter(t => t.milestone === milestoneFilter.value)
  }
  
  // Sort by milestone, then by status priority
  const statusOrder: Record<TaskStatus, number> = {
    'Blocked': 0,
    'InProgress': 1,
    'Ready': 2,
    'Waiting': 3,
    'Backlog': 4,
    'Done': 5,
    'Canceled': 6
  }
  
  return tasks.sort((a, b) => {
    if (a.milestone !== b.milestone) return a.milestone - b.milestone
    return statusOrder[a.status] - statusOrder[b.status]
  })
})

const selectedTask = computed(() => {
  if (!selectedTaskId.value || !project.value) return null
  return project.value.tasks.find(t => t.id === selectedTaskId.value) || null
})

function openTaskDrawer(task: Task) {
  selectedTaskId.value = task.id
}

function closeTaskDrawer() {
  selectedTaskId.value = null
}

function goBack() {
  router.push('/')
}

watch(() => route.params.id, () => {
  selectedTaskId.value = null
  activeTab.value = 'tasks'
})
</script>

<template>
  <div v-if="project" class="max-w-6xl">
    <!-- Header -->
    <div class="mb-6">
      <button 
        @click="goBack"
        class="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-3 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>
      
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold text-surface-900">{{ project.name }}</h1>
            <span v-if="project.blocked" class="badge-danger">Blocked</span>
          </div>
          <div class="flex items-center gap-4 mt-2 text-sm text-surface-500">
            <span>{{ project.customer }}</span>
            <span class="text-surface-300">|</span>
            <span class="font-mono">WO: {{ project.workOrderId }}</span>
            <span class="text-surface-300">|</span>
            <span>{{ project.type === 'Hardware' ? 'Hardware + Software' : 'Software Only' }}</span>
          </div>
        </div>
        
        <div class="text-right">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm text-surface-500">Owner:</span>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-xs font-medium text-primary-700">{{ project.owner }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Section -->
    <div class="card p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-surface-700">Project Progress</span>
        <span class="text-lg font-semibold text-primary-600">{{ progress }}%</span>
      </div>
      <ProgressBar :value="progress" />
      
      <!-- Milestone indicators -->
      <div class="flex justify-between mt-2 px-1">
        <div 
          v-for="milestone in milestones" 
          :key="milestone"
          class="flex flex-col items-center"
        >
          <div 
            :class="[
              'w-2 h-2 rounded-full',
              progress >= milestone ? 'bg-primary-500' : 'bg-surface-300'
            ]"
          />
          <span class="text-[10px] text-surface-400 mt-1">{{ milestone }}%</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-surface-200 mb-4">
      <nav class="flex gap-6">
        <button
          @click="activeTab = 'tasks'"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'tasks' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-surface-500 hover:text-surface-700'
          ]"
        >
          Tasks
        </button>
        <button
          @click="activeTab = 'info'"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'info' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-surface-500 hover:text-surface-700'
          ]"
        >
          Project Info
        </button>
        <button
          @click="activeTab = 'time'"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'time' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-surface-500 hover:text-surface-700'
          ]"
        >
          Time
        </button>
        <button
          @click="activeTab = 'emails'"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'emails' 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-surface-500 hover:text-surface-700'
          ]"
        >
          Emails
          <span class="ml-1 text-xs text-surface-400">(v1.5)</span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === 'tasks'">
      <!-- View toggle and filters -->
      <div class="flex items-center justify-between mb-4">
        <!-- View mode toggle -->
        <div class="flex items-center bg-surface-100 rounded-lg p-1">
          <button
            @click="taskViewMode = 'phases'"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              taskViewMode === 'phases'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            ]"
          >
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Phases
            </span>
          </button>
          <button
            @click="taskViewMode = 'table'"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              taskViewMode === 'table'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            ]"
          >
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Table
            </span>
          </button>
        </div>

        <!-- Filters (only for table view) -->
        <div v-if="taskViewMode === 'table'" class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm text-surface-500">Status:</label>
            <select v-model="statusFilter" class="select text-sm py-1.5 w-36">
              <option value="all">All</option>
              <option value="Backlog">Backlog</option>
              <option value="Ready">Ready</option>
              <option value="InProgress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Waiting">Waiting</option>
              <option value="Done">Done</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-surface-500">Milestone:</label>
            <select v-model="milestoneFilter" class="select text-sm py-1.5 w-28">
              <option value="all">All</option>
              <option v-for="m in milestones" :key="m" :value="m">{{ m }}%</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Phase view -->
      <PhaseTaskList 
        v-if="taskViewMode === 'phases'"
        :tasks="project.tasks" 
        @select-task="openTaskDrawer"
      />

      <!-- Table view -->
      <TaskList 
        v-else
        :tasks="filteredTasks" 
        @select-task="openTaskDrawer"
      />
    </div>

    <div v-else-if="activeTab === 'info'">
      <ProjectInfoTab :project="project" />
    </div>

    <div v-else-if="activeTab === 'time'">
      <ProjectTimeTab :project="project" />
    </div>

    <div v-else-if="activeTab === 'emails'" class="card p-8 text-center">
      <div class="text-surface-400 mb-2">
        <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-surface-700 mb-1">Email Logging</h3>
      <p class="text-sm text-surface-500">
        Email logging will be available in v1.5. CC launchpad@awsys.com to log emails to this project.
      </p>
    </div>

    <!-- Task Drawer -->
    <TaskDrawer 
      v-if="selectedTask && project"
      :task="selectedTask"
      :project-id="project.id"
      @close="closeTaskDrawer"
    />
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <p class="text-surface-500">Project not found</p>
  </div>
</template>
