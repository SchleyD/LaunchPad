# Launchpad

**AWS Internal Project Execution Tool**

Launchpad is an internal web application for Advanced Weighing Systems (AWS) that replaces ClickUp for customer project execution tracking. It focuses on milestone-driven progress calculation, task management, time tracking, and PM review workflows.

> **Note:** This tool does NOT handle billing or support tickets.

## Tech Stack

- **Vue 3** (Composition API)
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **TailwindCSS** - Styling

## Features

### Project Management
- Project creation from templates with smart owner assignment
- Milestone-driven progress calculation (Hardware: 20/40/60/80/90/100%, Software-Only: 20/60/80/90/100%)
- Project status indicators (Blocked, Stalled, Active)
- Quoted hours vs. actual hours tracking per category

### Task Management
- Task list with sortable columns (Task, Milestone, Status, Owner, Time)
- Task filtering by status and milestone
- Task drawer for status updates, time logging, and comments
- Automatic progress rollback when lower-milestone tasks are reopened

### Template System
- Master task library with project type tags (Software Only, Hardware Only, Hardware + Software)
- Smart assignee assignment:
  - `[Project Owner]` - dynamically assigned during project creation
  - Specific person - always assigned regardless of project owner
- Pre-set milestones on task templates
- Admin-only template editing

### PM Review
- Weekly review workflow replacing spreadsheet-driven process
- Summary stats (active projects, blocked count, needs review)
- Progress comparison with selectable date range
- Review notes that persist until marked reviewed
- Convert notes to tasks functionality

### Time Tracking
- Log time entries with category and notes
- Time categories: PM Time, Application Management/Install, Build Time, DB Conversion, Onsite Install (Work/Travel)
- Quoted vs. used hours comparison with visual indicators
- Over-budget warnings (amber at 80%, red over 100%)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── AppHeader.vue
│   ├── AppSidebar.vue
│   ├── CreateProjectModal.vue
│   ├── ProgressBar.vue
│   ├── ProjectCard.vue
│   ├── ProjectTimeTab.vue
│   ├── ReviewNoteCard.vue
│   ├── TaskDrawer.vue
│   └── TaskList.vue
├── data/
│   └── mockData.ts      # Mock data for prototype
├── router/
│   └── index.ts         # Vue Router configuration
├── stores/
│   └── projects.ts      # Pinia store for state management
├── styles/
│   └── main.css         # Global styles and Tailwind config
├── types/
│   └── index.ts         # TypeScript type definitions
├── views/               # Page components
│   ├── PMReviewView.vue
│   ├── ProjectDetailView.vue
│   ├── ProjectListView.vue
│   └── TemplateManagementView.vue
├── App.vue              # Root component
└── main.ts              # Application entry point
```

## Data Model

### Project Types
- **SoftwareOnly** - Software-only implementations
- **HardwareOnly** - Hardware-only installations
- **HardwareSoftware** - Combined hardware + software projects

### Task Statuses
- Backlog, Ready, In Progress, Waiting, Done, Canceled, Blocked

### Milestones
Progress is calculated based on completed milestones:
- **Hardware projects:** 20% → 40% → 60% → 80% → 90% → 100%
- **Software-only:** 20% → 60% → 80% → 90% → 100%

A project only advances when ALL tasks at a milestone level are Done or Canceled.

## Mock Users

| Initials | Name | Role |
|----------|------|------|
| RB | Rachel B. | PM |
| ES | Eric S. | PM |
| JM | Josh M. | Admin |
| KH | Kevin H. | Technician |

## License

Internal use only - Advanced Weighing Systems
