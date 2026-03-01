<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { ProjectType, LeadTimeType, QuotedHours, TimeCategory } from '@/types'
import { projectTypes, mockUsers, timeCategories } from '@/data/mockData'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', projectId: string): void
}>()

const store = useProjectStore()

// Form state
const formData = ref({
  name: '',
  customer: '',
  workOrderId: '',
  orderDate: new Date().toISOString().split('T')[0],
  projectType: 'HardwareSoftware' as ProjectType,
  owner: '',
  reseller: '',
  scaleDealer: '',
  templateId: '' as string // Empty = blank project, or template ID
})

// Available templates for current project type
const availableTemplates = computed(() => {
  return store.projectTemplates.filter(t => t.projectType === formData.value.projectType)
})

// Auto-select matching template when project type changes
watch(() => formData.value.projectType, (newType) => {
  const matchingTemplate = store.projectTemplates.find(t => t.projectType === newType)
  formData.value.templateId = matchingTemplate?.id || ''
})

// Quoted hours per category
const quotedHours = ref<Record<string, number | null>>({
  'PM Time': null,
  'Application Management / Install': null,
  'Build Time': null,
  'DB Conversion': null,
  'Onsite Install – Work': null,
  'Onsite Install – Travel': null
})

// Validation
const errors = ref<Record<string, string>>({})

const isValid = computed(() => {
  return formData.value.name.trim() !== '' &&
    formData.value.customer.trim() !== '' &&
    formData.value.workOrderId.trim() !== '' &&
    formData.value.owner !== ''
})

// Get tasks that will be created based on selected template
const selectedTemplate = computed(() => {
  if (!formData.value.templateId) return null
  return store.projectTemplates.find(t => t.id === formData.value.templateId)
})

const previewTasks = computed(() => {
  return selectedTemplate.value?.tasks || []
})

const taskCountByMilestone = computed(() => {
  const counts: Record<number, number> = {}
  previewTasks.value.forEach(t => {
    counts[t.milestone] = (counts[t.milestone] || 0) + 1
  })
  return counts
})

// Map project type to lead time type
function getLeadTimeType(projectType: ProjectType): LeadTimeType {
  const map: Record<ProjectType, LeadTimeType> = {
    'SoftwareOnly': 'SoftwareOnly',
    'HardwareOnly': 'SoftwareAndHardware', // Hardware only still uses full timeline
    'HardwareSoftware': 'SoftwareAndHardware'
  }
  return map[projectType]
}

function getOwnerName(ownerId: string): string {
  const user = mockUsers.find(u => u.id === ownerId)
  return user?.name || ownerId
}

function resetForm() {
  formData.value = {
    name: '',
    customer: '',
    workOrderId: '',
    orderDate: new Date().toISOString().split('T')[0],
    projectType: 'HardwareSoftware',
    owner: '',
    reseller: '',
    scaleDealer: '',
    templateId: store.projectTemplates.find(t => t.projectType === 'HardwareSoftware')?.id || ''
  }
  quotedHours.value = {
    'PM Time': null,
    'Application Management / Install': null,
    'Build Time': null,
    'DB Conversion': null,
    'Onsite Install – Work': null,
    'Onsite Install – Travel': null
  }
  errors.value = {}
}

function handleClose() {
  resetForm()
  emit('close')
}

