<script setup lang="ts">
import { useProjectStore } from '@/stores/projects'
import type { ReviewNote } from '@/types'
import { format } from 'date-fns'

interface Props {
  note: ReviewNote
  projectId: string
}

const props = defineProps<Props>()
const store = useProjectStore()

function markAsReviewed() {
  store.markNoteAsReviewed(props.projectId, props.note.id)
}

function convertToTask() {
  store.convertNoteToTask(props.projectId, props.note.id)
}

async function convertToActionItem() {
  await store.convertNoteToActionItem(props.projectId, props.note.id)
}

function formatDate(date: Date): string {
  return format(new Date(date), 'MMM d, h:mm a')
}
</script>

<template>
  <div 
    :class="[
      'rounded-lg p-3 border',
      note.isReviewed 
        ? 'bg-surface-50 border-surface-200' 
        : 'bg-amber-50 border-amber-200'
    ]"
  >
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <p :class="['text-sm', note.isReviewed ? 'text-surface-500' : 'text-surface-800']">
          {{ note.text }}
        </p>
        <div class="flex items-center gap-2 mt-2 text-xs text-surface-400">
          <span>{{ note.createdBy }}</span>
          <span>{{ formatDate(note.createdAt) }}</span>
          <span v-if="note.isReviewed && note.reviewedAt" class="text-emerald-600">
            Reviewed {{ formatDate(note.reviewedAt) }}
          </span>
        </div>
      </div>
      
      <div v-if="!note.isReviewed" class="flex items-center gap-1 shrink-0">
        <button 
          @click="convertToTask"
          class="btn-ghost text-xs px-2 py-1"
          title="Create Task for our team"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Task
        </button>
        <button 
          @click="convertToActionItem"
          class="btn-ghost text-xs px-2 py-1 text-amber-600 hover:bg-amber-50"
          title="Create Customer Action Item"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Customer
        </button>
        <button 
          @click="markAsReviewed"
          class="btn-ghost text-xs px-2 py-1 text-emerald-600 hover:bg-emerald-50"
          title="Mark as Reviewed"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Done
        </button>
      </div>
      
      <div v-else class="shrink-0">
        <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  </div>
</template>
