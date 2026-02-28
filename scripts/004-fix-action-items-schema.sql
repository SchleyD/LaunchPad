-- Fix action_items table if notes column is missing
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Fix punch_list_items table if is_completed column doesn't exist (rename is_complete)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'punch_list_items' AND column_name = 'is_complete') THEN
    ALTER TABLE punch_list_items RENAME COLUMN is_complete TO is_completed;
  END IF;
END $$;

-- Change completed_by from UUID to TEXT if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'punch_list_items' AND column_name = 'completed_by' AND data_type = 'uuid') THEN
    ALTER TABLE punch_list_items ALTER COLUMN completed_by TYPE TEXT;
  END IF;
END $$;
