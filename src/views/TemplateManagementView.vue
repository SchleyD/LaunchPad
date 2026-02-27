<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import type { TaskTemplate, ProjectType, TaskCategory } from '@/types'
import { projectTypes, taskCategories, mockUsers, mockDepartments } from '@/data/mockData'

const authStore = useAuthStore()

const store = useProjectStore()

// Editing state
const editingTemplate = ref<TaskTemplate | null>(null)
const isCreating = ref(false)

// Filter state
const filterType = ref<ProjectType | 'All'>('All')

// Form state for create/edit
const formData = ref({
  title: '',
  projectTypes: [] as ProjectType[],
  milestone: 20,
  category: 'Setup' as TaskCategory,
  estimatedHours: 1,
  assignee: '[ProjectOwner]' as string,
  departmentId: null as string | null
})

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

function getAssigneeLabel(assignee: string): string {
  if (assignee === '[ProjectOwner]') return 'Project Owner'
  const user = mockUsers.find(u => u.id === assignee)
  return user?.name || assignee
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
    milestone: 20,
    category: 'Setup',
    estimatedHours: 1,
    assignee: '[ProjectOwner]',
    departmentId: null
  }
}

function startEdit(template: TaskTemplate) {
  isCreating.value = false
  editingTemplate.value = template
  formData.value = {
    title: template.title,
    projectTypes: [...template.projectTypes],
    milestone: template.milestone,
    category: template.category,
    estimatedHours: template.estimatedHours,
    assignee: template.assignee,
    departmentId: template.departmentId || null
  }
}

function cancelEdit() {
  editingTemplate.value = null
  isCreating.value = false
}

function saveTemplate() {
  if (isCreating.value) {
    store.createTaskTemplate({
      title: formData.value.title,
      projectTypes: formData.value.projectTypes,
      milestone: formData.value.milestone,
      category: formData.value.category,
      estimatedHours: formData.value.estimatedHours,
      assignee: formData.value.assignee,
      departmentId: formData.value.departmentId
    })
  } else if (editingTemplate.value) {
    store.updateTaskTemplate(editingTemplate.value.id, {
      title: formData.value.title,
      projectTypes: formData.value.projectTypes,
      milestone: formData.value.milestone,
      category: formData.value.category,
      estimatedHours: formData.value.estimatedHours,
      assignee: formData.value.assignee,
      departmentId: formData.value.departmentId
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

    <!-- Filter by Project Type -->
    <div class="flex items-center gap-2 mb-6">
      <span class="text-sm text-slate-600">Show:</span>
      <button
        @click="filterType = 'All'"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          filterType === 'All' 
            ? 'bg-slate-800 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        All ({{ store.taskTemplates.length }})
      </button>
      <button
        v-for="pt in projectTypes"
        :key="pt.value"
        @click="filterType = pt.value"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          filterType === pt.value 
            ? getProjectTypeClass(pt.value) + ' ring-2 ring-offset-1 ring-slate-400' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        {{ pt.label }} ({{ store.taskTemplates.filter(t => t.projectTypes.includes(pt.value)).length }})
      </button>
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
    <div class="space-y-6">
      <div v-for="milestone in milestones" :key="milestone" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div class="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 class="font-medium text-slate-900">{{ getMilestoneLabel(milestone) }}</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ templatesByMilestone[milestone].length }} task{{ templatesByMilestone[milestone].length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div v-if="templatesByMilestone[milestone].length === 0" class="px-4 py-8 text-center text-slate-400 text-sm">
          No tasks at this milestone
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div 
            v-for="template in templatesByMilestone[milestone]" 
            :key="template.id"
            class="px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-slate-900">{{ template.title }}</span>
                  <span class="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {{ template.category }}
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                  <span>{{ template.estimatedHours }}h estimated</span>
                  <span class="text-slate-300">|</span>
                  <span>
                    Assigned to: 
                    <span :class="template.assignee === '[ProjectOwner]' ? 'text-blue-600' : 'text-slate-700'">
                      {{ getAssigneeLabel(template.assignee) }}
                    </span>
                  </span>
                  <template v-if="template.departmentId">
                    <span class="text-slate-300">|</span>
                    <span>
                      Dept: 
                      <span class="text-emerald-600 font-medium">
                        {{ getDepartmentLabel(template.departmentId) }}
                      </span>
                    </span>
                  </template>
                </div>
                <div class="flex gap-1.5 mt-2">
                  <span 
                    v-for="pt in template.projectTypes" 
                    :key="pt"
                    :class="['text-xs px-2 py-0.5 rounded', getProjectTypeClass(pt)]"
                  >
                    {{ projectTypes.find(p => p.value === pt)?.label }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="startEdit(template)"
                  class="text-sm text-blue-600 hover:text-blue-700 px-2 py-1"
                  :disabled="isCreating || !!editingTemplate"
                >
                  Edit
                </button>
                <button 
                  @click="deleteTemplate(template.id)"
                  class="text-sm text-red-600 hover:text-red-700 px-2 py-1"
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
