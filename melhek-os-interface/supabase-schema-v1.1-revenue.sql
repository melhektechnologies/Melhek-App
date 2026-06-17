-- ============================================================
-- MELHEK OS V1.1 — Revenue Execution Schema
-- Run this in your Supabase SQL Editor AFTER the base schema
-- ============================================================

-- ─── TABLE: opportunities ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.opportunities (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name      text NOT NULL,
  contact_name      text,
  phone             text,
  industry          text,
  potential_revenue numeric(12, 2) NOT NULL DEFAULT 0,
  probability       integer NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  stage             text NOT NULL DEFAULT 'lead'
                    CHECK (stage IN ('lead', 'contacted', 'proposal_sent', 'follow_up', 'negotiation', 'won', 'lost')),
  last_contact_date date,
  next_action       text,
  next_action_date  date,
  notes             text,
  proposal_link     text,
  project_id        uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER handle_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE INDEX IF NOT EXISTS opp_user_idx   ON public.opportunities(user_id);
CREATE INDEX IF NOT EXISTS opp_stage_idx  ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS opp_next_action_date_idx ON public.opportunities(next_action_date);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opportunities_own" ON public.opportunities;
CREATE POLICY "opportunities_own" ON public.opportunities FOR ALL USING (auth.uid() = user_id);

-- ─── TABLE: daily_scorecards ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_scorecards (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date                date NOT NULL DEFAULT CURRENT_DATE,
  calls_made          integer NOT NULL DEFAULT 0,
  followups_sent      integer NOT NULL DEFAULT 0,
  meetings_booked     integer NOT NULL DEFAULT 0,
  proposals_sent      integer NOT NULL DEFAULT 0,
  deals_closed        integer NOT NULL DEFAULT 0,
  revenue_generated   numeric(12, 2) NOT NULL DEFAULT 0,
  reflection          text,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, date)
);

CREATE TRIGGER handle_scorecards_updated_at
  BEFORE UPDATE ON public.daily_scorecards
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE INDEX IF NOT EXISTS scorecards_user_date_idx ON public.daily_scorecards(user_id, date DESC);

ALTER TABLE public.daily_scorecards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scorecards_own" ON public.daily_scorecards;
CREATE POLICY "scorecards_own" ON public.daily_scorecards FOR ALL USING (auth.uid() = user_id);

-- ─── TABLE: proposal_templates ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  category    text NOT NULL DEFAULT 'custom',
  content     text NOT NULL DEFAULT '',
  tags        text[] NOT NULL DEFAULT '{}',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER handle_proposals_updated_at
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE INDEX IF NOT EXISTS proposals_user_idx ON public.proposal_templates(user_id);

ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals_own" ON public.proposal_templates;
CREATE POLICY "proposals_own" ON public.proposal_templates FOR ALL USING (auth.uid() = user_id);

-- ─── TABLE: note_links ────────────────────────────────────────
-- Links notes to opportunities (or other entities in future)
CREATE TABLE IF NOT EXISTS public.note_links (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id          uuid REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  opportunity_id   uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS note_links_note_idx        ON public.note_links(note_id);
CREATE INDEX IF NOT EXISTS note_links_opportunity_idx ON public.note_links(opportunity_id);

ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "note_links_auth" ON public.note_links;
CREATE POLICY "note_links_auth" ON public.note_links FOR ALL USING (auth.role() = 'authenticated');

-- ─── REVENUE GOAL SETTINGS (stored in profiles as metadata) ──
-- We store revenue goal config as a JSON column on profiles.
-- If you prefer a separate table, that's an easy refactor.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS revenue_goal      numeric(12,2) DEFAULT 300000,
  ADD COLUMN IF NOT EXISTS sprint_start_date date          DEFAULT '2026-06-17',
  ADD COLUMN IF NOT EXISTS sprint_days       integer       DEFAULT 84;

-- ─── DONE ────────────────────────────────────────────────────
-- Run this after base schema (supabase-schema.sql)
-- Then seed default proposal templates per user if desired.
