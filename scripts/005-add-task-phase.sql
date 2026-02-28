-- Add phase column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS phase TEXT;

-- Add index for efficient filtering by phase
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);
