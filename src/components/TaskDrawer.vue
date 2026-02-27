<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { Task, TaskStatus, TimeCategory } from '@/types'
import { timeCategories } from '@/data/mockData'
import { format } from 'date-fns'

interface Props {
  task: Task
  projectId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const store = useProjectStore()

// Time entry form
const timeAmount = ref<number | null>(null)
const timeCategory = ref<TimeCategory>(getDefaultTimeCategory())
const timeNote = ref('')

// Comment form
const newComment = ref('')

function getDefaultTimeCategory(): TimeCategory {
  // Default based on task category
  const categoryDefaults: Record<string, TimeCategory> = {
    'Setup': 'PM Time',
    'Configuration': 'Application Management / Install',
    'Installation': 'Onsite Install – Work',
    'Training': 'PM Time',
    'Testing': 'Application Management / Install',
    'Documentation': 'PM Time',
    'Punch List': 'PM Time'
  }
  return categoryDefaults[props.task.category] || 'PM Time'
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'Backlog', label: 'Backlog' },
  { value: 'Ready', label: 'Ready' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Blocked', label: 'Blocked' },
  { value: 'Waiting', label: 'Waiting' },
  { value: 'Done', label: 'Done' },
  { value: 'Canceled', label: 'Canceled' },
]

const totalTime = computed(() => {
  return props.task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
})

function updateStatus(newStatus: TaskStatus) {
  store.updateTaskStatus(props.projectId, props.task.id, newStatus)
}

function addTimeEntry() {
  if (timeAmount.value === null || timeAmount.value <= 0) return

  store.addTimeEntry(
    props.projectId,
    props.task.id,
    timeAmount.value,
    timeCategory.value,
    timeNote.value
  )

  // Reset form
  timeAmount.value = null
  timeNote.value = ''
}

function addComment() {
  if (!newComment.value.trim()) return

  store.addTaskComment(props.projectId, props.task.id, newComment.value.trim())
  newComment.value = ''
}

function formatDate(date: Date): string {
  return format(new Date(date), 'MMM d, h:mm a')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/20" @click="emit('close')" />
    
    <!-- Drawer -->
    <div class="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-surface-200 px-6 py-4 z-10">
        <div class="flex items-start justify-between">
          <div class="flex-1 pr-4">
            <h2 class="text-lg font-semibold text-surface-900">{{ task.title }}</h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="pill">{{ task.milestone }}%</span>
              <span class="text-xs text-surface-400">{{ task.category }}</span>
            </div>
          </div>
          <button 
            @click="emit('close')"
            class="p-1 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Status -->
        <div>
          <label class="label">Status</label>
          <select 
            :value="task.status"
            @change="updateStatus(($event.target as HTMLSelectElement).value as TaskStatus)"
            class="select"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Owner -->
        <div>
          <label class="label">Owner</label>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-primary-700">{{ task.owner }}</span>
            </div>
          </div>
        </div>

        <!-- Time Entry Section -->
        <div class="border-t border-surface-200 pt-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-surface-900">Time Tracking</h3>
            <span class="text-sm text-surface-500">Total: {{ totalTime }}h</span>
          </div>

          <!-- Quick Time Entry Form -->
          <div class="bg-surface-50 rounded-lg p-4 space-y-3">
            <div class="flex gap-3">
              <div class="w-24">
                <label class="text-xs text-surface-500 mb-1 block">Hours</label>
                <input 
                  v-model="timeAmount"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="0.5"
                  class="input text-sm"
                />
              </div>
              <div class="flex-1">
                <label class="text-xs text-surface-500 mb-1 block">Category</label>
                <select v-model="timeCategory" class="select text-sm">
                  <option v-for="cat in timeCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-xs text-surface-500 mb-1 block">Note (optional)</label>
              <input 
                v-model="timeNote"
                type="text"
                placeholder="Brief description..."
                class="input text-sm"
              />
            </div>
            <button 
              @click="addTimeEntry"
              :disabled="timeAmount === null || timeAmount <= 0"
              class="btn-primary w-full text-sm"
            >
              Log Time
            </button>
          </div>

          <!-- Time Entries List -->
          <div v-if="task.timeEntries.length > 0" class="mt-4 space-y-2">
            <div 
              v-for="entry in task.timeEntries" 
              :key="entry.id"
              class="flex items-start gap-3 text-sm"
            >
              <span class="font-medium text-surface-700 w-12">{{ entry.duration }}h</span>
              <div class="flex-1">
                <div class="text-surface-600">{{ entry.category }}</div>
                <div v-if="entry.note" class="text-surface-400 text-xs">{{ entry.note }}</div>
              </div>
              <span class="text-xs text-surface-400">{{ formatDate(entry.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="border-t border-surface-200 pt-6">
          <h3 class="font-medium text-surface-900 mb-3">Comments</h3>

          <!-- Add Comment -->
          <div class="flex gap-2 mb-4">
            <input 
              v-model="newComment"
              type="text"
              placeholder="Add a comment..."
              class="input text-sm flex-1"
              @keyup.enter="addComment"
            />
            <button 
              @click="addComment"
              :disabled="!newComment.trim()"
              class="btn-secondary text-sm"
            >
              Add
            </button>
          </div>

          <!-- Comments List -->
          <div v-if="task.comments.length > 0" class="space-y-3">
            <div 
              v-for="comment in task.comments" 
              :key="comment.id"
              class="bg-surface-50 rounded-lg p-3"
            >
              <div class="flex items-center gap-2 mb-1">
                <div class="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-[10px] font-medium text-primary-700">{{ comment.createdBy }}</span>
                </div>
                <span class="text-xs text-surface-400">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="text-sm text-surface-700">{{ comment.text }}</p>
            </div>
          </div>
          <div v-else class="text-sm text-surface-400 text-center py-4">
            No comments yet
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
