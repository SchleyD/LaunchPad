export type LeadTimeType = 'SoftwareOnly' | 'SoftwareAndHardware' | 'HardwareOnly'

export type ProjectStatus = 'Open' | 'Closed'

export type TaskStatus = 'Backlog' | 'Ready' | 'InProgress' | 'Blocked' | 'Waiting' | 'Done' | 'Canceled'

export type TimeCategory = 
  | 'PM Time'
  | 'Application Management / Install'
  | 'Build Time'
  | 'DB Conversion'
  | 'Onsite Install – Work'
  | 'Onsite Install – Travel'

export type TaskCategory = 
  | 'Setup'
  | 'Configuration'
  | 'Installation'
  | 'Training'
  | 'Testing'
  | 'Documentation'
  | 'Punch List'

// Task phases based on project workflow (from ClickUp structure)
export type TaskPhase = 
  | 'Special Proj. Notes'
  | 'Inhouse Planning'
  | 'Inhouse-HW/SW'
  | 'Inhouse Documentation'
  | 'Site-HW'
  | 'Site-SW'
  | 'Shipping/Install'
  | 'Go Live-Follow Up'

export const TASK_PHASES: TaskPhase[] = [
  'Special Proj. Notes',
  'Inhouse Planning',
  'Inhouse-HW/SW',
  'Inhouse Documentation',
  'Site-HW',
  'Site-SW',
  'Shipping/Install',
  'Go Live-Follow Up'
]

export const PHASE_COLORS: Record<TaskPhase, string> = {
  'Special Proj. Notes': 'bg-red-500',
  'Inhouse Planning': 'bg-cyan-600',
  'Inhouse-HW/SW': 'bg-cyan-700',
  'Inhouse Documentation': 'bg-cyan-600',
  'Site-HW': 'bg-teal-600',
  'Site-SW': 'bg-teal-600',
  'Shipping/Install': 'bg-amber-500',
  'Go Live-Follow Up': 'bg-green-500'
}

export interface TimeEntry {
  id: string
  duration: number // hours
  category: TimeCategory
  note: string
  createdAt: Date
  createdBy: string
}

export interface Comment {
  id: string
  text: string
  createdAt: Date
  createdBy: string
}

export interface Task {
  id: string
  projectId: string
  parentTaskId?: string // If set, this is a subtask
  title: string
  owner: string
  departmentId?: string // Optional department assignment
  status: TaskStatus
  phase?: TaskPhase // Project phase this task belongs to
  milestone: number // 20, 40, 60, 80, 90, 100
  category: TaskCategory
  estimatedHours: number
  timeEntries: TimeEntry[]
  comments: Comment[]
  subtasks?: Task[] // Populated client-side for nested display
  createdAt: Date
  updatedAt: Date
}

export interface ReviewNote {
  id: string
  projectId: string
  text: string
  isReviewed: boolean
  createdAt: Date
  createdBy: string
  reviewedAt?: Date
  reviewedBy?: string
}

// Quoted hours per time category for a project
export type QuotedHours = Partial<Record<TimeCategory, number>>

export interface Project {
  id: string
  name: string
  customer: string
  workOrderId: string
  orderDate: Date
  leadTimeType: LeadTimeType
  reseller?: string
  scaleDealer?: string
  owner: string
  contributors: string[]
  status: ProjectStatus
  blocked: boolean
  type: 'Hardware' | 'SoftwareOnly'
  quotedHours: QuotedHours // Hours quoted/budgeted per category
  tasks: Task[]
  reviewNotes: ReviewNote[]
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
}

// Computed types for PM Review
export interface ProjectChangeSummary {
  project: Project
  previousProgress: number
  currentProgress: number
  progressChange: number
  tasksAdded: number
  tasksCompleted: number
  tasksReopened: number
  hasBlockedTasks: boolean
  unreviewedNotes: number
}

// Department type
export interface Department {
  id: string
  name: string
  description?: string
  lead?: string // User ID of department head
}

// User type for mock data
export interface User {
  id: string
  name: string
  initials: string
  role: 'PM' | 'Technician' | 'Admin'
  departmentId?: string // Which department they belong to
}

// Template System Types
export type ProjectType = 'SoftwareOnly' | 'HardwareOnly' | 'HardwareSoftware'

// Assignee can be '[ProjectOwner]' for dynamic assignment or a specific user ID
export type TemplateAssignee = '[ProjectOwner]' | string

// Department assignment can be a department ID or '[ProjectOwner]' for dynamic assignment
export type TemplateDepartment = string | null

export interface SubtaskTemplate {
  id: string
  title: string
  estimatedHours: number
  assignee: TemplateAssignee
  order: number
}

export interface TaskTemplate {
  id: string
  title: string
  projectTypes: ProjectType[] // Which project types this task applies to
  phase?: TaskPhase // Project phase this task belongs to
  milestone: number // 20, 40, 60, 80, 90, 100
  category: TaskCategory
  estimatedHours: number
  assignee: TemplateAssignee // '[ProjectOwner]' or specific user ID like 'rb'
  departmentId?: TemplateDepartment // Optional department assignment for template
  subtasks?: SubtaskTemplate[] // Subtask templates
  order: number // For sorting within milestone
  createdAt: Date
  updatedAt: Date
}

export interface ProjectCreatePayload {
  name: string
  customer: string
  workOrderId: string
  orderDate: Date
  projectType: ProjectType
  leadTimeType: LeadTimeType
  owner: string // User ID
  reseller?: string
  scaleDealer?: string
  quotedHours?: QuotedHours
}
