-- ============================================
-- ACTION ITEMS & PUNCH LIST TABLES
-- ============================================

-- Action Items (things we're waiting on customer to do)
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to TEXT, -- Customer contact name or role, not internal user
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Waiting', 'Closed')),
  due_date DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Punch List Items (things WE need to verify/complete before closing)
CREATE TABLE punch_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_action_items_project ON action_items(project_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_punch_list_project ON punch_list_items(project_id);
