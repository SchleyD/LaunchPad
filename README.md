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

## Open Design Decisions

These are architectural decisions that need to be finalized. Each has trade-offs to consider.

### Decision 1: Primary Task Grouping Method

**How should tasks be grouped at the top level?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **By Phase** | Planning → Build → Ship → Install → Go-Live | Matches project lifecycle, clear progression | Phases might not apply equally to all project types |
| **By Location** | Inhouse vs Site | Simple mental model, clear ownership | Doesn't show progress through lifecycle |
| **By Type** | HW / SW / Documentation | Good for specialist teams | Doesn't show when things happen |
| **Flat with Tags** | All tasks in one list, filter by tags | Most flexible | Can get overwhelming, less visual structure |

**Status:** Not decided

---

### Decision 2: Task Hierarchy

**Should tasks have subtasks?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Flat tasks only** | Every item is a standalone task | Simple, no nesting complexity | Can't group related work (e.g., "HW Drawings" with subtasks) |
| **One level of subtasks** | Tasks can have checklist items beneath them | Captures detail without deep nesting | Need to decide what's a task vs subtask |
| **Multi-level nesting** | Tasks → Subtasks → Sub-subtasks | Maximum flexibility | Complex UI, harder to track progress |

**Status:** Not decided

---

### Decision 3: Templates

**How should standard work be pre-populated?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Project-type templates** | "Inhouse HW/SW" project auto-creates standard phases/tasks | Consistency, fast setup | Needs template maintenance, may create tasks you don't need |
| **Phase templates** | Add a phase, get its standard tasks | More granular control | More clicks to set up a project |
| **No templates** | Build task list manually each time | Maximum flexibility | Repetitive, easy to forget steps |

**Status:** Not decided

---

### Decision 4: Progress Visualization

**How should completion be shown?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Progress bars per group** | Like ClickUp - colored bar showing % complete | Visual, quick to scan | Requires grouping |
| **Task counts** | "5 of 12 complete" | Simple, clear | Less visual impact |
| **Kanban columns** | Cards move through status columns | Great for active work | Doesn't show full project scope |
| **Checklist style** | Simple checkboxes, completed items collapse | Clean, focused on what's left | Harder to see overall progress |

**Status:** Not decided

---

### Decision 5: Who Sees What

**Should task views differ by role?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Everyone sees everything** | Full transparency | Simple, no permission management | Can be noisy for field techs |
| **Role-based filtering** | Techs see their assigned work, PMs see all | Focused views | More complex, need to assign tasks |
| **View toggles** | User chooses their preferred view | Flexible | User has to configure |

**Status:** Not decided

---

### Decision 6: Task Assignment

**How are tasks assigned to people?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **No assignment** | Tasks belong to the project, anyone can do them | Simple for small teams | No accountability |
| **Single assignee** | One person per task | Clear ownership | Doesn't handle team work well |
| **Multiple assignees** | Multiple people can be assigned | Reflects reality | Can diffuse responsibility |
| **Team/role assignment** | Assign to "HW Team" not individuals | Good for phases of work | Less individual accountability |

**Status:** Not decided

---

### Decision 7: Time Tracking Relationship

**How does time tracking connect to tasks?**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Log time against tasks** | Each time entry tied to a specific task | Granular tracking, see effort per task | More clicks, need to pick task each time |
| **Log time against phases** | Time tracked at phase level | Simpler, still useful | Less detail |
| **Separate from tasks** | Time tracking is project-level only | Simplest | Can't see where time went |

**Status:** Not decided

---

### Suggested Starting Point

If building iteratively, a reasonable starting configuration:

1. **Grouping**: Phase-based (matches existing ClickUp mental model)
2. **Hierarchy**: One level of subtasks
3. **Templates**: Project-type templates
4. **Progress**: Progress bars per phase
5. **Views**: Everyone sees all, with filter options
6. **Assignment**: Optional single assignee
7. **Time**: Log against tasks

---

## License

Internal use only - Advanced Weighing Systems
