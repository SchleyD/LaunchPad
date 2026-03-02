<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import type { ProjectChangeSummary } from '@/types'
import { format, subDays } from 'date-fns'
import ProgressBar from '@/components/ProgressBar.vue'
import ReviewNoteCard from '@/components/ReviewNoteCard.vue'
import { mockUsers } from '@/data/mockData'

const router = useRouter()
const store = useProjectStore()

// Sync with store's lastReviewDate
const comparisonDate = computed(() => format(store.lastReviewDate, 'yyyy-MM-dd'))
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

function markReviewComplete() {
  // Set the "since" date to now - next time you review, only changes after this moment will show
  store.setLastReviewDate(new Date())
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
  <div class="max-w-5xl mx-auto">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-surface-800">PM Review</h1>
        <p class="text-sm text-surface-500 mt-1">
          Showing changes since <span class="font-medium text-surface-700">{{ format(store.lastReviewDate, 'MMM d, yyyy') }}</span>
        </p>
      </div>
      <button 
        @click="markReviewComplete"
        class="btn-primary text-sm"
      >
        Mark Review Complete
      </button>
    </div>

    <!-- Owner Filter - horizontal scroll on mobile -->
    <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <span class="text-sm text-surface-500 whitespace-nowrap">Filter:</span>
      <button
        @click="filterOwner = 'All'"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
          filterOwner === 'All' 
            ? 'bg-primary-500 text-white' 
            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
        ]"
      >
        All ({{ projectSummaries.length }})
      </button>
      <button
        v-for="owner in projectOwners"
        :key="owner.id"
        @click="filterOwner = owner.initials"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap',
          filterOwner === owner.initials 
            ? 'bg-primary-500 text-white' 
            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
        ]"
      >
        <span class="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
          {{ owner.initials }}
        </span>
        {{ owner.name }} ({{ projectSummaries.filter(s => s.project.owner === owner.initials).length }})
      </button>
    </div>

    <!-- Summary Stats - 2x2 grid on mobile -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card p-3">
        <div class="text-xs text-surface-500">Active</div>
        <div class="text-xl font-semibold text-surface-800">{{ store.activeProjects.length }}</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-surface-500">Blocked</div>
        <div class="text-xl font-semibold" :class="blockedCount > 0 ? 'text-amber-600' : 'text-surface-800'">
          {{ blockedCount }}
        </div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-surface-500">Needs Review</div>
        <div class="text-xl font-semibold" :class="totalUnreviewedNotes > 0 ? 'text-amber-600' : 'text-surface-800'">
          {{ totalUnreviewedNotes }}
        </div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-surface-500">Compare Since</div>
        <input 
          type="date"
          :value="comparisonDate"
          @change="updateComparisonDate"
          class="input text-sm py-0.5 px-1 mt-0.5 w-full"
          title="Change the comparison date to see older changes"
        />
      </div>
    </div>

    <!-- Projects List -->
    <div class="space-y-3">
      <div 
        v-for="summary in sortedSummaries" 
        :key="summary.project.id"
        class="card overflow-hidden"
      >
        <!-- Project Header - stacked layout -->
        <div 
          class="p-4 cursor-pointer hover:bg-surface-50 transition-colors"
          @click="toggleProject(summary.project.id)"
        >
          <!-- Top row: name + badges -->
          <div class="flex items-start gap-3">
            <svg 
              :class="[
                'w-4 h-4 text-surface-400 transition-transform mt-1 shrink-0',
                isExpanded(summary.project.id) ? 'rotate-90' : ''
              ]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-surface-800">{{ summary.project.name }}</span>
                <span v-if="summary.hasBlockedTasks" class="badge-warning text-xs">Blocked</span>
                <span v-if="summary.unreviewedNotes > 0" class="badge-warning text-xs">
                  {{ summary.unreviewedNotes }} note{{ summary.unreviewedNotes !== 1 ? 's' : '' }}
                </span>
              </div>
              <div class="text-xs text-surface-500 mt-1">
                {{ summary.project.customer }} &bull; WO: {{ summary.project.workOrderId }}
              </div>
              
              <!-- Progress row -->
              <div class="flex items-center gap-3 mt-3">
                <div class="flex-1 max-w-[200px]">
                  <ProgressBar :value="summary.currentProgress" />
                </div>
                <span class="text-sm font-medium text-surface-700">
                  {{ summary.currentProgress }}%
                </span>
                <span 
                  v-if="summary.progressChange > 0"
                  class="text-sm font-medium text-emerald-600"
                >
                  +{{ summary.progressChange }}%
                </span>
                <span 
                  v-else-if="summary.progressChange < 0"
                  class="text-sm font-medium text-amber-600"
                >
                  {{ summary.progressChange }}%
                </span>
                <span v-else class="text-sm text-surface-400">--</span>
              </div>
            </div>

            <button 
              @click.stop="navigateToProject(summary.project.id)"
              class="btn-ghost text-sm px-3 py-1 shrink-0"
            >
              View
            </button>
          </div>
        </div>

        <!-- Expanded Content -->
        <div v-if="isExpanded(summary.project.id)" class="border-t border-surface-200">
          <!-- Change Summary - since last review -->
          <div class="px-4 py-3 bg-surface-50 border-b border-surface-200">
            <div class="text-xs text-surface-500 mb-2">Changes since last review:</div>
            <div class="flex items-center gap-6 text-sm">
              <div class="flex items-center gap-1">
                <span 
                  :class="summary.tasksAdded > 0 ? 'text-emerald-600 font-medium' : 'text-surface-600'"
                >
                  +{{ summary.tasksAdded }} added
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span 
                  :class="summary.tasksCompleted > 0 ? 'text-primary-600 font-medium' : 'text-surface-600'"
                >
                  {{ summary.tasksCompleted }} completed
                </span>
              </div>
              <div class="flex items-center gap-1 ml-auto">
                <span class="text-surface-500">Owner:</span>
                <div class="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-[10px] font-medium text-primary-700">{{ summary.project.owner }}</span>
                </div>
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
