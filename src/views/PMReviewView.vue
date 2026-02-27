<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import type { ProjectChangeSummary } from '@/types'
import { format, subDays } from 'date-fns'
import ProgressBar from '@/components/ProgressBar.vue'
import ReviewNoteCard from '@/components/ReviewNoteCard.vue'
import { mockUsers } from '@/data/mockData'

const router = useRouter()
const store = useProjectStore()

const comparisonDate = ref<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
const filterOwner = ref<string>('All')

const projectsForReview = computed(() => {
  // Active projects + recently closed
  const active = store.activeProjects
  const recentlyClosed = store.projectsClosedSinceLastReview
  return [...active, ...recentlyClosed]
})

const projectSummaries = computed((): ProjectChangeSummary[] => {
  return projectsForReview.value.map(p => store.getProjectChangeSummary(p))
})

// Filter by owner then sort: Blocked first, then by unreviewed notes, then by progress change
const sortedSummaries = computed(() => {
  return [...projectSummaries.value]
    .filter(s => filterOwner.value === 'All' || s.project.owner === filterOwner.value)
    .sort((a, b) => {
      // Blocked projects first
      if (a.hasBlockedTasks && !b.hasBlockedTasks) return -1
      if (!a.hasBlockedTasks && b.hasBlockedTasks) return 1
      
      // Then by unreviewed notes
      if (a.unreviewedNotes !== b.unreviewedNotes) {
        return b.unreviewedNotes - a.unreviewedNotes
      }
      
      // Then by progress change (ascending - stalled projects first)
      return a.progressChange - b.progressChange
    })
})

// Get unique owners from active projects for filter
const projectOwners = computed(() => {
  const owners = new Set(projectsForReview.value.map(p => p.owner))
  return mockUsers.filter(u => owners.has(u.initials))
})

const totalUnreviewedNotes = computed(() => {
  return projectSummaries.value.reduce((sum, s) => sum + s.unreviewedNotes, 0)
})

const blockedCount = computed(() => {
  return projectSummaries.value.filter(s => s.hasBlockedTasks).length
})

function updateComparisonDate(event: Event) {
  const target = event.target as HTMLInputElement
  store.setLastReviewDate(new Date(target.value))
}

function navigateToProject(projectId: string) {
  router.push(`/project/${projectId}`)
}

const newNoteText = ref<Record<string, string>>({})

function addNote(projectId: string) {
  const text = newNoteText.value[projectId]
  if (!text?.trim()) return
  
  store.addReviewNote(projectId, text.trim())
  newNoteText.value[projectId] = ''
}

const expandedProjects = ref<Set<string>>(new Set())

function toggleProject(projectId: string) {
  if (expandedProjects.value.has(projectId)) {
    expandedProjects.value.delete(projectId)
  } else {
    expandedProjects.value.add(projectId)
  }
}

function isExpanded(projectId: string): boolean {
  return expandedProjects.value.has(projectId)
}
</script>

