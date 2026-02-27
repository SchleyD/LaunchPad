<script setup lang="ts">
import type { Project } from '@/types'
import ProgressBar from './ProgressBar.vue'

interface Props {
  project: Project
  progress: number
}

defineProps<Props>()
</script>

<template>
  <div class="card p-4 hover:shadow-md transition-shadow cursor-pointer">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-medium text-surface-900">{{ project.name }}</h3>
        <p class="text-sm text-surface-500">{{ project.customer }}</p>
      </div>
      <span 
        v-if="project.blocked" 
        class="badge-danger"
      >
        Blocked
      </span>
    </div>
    
    <div class="flex items-center gap-3 mb-3">
      <span class="text-xs text-surface-500">WO:</span>
      <span class="text-sm font-mono text-surface-700">{{ project.workOrderId }}</span>
    </div>
    
    <div class="flex items-center gap-3">
      <ProgressBar :value="progress" class="flex-1" />
      <span class="text-sm font-semibold text-surface-700">{{ progress }}%</span>
    </div>
  </div>
</template>
