-- ============================================================
-- MELHEK OS — Supabase Database Schema (V1 MVP)
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ─── TABLE: profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   text NOT NULL DEFAULT '',
  avatar_url  text,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  timezone    text NOT NULL DEFAULT 'Africa/Addis_Ababa',
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── TABLE: projects ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  color        text NOT NULL DEFAULT '#00d4ff',
  icon         text DEFAULT '📁',
  owner_id     uuid REFERENCES public.profiles(id) NOT NULL,
  target_date  date,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

-- ─── TABLE: tasks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority     text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  project_id   uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  assignee_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by   uuid REFERENCES public.profiles(id) NOT NULL,
  due_date     date,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_project_id_idx  ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx      ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx    ON public.tasks(due_date);

-- ─── TABLE: ai_conversations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.profiles(id) NOT NULL,
  title         text,
  messages      jsonb NOT NULL DEFAULT '[]',
  context_type  text CHECK (context_type IN ('task', 'project', 'general')),
  context_id    uuid,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_convs_user_idx ON public.ai_conversations(user_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe re-run)
DROP POLICY IF EXISTS "profiles_read_all"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "projects_authenticated" ON public.projects;
DROP POLICY IF EXISTS "tasks_authenticated"    ON public.tasks;
DROP POLICY IF EXISTS "ai_convs_own"           ON public.ai_conversations;

-- Profiles: anyone authenticated can read; only owner can update
CREATE POLICY "profiles_read_all"   ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: all authenticated users can read/write (small internal team)
CREATE POLICY "projects_authenticated" ON public.projects FOR ALL USING (auth.role() = 'authenticated');

-- Tasks: all authenticated users can read/write
CREATE POLICY "tasks_authenticated" ON public.tasks FOR ALL USING (auth.role() = 'authenticated');

-- AI Conversations: users see only their own
CREATE POLICY "ai_convs_own" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

-- ─── TABLE: notes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title       text NOT NULL DEFAULT 'Untitled Note',
  content     text NOT NULL DEFAULT '',
  tags        text[] NOT NULL DEFAULT '{}',
  is_pinned   boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notes_user_idx       ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_project_idx    ON public.notes(project_id);
CREATE INDEX IF NOT EXISTS notes_pinned_idx     ON public.notes(is_pinned);
CREATE INDEX IF NOT EXISTS notes_updated_idx    ON public.notes(updated_at DESC);
-- Full-text search index on title + content
CREATE INDEX IF NOT EXISTS notes_fts_idx ON public.notes
  USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notes_own" ON public.notes;
CREATE POLICY "notes_own" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- ─── STORAGE: note-attachments bucket ────────────────────────
-- Run this separately in the Supabase Storage tab or via the SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('note-attachments', 'note-attachments', false) ON CONFLICT DO NOTHING;
-- DROP POLICY IF EXISTS "note_attach_auth" ON storage.objects;
-- CREATE POLICY "note_attach_auth" ON storage.objects FOR ALL USING (auth.role() = 'authenticated' AND bucket_id = 'note-attachments');

-- ─── DONE ────────────────────────────────────────────────────
-- After running this script:
-- 1. Create a user in Supabase Auth Dashboard (Authentication > Users > Add user)
-- 2. The trigger auto-creates their profile row
-- 3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
-- 4. Set ANTHROPIC_API_KEY in .env.local
-- 5. Run: npm run dev
-- 6. In Supabase Storage tab: create bucket named "note-attachments" (private)