<template>
  <div class="max-w-5xl">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-surface-900">PM Review</h1>
      <p class="text-sm text-surface-500 mt-1">Weekly project status review</p>
    </div>

    <!-- Owner Filter -->
    <div class="flex items-center gap-2 mb-6">
      <span class="text-sm text-surface-600">Filter by Owner:</span>
      <button
        @click="filterOwner = 'All'"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          filterOwner === 'All' 
            ? 'bg-slate-800 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        All ({{ projectSummaries.length }})
      </button>
      <button
        v-for="owner in projectOwners"
        :key="owner.id"
        @click="filterOwner = owner.initials"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
          filterOwner === owner.initials 
            ? 'bg-primary-600 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        <span class="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
          {{ owner.initials }}
        </span>
        {{ owner.name }} ({{ projectSummaries.filter(s => s.project.owner === owner.initials).length }})
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Active Projects</div>
        <div class="text-2xl font-semibold text-surface-900">{{ store.activeProjects.length }}</div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Blocked</div>
        <div class="text-2xl font-semibold" :class="blockedCount > 0 ? 'text-red-600' : 'text-surface-900'">
          {{ blockedCount }}
        </div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Needs Review</div>
        <div class="text-2xl font-semibold" :class="totalUnreviewedNotes > 0 ? 'text-amber-600' : 'text-surface-900'">
          {{ totalUnreviewedNotes }}
        </div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-surface-500 mb-1">Comparison Date</div>
        <input 
          type="date"
          :value="comparisonDate"
          @change="updateComparisonDate"
          class="input text-sm py-1 mt-1"
        />
      </div>
    </div>

    <!-- Projects List -->
    <div class="space-y-4">
      <div 
        v-for="summary in sortedSummaries" 
        :key="summary.project.id"
        class="card overflow-hidden"
      >
        <!-- Project Header -->
        <div 
          class="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-surface-50 transition-colors"
          @click="toggleProject(summary.project.id)"
        >
          <!-- Expand/Collapse Icon -->
          <svg 
            :class="[
              'w-4 h-4 text-surface-400 transition-transform',
              isExpanded(summary.project.id) ? 'rotate-90' : ''
            ]"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>

          <!-- Project Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-surface-900">{{ summary.project.name }}</span>
              <span v-if="summary.hasBlockedTasks" class="badge-danger">Blocked</span>
              <span v-if="summary.unreviewedNotes > 0" class="badge-warning">
                {{ summary.unreviewedNotes }} note{{ summary.unreviewedNotes !== 1 ? 's' : '' }}
              </span>
              <span v-if="summary.project.status === 'Closed'" class="badge-neutral">Closed</span>
            </div>
            <div class="text-xs text-surface-500 mt-0.5">
              {{ summary.project.customer }} | WO: {{ summary.project.workOrderId }}
            </div>
          </div>

          <!-- Progress -->
          <div class="w-32 flex items-center gap-2">
            <ProgressBar :value="summary.currentProgress" class="flex-1" />
            <span class="text-sm font-medium text-surface-700 w-10 text-right">
              {{ summary.currentProgress }}%
            </span>
          </div>

          <!-- Change Indicator -->
          <div class="w-16 text-right">
            <span 
              v-if="summary.progressChange > 0"
              class="text-sm font-medium text-emerald-600"
            >
              +{{ summary.progressChange }}%
            </span>
            <span 
              v-else-if="summary.progressChange < 0"
              class="text-sm font-medium text-red-600"
            >
              {{ summary.progressChange }}%
            </span>
            <span 
              v-else
              class="text-sm text-surface-400"
            >
              --
            </span>
          </div>

          <!-- View Project Link -->
          <button 
            @click.stop="navigateToProject(summary.project.id)"
            class="btn-ghost text-sm px-3 py-1"
          >
            View
          </button>
        </div>

        <!-- Expanded Content -->
        <div v-if="isExpanded(summary.project.id)" class="border-t border-surface-200">
          <!-- Change Summary -->
          <div class="px-4 py-3 bg-surface-50 flex items-center gap-6 text-sm">
            <div class="flex items-center gap-1">
              <span class="text-surface-500">Tasks Added:</span>
              <span class="font-medium">{{ summary.tasksAdded }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-surface-500">Completed:</span>
              <span class="font-medium">{{ summary.tasksCompleted }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-surface-500">Owner:</span>
              <div class="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-[10px] font-medium text-primary-700">{{ summary.project.owner }}</span>
              </div>
            </div>
          </div>

          <!-- Review Notes -->
          <div class="p-4">
            <h4 class="text-sm font-medium text-surface-700 mb-3">Review Notes</h4>
            
            <!-- Existing Notes -->
            <div v-if="summary.project.reviewNotes.length > 0" class="space-y-2 mb-4">
              <ReviewNoteCard 
                v-for="note in summary.project.reviewNotes"
                :key="note.id"
                :note="note"
                :project-id="summary.project.id"
              />
            </div>
            <div v-else class="text-sm text-surface-400 mb-4">
              No review notes
            </div>

            <!-- Add Note Form -->
            <div class="flex gap-2">
              <input 
                v-model="newNoteText[summary.project.id]"
                type="text"
                placeholder="Add a review note..."
                class="input text-sm flex-1"
                @keyup.enter="addNote(summary.project.id)"
              />
              <button 
                @click="addNote(summary.project.id)"
                :disabled="!newNoteText[summary.project.id]?.trim()"
                class="btn-primary text-sm"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="projectsForReview.length === 0" class="card p-12 text-center">
      <p class="text-surface-500">No projects to review</p>
    </div>
  </div>
</template>
