<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { TaskTemplate, ProjectType, TaskCategory, TaskPhase, SubtaskTemplate } from '@/types'
import { projectTypes, taskCategories, mockUsers, mockDepartments } from '@/data/mockData'

const store = useProjectStore()

// Editing state
const editingTemplate = ref<TaskTemplate | null>(null)
const isCreating = ref(false)

// Filter state
const filterType = ref<ProjectType | 'All'>('All')
const viewMode = ref<'milestone' | 'phase'>('milestone')

// Phase management state
const isManagingPhases = ref(false)
const newPhaseName = ref('')

function addNewPhase() {
  if (newPhaseName.value.trim()) {
    store.addPhase(newPhaseName.value.trim())
    newPhaseName.value = ''
  }
}

function removePhase(phase: string) {
  // Check if any templates use this phase
  const templatesUsingPhase = store.taskTemplates.filter(t => t.phase === phase)
  if (templatesUsingPhase.length > 0) {
    alert(`Cannot remove "${phase}" - ${templatesUsingPhase.length} template(s) use this phase. Update them first.`)
    return
  }
  store.removePhase(phase)
}

// Form state for create/edit
const formData = ref({
  title: '',
  projectTypes: [] as ProjectType[],
  phase: 'Inhouse Planning' as TaskPhase,
  milestone: 20,
  category: 'Setup' as TaskCategory,
  estimatedHours: 1,
  assignee: '[ProjectOwner]' as string,
  departmentId: null as string | null,
  subtasks: [] as SubtaskTemplate[]
})

// Historical stats for estimation suggestion
const historicalStats = ref<{ 
  avgActualHours: number | null, 
  taskCount: number,
  minHours: number | null,
  maxHours: number | null 
} | null>(null)

// Watch for changes to title/category to update suggestions
watch(
  () => ({ title: formData.value.title, category: formData.value.category }),
  ({ title, category }) => {
    if (title && title.length >= 3) {
      historicalStats.value = store.getTaskHistoricalStats(title, category)
    } else {
      historicalStats.value = null
    }
  },
  { deep: true }
)

function useSuggestedHours() {
  if (historicalStats.value?.avgActualHours) {
    formData.value.estimatedHours = historicalStats.value.avgActualHours
  }
}

