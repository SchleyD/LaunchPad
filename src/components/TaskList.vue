<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskStatus } from '@/types'

interface Props {
  tasks: Task[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  selectTask: [task: Task]
}>()

type SortKey = 'title' | 'milestone' | 'status' | 'owner' | 'time'
type SortDirection = 'asc' | 'desc'

const sortKey = ref<SortKey>('milestone')
const sortDirection = ref<SortDirection>('asc')

const statusOrder: Record<TaskStatus, number> = {
  'Blocked': 0,
  'InProgress': 1,
  'Waiting': 2,
  'Ready': 3,
  'Backlog': 4,
  'Done': 5,
  'Canceled': 6
}

const sortedTasks = computed(() => {
  const tasksCopy = [...props.tasks]
  
  return tasksCopy.sort((a, b) => {
    let comparison = 0
    
    switch (sortKey.value) {
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'milestone':
        comparison = a.milestone - b.milestone
        break
      case 'status':
        comparison = statusOrder[a.status] - statusOrder[b.status]
        break
      case 'owner':
        comparison = a.owner.localeCompare(b.owner)
        break
      case 'time':
        comparison = getTotalTime(a) - getTotalTime(b)
        break
    }
    
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    'Backlog': 'bg-surface-100 text-surface-600',
    'Ready': 'bg-blue-100 text-blue-700',
    'InProgress': 'bg-amber-100 text-amber-700',
    'Blocked': 'bg-red-100 text-red-700',
    'Waiting': 'bg-orange-100 text-orange-700',
    'Done': 'bg-emerald-100 text-emerald-700',
    'Canceled': 'bg-surface-100 text-surface-400 line-through'
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

const getTotalTime = (task: Task): number => {
  return task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
}
</script>

<template>
  <div class="card overflow-hidden">
    <table class="w-full">
      <thead class="bg-surface-50 border-b border-surface-200">
        <tr>
          <th 
            class="table-header px-4 py-3 text-left cursor-pointer hover:bg-surface-100 transition-colors select-none"
            @click="toggleSort('title')"
          >
            <div class="flex items-center gap-1">
              Task
              <svg 
                v-if="sortKey === 'title'" 
                class="w-3.5 h-3.5 text-primary-500 transition-transform"
                :class="{ 'rotate-180': sortDirection === 'desc' }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <svg 
                v-else 
                class="w-3.5 h-3.5 text-surface-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </th>
          <th 
            class="table-header px-4 py-3 text-left w-24 cursor-pointer hover:bg-surface-100 transition-colors select-none"
            @click="toggleSort('milestone')"
          >
            <div class="flex items-center gap-1">
              Milestone
              <svg 
                v-if="sortKey === 'milestone'" 
                class="w-3.5 h-3.5 text-primary-500 transition-transform"
                :class="{ 'rotate-180': sortDirection === 'desc' }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <svg 
                v-else 
                class="w-3.5 h-3.5 text-surface-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </th>
          <th 
            class="table-header px-4 py-3 text-left w-28 cursor-pointer hover:bg-surface-100 transition-colors select-none"
            @click="toggleSort('status')"
          >
            <div class="flex items-center gap-1">
              Status
              <svg 
                v-if="sortKey === 'status'" 
                class="w-3.5 h-3.5 text-primary-500 transition-transform"
                :class="{ 'rotate-180': sortDirection === 'desc' }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <svg 
                v-else 
                class="w-3.5 h-3.5 text-surface-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </th>
          <th 
            class="table-header px-4 py-3 text-left w-20 cursor-pointer hover:bg-surface-100 transition-colors select-none"
            @click="toggleSort('owner')"
          >
            <div class="flex items-center gap-1">
              Owner
              <svg 
                v-if="sortKey === 'owner'" 
                class="w-3.5 h-3.5 text-primary-500 transition-transform"
                :class="{ 'rotate-180': sortDirection === 'desc' }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <svg 
                v-else 
                class="w-3.5 h-3.5 text-surface-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </th>
          <th 
            class="table-header px-4 py-3 text-left w-20 cursor-pointer hover:bg-surface-100 transition-colors select-none"
            @click="toggleSort('time')"
          >
            <div class="flex items-center gap-1">
              Time
              <svg 
                v-if="sortKey === 'time'" 
                class="w-3.5 h-3.5 text-primary-500 transition-transform"
                :class="{ 'rotate-180': sortDirection === 'desc' }"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <svg 
                v-else 
                class="w-3.5 h-3.5 text-surface-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-100">
        <tr 
          v-for="task in sortedTasks" 
          :key="task.id"
          class="hover:bg-surface-50 cursor-pointer transition-colors"
          @click="emit('selectTask', task)"
        >
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <span 
                :class="[
                  'font-medium',
                  task.status === 'Canceled' ? 'text-surface-400 line-through' : 'text-surface-900'
                ]"
              >
                {{ task.title }}
              </span>
              <span v-if="task.category === 'Punch List'" class="pill">Punch List</span>
            </div>
            <div v-if="task.comments.length > 0" class="text-xs text-surface-400 mt-0.5">
              {{ task.comments.length }} comment{{ task.comments.length !== 1 ? 's' : '' }}
            </div>
          </td>
          <td class="px-4 py-3">
            <span class="pill">{{ task.milestone }}%</span>
          </td>
          <td class="px-4 py-3">
            <span :class="['badge', getStatusColor(task.status)]">
              {{ getStatusLabel(task.status) }}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-xs font-medium text-primary-700">{{ task.owner }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <span class="text-sm text-surface-600">
              {{ getTotalTime(task) > 0 ? `${getTotalTime(task)}h` : '-' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="sortedTasks.length === 0" class="p-8 text-center">
      <p class="text-surface-500">No tasks match the current filters</p>
    </div>
  </div>
</template>
