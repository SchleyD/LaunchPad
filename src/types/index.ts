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
  title: string
  owner: string
  status: TaskStatus
  milestone: number // 20, 40, 60, 80, 90, 100
  category: TaskCategory
  estimatedHours: number
  timeEntries: TimeEntry[]
  comments: Comment[]
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

// User type for mock data
export interface User {
  id: string
  name: string
  initials: string
  role: 'PM' | 'Technician' | 'Admin'
}

// Template System Types
export type ProjectType = 'SoftwareOnly' | 'HardwareOnly' | 'HardwareSoftware'

// Assignee can be '[ProjectOwner]' for dynamic assignment or a specific user ID
export type TemplateAssignee = '[ProjectOwner]' | string

export interface TaskTemplate {
  id: string
  title: string
  projectTypes: ProjectType[] // Which project types this task applies to
  milestone: number // 20, 40, 60, 80, 90, 100
  category: TaskCategory
  estimatedHours: number
  assignee: TemplateAssignee // '[ProjectOwner]' or specific user ID like 'rb'
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
}
