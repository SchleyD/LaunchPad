import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, Task, TaskStatus, TimeEntry, TimeCategory, ReviewNote, ProjectChangeSummary, TaskTemplate, ProjectType, ProjectCreatePayload } from '@/types'
import { mockProjects, mockTaskTemplates } from '@/data/mockData'

export const useProjectStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>(mockProjects)
  const taskTemplates = ref<TaskTemplate[]>(mockTaskTemplates)
  const lastReviewDate = ref<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago

  // Getters
  const activeProjects = computed(() => 
    projects.value.filter(p => p.status === 'Open')
  )

  const closedProjects = computed(() => 
    projects.value.filter(p => p.status === 'Closed')
  )

  const projectsClosedSinceLastReview = computed(() => 
    projects.value.filter(p => 
      p.status === 'Closed' && 
      p.closedAt && 
      new Date(p.closedAt) > lastReviewDate.value
    )
  )

  // Calculate project completion percentage based on milestone logic
  function calculateProjectProgress(project: Project): number {
    const milestones = project.type === 'Hardware' 
      ? [20, 40, 60, 80, 90, 100]
      : [20, 60, 80, 90, 100]

    let highestCompleteMilestone = 0

    for (const milestone of milestones) {
      const tasksAtMilestone = project.tasks.filter(t => t.milestone === milestone)
      
      // If no tasks at this milestone, continue to next
      if (tasksAtMilestone.length === 0) continue

      // Check if all tasks at this milestone are Done or Canceled
      const allComplete = tasksAtMilestone.every(t => 
        t.status === 'Done' || t.status === 'Canceled'
      )

      if (allComplete) {
        highestCompleteMilestone = milestone
      } else {
        // Stop checking higher milestones
        break
      }
    }

    return highestCompleteMilestone
  }

  function getProjectProgress(projectId: string): number {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return 0
    return calculateProjectProgress(project)
  }

  function getProjectById(projectId: string): Project | undefined {
    return projects.value.find(p => p.id === projectId)
  }

  function isProjectBlocked(project: Project): boolean {
    return project.tasks.some(t => t.status === 'Blocked')
  }

  function isProjectStalled(project: Project): boolean {
    // A project is stalled if no task updates in 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const latestUpdate = Math.max(...project.tasks.map(t => new Date(t.updatedAt).getTime()))
    return new Date(latestUpdate) < fourteenDaysAgo
  }

  // Actions
  function updateTaskStatus(projectId: string, taskId: string, newStatus: TaskStatus) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    task.status = newStatus
    task.updatedAt = new Date()
    project.updatedAt = new Date()

    // Update project blocked status
    project.blocked = isProjectBlocked(project)
  }

  function addTimeEntry(
    projectId: string, 
    taskId: string, 
    duration: number, 
    category: TimeCategory, 
    note: string
  ) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    const entry: TimeEntry = {
      id: `te-${Date.now()}`,
      duration,
      category,
      note,
      createdAt: new Date(),
      createdBy: 'KH' // Current user
    }

    task.timeEntries.push(entry)
    task.updatedAt = new Date()
    project.updatedAt = new Date()
  }

  function addTaskComment(projectId: string, taskId: string, text: string) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    task.comments.push({
      id: `c-${Date.now()}`,
      text,
      createdAt: new Date(),
      createdBy: 'KH'
    })
    task.updatedAt = new Date()
  }

  function addReviewNote(projectId: string, text: string) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const note: ReviewNote = {
      id: `rn-${Date.now()}`,
      projectId,
      text,
      isReviewed: false,
      createdAt: new Date(),
      createdBy: 'KH'
    }

    project.reviewNotes.push(note)
  }

  function markNoteAsReviewed(projectId: string, noteId: string) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const note = project.reviewNotes.find(n => n.id === noteId)
    if (!note) return

    note.isReviewed = true
    note.reviewedAt = new Date()
    note.reviewedBy = 'KH'
  }

  function convertNoteToTask(projectId: string, noteId: string) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const note = project.reviewNotes.find(n => n.id === noteId)
    if (!note) return

    // Create task from note at 100% milestone (punch list)
    const newTask: Task = {
      id: `t-${Date.now()}`,
      projectId,
      title: note.text,
      owner: project.owner,
      status: 'Ready',
      milestone: 100,
      category: 'Punch List',
      estimatedHours: 1,
      timeEntries: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    project.tasks.push(newTask)
    note.isReviewed = true
    note.reviewedAt = new Date()
    note.reviewedBy = 'KH'
  }

  function addTask(projectId: string, task: Omit<Task, 'id' | 'projectId' | 'timeEntries' | 'comments' | 'createdAt' | 'updatedAt'>) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const newTask: Task = {
      ...task,
      id: `t-${Date.now()}`,
      projectId,
      timeEntries: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    project.tasks.push(newTask)
    project.updatedAt = new Date()
  }

  function setLastReviewDate(date: Date) {
    lastReviewDate.value = date
  }

  // PM Review calculations
  function getProjectChangeSummary(project: Project): ProjectChangeSummary {
    const currentProgress = calculateProjectProgress(project)
    
    // For demo purposes, simulate previous progress
    const previousProgress = Math.max(0, currentProgress - 20)
    
    const tasksAddedSinceReview = project.tasks.filter(t => 
      new Date(t.createdAt) > lastReviewDate.value
    ).length

    const tasksCompletedSinceReview = project.tasks.filter(t => 
      (t.status === 'Done' || t.status === 'Canceled') &&
      new Date(t.updatedAt) > lastReviewDate.value
    ).length

    const unreviewedNotes = project.reviewNotes.filter(n => !n.isReviewed).length

    return {
      project,
      previousProgress,
      currentProgress,
      progressChange: currentProgress - previousProgress,
      tasksAdded: tasksAddedSinceReview,
      tasksCompleted: tasksCompletedSinceReview,
      tasksReopened: 0, // Would track this in real implementation
      hasBlockedTasks: isProjectBlocked(project),
      unreviewedNotes
    }
  }

  function getTotalTimeForProject(projectId: string): number {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return 0

    return project.tasks.reduce((total, task) => {
      return total + task.timeEntries.reduce((taskTotal, entry) => taskTotal + entry.duration, 0)
    }, 0)
  }

  function getTimeByCategory(projectId: string): Record<TimeCategory, number> {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return {} as Record<TimeCategory, number>

    const timeByCategory: Record<string, number> = {}

    project.tasks.forEach(task => {
      task.timeEntries.forEach(entry => {
        if (!timeByCategory[entry.category]) {
          timeByCategory[entry.category] = 0
        }
        timeByCategory[entry.category] += entry.duration
      })
    })

    return timeByCategory as Record<TimeCategory, number>
  }

  // Template Management Functions
  function getTemplatesForProjectType(projectType: ProjectType): TaskTemplate[] {
    return taskTemplates.value
      .filter(t => t.projectTypes.includes(projectType))
      .sort((a, b) => {
        if (a.milestone !== b.milestone) return a.milestone - b.milestone
        return a.order - b.order
      })
  }

  function createTaskTemplate(template: Omit<TaskTemplate, 'id' | 'order' | 'createdAt' | 'updatedAt'>) {
    // Calculate order within milestone
    const templatesAtMilestone = taskTemplates.value.filter(t => t.milestone === template.milestone)
    const maxOrder = templatesAtMilestone.length > 0 
      ? Math.max(...templatesAtMilestone.map(t => t.order)) 
      : 0

    const newTemplate: TaskTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    taskTemplates.value.push(newTemplate)
  }

  function updateTaskTemplate(templateId: string, updates: Partial<Omit<TaskTemplate, 'id' | 'createdAt'>>) {
    const template = taskTemplates.value.find(t => t.id === templateId)
    if (!template) return

    Object.assign(template, updates, { updatedAt: new Date() })
  }

  function deleteTaskTemplate(templateId: string) {
    const index = taskTemplates.value.findIndex(t => t.id === templateId)
    if (index >= 0) {
      taskTemplates.value.splice(index, 1)
    }
  }

  // Project Creation from Template
  function createProjectFromTemplate(payload: ProjectCreatePayload): string {
    const projectId = `p-${Date.now()}`
    
    // Get templates for this project type
    const templates = getTemplatesForProjectType(payload.projectType)
    
    // Create tasks from templates
    const tasks: Task[] = templates.map((template, index) => {
      // Determine assignee: '[ProjectOwner]' maps to project owner, otherwise use specific assignee
      const assignee = template.assignee === '[ProjectOwner]' 
        ? payload.owner.toUpperCase() 
        : template.assignee.toUpperCase()

      return {
        id: `t-${Date.now()}-${index}`,
        projectId,
        title: template.title,
        owner: assignee,
        status: 'Backlog' as TaskStatus,
        milestone: template.milestone,
        category: template.category,
        estimatedHours: template.estimatedHours,
        timeEntries: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Determine project type for progress calculation
    const projectTypeMap: Record<ProjectType, 'Hardware' | 'SoftwareOnly'> = {
      'SoftwareOnly': 'SoftwareOnly',
      'HardwareOnly': 'Hardware',
      'HardwareSoftware': 'Hardware'
    }

    const newProject: Project = {
      id: projectId,
      name: payload.name,
      customer: payload.customer,
      workOrderId: payload.workOrderId,
      orderDate: payload.orderDate,
      leadTimeType: payload.leadTimeType,
      reseller: payload.reseller,
      scaleDealer: payload.scaleDealer,
      owner: payload.owner.toUpperCase(),
      contributors: [],
      status: 'Open',
      blocked: false,
      type: projectTypeMap[payload.projectType],
      tasks,
      reviewNotes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    projects.value.push(newProject)
    return projectId
  }

  return {
    // State
    projects,
    taskTemplates,
    lastReviewDate,
    
    // Getters
    activeProjects,
    closedProjects,
    projectsClosedSinceLastReview,
    
    // Actions
    getProjectById,
    getProjectProgress,
    calculateProjectProgress,
    isProjectBlocked,
    isProjectStalled,
    updateTaskStatus,
    addTimeEntry,
    addTaskComment,
    addReviewNote,
    markNoteAsReviewed,
    convertNoteToTask,
    addTask,
    setLastReviewDate,
    getProjectChangeSummary,
    getTotalTimeForProject,
    getTimeByCategory,
    
    // Template Management
    getTemplatesForProjectType,
    createTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    createProjectFromTemplate,
  }
})
