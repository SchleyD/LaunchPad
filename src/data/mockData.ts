import type { Project, Task, User, ReviewNote, TaskTemplate, ProjectType, Department } from '@/types'

// Departments
export const mockDepartments: Department[] = [
  { 
    id: 'dept-pm', 
    name: 'Project Management', 
    description: 'Oversees project planning, coordination, and customer communication',
    lead: 'kh' 
  },
  { 
    id: 'dept-field', 
    name: 'Field Services', 
    description: 'Handles on-site installations, training, and customer support',
    lead: 'rb' 
  },
  { 
    id: 'dept-prod', 
    name: 'Production', 
    description: 'Manages hardware staging, testing, and build processes',
    lead: 'jm' 
  },
]

export const mockUsers: User[] = [
  { id: 'kh', name: 'Kevin H.', initials: 'KH', role: 'PM', departmentId: 'dept-pm' },
  { id: 'rb', name: 'Ryan B.', initials: 'RB', role: 'Technician', departmentId: 'dept-field' },
  { id: 'es', name: 'Eric S.', initials: 'ES', role: 'Technician', departmentId: 'dept-field' },
  { id: 'jm', name: 'Josh M.', initials: 'JM', role: 'Admin', departmentId: 'dept-prod' },
]

const createDate = (daysAgo: number): Date => {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
}

