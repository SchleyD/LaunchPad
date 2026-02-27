<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { Project, TimeCategory } from '@/types'
import { format } from 'date-fns'

interface Props {
  project: Project
}

const props = defineProps<Props>()
const store = useProjectStore()

const totalTime = computed(() => store.getTotalTimeForProject(props.project.id))
const timeByCategory = computed(() => store.getTimeByCategory(props.project.id))

const allTimeEntries = computed(() => {
  const entries: Array<{
    taskTitle: string
    entry: {
      id: string
      duration: number
      category: TimeCategory
      note: string
      createdAt: Date
      createdBy: string
    }
  }> = []

  props.project.tasks.forEach(task => {
    task.timeEntries.forEach(entry => {
      entries.push({
        taskTitle: task.title,
        entry
      })
    })
  })

  // Sort by date descending
  return entries.sort((a, b) => 
    new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime()
  )
})

function formatDate(date: Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

const categoryColors: Record<string, string> = {
  'PM Time': 'bg-blue-100 text-blue-700',
  'Application Management / Install': 'bg-emerald-100 text-emerald-700',
  'Build Time': 'bg-amber-100 text-amber-700',
  'DB Conversion': 'bg-purple-100 text-purple-700',
  'Onsite Install – Work': 'bg-orange-100 text-orange-700',
  'Onsite Install – Travel': 'bg-pink-100 text-pink-700'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-4">
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Total Time Logged</div>
        <div class="text-2xl font-semibold text-surface-900">{{ totalTime }}h</div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Time Entries</div>
        <div class="text-2xl font-semibold text-surface-900">{{ allTimeEntries.length }}</div>
      </div>
    </div>

    <!-- Time by Category -->
    <div class="card p-4">
      <h3 class="font-medium text-surface-900 mb-4">Time by Category</h3>
      <div class="space-y-3">
        <div 
          v-for="(hours, category) in timeByCategory" 
          :key="category"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span :class="['badge text-xs', categoryColors[category] || 'bg-surface-100 text-surface-600']">
              {{ category }}
            </span>
          </div>
          <span class="font-medium text-surface-700">{{ hours }}h</span>
        </div>
        <div v-if="Object.keys(timeByCategory).length === 0" class="text-sm text-surface-400 text-center py-4">
          No time logged yet
        </div>
      </div>
    </div>

    <!-- Time Entries List -->
    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-surface-200 bg-surface-50">
        <h3 class="font-medium text-surface-900">Recent Time Entries</h3>
      </div>
      <div v-if="allTimeEntries.length > 0">
        <div 
          v-for="{ taskTitle, entry } in allTimeEntries" 
          :key="entry.id"
          class="px-4 py-3 border-b border-surface-100 last:border-0"
        >
          <div class="flex items-start justify-between mb-1">
            <span class="text-sm font-medium text-surface-900">{{ taskTitle }}</span>
            <span class="font-semibold text-surface-700">{{ entry.duration }}h</span>
          </div>
          <div class="flex items-center gap-2">
            <span :class="['text-xs px-1.5 py-0.5 rounded', categoryColors[entry.category] || 'bg-surface-100 text-surface-600']">
              {{ entry.category }}
            </span>
            <span class="text-xs text-surface-400">{{ formatDate(entry.createdAt) }}</span>
            <span class="text-xs text-surface-400">by {{ entry.createdBy }}</span>
          </div>
          <p v-if="entry.note" class="text-xs text-surface-500 mt-1">{{ entry.note }}</p>
        </div>
      </div>
      <div v-else class="p-8 text-center">
        <p class="text-surface-500">No time entries yet</p>
      </div>
    </div>
  </div>
</template>
