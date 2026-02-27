<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { Project, TimeCategory } from '@/types'
import { format } from 'date-fns'
import { timeCategories } from '@/data/mockData'

interface Props {
  project: Project
}

const props = defineProps<Props>()
const store = useProjectStore()

const totalTime = computed(() => store.getTotalTimeForProject(props.project.id))
const timeByCategory = computed(() => store.getTimeByCategory(props.project.id))

// Calculate total quoted hours
const totalQuoted = computed(() => {
  return Object.values(props.project.quotedHours || {}).reduce((sum, h) => sum + (h || 0), 0)
})

// Get all categories (both quoted and used)
const allCategories = computed(() => {
  const categories = new Set<TimeCategory>()
  
  // Add categories with quoted hours
  Object.keys(props.project.quotedHours || {}).forEach(cat => {
    categories.add(cat as TimeCategory)
  })
  
  // Add categories with logged hours
  Object.keys(timeByCategory.value).forEach(cat => {
    categories.add(cat as TimeCategory)
  })
  
  // Sort by the order in timeCategories
  return Array.from(categories).sort((a, b) => {
    const aIndex = timeCategories.indexOf(a as any)
    const bIndex = timeCategories.indexOf(b as any)
    return aIndex - bIndex
  })
})

// Calculate percentage used for a category
function getPercentUsed(category: TimeCategory): number {
  const quoted = props.project.quotedHours?.[category] || 0
  const used = timeByCategory.value[category] || 0
  if (quoted === 0) return used > 0 ? 100 : 0
  return Math.round((used / quoted) * 100)
}

// Get status color based on percentage
function getStatusColor(category: TimeCategory): string {
  const percent = getPercentUsed(category)
  if (percent >= 100) return 'text-red-600'
  if (percent >= 80) return 'text-amber-600'
  return 'text-emerald-600'
}

// Get progress bar color
function getProgressBarColor(category: TimeCategory): string {
  const percent = getPercentUsed(category)
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

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
    <div class="grid grid-cols-3 gap-4">
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Quoted Hours</div>
        <div class="text-2xl font-semibold text-surface-900">{{ totalQuoted }}h</div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Hours Used</div>
        <div class="text-2xl font-semibold" :class="totalTime > totalQuoted ? 'text-red-600' : 'text-surface-900'">
          {{ totalTime }}h
        </div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Remaining</div>
        <div class="text-2xl font-semibold" :class="totalQuoted - totalTime < 0 ? 'text-red-600' : 'text-emerald-600'">
          {{ totalQuoted - totalTime }}h
        </div>
      </div>
    </div>

    <!-- Hours by Category - Quoted vs Used -->
    <div class="card p-4">
      <h3 class="font-medium text-surface-900 mb-4">Hours by Category</h3>
      <div class="space-y-4">
        <div 
          v-for="category in allCategories" 
          :key="category"
          class="space-y-2"
        >
          <div class="flex items-center justify-between">
            <span :class="['badge text-xs', categoryColors[category] || 'bg-surface-100 text-surface-600']">
              {{ category }}
            </span>
            <div class="flex items-center gap-3 text-sm">
              <span class="text-surface-500">
                <span :class="getStatusColor(category)" class="font-medium">{{ timeByCategory[category] || 0 }}h</span>
                <span class="text-surface-400"> / </span>
                <span>{{ project.quotedHours?.[category] || 0 }}h quoted</span>
              </span>
              <span :class="[getStatusColor(category), 'font-medium text-xs w-12 text-right']">
                {{ getPercentUsed(category) }}%
              </span>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div 
              :class="['h-full rounded-full transition-all', getProgressBarColor(category)]"
              :style="{ width: Math.min(getPercentUsed(category), 100) + '%' }"
            />
          </div>
          <!-- Over budget indicator -->
          <div v-if="getPercentUsed(category) > 100" class="text-xs text-red-600">
            {{ (timeByCategory[category] || 0) - (project.quotedHours?.[category] || 0) }}h over budget
          </div>
        </div>
        <div v-if="allCategories.length === 0" class="text-sm text-surface-400 text-center py-4">
          No hours quoted or logged yet
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