// Project 1: Haas & Sons - Hardware project
const haasAndSonsTasks: Task[] = [
  // 20% Milestone - Complete
  {
    id: 't-1',
    projectId: 'p-1',
    title: 'Initial customer kickoff call',
    owner: 'RB',
    status: 'Done',
    phase: 'Special Proj. Notes',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 1,
    timeEntries: [
      { id: 'te-1', duration: 1, category: 'PM Time', note: 'Kickoff with customer', createdAt: createDate(30), createdBy: 'RB' }
    ],
    comments: [],
    createdAt: createDate(35),
    updatedAt: createDate(30)
  },
  {
    id: 't-2',
    projectId: 'p-1',
    title: 'Gather site requirements',
    owner: 'RB',
    status: 'Done',
    phase: 'Inhouse Planning',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 2,
    timeEntries: [
      { id: 'te-2', duration: 2, category: 'PM Time', note: 'Site survey documentation', createdAt: createDate(28), createdBy: 'RB' }
    ],
    comments: [],
    createdAt: createDate(35),
    updatedAt: createDate(28)
  },
  // 40% Milestone - Complete
  {
    id: 't-3',
    projectId: 'p-1',
    title: 'Hardware order placed and confirmed',
    owner: 'RB',
    status: 'Done',
    phase: 'Inhouse-HW/SW',
    milestone: 40,
    category: 'Setup',
    estimatedHours: 1,
    timeEntries: [
      { id: 'te-3', duration: 0.5, category: 'PM Time', note: 'Order confirmation', createdAt: createDate(25), createdBy: 'RB' }
    ],
    comments: [],
    createdAt: createDate(30),
    updatedAt: createDate(25)
  },
  // Parent task: HW Drawings with subtasks
  {
    id: 't-hw-drawings',
    projectId: 'p-1',
    title: 'HW Drawings',
    owner: 'KS',
    status: 'InProgress',
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 8,
    timeEntries: [],
    comments: [],
    createdAt: createDate(28),
    updatedAt: createDate(5)
  },
  // Subtasks for HW Drawings
  {
    id: 't-hw-sub-1',
    projectId: 'p-1',
    parentTaskId: 't-hw-drawings',
    title: 'Post Drawings',
    owner: 'KS',
    status: 'Done',
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 2,
    timeEntries: [],
    comments: [],
    createdAt: createDate(28),
    updatedAt: createDate(20)
  },
  {
    id: 't-hw-sub-2',
    projectId: 'p-1',
    parentTaskId: 't-hw-drawings',
    title: 'Post Location',
    owner: 'KS',
    status: 'Done',
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 1,
    timeEntries: [],
    comments: [],
    createdAt: createDate(28),
    updatedAt: createDate(18)
  },
  {
    id: 't-hw-sub-3',
    projectId: 'p-1',
    parentTaskId: 't-hw-drawings',
    title: 'Design Diagram',
    owner: 'KS',
    status: 'Done',
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 2,
    timeEntries: [],
    comments: [],
    createdAt: createDate(28),
    updatedAt: createDate(15)
  },
  {
    id: 't-hw-sub-4',
    projectId: 'p-1',
    parentTaskId: 't-hw-drawings',
    title: 'Review Drawings With Electricians',
    owner: 'KS',
    status: 'InProgress',
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 2,
    timeEntries: [],
    comments: [],
    createdAt: createDate(28),
    updatedAt: createDate(2)
  },
  {
    id: 't-4',
    projectId: 'p-1',
    title: 'Database conversion planning',
    owner: 'RB',
    status: 'Done',
    phase: 'Inhouse-HW/SW',
    milestone: 40,
    category: 'Configuration',
    estimatedHours: 4,
    timeEntries: [
      { id: 'te-4', duration: 3.5, category: 'DB Conversion', note: 'Schema mapping', createdAt: createDate(22), createdBy: 'RB' }
    ],
    comments: [],
    createdAt: createDate(28),
    updatedAt: createDate(22)
  },
  // 60% Milestone - In Progress (one blocked)
  {
    id: 't-5',
    projectId: 'p-1',
    title: 'Software configuration',
    owner: 'RB',
    status: 'InProgress',
    phase: 'Inhouse-HW/SW',
    milestone: 60,
    category: 'Configuration',
    estimatedHours: 8,
    timeEntries: [
      { id: 'te-5', duration: 4, category: 'Application Management / Install', note: 'Initial config', createdAt: createDate(10), createdBy: 'RB' }
    ],
    comments: [
      { id: 'c-1', text: 'Need customer input on report formats', createdAt: createDate(5), createdBy: 'RB' }
    ],
    createdAt: createDate(20),
    updatedAt: createDate(5)
  },
  {
    id: 't-6',
    projectId: 'p-1',
    title: 'Hardware staging and testing',
    owner: 'RB',
    status: 'Blocked',
    phase: 'Inhouse-HW/SW',
    milestone: 60,
    category: 'Installation',
    estimatedHours: 6,
    timeEntries: [
      { id: 'te-6', duration: 2, category: 'Build Time', note: 'Started staging', createdAt: createDate(8), createdBy: 'RB' }
    ],
    comments: [
      { id: 'c-2', text: 'Waiting on scale platform delivery - ETA next week', createdAt: createDate(3), createdBy: 'RB' }
    ],
    createdAt: createDate(18),
    updatedAt: createDate(3)
  },
  // 80% Milestone - Not started
  {
    id: 't-7',
    projectId: 'p-1',
    title: 'Onsite installation',
    owner: 'RB',
    status: 'Backlog',
    phase: 'Shipping/Install',
    milestone: 80,
    category: 'Installation',
    estimatedHours: 16,
    timeEntries: [],
    comments: [],
    createdAt: createDate(35),
    updatedAt: createDate(35)
  },
  {
    id: 't-8',
    projectId: 'p-1',
    title: 'User training session',
    owner: 'RB',
    status: 'Backlog',
    phase: 'Site-SW',
    milestone: 80,
    category: 'Training',
    estimatedHours: 4,
    timeEntries: [],
    comments: [],
    createdAt: createDate(35),
    updatedAt: createDate(35)
  },
  // 90% Milestone
  {
    id: 't-9',
    projectId: 'p-1',
    title: 'Go-live support',
    owner: 'RB',
    status: 'Backlog',
    phase: 'Go Live-Follow Up',
    milestone: 90,
    category: 'Installation',
    estimatedHours: 8,
    timeEntries: [],
    comments: [],
    createdAt: createDate(35),
    updatedAt: createDate(35)
  },
  // 100% Milestone - Punch list item
  {
    id: 't-10',
    projectId: 'p-1',
    title: 'Final documentation handoff',
    owner: 'RB',
    status: 'Backlog',
    phase: 'Inhouse Documentation',
    milestone: 100,
    category: 'Documentation',
    estimatedHours: 2,
    timeEntries: [],
    comments: [],
    createdAt: createDate(35),
    updatedAt: createDate(35)
  },
  {
    id: 't-11',
    projectId: 'p-1',
    title: 'Customer requested additional report format',
    owner: 'RB',
    status: 'Ready',
    milestone: 100,
    category: 'Punch List',
    estimatedHours: 2,
    timeEntries: [],
    comments: [
      { id: 'c-3', text: 'Customer asked for custom CSV export', createdAt: createDate(2), createdBy: 'KH' }
    ],
    createdAt: createDate(2),
    updatedAt: createDate(2)
  }
]

