-- ============================================
-- LAUNCHPAD DATABASE SCHEMA
-- ============================================

-- ============================================
-- CORE TABLES
-- ============================================

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lead_user_id UUID, -- Will add FK after users table created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PM', 'Technician', 'Admin')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for department lead after users table exists
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_lead 
FOREIGN KEY (lead_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer TEXT NOT NULL,
  work_order_id TEXT,
  order_date DATE,
  project_type TEXT NOT NULL CHECK (project_type IN ('SoftwareOnly', 'HardwareOnly', 'HardwareSoftware')),
  reseller TEXT,
  scale_dealer TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  blocked BOOLEAN DEFAULT FALSE,
  quoted_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Project Contributors (many-to-many: which users work on which projects)
CREATE TABLE project_contributors (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Backlog' CHECK (status IN ('Backlog', 'Ready', 'InProgress', 'Blocked', 'Waiting', 'Done', 'Canceled')),
  milestone INTEGER NOT NULL CHECK (milestone IN (20, 40, 60, 80, 90, 100)),
  category TEXT NOT NULL,
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries (time logged against tasks)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  duration DECIMAL(5,2) NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments (on tasks)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Notes (PM review items for a project)
CREATE TABLE review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Task Templates (for auto-creating tasks on new projects)
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  project_types TEXT[] NOT NULL,
  milestone INTEGER NOT NULL CHECK (milestone IN (20, 40, 60, 80, 90, 100)),
  category TEXT NOT NULL,
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  assignee TEXT DEFAULT '[ProjectOwner]',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  lead_time_weeks INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECT INTAKE / SETUP INFO TABLES
-- ============================================

-- Project Sites (multiple sites per project)
CREATE TABLE project_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  is_shipping_address BOOLEAN DEFAULT FALSE,
  has_loading_dock BOOLEAN,
  freight_broker_info TEXT,
  scale_pc_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network Devices (multiple per site)
CREATE TABLE network_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES project_sites(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL CHECK (device_type IN ('Kiosk', 'Relay', 'Intercom', 'Camera', 'CardReader', 'Other')),
  device_name TEXT,
  ip_address TEXT,
  subnet_mask TEXT,
  gateway TEXT,
  dns_primary TEXT,
  dns_secondary TEXT,
  sip_extension TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Contacts (multiple per project)
CREATE TABLE project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('Main', 'IT', 'Electrician', 'ScaleDealer', 'Other')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scale Configuration (one per site, for sites with scales)
CREATE TABLE scale_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES project_sites(id) ON DELETE CASCADE,
  location TEXT,
  model TEXT,
  dealer_name TEXT,
  dealer_phone TEXT,
  dealer_email TEXT,
  baud_rate TEXT,
  data_bits TEXT,
  stop_bits TEXT,
  parity TEXT,
  flow_control TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Software Configuration (one per project, for Software projects)
CREATE TABLE software_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  license_info TEXT,
  backup_requirements TEXT,
  custom_reports_needed BOOLEAN DEFAULT FALSE,
  smtp_server TEXT,
  smtp_port TEXT,
  smtp_from TEXT,
  smtp_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solar Configuration (one per site, for Solar projects)
CREATE TABLE solar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES project_sites(id) ON DELETE CASCADE,
  battery_count INTEGER,
  battery_model TEXT,
  panel_shipping_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_review_notes_project ON review_notes(project_id);
CREATE INDEX idx_project_sites_project ON project_sites(project_id);
CREATE INDEX idx_network_devices_site ON network_devices(site_id);
CREATE INDEX idx_project_contacts_project ON project_contacts(project_id);
