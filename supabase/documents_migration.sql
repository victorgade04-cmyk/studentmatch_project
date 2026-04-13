-- Run this in the Supabase SQL editor to add the student documents system

-- 1. Create student_documents table
CREATE TABLE IF NOT EXISTS public.student_documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   text        NOT NULL,
  file_path   text        NOT NULL,
  file_size   integer     NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- 3. Students can view their own documents
CREATE POLICY "Students can view own documents"
  ON public.student_documents FOR SELECT
  USING (auth.uid() = student_id);

-- 4. Students can insert their own documents
CREATE POLICY "Students can insert own documents"
  ON public.student_documents FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- 5. Students can delete their own documents
CREATE POLICY "Students can delete own documents"
  ON public.student_documents FOR DELETE
  USING (auth.uid() = student_id);

-- 6. Companies and admins can view all student documents
CREATE POLICY "Companies and admins can view all documents"
  ON public.student_documents FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('company', 'admin')
  );


-- ── STORAGE ──────────────────────────────────────────────────────────────────
-- Create a PRIVATE bucket called "student-documents" in the Supabase dashboard
-- (Storage → New bucket → name: student-documents, public: OFF)
-- Then run the storage policies below:

-- Students can upload files to their own folder (folder = their user id)
CREATE POLICY "Students upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can delete their own files
CREATE POLICY "Students delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Companies and admins can read all files (needed for createSignedUrl)
CREATE POLICY "Companies and admins read files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('company', 'admin')
  );