// Project 2: Knight Hawk Coal - Software Only project
const knightHawkTasks: Task[] = [
  // 20% Milestone - Complete
  {
    id: 't-20',
    projectId: 'p-2',
    title: 'Project kickoff and requirements gathering',
    owner: 'ES',
    status: 'Done',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 2,
    timeEntries: [
      { id: 'te-20', duration: 2, category: 'PM Time', note: 'Initial meeting', createdAt: createDate(20), createdBy: 'ES' }
    ],
    comments: [],
    createdAt: createDate(25),
    updatedAt: createDate(20)
  },
  {
    id: 't-21',
    projectId: 'p-2',
    title: 'Current system analysis',
    owner: 'ES',
    status: 'Done',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 3,
    timeEntries: [
      { id: 'te-21', duration: 3, category: 'PM Time', note: 'System review', createdAt: createDate(18), createdBy: 'ES' }
    ],
    comments: [],
    createdAt: createDate(25),
    updatedAt: createDate(18)
  },
  // 60% Milestone - Complete
  {
    id: 't-22',
    projectId: 'p-2',
    title: 'Database migration',
    owner: 'ES',
    status: 'Done',
    milestone: 60,
    category: 'Configuration',
    estimatedHours: 8,
    timeEntries: [
      { id: 'te-22', duration: 7, category: 'DB Conversion', note: 'Full migration', createdAt: createDate(12), createdBy: 'ES' }
    ],
    comments: [],
    createdAt: createDate(20),
    updatedAt: createDate(12)
  },
  {
    id: 't-23',
    projectId: 'p-2',
    title: 'Software installation and configuration',
    owner: 'ES',
    status: 'Done',
    milestone: 60,
    category: 'Installation',
    estimatedHours: 6,
    timeEntries: [
      { id: 'te-23', duration: 5.5, category: 'Application Management / Install', note: 'Install complete', createdAt: createDate(10), createdBy: 'ES' }
    ],
    comments: [],
    createdAt: createDate(18),
    updatedAt: createDate(10)
  },
  // 80% Milestone - In Progress
  {
    id: 't-24',
    projectId: 'p-2',
    title: 'User acceptance testing',
    owner: 'ES',
    status: 'InProgress',
    milestone: 80,
    category: 'Testing',
    estimatedHours: 4,
    timeEntries: [
      { id: 'te-24', duration: 2, category: 'Application Management / Install', note: 'UAT started', createdAt: createDate(5), createdBy: 'ES' }
    ],
    comments: [
      { id: 'c-20', text: 'Customer testing - minor issues reported', createdAt: createDate(3), createdBy: 'ES' }
    ],
    createdAt: createDate(12),
    updatedAt: createDate(3)
  },
  {
    id: 't-25',
    projectId: 'p-2',
    title: 'End user training',
    owner: 'ES',
    status: 'Ready',
    milestone: 80,
    category: 'Training',
    estimatedHours: 4,
    timeEntries: [],
    comments: [],
    createdAt: createDate(12),
    updatedAt: createDate(12)
  },
  // 90% Milestone
  {
    id: 't-26',
    projectId: 'p-2',
    title: 'Production cutover',
    owner: 'ES',
    status: 'Backlog',
    milestone: 90,
    category: 'Installation',
    estimatedHours: 4,
    timeEntries: [],
    comments: [],
    createdAt: createDate(25),
    updatedAt: createDate(25)
  },
  // 100% Milestone
  {
    id: 't-27',
    projectId: 'p-2',
    title: 'Project closeout documentation',
    owner: 'ES',
    status: 'Backlog',
    milestone: 100,
    category: 'Documentation',
    estimatedHours: 2,
    timeEntries: [],
    comments: [],
    createdAt: createDate(25),
    updatedAt: createDate(25)
  }
]

