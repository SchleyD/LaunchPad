import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, Task, TaskStatus, TimeEntry, TimeCategory, ReviewNote, ProjectChangeSummary, TaskTemplate, ProjectType, ProjectCreatePayload } from '@/types'
import { DEFAULT_PHASES } from '@/types'
import { mockProjects, mockTaskTemplates } from '@/data/mockData'
import { useAuthStore } from './auth'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client if configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const useProjectStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>(mockProjects)
  const taskTemplates = ref<TaskTemplate[]>(mockTaskTemplates)
  const phases = ref<string[]>([...DEFAULT_PHASES])
  const lastReviewDate = ref<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
  const isLoading = ref(false)
  const hasLoadedFromDb = ref(false)

  // Phase management
  function addPhase(phaseName: string) {
    if (!phases.value.includes(phaseName)) {
      phases.value.push(phaseName)
    }
  }

  function removePhase(phaseName: string) {
    const index = phases.value.indexOf(phaseName)
    if (index > -1) {
      phases.value.splice(index, 1)
    }
  }

  function reorderPhases(newOrder: string[]) {
    phases.value = newOrder
  }

  // Load projects from Supabase
  async function loadProjects() {
    if (!supabase || hasLoadedFromDb.value) return
    
    isLoading.value = true
    try {
      // Load projects
      const { data: projectRows, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectError) {
        console.error('[v0] Error loading projects:', projectError)
        return
      }

      if (!projectRows || projectRows.length === 0) {
        hasLoadedFromDb.value = true
        return
      }

      // Load tasks for all projects
      const projectIds = projectRows.map(p => p.id)
      const { data: taskRows, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)

      if (taskError) {
        console.error('[v0] Error loading tasks:', taskError)
      }

      // Load time entries for all tasks
      const taskIds = (taskRows || []).map(t => t.id)
      let timeEntryRows: any[] = []
      let commentRows: any[] = []
      
      if (taskIds.length > 0) {
        const { data: teData } = await supabase
          .from('time_entries')
          .select('*')
          .in('task_id', taskIds)
        timeEntryRows = teData || []

        const { data: cData } = await supabase
          .from('comments')
          .select('*')
          .in('task_id', taskIds)
        commentRows = cData || []
      }

      // Load review notes for all projects
      const { data: reviewNoteRows } = await supabase
        .from('review_notes')
        .select('*')
        .in('project_id', projectIds)

      // Convert database rows to Project objects
      const dbProjects: Project[] = projectRows.map(row => {
        const projectTasks = (taskRows || [])
          .filter(t => t.project_id === row.id)
          .map(t => ({
            id: t.id,
            projectId: t.project_id,
            parentTaskId: t.parent_task_id || undefined,
            title: t.title,
            owner: t.owner || 'TBD',
            status: t.status as TaskStatus,
            phase: t.phase || undefined,
            milestone: t.milestone,
            category: t.category,
            estimatedHours: t.estimated_hours,
            timeEntries: timeEntryRows
              .filter(te => te.task_id === t.id)
              .map(te => ({
                id: te.id,
                duration: te.duration,
                category: te.category,
                note: te.note || '',
                createdAt: new Date(te.created_at),
                createdBy: te.created_by || 'Unknown'
              })),
            comments: commentRows
              .filter(c => c.task_id === t.id)
              .map(c => ({
                id: c.id,
                text: c.text,
                createdAt: new Date(c.created_at),
                createdBy: c.created_by || 'Unknown'
              })),
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at)
          }))

        const projectReviewNotes = (reviewNoteRows || [])
          .filter(n => n.project_id === row.id)
          .map(n => ({
            id: n.id,
            projectId: n.project_id,
            text: n.text,
            isReviewed: n.is_reviewed || false,
            reviewedAt: n.reviewed_at ? new Date(n.reviewed_at) : undefined,
            reviewedBy: n.reviewed_by || undefined,
            createdAt: new Date(n.created_at),
            createdBy: n.created_by || 'Unknown'
          }))

        return {
          id: row.id,
          name: row.name,
          customer: row.customer,
          workOrderId: row.work_order_id,
          orderDate: new Date(row.order_date),
          leadTimeType: row.lead_time_type || 'Standard',
          reseller: row.reseller || undefined,
          scaleDealer: row.scale_dealer || undefined,
          owner: row.owner || 'TBD',
          contributors: [],
          status: row.status,
          blocked: row.blocked || false,
          type: row.project_type === 'SoftwareOnly' ? 'SoftwareOnly' : 'Hardware',
          quotedHours: row.quoted_hours || {},
          tasks: projectTasks,
          reviewNotes: projectReviewNotes,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        }
      })

      // Merge with mock data (keep mock data for demo, add db projects)
      const existingIds = new Set(projects.value.map(p => p.id))
      dbProjects.forEach(p => {
        if (!existingIds.has(p.id)) {
          projects.value.push(p)
        }
      })

      hasLoadedFromDb.value = true
    } catch (err) {
      console.error('[v0] Error in loadProjects:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Auto-load on store creation
  loadProjects()

  // Getters
  const activeProjects = computed(() => 
    projects.value.filter(p => p.status === 'Open')
  )

  // Get historical stats for task estimation
  function getTaskHistoricalStats(taskTitle: string, category?: string): { 
    avgActualHours: number | null, 
    taskCount: number,
    minHours: number | null,
    maxHours: number | null 
  } {
    // Find all completed tasks matching title or category
    const completedTasks: Task[] = []
    
    projects.value.forEach(project => {
      project.tasks.forEach(task => {
        if (task.status !== 'Done') return
        if (task.timeEntries.length === 0) return // No actual time logged
        
        // Match by title (fuzzy) or exact category
        const titleMatch = task.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
                          taskTitle.toLowerCase().includes(task.title.toLowerCase())
        const categoryMatch = category && task.category === category
        
        if (titleMatch || categoryMatch) {
          completedTasks.push(task)
        }
      })
    })

    if (completedTasks.length === 0) {
      return { avgActualHours: null, taskCount: 0, minHours: null, maxHours: null }
    }

    // Calculate actual hours for each task
    const actualHours = completedTasks.map(task => 
      task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    )

    const total = actualHours.reduce((sum, h) => sum + h, 0)
    const avg = total / actualHours.length

    return {
      avgActualHours: Math.round(avg * 10) / 10, // Round to 1 decimal
      taskCount: completedTasks.length,
      minHours: Math.min(...actualHours),
      maxHours: Math.max(...actualHours)
    }
  }

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
  async function updateTaskStatus(projectId: string, taskId: string, newStatus: TaskStatus) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    // Update local state
    task.status = newStatus
    task.updatedAt = new Date()
    project.updatedAt = new Date()
    project.blocked = isProjectBlocked(project)

    // Persist to database
    if (supabase) {
      await supabase.from('tasks').update({
        status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('id', taskId)
    }
  }

  async function addTimeEntry(
    projectId: string, 
    taskId: string, 
    duration: number, 
    category: TimeCategory, 
    note: string
  ) {
    const authStore = useAuthStore()
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    const entryId = crypto.randomUUID()
    const entry: TimeEntry = {
      id: entryId,
      duration,
      category,
      note,
      createdAt: new Date(),
      createdBy: authStore.currentUser?.initials || 'Unknown'
    }

    // Update local state
    task.timeEntries.push(entry)
    task.updatedAt = new Date()
    project.updatedAt = new Date()

    // Persist to database
    if (supabase) {
      await supabase.from('time_entries').insert({
        id: entryId,
        task_id: taskId,
        duration,
        category,
        note,
        created_by: authStore.currentUser?.id || null
      })
    }
  }

  async function addTaskComment(projectId: string, taskId: string, text: string) {
    const authStore = useAuthStore()
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    const commentId = crypto.randomUUID()
    task.comments.push({
      id: commentId,
      text,
      createdAt: new Date(),
      createdBy: authStore.currentUser?.initials || 'Unknown'
    })
    task.updatedAt = new Date()

    // Persist to database
    if (supabase) {
      await supabase.from('comments').insert({
        id: commentId,
        task_id: taskId,
        text,
        created_by: authStore.currentUser?.id || null
      })
    }
  }

  async function addReviewNote(projectId: string, text: string) {
    const authStore = useAuthStore()
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const noteId = crypto.randomUUID()
    const note: ReviewNote = {
      id: noteId,
      projectId,
      text,
      isReviewed: false,
      createdAt: new Date(),
      createdBy: authStore.currentUser?.initials || 'Unknown'
    }

    // Update local state
    project.reviewNotes.push(note)

    // Persist to database
    if (supabase) {
      await supabase.from('review_notes').insert({
        id: noteId,
        project_id: projectId,
        text,
        is_reviewed: false,
        created_by: authStore.currentUser?.id || null
      })
    }
  }

  async function markNoteAsReviewed(projectId: string, noteId: string) {
    const authStore = useAuthStore()
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const note = project.reviewNotes.find(n => n.id === noteId)
    if (!note) return

    // Update local state
    note.isReviewed = true
    note.reviewedAt = new Date()
    note.reviewedBy = authStore.currentUser?.initials || 'Unknown'

    // Persist to database
    if (supabase) {
      await supabase.from('review_notes').update({
        is_reviewed: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: authStore.currentUser?.id || null
      }).eq('id', noteId)
    }
  }

  async function convertNoteToTask(projectId: string, noteId: string) {
    const authStore = useAuthStore()
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const note = project.reviewNotes.find(n => n.id === noteId)
    if (!note) return

    const taskId = crypto.randomUUID()
    // Create task from note at 100% milestone (punch list)
    const newTask: Task = {
      id: taskId,
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

    // Update local state
    project.tasks.push(newTask)
    note.isReviewed = true
    note.reviewedAt = new Date()
    note.reviewedBy = authStore.currentUser?.initials || 'Unknown'

    // Persist to database
    if (supabase) {
      // Create task
      await supabase.from('tasks').insert({
        id: taskId,
        project_id: projectId,
        title: note.text,
        status: 'Ready',
        milestone: 100,
        category: 'Punch List',
        estimated_hours: 1
      })
      
      // Mark note as reviewed
      await supabase.from('review_notes').update({
        is_reviewed: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: authStore.currentUser?.id || null
      }).eq('id', noteId)
    }
  }

  async function convertNoteToActionItem(projectId: string, noteId: string) {
    if (!supabase) {
      console.error('[v0] Supabase not configured')
      return false
    }

    const authStore = useAuthStore()
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return false

    const note = project.reviewNotes.find(n => n.id === noteId)
    if (!note) return false

    try {
      // Create action item in Supabase
      const { error } = await supabase.from('action_items').insert({
        project_id: projectId,
        description: note.text,
        status: 'Open',
        created_by: authStore.currentUser?.id || null
      })

      if (error) throw error

      // Mark note as reviewed
      note.isReviewed = true
      note.reviewedAt = new Date()
      note.reviewedBy = authStore.currentUser?.initials || 'Unknown'

      return true
    } catch (error) {
      console.error('[v0] Failed to create action item:', error)
      return false
    }
  }

  async function addTask(projectId: string, task: Omit<Task, 'id' | 'projectId' | 'timeEntries' | 'comments' | 'createdAt' | 'updatedAt'>) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    const taskId = crypto.randomUUID()
    const newTask: Task = {
      ...task,
      id: taskId,
      projectId,
      timeEntries: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Update local state
    project.tasks.push(newTask)
    project.updatedAt = new Date()

    // Persist to database
    if (supabase) {
      await supabase.from('tasks').insert({
        id: taskId,
        project_id: projectId,
        title: task.title,
        owner_id: null, // Would need to look up user ID
        status: task.status,
        phase: task.phase || null,
        milestone: task.milestone,
        category: task.category,
        estimated_hours: task.estimatedHours,
        parent_task_id: task.parentTaskId || null
      })
    }
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

  // Generate UUID
  function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Project Creation from Template
  async function createProjectFromTemplate(payload: ProjectCreatePayload): Promise<string> {
    const projectId = generateUUID()
    
    // Get templates for this project type
    const templates = getTemplatesForProjectType(payload.projectType)
    
    // Create tasks from templates (including subtasks)
    const tasks: Task[] = []
    
    templates.forEach((template) => {
      // Determine assignee: '[ProjectOwner]' maps to project owner, otherwise use specific assignee
      const assignee = template.assignee === '[ProjectOwner]' 
        ? payload.owner.toUpperCase() 
        : template.assignee.toUpperCase()

      const parentTaskId = generateUUID()

      // Create parent task
      const parentTask: Task = {
        id: parentTaskId,
        projectId,
        title: template.title,
        owner: assignee,
        status: 'Backlog' as TaskStatus,
        phase: template.phase,
        milestone: template.milestone,
        category: template.category,
        estimatedHours: template.estimatedHours,
        timeEntries: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      tasks.push(parentTask)

      // Create subtasks if template has them
      if (template.subtasks?.length) {
        template.subtasks.forEach((subtaskTemplate) => {
          const subtaskAssignee = subtaskTemplate.assignee === '[ProjectOwner]' 
            ? payload.owner.toUpperCase() 
            : subtaskTemplate.assignee.toUpperCase()

          const subtask: Task = {
            id: generateUUID(),
            projectId,
            parentTaskId,
            title: subtaskTemplate.title,
            owner: subtaskAssignee,
            status: 'Backlog' as TaskStatus,
            phase: template.phase, // Inherit phase from parent
            milestone: template.milestone, // Inherit milestone from parent
            category: template.category, // Inherit category from parent
            estimatedHours: subtaskTemplate.estimatedHours,
            timeEntries: [],
            comments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          tasks.push(subtask)
        })
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
      quotedHours: payload.quotedHours || {},
      tasks,
      reviewNotes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to Supabase if available
    if (supabase) {
      try {
        // Insert project
        const { error: projectError } = await supabase
          .from('projects')
          .insert({
            id: projectId,
            name: payload.name,
            customer: payload.customer,
            work_order_id: payload.workOrderId,
            order_date: payload.orderDate.toISOString().split('T')[0],
            project_type: payload.projectType,
            owner: payload.owner.toUpperCase(),
            reseller: payload.reseller || null,
            scale_dealer: payload.scaleDealer || null,
            status: 'Open',
            blocked: false,
            quoted_hours: payload.quotedHours || {}
          })
        
        if (projectError) {
          console.error('[v0] Error saving project:', projectError)
        }

        // Insert tasks
        const taskInserts = tasks.map(task => ({
          id: task.id,
          project_id: projectId,
          parent_task_id: task.parentTaskId || null,
          title: task.title,
          owner: task.owner,
          status: task.status,
          phase: task.phase || null,
          milestone: task.milestone,
          category: task.category,
          estimated_hours: task.estimatedHours
        }))

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(taskInserts)

        if (tasksError) {
          console.error('[v0] Error saving tasks:', tasksError)
        }
      } catch (err) {
        console.error('[v0] Supabase error:', err)
      }
    }

    // Add to local store
    projects.value.push(newProject)
    return projectId
  }

  return {
    // State
    projects,
    taskTemplates,
    phases,
    lastReviewDate,
    isLoading,
    
    // Data loading
    loadProjects,
    
    // Phase Management
    addPhase,
    removePhase,
    reorderPhases,
    
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
    convertNoteToActionItem,
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
    
    // Estimation helpers
    getTaskHistoricalStats,
  }
})
