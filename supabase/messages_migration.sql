-- Run this in the Supabase SQL editor to enable the messaging system

-- Conversations (one per student-company pair)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, company_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = company_id);

CREATE POLICY "Users create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = company_id);

CREATE POLICY "Users update their conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = company_id);

CREATE POLICY "Users see messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
    )
  );

CREATE POLICY "Users send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.company_id = auth.uid())
    )
  );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
open -a TextEdit ~/Downloads/studentmatch_project/supabase/package_migration.sql