const haasReviewNotes: ReviewNote[] = [
  {
    id: 'rn-1',
    projectId: 'p-1',
    text: 'Scale platform delayed - need to follow up with vendor',
    isReviewed: false,
    createdAt: createDate(3),
    createdBy: 'KH'
  }
]

const knightHawkReviewNotes: ReviewNote[] = [
  {
    id: 'rn-2',
    projectId: 'p-2',
    text: 'Customer UAT feedback needs review - 3 minor issues',
    isReviewed: false,
    createdAt: createDate(2),
    createdBy: 'KH'
  },
  {
    id: 'rn-3',
    projectId: 'p-2',
    text: 'Training scheduled for next Tuesday',
    isReviewed: true,
    createdAt: createDate(5),
    createdBy: 'KH',
    reviewedAt: createDate(4),
    reviewedBy: 'KH'
  }
]

export const mockProjects: Project[] = [
  {
    id: 'p-1',
    name: 'Haas & Sons Scale System',
    customer: 'Haas & Sons',
    workOrderId: '20250564',
    orderDate: createDate(40),
    leadTimeType: 'SoftwareAndHardware',
    reseller: 'Midwest Scale Co.',
    scaleDealer: 'Precision Scales Inc.',
    owner: 'RB',
    contributors: ['ES'],
    status: 'Open',
    blocked: true,
    type: 'Hardware',
    quotedHours: {
      'PM Time': 8,
      'Application Management / Install': 12,
      'Build Time': 10,
      'DB Conversion': 6,
      'Onsite Install – Work': 16,
      'Onsite Install – Travel': 4
    },
    tasks: haasAndSonsTasks,
    reviewNotes: haasReviewNotes,
    createdAt: createDate(40),
    updatedAt: createDate(2)
  },
  {
    id: 'p-2',
    name: 'Knight Hawk Coal Software Upgrade',
    customer: 'Knight Hawk Coal',
    workOrderId: '20250587',
    orderDate: createDate(30),
    leadTimeType: 'SoftwareOnly',
    owner: 'ES',
    contributors: ['RB'],
    status: 'Open',
    blocked: false,
    type: 'SoftwareOnly',
    quotedHours: {
      'PM Time': 6,
      'Application Management / Install': 10,
      'DB Conversion': 8
    },
    tasks: knightHawkTasks,
    reviewNotes: knightHawkReviewNotes,
    createdAt: createDate(30),
    updatedAt: createDate(3)
  }
]

export const timeCategories = [
  'PM Time',
  'Application Management / Install',
  'Build Time',
  'DB Conversion',
  'Onsite Install – Work',
  'Onsite Install – Travel'
] as const

export const taskStatuses = [
  'Backlog',
  'Ready',
  'InProgress',
  'Blocked',
  'Waiting',
  'Done',
  'Canceled'
] as const

export const taskCategories = [
  'Setup',
  'Configuration',
  'Installation',
  'Training',
  'Testing',
  'Documentation',
  'Punch List'
] as const

