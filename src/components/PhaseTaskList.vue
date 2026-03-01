<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskStatus, TaskPhase } from '@/types'
import { useProjectStore } from '@/stores/projects'

const projectStore = useProjectStore()

// Phase color mapping (using primary brand color for consistency)
const getPhaseColor = (phase: string): string => {
  const colors: Record<string, string> = {
    'Special Proj. Notes': 'bg-red-500',
    'Inhouse Planning': 'bg-primary-500',
    'Inhouse-HW/SW': 'bg-primary-600',
    'Inhouse Documentation': 'bg-primary-500',
    'Onsite': 'bg-teal-600',
    'Shipping/Install': 'bg-amber-500',
    'Go Live-Follow Up': 'bg-emerald-500'
  }
  return colors[phase] || 'bg-primary-500'
}

interface Props {
  tasks: Task[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  selectTask: [task: Task]
}>()

// Track collapsed phases and parent tasks
const collapsedPhases = ref<Set<TaskPhase>>(new Set())
const collapsedTasks = ref<Set<string>>(new Set())

// Build task hierarchy - parent tasks with subtasks nested
const taskHierarchy = computed(() => {
  const parentTasks: Task[] = []
  const subtaskMap: Map<string, Task[]> = new Map()
  
  // Separate parent tasks from subtasks
  props.tasks.forEach(task => {
    if (task.parentTaskId) {
      // This is a subtask
      const existing = subtaskMap.get(task.parentTaskId) || []
      existing.push(task)
      subtaskMap.set(task.parentTaskId, existing)
    } else {
      // This is a parent task (or standalone)
      parentTasks.push(task)
    }
  })
  
  // Attach subtasks to parent tasks
  parentTasks.forEach(task => {
    task.subtasks = subtaskMap.get(task.id) || []
  })
  
  return parentTasks
})

// Group tasks by phase (only parent-level tasks)
const tasksByPhase = computed(() => {
  const grouped: Record<TaskPhase, Task[]> = {} as Record<TaskPhase, Task[]>
  
  // Initialize all phases from store
  projectStore.phases.forEach(phase => {
    grouped[phase] = []
  })
  
  // Group parent tasks (subtasks will be nested inside)
  taskHierarchy.value.forEach(task => {
    const phase = task.phase || 'Inhouse Planning' // Default phase
    if (grouped[phase]) {
      grouped[phase].push(task)
    }
  })
  
  return grouped
})

// Phases that have tasks
const activePhases = computed(() => {
  return projectStore.phases.filter(phase => tasksByPhase.value[phase]?.length > 0)
})

// Phase stats
function getPhaseStats(phase: TaskPhase) {
  const tasks = tasksByPhase.value[phase]
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'Done').length
  const inProgress = tasks.filter(t => t.status === 'InProgress').length
  const blocked = tasks.filter(t => t.status === 'Blocked').length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return { total, completed, inProgress, blocked, percent }
}

function togglePhase(phase: TaskPhase) {
  if (collapsedPhases.value.has(phase)) {
    collapsedPhases.value.delete(phase)
  } else {
    collapsedPhases.value.add(phase)
  }
}

function toggleTask(taskId: string) {
  if (collapsedTasks.value.has(taskId)) {
    collapsedTasks.value.delete(taskId)
  } else {
    collapsedTasks.value.add(taskId)
  }
}

function hasSubtasks(task: Task): boolean {
  return (task.subtasks?.length || 0) > 0
}

function getSubtaskStats(task: Task) {
  const subtasks = task.subtasks || []
  const total = subtasks.length
  const completed = subtasks.filter(t => t.status === 'Done').length
  return { total, completed }
}

const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    'Backlog': 'bg-surface-100 text-surface-600',
    'Ready': 'bg-blue-100 text-blue-700',
    'InProgress': 'bg-amber-100 text-amber-700',
    'Blocked': 'bg-red-100 text-red-700',
    'Waiting': 'bg-orange-100 text-orange-700',
    'Done': 'bg-emerald-100 text-emerald-700',
    'Canceled': 'bg-surface-100 text-surface-400'
  }
  return colors[status]
}

const getStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    'Backlog': 'Backlog',
    'Ready': 'Ready',
    'InProgress': 'In Progress',
    'Blocked': 'Blocked',
    'Waiting': 'Waiting',
    'Done': 'Done',
    'Canceled': 'Canceled'
  }
  return labels[status]
}

// Sort tasks within phase: blocked first, then in progress, then by status
function sortTasks(tasks: Task[]): Task[] {
  const statusOrder: Record<TaskStatus, number> = {
    'Blocked': 0,
    'InProgress': 1,
    'Waiting': 2,
    'Ready': 3,
    'Backlog': 4,
    'Done': 5,
    'Canceled': 6
  }
  
  return [...tasks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
}

// Get progress bar segment widths
function getProgressSegments(phase: TaskPhase) {
  const stats = getPhaseStats(phase)
  if (stats.total === 0) return { done: 0, inProgress: 0, blocked: 0 }
  
  return {
    done: (stats.completed / stats.total) * 100,
    inProgress: (stats.inProgress / stats.total) * 100,
    blocked: (stats.blocked / stats.total) * 100
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Empty state -->
    <div v-if="activePhases.length === 0" class="card p-8 text-center">
      <p class="text-surface-500">No tasks in this project yet</p>
    </div>

    <!-- Phase sections -->
    <div 
      v-for="phase in activePhases" 
      :key="phase"
      class="card overflow-hidden"
    >
      <!-- Phase Header -->
      <button
        @click="togglePhase(phase)"
        class="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-50 transition-colors"
      >
        <!-- Collapse indicator -->
        <svg 
          class="w-4 h-4 text-surface-400 transition-transform shrink-0"
          :class="{ '-rotate-90': collapsedPhases.has(phase) }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        
        <!-- Phase badge -->
        <span 
          :class="[
            'px-2.5 py-1 rounded text-xs font-semibold text-white shrink-0',
            getPhaseColor(phase)
          ]"
        >
          {{ phase }}
        </span>
        
        <!-- Task count -->
        <span class="text-sm text-surface-500">
          {{ getPhaseStats(phase).total }} {{ getPhaseStats(phase).total === 1 ? 'Task' : 'Tasks' }}
        </span>
        
        <!-- Progress bar -->
        <div class="flex-1 mx-4">
          <div class="h-2 bg-surface-100 rounded-full overflow-hidden flex">
            <div 
              class="bg-teal-500 transition-all duration-300"
              :style="{ width: `${getProgressSegments(phase).done}%` }"
            />
            <div 
              class="bg-amber-400 transition-all duration-300"
              :style="{ width: `${getProgressSegments(phase).inProgress}%` }"
            />
            <div 
              class="bg-red-400 transition-all duration-300"
              :style="{ width: `${getProgressSegments(phase).blocked}%` }"
            />
          </div>
        </div>
        
        <!-- Stats summary -->
        <div class="flex items-center gap-3 text-xs shrink-0">
          <span v-if="getPhaseStats(phase).blocked > 0" class="text-red-600 font-medium">
            {{ getPhaseStats(phase).blocked }} blocked
          </span>
          <span class="text-surface-500">
            {{ getPhaseStats(phase).completed }}/{{ getPhaseStats(phase).total }}
          </span>
        </div>
      </button>

      <!-- Tasks list (collapsible) -->
      <div 
        v-if="!collapsedPhases.has(phase)"
        class="border-t border-surface-100"
      >
        <div 
          v-for="task in sortTasks(tasksByPhase[phase])"
          :key="task.id"
          class="border-b border-surface-50 last:border-b-0"
        >
          <!-- Parent task row -->
          <div 
            class="px-4 py-3 flex items-center gap-3 hover:bg-surface-50 cursor-pointer transition-colors"
          >
            <!-- Subtask expand/collapse -->
            <button
              v-if="hasSubtasks(task)"
              @click.stop="toggleTask(task.id)"
              class="p-0.5 -ml-1 hover:bg-surface-200 rounded transition-colors"
            >
              <svg 
                class="w-4 h-4 text-surface-400 transition-transform"
                :class="{ '-rotate-90': collapsedTasks.has(task.id) }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-else class="w-5" />
            
            <!-- Checkbox visual -->
            <div 
              @click="emit('selectTask', task)"
              :class="[
                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                task.status === 'Done' 
                  ? 'bg-teal-500 border-teal-500' 
                  : task.status === 'Blocked'
                    ? 'border-red-400'
                    : task.status === 'InProgress'
                      ? 'border-amber-400'
                      : 'border-surface-300'
              ]"
            >
              <svg 
                v-if="task.status === 'Done'"
                class="w-3 h-3 text-white" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div 
                v-else-if="task.status === 'InProgress'"
                class="w-2 h-2 rounded-full bg-amber-400"
              />
            </div>
            
            <!-- Task title -->
            <span 
              @click="emit('selectTask', task)"
              :class="[
                'flex-1 text-sm',
                task.status === 'Done' ? 'text-surface-400 line-through' : 'text-surface-900',
                task.status === 'Canceled' && 'text-surface-400 line-through'
              ]"
            >
              {{ task.title }}
            </span>
            
            <!-- Subtask count badge -->
            <span 
              v-if="hasSubtasks(task)"
              class="text-xs text-surface-500 bg-surface-100 px-2 py-0.5 rounded-full"
            >
              {{ getSubtaskStats(task).completed }}/{{ getSubtaskStats(task).total }}
            </span>
            
            <!-- Status badge (if not done) -->
            <span 
              v-if="task.status !== 'Done' && task.status !== 'Backlog'"
              :class="['badge text-xs', getStatusColor(task.status)]"
            >
              {{ getStatusLabel(task.status) }}
            </span>
            
            <!-- Owner avatar -->
            <div 
              @click="emit('selectTask', task)"
              class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center shrink-0"
            >
              <span class="text-xs font-medium text-primary-700">{{ task.owner }}</span>
            </div>
          </div>
          
          <!-- Subtasks (collapsible) -->
          <div 
            v-if="hasSubtasks(task) && !collapsedTasks.has(task.id)"
            class="bg-surface-50"
          >
            <div 
              v-for="subtask in task.subtasks"
              :key="subtask.id"
              @click="emit('selectTask', subtask)"
              class="pl-14 pr-4 py-2 flex items-center gap-3 hover:bg-surface-100 cursor-pointer transition-colors border-t border-surface-100"
            >
              <!-- Subtask checkbox -->
              <div 
                :class="[
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                  subtask.status === 'Done' 
                    ? 'bg-teal-500 border-teal-500' 
                    : subtask.status === 'Blocked'
                      ? 'border-red-400'
                      : subtask.status === 'InProgress'
                        ? 'border-amber-400'
                        : 'border-surface-300'
                ]"
              >
                <svg 
                  v-if="subtask.status === 'Done'"
                  class="w-2.5 h-2.5 text-white" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <!-- Subtask title -->
              <span 
                :class="[
                  'flex-1 text-sm',
                  subtask.status === 'Done' ? 'text-surface-400 line-through' : 'text-surface-700',
                ]"
              >
                {{ subtask.title }}
              </span>
              
              <!-- Subtask status -->
              <span 
                v-if="subtask.status !== 'Done' && subtask.status !== 'Backlog'"
                :class="['badge text-xs', getStatusColor(subtask.status)]"
              >
                {{ getStatusLabel(subtask.status) }}
              </span>
              
              <!-- Subtask owner -->
              <div class="w-5 h-5 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                <span class="text-[10px] font-medium text-primary-600">{{ subtask.owner }}</span>
              </div>
            </div>
            
            <!-- Add subtask button -->
            <button class="w-full pl-14 pr-4 py-2 text-xs text-surface-400 hover:text-surface-600 hover:bg-surface-100 flex items-center gap-2 transition-colors border-t border-surface-100">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add subtask
            </button>
          </div>
        </div>
        
        <!-- Add task button -->
        <button class="w-full px-4 py-2 text-sm text-surface-400 hover:text-surface-600 hover:bg-surface-50 flex items-center gap-2 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      </div>
    </div>
  </div>
</template>
