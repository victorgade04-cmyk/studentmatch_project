-- Allow admin-initiated conversations where only one side (student OR company) is present
ALTER TABLE conversations ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE conversations ALTER COLUMN company_id DROP NOT NULL;

-- Track which admin initiated the conversation
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS admin_participant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_admin_participant_idx
  ON conversations(admin_participant_id);