export const projectTypes: { value: ProjectType; label: string }[] = [
  { value: 'SoftwareOnly', label: 'Software Only' },
  { value: 'HardwareOnly', label: 'Hardware Only' },
  { value: 'HardwareSoftware', label: 'Hardware + Software' }
]

// Master Task Template Library
// Each task is tagged with which project types it applies to
// Assignee: '[ProjectOwner]' = assigned to project owner, or specific user ID
export const mockTaskTemplates: TaskTemplate[] = [
  // ===== SPECIAL PROJ. NOTES (20%) =====
  {
    id: 'tmpl-1',
    title: 'Initial customer kickoff call',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Special Proj. Notes',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 1,
    assignee: '[ProjectOwner]',
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-notes-2',
    title: 'Review special project requirements',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Special Proj. Notes',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 1,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },

  // ===== INHOUSE PLANNING (20%) =====
  {
    id: 'tmpl-2',
    title: 'Gather site requirements',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Planning',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 2,
    assignee: '[ProjectOwner]',
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-3',
    title: 'Current system analysis',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Planning',
    milestone: 20,
    category: 'Setup',
    estimatedHours: 3,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-plan-1',
    title: 'HW Drawings',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 8,
    assignee: '[ProjectOwner]',
    subtasks: [
      { id: 'st-hw-1', title: 'Post Drawings', estimatedHours: 2, assignee: '[ProjectOwner]', order: 1 },
      { id: 'st-hw-2', title: 'Post Location', estimatedHours: 1, assignee: '[ProjectOwner]', order: 2 },
      { id: 'st-hw-3', title: 'Design Diagram', estimatedHours: 2, assignee: '[ProjectOwner]', order: 3 },
      { id: 'st-hw-4', title: 'Review with Electricians', estimatedHours: 1, assignee: '[ProjectOwner]', order: 4 }
    ],
    order: 3,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-plan-2',
    title: 'Remote SW Drawings',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Planning',
    milestone: 40,
    category: 'Documentation',
    estimatedHours: 4,
    assignee: '[ProjectOwner]',
    order: 4,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  
  // ===== INHOUSE-HW/SW (40%) =====
  {
    id: 'tmpl-4',
    title: 'Hardware order placed and confirmed',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse-HW/SW',
    milestone: 40,
    category: 'Setup',
    estimatedHours: 1,
    assignee: 'jm',
    departmentId: 'dept-prod',
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-5',
    title: 'Database conversion planning',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse-HW/SW',
    milestone: 40,
    category: 'Configuration',
    estimatedHours: 4,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-hw-1',
    title: 'Staging/Build HW',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse-HW/SW',
    milestone: 60,
    category: 'Installation',
    estimatedHours: 8,
    assignee: 'jm',
    departmentId: 'dept-prod',
    subtasks: [
      { id: 'st-stg-1', title: 'Unbox and inventory', estimatedHours: 1, assignee: 'jm', order: 1 },
      { id: 'st-stg-2', title: 'Assemble components', estimatedHours: 3, assignee: 'jm', order: 2 },
      { id: 'st-stg-3', title: 'Initial power-on test', estimatedHours: 1, assignee: 'jm', order: 3 },
      { id: 'st-stg-4', title: 'Configure network settings', estimatedHours: 1, assignee: 'jm', order: 4 }
    ],
    order: 3,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-hw-2',
    title: 'QC Testing',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse-HW/SW',
    milestone: 60,
    category: 'Testing',
    estimatedHours: 4,
    assignee: 'jm',
    departmentId: 'dept-prod',
    order: 4,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  
  // ===== INHOUSE DOCUMENTATION (60%) =====
  {
    id: 'tmpl-6',
    title: 'Software configuration',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Documentation',
    milestone: 60,
    category: 'Configuration',
    estimatedHours: 8,
    assignee: '[ProjectOwner]',
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-8',
    title: 'Database migration',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Documentation',
    milestone: 60,
    category: 'Configuration',
    estimatedHours: 8,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-doc-1',
    title: 'Create customer documentation',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Inhouse Documentation',
    milestone: 60,
    category: 'Documentation',
    estimatedHours: 3,
    assignee: '[ProjectOwner]',
    order: 3,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  
  // ===== ONSITE (80%) =====
  {
    id: 'tmpl-9',
    title: 'Onsite hardware installation',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Onsite',
    milestone: 80,
    category: 'Installation',
    estimatedHours: 16,
    assignee: '[ProjectOwner]',
    subtasks: [
      { id: 'st-site-1', title: 'Unload and position equipment', estimatedHours: 2, assignee: '[ProjectOwner]', order: 1 },
      { id: 'st-site-2', title: 'Electrical connections', estimatedHours: 3, assignee: '[ProjectOwner]', order: 2 },
      { id: 'st-site-3', title: 'Network/data connections', estimatedHours: 2, assignee: '[ProjectOwner]', order: 3 },
      { id: 'st-site-4', title: 'Calibration', estimatedHours: 4, assignee: '[ProjectOwner]', order: 4 },
      { id: 'st-site-5', title: 'Initial testing', estimatedHours: 3, assignee: '[ProjectOwner]', order: 5 }
    ],
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  
  // Software onsite tasks (also in Onsite phase, differentiated by projectTypes)
  {
    id: 'tmpl-10',
    title: 'Software installation and configuration',
    projectTypes: ['SoftwareOnly'],
    phase: 'Onsite',
    milestone: 80,
    category: 'Installation',
    estimatedHours: 6,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-12',
    title: 'User acceptance testing',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Onsite',
    milestone: 80,
    category: 'Testing',
    estimatedHours: 4,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  
  // ===== SHIPPING/INSTALL (80%) =====
  {
    id: 'tmpl-ship-1',
    title: 'Coordinate shipping',
    projectTypes: ['HardwareOnly', 'HardwareSoftware'],
    phase: 'Shipping/Install',
    milestone: 80,
    category: 'Setup',
    estimatedHours: 2,
    assignee: 'jm',
    departmentId: 'dept-prod',
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-11',
    title: 'User training session',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Shipping/Install',
    milestone: 80,
    category: 'Training',
    estimatedHours: 4,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  
  // ===== GO LIVE-FOLLOW UP (90-100%) =====
  {
    id: 'tmpl-13',
    title: 'Production cutover',
    projectTypes: ['SoftwareOnly', 'HardwareSoftware'],
    phase: 'Go Live-Follow Up',
    milestone: 90,
    category: 'Installation',
    estimatedHours: 4,
    assignee: '[ProjectOwner]',
    order: 1,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-14',
    title: 'Go-live support',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Go Live-Follow Up',
    milestone: 90,
    category: 'Installation',
    estimatedHours: 8,
    assignee: '[ProjectOwner]',
    order: 2,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-followup-1',
    title: 'Post go-live check-in (1 week)',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Go Live-Follow Up',
    milestone: 100,
    category: 'Setup',
    estimatedHours: 1,
    assignee: '[ProjectOwner]',
    order: 3,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-followup-2',
    title: 'Punch list items',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Go Live-Follow Up',
    milestone: 100,
    category: 'Punch List',
    estimatedHours: 4,
    assignee: '[ProjectOwner]',
    order: 4,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-15',
    title: 'Final documentation handoff',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Go Live-Follow Up',
    milestone: 100,
    category: 'Documentation',
    estimatedHours: 2,
    assignee: '[ProjectOwner]',
    order: 5,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  },
  {
    id: 'tmpl-16',
    title: 'Project closeout',
    projectTypes: ['SoftwareOnly', 'HardwareOnly', 'HardwareSoftware'],
    phase: 'Go Live-Follow Up',
    milestone: 100,
    category: 'Documentation',
    estimatedHours: 2,
    assignee: '[ProjectOwner]',
    order: 6,
    createdAt: createDate(100),
    updatedAt: createDate(100)
  }
]