// Generate unique ID for subtasks
function generateSubtaskId(): string {
  return 'st-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

// Subtask management
function addSubtask() {
  formData.value.subtasks.push({
    id: generateSubtaskId(),
    title: '',
    estimatedHours: 1,
    assignee: '[ProjectOwner]',
    order: formData.value.subtasks.length
  })
}

function removeSubtask(index: number) {
  formData.value.subtasks.splice(index, 1)
  // Re-order remaining subtasks
  formData.value.subtasks.forEach((st, i) => st.order = i)
}

function moveSubtaskUp(index: number) {
  if (index <= 0) return
  const temp = formData.value.subtasks[index]
  formData.value.subtasks[index] = formData.value.subtasks[index - 1]
  formData.value.subtasks[index - 1] = temp
  formData.value.subtasks.forEach((st, i) => st.order = i)
}

function moveSubtaskDown(index: number) {
  if (index >= formData.value.subtasks.length - 1) return
  const temp = formData.value.subtasks[index]
  formData.value.subtasks[index] = formData.value.subtasks[index + 1]
  formData.value.subtasks[index + 1] = temp
  formData.value.subtasks.forEach((st, i) => st.order = i)
}

// Group templates by milestone
const milestones = [20, 40, 60, 80, 90, 100]

const templatesByMilestone = computed(() => {
  const grouped: Record<number, TaskTemplate[]> = {}
  milestones.forEach(m => {
    grouped[m] = store.taskTemplates
      .filter(t => t.milestone === m)
      .filter(t => filterType.value === 'All' || t.projectTypes.includes(filterType.value))
      .sort((a, b) => a.order - b.order)
  })
  return grouped
})

const templatesByPhase = computed(() => {
  const grouped: Record<string, TaskTemplate[]> = {}
  store.phases.forEach(phase => {
    grouped[phase] = store.taskTemplates
      .filter(t => t.phase === phase)
      .filter(t => filterType.value === 'All' || t.projectTypes.includes(filterType.value))
      .sort((a, b) => a.order - b.order)
  })
  // Add "Unassigned" for templates without a phase
  grouped['Unassigned'] = store.taskTemplates
    .filter(t => !t.phase)
    .filter(t => filterType.value === 'All' || t.projectTypes.includes(filterType.value))
    .sort((a, b) => a.order - b.order)
  return grouped
})

function getMilestoneLabel(milestone: number): string {
  const labels: Record<number, string> = {
    20: '20% - Project Kickoff',
    40: '40% - Order & Planning',
    60: '60% - Build & Configuration',
    80: '80% - Installation & Training',
    90: '90% - Go-Live',
    100: '100% - Closeout'
  }
  return labels[milestone] || `${milestone}%`
}

function getDepartmentLabel(departmentId: string | null | undefined): string {
  if (!departmentId) return 'None'
  const dept = mockDepartments.find(d => d.id === departmentId)
  return dept?.name || departmentId
}

function getProjectTypeClass(type: ProjectType): string {
  const classes: Record<ProjectType, string> = {
    'SoftwareOnly': 'bg-blue-100 text-blue-800',
    'HardwareOnly': 'bg-amber-100 text-amber-800',
    'HardwareSoftware': 'bg-emerald-100 text-emerald-800'
  }
  return classes[type]
}

function startCreate() {
  isCreating.value = true
  editingTemplate.value = null
  formData.value = {
    title: '',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Planning',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 1,
    assignee: '[ProjectOwner]',
    departmentId: null,
    subtasks: []
  }
}

function startEdit(template: TaskTemplate) {
  isCreating.value = false
  editingTemplate.value = template
  formData.value = {
    title: template.title,
    projectTypes: [...template.projectTypes],
    phase: template.phase || 'Inhouse Planning',
    milestone: template.milestone,
    category: template.category,
    estimatedHours: template.estimatedHours,
    assignee: template.assignee,
    departmentId: template.departmentId || null,
    subtasks: template.subtasks ? template.subtasks.map(st => ({ ...st })) : []
  }
}

function cancelEdit() {
  editingTemplate.value = null
  isCreating.value = false
}

function saveTemplate() {
  // Filter out empty subtasks
  const validSubtasks = formData.value.subtasks.filter(st => st.title.trim() !== '')
  
  if (isCreating.value) {
    store.createTaskTemplate({
      title: formData.value.title,
      projectTypes: formData.value.projectTypes,
      phase: formData.value.phase,
      milestone: formData.value.milestone,
      category: formData.value.category,
      estimatedHours: formData.value.estimatedHours,
      assignee: formData.value.assignee,
      departmentId: formData.value.departmentId,
      subtasks: validSubtasks.length > 0 ? validSubtasks : undefined
    })
  } else if (editingTemplate.value) {
    store.updateTaskTemplate(editingTemplate.value.id, {
      title: formData.value.title,
      projectTypes: formData.value.projectTypes,
      phase: formData.value.phase,
      milestone: formData.value.milestone,
      category: formData.value.category,
      estimatedHours: formData.value.estimatedHours,
      assignee: formData.value.assignee,
      departmentId: formData.value.departmentId,
      subtasks: validSubtasks.length > 0 ? validSubtasks : undefined
    })
  }
  cancelEdit()
}

function deleteTemplate(id: string) {
  if (confirm('Are you sure you want to delete this task template?')) {
    store.deleteTaskTemplate(id)
  }
}

function toggleProjectType(type: ProjectType) {
  const idx = formData.value.projectTypes.indexOf(type)
  if (idx >= 0) {
    // Don't allow removing last type
    if (formData.value.projectTypes.length > 1) {
      formData.value.projectTypes.splice(idx, 1)
    }
  } else {
    formData.value.projectTypes.push(type)
  }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Task Templates</h1>
        <p class="text-sm text-slate-500 mt-1">
          Master task library for project creation. Tasks are filtered by project type.
        </p>
      </div>
      <button 
        @click="startCreate"
        class="btn-primary"
        :disabled="isCreating || !!editingTemplate"
      >
        + Add Task
      </button>
    </div>

    <!-- Filters and View Toggle -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <!-- Filter by Project Type -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
        <span class="text-sm text-surface-500 whitespace-nowrap">Show:</span>
        <button
          @click="filterType = 'All'"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
            filterType === 'All' 
              ? 'bg-primary-500 text-white' 
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          ]"
        >
          All ({{ store.taskTemplates.length }})
        </button>
        <button
          v-for="pt in projectTypes"
          :key="pt.value"
          @click="filterType = pt.value"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
            filterType === pt.value 
              ? 'bg-primary-500 text-white' 
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          ]"
        >
          {{ pt.label }} ({{ store.taskTemplates.filter(t => t.projectTypes.includes(pt.value)).length }})
        </button>
      </div>

      <!-- View Mode Toggle -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
          <button
            @click="viewMode = 'milestone'"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'milestone' 
                ? 'bg-white text-primary-500 shadow-sm' 
                : 'text-surface-500 hover:text-surface-700'
            ]"
          >
            By Milestone
          </button>
          <button
            @click="viewMode = 'phase'"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'phase' 
                ? 'bg-white text-primary-500 shadow-sm' 
                : 'text-surface-500 hover:text-surface-700'
            ]"
          >
            By Phase
          </button>
        </div>
        <button
          @click="isManagingPhases = !isManagingPhases"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            isManagingPhases 
              ? 'bg-primary-500 text-white' 
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          ]"
        >
          Manage Phases
        </button>
      </div>
    </div>

    <!-- Phase Management Panel -->
    <div v-if="isManagingPhases" class="bg-white border border-surface-200 rounded-lg p-4 mb-6">
      <h3 class="font-medium text-surface-800 mb-3">Manage Phases</h3>
      <p class="text-xs text-surface-500 mb-4">
        Add, remove, or reorder phases. Templates inherit their project type (HW/SW/HW+SW) to determine which tasks appear.
      </p>
      
      <!-- Current Phases -->
      <div class="space-y-2 mb-4">
        <div 
          v-for="(phase, index) in store.phases" 
          :key="phase"
          class="flex items-center gap-2 p-2 bg-surface-50 rounded-md"
        >
          <span class="text-xs text-surface-400 w-6">{{ index + 1 }}.</span>
          <span class="flex-1 text-sm text-surface-700">{{ phase }}</span>
          <span class="text-xs text-surface-400">
            {{ store.taskTemplates.filter(t => t.phase === phase).length }} templates
          </span>
          <button
            @click="removePhase(phase)"
            class="text-xs text-red-500 hover:text-red-600 px-2 py-1"
            :disabled="store.taskTemplates.filter(t => t.phase === phase).length > 0"
            :class="{ 'opacity-50 cursor-not-allowed': store.taskTemplates.filter(t => t.phase === phase).length > 0 }"
          >
            Remove
          </button>
        </div>
      </div>
      
      <!-- Add New Phase -->
      <div class="flex items-center gap-2">
        <input
          v-model="newPhaseName"
          type="text"
          placeholder="New phase name..."
          class="flex-1 px-3 py-2 border border-surface-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          @keyup.enter="addNewPhase"
        />
        <button
          @click="addNewPhase"
          :disabled="!newPhaseName.trim()"
          class="btn-primary text-sm px-4 py-2"
          :class="{ 'opacity-50 cursor-not-allowed': !newPhaseName.trim() }"
        >
          Add Phase
        </button>
      </div>
    </div>

    <!-- Create/Edit Form -->
    <div 
      v-if="isCreating || editingTemplate" 
      class="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm"
    >
      <h2 class="text-lg font-medium text-slate-900 mb-4">
        {{ isCreating ? 'Create Task Template' : 'Edit Task Template' }}
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Title -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
          <input 
            v-model="formData.title"
            type="text"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter task title..."
          />
        </div>

        <!-- Project Types -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-2">Applies to Project Types</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="pt in projectTypes"
              :key="pt.value"
              @click="toggleProjectType(pt.value)"
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                formData.projectTypes.includes(pt.value) 
                  ? getProjectTypeClass(pt.value) 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              ]"
            >
              {{ pt.label }}
            </button>
          </div>
        </div>

        <!-- Phase -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Phase</label>
          <select 
            v-model="formData.phase"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="phase in store.phases" :key="phase" :value="phase">
              {{ phase }}
            </option>
          </select>
        </div>

        <!-- Milestone -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Milestone</label>
          <select 
            v-model.number="formData.milestone"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="m in milestones" :key="m" :value="m">
              {{ getMilestoneLabel(m) }}
            </option>
          </select>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select 
            v-model="formData.category"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="cat in taskCategories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Estimated Hours -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
          <input 
            v-model.number="formData.estimatedHours"
            type="number"
            min="0.5"
            step="0.5"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <!-- Historical suggestion -->
          <div 
            v-if="historicalStats?.avgActualHours && historicalStats.taskCount > 0"
            class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="text-xs text-amber-800">
                <span class="font-medium">Suggestion:</span> 
                Similar tasks averaged <span class="font-semibold">{{ historicalStats.avgActualHours }}h</span> actual
                <span class="text-amber-600">
                  ({{ historicalStats.taskCount }} completed task{{ historicalStats.taskCount !== 1 ? 's' : '' }}, 
                  range: {{ historicalStats.minHours }}-{{ historicalStats.maxHours }}h)
                </span>
              </div>
              <button
                type="button"
                @click="useSuggestedHours"
                class="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
              >
                Use {{ historicalStats.avgActualHours }}h
              </button>
            </div>
          </div>
        </div>

        <!-- Assignee -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Default Assignee</label>
          <select 
            v-model="formData.assignee"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="[ProjectOwner]">Project Owner (dynamic)</option>
            <option v-for="user in mockUsers" :key="user.id" :value="user.id">
              {{ user.name }} ({{ user.role }})
            </option>
          </select>
          <p class="text-xs text-slate-500 mt-1">
            "Project Owner" assigns to whoever owns the project. Specific names always go to that person.
          </p>
        </div>

        <!-- Department -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <select 
            v-model="formData.departmentId"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">No Department</option>
            <option v-for="dept in mockDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <p class="text-xs text-slate-500 mt-1">
            Optional: Assign this task to a department for workload tracking.
          </p>
        </div>

        <!-- Subtasks Section -->
        <div class="md:col-span-2 mt-2">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-slate-700">Subtasks</label>
            <button
              type="button"
              @click="addSubtask"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Subtask
            </button>
          </div>

          <div v-if="formData.subtasks.length === 0" class="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-md">
            No subtasks. Click "Add Subtask" to create checklist items within this task.
          </div>

          <div v-else class="space-y-2">
            <div 
              v-for="(subtask, index) in formData.subtasks" 
              :key="subtask.id"
              class="flex items-start gap-2 p-3 bg-slate-50 rounded-md border border-slate-200"
            >
              <!-- Reorder buttons -->
              <div class="flex flex-col gap-0.5 pt-1">
                <button
                  type="button"
                  @click="moveSubtaskUp(index)"
                  :disabled="index === 0"
                  :class="[
                    'p-0.5 rounded',
                    index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  ]"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="moveSubtaskDown(index)"
                  :disabled="index === formData.subtasks.length - 1"
                  :class="[
                    'p-0.5 rounded',
                    index === formData.subtasks.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  ]"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <!-- Subtask fields -->
              <div class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                <input 
                  v-model="subtask.title"
                  type="text"
                  placeholder="Subtask title..."
                  class="md:col-span-6 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  v-model.number="subtask.estimatedHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="Hours"
                  class="md:col-span-2 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  v-model="subtask.assignee"
                  class="md:col-span-4 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="[ProjectOwner]">Project Owner</option>
                  <option v-for="user in mockUsers" :key="user.id" :value="user.id">
                    {{ user.name }}
                  </option>
                </select>
              </div>

              <!-- Delete button -->
              <button
                type="button"
                @click="removeSubtask(index)"
                class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button @click="cancelEdit" class="btn-secondary">
          Cancel
        </button>
        <button 
          @click="saveTemplate" 
          class="btn-primary"
          :disabled="!formData.title || formData.projectTypes.length === 0"
        >
          {{ isCreating ? 'Create Template' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Templates grouped by milestone -->
    <div v-if="viewMode === 'milestone'" class="space-y-4">
      <div v-for="milestone in milestones" :key="milestone" class="bg-white border border-surface-200 rounded-lg overflow-hidden">
        <div class="bg-surface-50 px-4 py-3 border-b border-surface-200">
          <h3 class="font-medium text-surface-800">{{ getMilestoneLabel(milestone) }}</h3>
          <p class="text-xs text-surface-500 mt-0.5">
            {{ templatesByMilestone[milestone].length }} task{{ templatesByMilestone[milestone].length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div v-if="templatesByMilestone[milestone].length === 0" class="px-4 py-6 text-center text-surface-400 text-sm">
          No tasks at this milestone
        </div>

        <div v-else class="divide-y divide-surface-100">
          <div 
            v-for="template in templatesByMilestone[milestone]" 
            :key="template.id"
            class="px-4 py-3 hover:bg-surface-50 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-surface-800">{{ template.title }}</span>
                  <span v-if="template.phase" class="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded font-medium">
                    {{ template.phase }}
                  </span>
                  <span v-if="template.subtasks?.length" class="text-xs text-surface-500">
                    ({{ template.subtasks.length }} subtasks)
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-surface-500">
                  <span class="px-1.5 py-0.5 bg-surface-100 rounded">{{ template.category }}</span>
                  <span>{{ template.estimatedHours }}h</span>
                  <span v-if="template.departmentId" class="text-emerald-600">
                    {{ getDepartmentLabel(template.departmentId) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button 
                  @click="startEdit(template)"
                  class="text-sm text-primary-500 hover:text-primary-600 px-2 py-1"
                  :disabled="isCreating || !!editingTemplate"
                >
                  Edit
                </button>
                <button 
                  @click="deleteTemplate(template.id)"
                  class="text-sm text-red-500 hover:text-red-600 px-2 py-1"
                  :disabled="isCreating || !!editingTemplate"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Templates grouped by phase -->
    <div v-else class="space-y-4">
      <div v-for="phase in [...store.phases, 'Unassigned']" :key="phase" class="bg-white border border-surface-200 rounded-lg overflow-hidden">
        <div class="bg-primary-50 px-4 py-3 border-b border-primary-100">
          <h3 class="font-medium text-primary-700">{{ phase }}</h3>
          <p class="text-xs text-primary-500 mt-0.5">
            {{ templatesByPhase[phase]?.length || 0 }} task{{ (templatesByPhase[phase]?.length || 0) !== 1 ? 's' : '' }}
          </p>
        </div>

        <div v-if="!templatesByPhase[phase]?.length" class="px-4 py-6 text-center text-surface-400 text-sm">
          No tasks in this phase
        </div>

        <div v-else class="divide-y divide-surface-100">
          <div 
            v-for="template in templatesByPhase[phase]" 
            :key="template.id"
            class="px-4 py-3 hover:bg-surface-50 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-surface-800">{{ template.title }}</span>
                  <span class="text-xs px-2 py-0.5 bg-surface-100 text-surface-600 rounded">
                    {{ getMilestoneLabel(template.milestone).split(' - ')[0] }}
                  </span>
                  <span v-if="template.subtasks?.length" class="text-xs text-surface-500">
                    ({{ template.subtasks.length }} subtasks)
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-surface-500">
                  <span class="px-1.5 py-0.5 bg-surface-100 rounded">{{ template.category }}</span>
                  <span>{{ template.estimatedHours }}h</span>
                  <span v-if="template.departmentId" class="text-emerald-600">
                    {{ getDepartmentLabel(template.departmentId) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button 
                  @click="startEdit(template)"
                  class="text-sm text-primary-500 hover:text-primary-600 px-2 py-1"
                  :disabled="isCreating || !!editingTemplate"
                >
                  Edit
                </button>
                <button 
                  @click="deleteTemplate(template.id)"
                  class="text-sm text-red-500 hover:text-red-600 px-2 py-1"
                  :disabled="isCreating || !!editingTemplate"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