const isSubmitting = ref(false)

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  // Build quoted hours object (only include non-null values)
  const quotedHoursPayload: QuotedHours = {}
  for (const [category, hours] of Object.entries(quotedHours.value)) {
    if (hours !== null && hours > 0) {
      quotedHoursPayload[category as TimeCategory] = hours
    }
  }
  
  try {
    const projectId = await store.createProjectFromTemplate({
      name: formData.value.name,
      customer: formData.value.customer,
      workOrderId: formData.value.workOrderId,
      orderDate: new Date(formData.value.orderDate),
      projectType: formData.value.projectType,
      leadTimeType: getLeadTimeType(formData.value.projectType),
      owner: formData.value.owner,
      reseller: formData.value.reseller || undefined,
      scaleDealer: formData.value.scaleDealer || undefined,
      quotedHours: quotedHoursPayload,
      templateId: formData.value.templateId || undefined
    })
    
    emit('created', projectId)
    handleClose()
  } catch (error) {
    console.error('[v0] Error creating project:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Reset form when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="open" 
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/50"
        @click="handleClose"
      ></div>
      
      <!-- Modal -->
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">Create New Project</h2>
          <button 
            @click="handleClose"
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="space-y-4">
            <!-- Project Type Selection -->
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-2">Project Type</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="pt in projectTypes"
                  :key="pt.value"
                  @click="formData.projectType = pt.value"
                  :class="[
                    'px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all text-center',
                    formData.projectType === pt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                  ]"
                >
                  {{ pt.label }}
                </button>
              </div>
            </div>

            <!-- Template Selection -->
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-2">Template</label>
              <div class="space-y-2">
                <!-- Blank Project Option -->
                <button
                  @click="formData.templateId = ''"
                  :class="[
                    'w-full px-4 py-3 rounded-lg border-2 text-left transition-all',
                    formData.templateId === ''
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-surface-300'
                  ]"
                >
                  <div class="font-medium text-surface-800">Start Blank</div>
                  <div class="text-xs text-surface-500 mt-0.5">Create project without pre-defined tasks</div>
                </button>
                
                <!-- Template Options -->
                <button
                  v-for="template in availableTemplates"
                  :key="template.id"
                  @click="formData.templateId = template.id"
                  :class="[
                    'w-full px-4 py-3 rounded-lg border-2 text-left transition-all',
                    formData.templateId === template.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-surface-300'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div class="font-medium text-surface-800">{{ template.name }}</div>
                    <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded">
                      {{ template.tasks.length }} tasks
                    </span>
                  </div>
                  <div v-if="template.description" class="text-xs text-surface-500 mt-0.5">
                    {{ template.description }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Project Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Project Name <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formData.name"
                type="text"
                class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Acme Corp Scale System"
              />
            </div>

            <!-- Customer & Work Order -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Customer <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="formData.customer"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Work Order ID <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="formData.workOrderId"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 20250789"
                />
              </div>
            </div>

            <!-- Order Date & Owner -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Order Date</label>
                <input 
                  v-model="formData.orderDate"
                  type="date"
                  class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  Project Owner <span class="text-red-500">*</span>
                </label>
                <select 
                  v-model="formData.owner"
                  class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select owner...</option>
                  <option v-for="user in mockUsers" :key="user.id" :value="user.id">
                    {{ user.name }} ({{ user.role }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Optional: Reseller & Scale Dealer -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Reseller (optional)</label>
                <input 
                  v-model="formData.reseller"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reseller name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Scale Dealer (optional)</label>
                <input 
                  v-model="formData.scaleDealer"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Scale dealer name"
                />
              </div>
            </div>

            <!-- Quoted Hours -->
            <div class="mt-6 pt-4 border-t border-slate-200">
              <h3 class="text-sm font-medium text-slate-700 mb-3">Quoted Hours by Category</h3>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="category in timeCategories" :key="category" class="flex items-center gap-2">
                  <input 
                    v-model.number="quotedHours[category]"
                    type="number"
                    min="0"
                    step="0.5"
                    class="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <label class="text-xs text-slate-600 truncate">{{ category }}</label>
                </div>
              </div>
            </div>

            <!-- Task Preview -->
            <div class="mt-6 pt-4 border-t border-surface-200">
              <h3 class="text-sm font-medium text-surface-700 mb-3">
                {{ formData.templateId ? `Tasks to be created (${previewTasks.length} tasks)` : 'Blank Project' }}
              </h3>
              
              <!-- Template selected - show task breakdown -->
              <div v-if="formData.templateId && previewTasks.length > 0" class="bg-surface-50 rounded-lg p-4">
                <div class="grid grid-cols-6 gap-2 text-center">
                  <div v-for="milestone in [20, 40, 60, 80, 90, 100]" :key="milestone">
                    <div class="text-xl font-semibold text-surface-800">
                      {{ taskCountByMilestone[milestone] || 0 }}
                    </div>
                    <div class="text-xs text-surface-500">{{ milestone }}%</div>
                  </div>
                </div>
                
                <div v-if="formData.owner" class="mt-4 pt-3 border-t border-surface-200">
                  <p class="text-xs text-surface-600">
                    Tasks marked <span class="font-medium text-primary-600">"Project Owner"</span> will be assigned to 
                    <span class="font-medium">{{ getOwnerName(formData.owner) }}</span>.
                  </p>
                </div>
              </div>
              
              <!-- Blank project selected -->
              <div v-else class="bg-surface-50 rounded-lg p-4 text-center">
                <p class="text-sm text-surface-600">
                  Project will be created with no tasks. You can add tasks manually after creation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button @click="handleClose" class="btn-secondary">
            Cancel
          </button>
          <button 
            @click="handleSubmit"
            class="btn-primary"
            :disabled="!isValid || isSubmitting"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
