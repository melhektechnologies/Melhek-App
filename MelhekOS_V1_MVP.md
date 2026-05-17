# MELHEK OS — V1 MVP BLUEPRINT
### Solo Founder Build Guide | Cursor + V0 + Supabase + AI Tools
#### Surgical. Realistic. Shippable in 6–8 weeks.

---

## THE SINGLE RULE FOR THIS BUILD

> **If it doesn't make a solo founder more productive on Day 1, it does not exist in V1.**

Everything in this document passes that test. Everything cut from the enterprise doc failed it.

---

## PART 1: EXACT MVP SCOPE

### What V1 IS

A fast, beautiful internal productivity tool with 6 modules:

| # | Module | Core Job |
|---|--------|----------|
| 1 | Dashboard | See everything at a glance |
| 2 | Tasks | Create, assign, track, complete work |
| 3 | Projects | Group tasks, track progress |
| 4 | Calendar | See what's happening and when |
| 5 | AI Assistant | Answer questions, draft content |
| 6 | Notes | Store and retrieve knowledge |

### What V1 IS NOT

- Not a CRM
- Not an automation engine
- Not a billing/invoice system
- Not a hotel ops platform
- Not an agency ops platform
- Not a team of 50 people tool (it's for YOU first)
- Not a public SaaS product

### The Honest User Count for V1

**2–5 internal users.** You + a small team. Design for this. Do not over-engineer.

---

## PART 2: EVERYTHING CUT (AND WHY)

Cut these completely from V1. Do not build stubs, do not build empty pages.

| Feature | Why Cut |
|---------|---------|
| CRM module | Entire separate data model; adds 3+ weeks |
| Automation engine | Needs event bus, queues, worker processes |
| Invoice/Finance | Regulatory complexity, payment integrations |
| Hotel Ops module | Vertical-specific, not day-1 critical |
| Agency Ops module | Same — phase 2 after core works |
| Role-based permissions (RBAC) | Admin + member is enough in V1 |
| Real-time collaboration | Supabase Realtime adds complexity; skip |
| AI health scoring | Requires historical data that doesn't exist yet |
| Report builder | No data yet to report on |
| WhatsApp integration | External API complexity |
| Email integration | Gmail OAuth scope, threading — skip |
| Client portal | No clients using this yet |
| Native mobile app | PWA is fine for internal V1 |
| Recurring tasks (RRULE) | Add in V1.5 when basic tasks work |
| Time tracking | Focus on task completion first |
| Gantt/Timeline view | Complex to build; List + Kanban is enough |
| Dependency graph | Same |
| Multiple pipelines | No CRM in V1 |
| Notification delivery (email/WhatsApp) | In-app only in V1 |
| Dark/light theme toggle | Launch dark. That's the brand. |
| CSV import/export | Not critical on day 1 |
| Webhooks (inbound/outbound) | Automation phase |
| SSO / Google login | Username + password is fine for 5 users |
| Multi-organization | Single org. It's internal. |
| Audit log | Add in V1.5 when you have users |
| AI win probability scoring | No CRM = no deals to score |
| Portfolio/resource management | Too complex; add when you have 10+ projects |

---

## PART 3: EXACT DATABASE SCHEMA (V1 ONLY)

### Technology: Supabase (PostgreSQL + Auth + Storage)

**Why Supabase:**
- Handles auth out of the box (no building login system)
- Postgres is real SQL that scales
- Built-in file storage for note attachments
- Auto-generated REST API (you get free API endpoints)
- Row Level Security keeps data safe without custom middleware
- Free tier handles V1 comfortably

---

### TABLE 1: profiles
*Extends Supabase's built-in auth.users table*

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  role text not null default 'member', -- 'admin' | 'member'
  timezone text not null default 'Africa/Addis_Ababa',
  created_at timestamptz default now() not null
);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### TABLE 2: projects

```sql
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  status text not null default 'active', -- 'active' | 'completed' | 'archived'
  color text not null default '#00d4ff', -- hex color for UI
  icon text default '📁',               -- emoji icon
  owner_id uuid references public.profiles(id) not null,
  target_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- progress is computed, not stored (avoids sync bugs)
-- computed via: count(done tasks) / count(all tasks)
```

**Why this is simple:** No budget fields, no milestones table, no template system. A project is just a named container for tasks. That's it.

---

### TABLE 3: tasks

```sql
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,                      -- plain text or markdown; no rich text editor needed yet
  status text not null default 'todo',  -- 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority text not null default 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
  project_id uuid references public.projects(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) not null,
  due_date date,
  sort_order integer default 0,          -- for drag-and-drop reordering
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for the queries you'll actually run
create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_assignee_id_idx on public.tasks(assignee_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_due_date_idx on public.tasks(due_date);
```

**What's NOT in this table (cut for V1):**
- No `parent_task_id` (no subtasks yet)
- No `estimated_hours` / `actual_hours` (no time tracking)
- No `recurrence` (no recurring tasks)
- No `tags` (use priority + project instead)
- No `dependencies` (no dependency graph)
- No `search_vector` (basic ILIKE search is fine for V1)
- No `embedding` (AI search is V1.5)

---

### TABLE 4: calendar_events

```sql
create table public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_type text not null default 'meeting', -- 'meeting' | 'deadline' | 'reminder' | 'block'
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean default false,
  color text default '#00d4ff',
  owner_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null, -- optional link to a task
  location text,                         -- "Zoom: link" or "Office"
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index events_owner_start_idx on public.calendar_events(owner_id, start_at);
```

**V1 scope:** No Google Calendar sync. Manual event entry only. Sync is V1.5.

---

### TABLE 5: notes

```sql
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,                           -- markdown content
  owner_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id) on delete set null,
  is_pinned boolean default false,
  tags text[] default '{}',              -- simple string array: ['sop', 'hotel', 'meeting']
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Full-text search on notes (simple but effective)
create index notes_search_idx on public.notes
  using gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));

create index notes_owner_idx on public.notes(owner_id);
create index notes_project_idx on public.notes(project_id);
```

---

### TABLE 6: ai_conversations

```sql
create table public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text,                            -- auto-generated from first message
  messages jsonb not null default '[]', -- array of {role, content, timestamp}
  context_type text,                     -- 'task' | 'project' | 'note' | 'general'
  context_id uuid,                       -- id of the linked task/project/note
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index ai_convs_user_idx on public.ai_conversations(user_id);
```

**Why store conversations:** So users can return to previous AI chats. The `messages` JSONB column stores the full history — no separate messages table needed at this scale.

---

### ROW LEVEL SECURITY (RLS) — V1 Simple Version

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notes enable row level security;
alter table public.ai_conversations enable row level security;

-- PROFILES: users can read all profiles (for assignee dropdowns)
create policy "profiles_read_all" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- PROJECTS: all authenticated users can read/write all projects
-- (small team, trust everyone — add restrictions in V2)
create policy "projects_all_authenticated" on public.projects
  for all using (auth.role() = 'authenticated');

-- TASKS: same — all authenticated users
create policy "tasks_all_authenticated" on public.tasks
  for all using (auth.role() = 'authenticated');

-- CALENDAR: users see their own events (private calendar for now)
create policy "events_own" on public.calendar_events
  for all using (auth.uid() = owner_id);

-- NOTES: users see their own notes
create policy "notes_own" on public.notes
  for all using (auth.uid() = owner_id);

-- AI CONVERSATIONS: users see only their own
create policy "ai_convs_own" on public.ai_conversations
  for all using (auth.uid() = user_id);
```

**V1 philosophy:** Keep RLS simple. Everyone on the team sees all projects and tasks. Private calendar and notes. No complex permission trees.

---

### STORAGE BUCKETS (Supabase Storage)

```
Bucket: note-attachments
  - path: {user_id}/{note_id}/{filename}
  - max file size: 10MB
  - allowed types: image/*, application/pdf, text/*
  - public: false (signed URLs only)

Bucket: avatars
  - path: {user_id}/avatar.{ext}
  - max file size: 2MB
  - allowed types: image/*
  - public: true
```

---

## PART 4: EXACT FRONTEND PAGES

### Technology: Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Why this stack:**
- Next.js App Router = file-based routing (Cursor generates these perfectly)
- TypeScript = AI tools give better suggestions with types
- Tailwind = V0 generates Tailwind; no fighting with CSS
- No need for Redux or complex state — React Query + Supabase client is enough

---

### Page Map (12 pages total — that's it)

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx          -- P1: Login page
│   └── onboarding/
│       └── page.tsx          -- P2: First-time setup (name, timezone)
│
└── (app)/
    ├── layout.tsx             -- App shell: sidebar + topbar
    ├── page.tsx               -- P3: Dashboard (home)
    │
    ├── tasks/
    │   ├── page.tsx           -- P4: Task list (my tasks + all tasks toggle)
    │   └── [id]/
    │       └── page.tsx       -- P5: Task detail (right panel or full page)
    │
    ├── projects/
    │   ├── page.tsx           -- P6: Projects list
    │   └── [id]/
    │       └── page.tsx       -- P7: Project detail (tasks filtered to project)
    │
    ├── calendar/
    │   └── page.tsx           -- P8: Calendar (month + day view)
    │
    ├── notes/
    │   ├── page.tsx           -- P9: Notes list + editor (split view)
    │   └── [id]/
    │       └── page.tsx       -- P10: Single note (full page edit)
    │
    ├── ai/
    │   └── page.tsx           -- P11: AI Assistant (full-page chat)
    │
    └── settings/
        └── page.tsx           -- P12: User settings (name, avatar, timezone)
```

### What Each Page Does (Keep It Simple)

**P1 — Login**
Email + password form. Supabase Auth. Nothing else. No social login. No "forgot password" fancy flow (just use Supabase's built-in email reset).

**P3 — Dashboard**
Four KPI cards (tasks due today, overdue tasks, active projects, notes count).
Today's tasks list.
Upcoming calendar events (next 3).
Recent notes (last 3).
NO charts. NO analytics. NO AI brief (too complex for V1 — mock it).

**P4 — Tasks**
Two tabs: "My Tasks" and "All Tasks".
Filters: status, priority, project.
Sort: due date, priority, created.
List view only (no Kanban in V1 — add it in V1.5).
Click task → opens task detail as a slide-over panel.
Quick add: text input at top of list.

**P5 — Task Detail (slide-over)**
Title (editable inline).
Status selector (pill buttons).
Priority selector.
Assignee dropdown.
Project dropdown.
Due date picker.
Description (simple textarea, markdown rendered on display).
Delete button.
That's it. No comments, no attachments, no subtasks.

**P6 — Projects**
Grid of project cards (name, icon, color, progress bar, task count).
"New Project" button → modal form.
Click project → goes to P7.

**P7 — Project Detail**
Header: name, description, target date, progress bar.
Tab: Tasks (filtered task list for this project).
Tab: Notes (notes linked to this project).
No Gantt. No milestones. Tasks list is the view.

**P8 — Calendar**
Month view by default.
Day view when clicking a date.
Click date → quick-add event modal.
Color-coded by type (meeting/deadline/reminder/block).
Show task due dates as calendar items (read-only, click → task detail).
No drag-to-reschedule in V1 (complex).

**P9 — Notes**
Two-panel layout: list on left, editor on right.
Left: searchable list of notes, pinned at top.
Right: markdown editor (use a library like `@uiw/react-md-editor`).
Auto-save on keystroke (debounced 1s).
Tag input (simple comma-separated input, stored as array).
Quick "Link to project" dropdown.

**P11 — AI Assistant**
Full-page chat interface.
Conversation history sidebar (past chats).
Input at bottom.
Calls your backend API route → calls Claude/OpenAI → streams response.
Context buttons: "Talk about [current project]" quick-select.
That's the entire feature.

**P12 — Settings**
Name, avatar upload (to Supabase storage), timezone selector.
Change password.
About section (version number).

---

## PART 5: EXACT REUSABLE COMPONENTS

Build these once. Use them everywhere. Generate with V0.

### Component List (26 components)

```
components/
│
├── layout/
│   ├── Sidebar.tsx           -- Navigation sidebar with logo + nav items + user footer
│   ├── Topbar.tsx            -- Breadcrumb + search trigger + notification bell + user avatar
│   ├── CommandPalette.tsx    -- ⌘K overlay: search + quick actions (use cmdk library)
│   └── AppShell.tsx          -- Sidebar + Topbar wrapper for all app pages
│
├── ui/  (brand-styled primitives — generate ALL of these with V0 first)
│   ├── Button.tsx            -- variants: primary, secondary, ghost, danger; sizes: sm, md, lg
│   ├── Input.tsx             -- text input with label, error state, icon slot
│   ├── Textarea.tsx          -- resizable textarea with label
│   ├── Select.tsx            -- dropdown select with search (use cmdk or radix)
│   ├── Badge.tsx             -- status/priority badges with color variants
│   ├── Card.tsx              -- glass card container with optional header
│   ├── Modal.tsx             -- centered modal with overlay (use Radix Dialog)
│   ├── SlideOver.tsx         -- right-side slide panel (task detail)
│   ├── Avatar.tsx            -- user avatar with initials fallback
│   ├── DatePicker.tsx        -- date-only picker (use react-day-picker)
│   ├── Spinner.tsx           -- loading spinner
│   ├── EmptyState.tsx        -- empty list illustration + CTA button
│   ├── ProgressBar.tsx       -- thin colored progress bar
│   └── Toast.tsx             -- notification toast (use sonner library)
│
├── tasks/
│   ├── TaskCard.tsx          -- single task row in list view
│   ├── TaskDetail.tsx        -- full task detail form (used in SlideOver)
│   └── TaskQuickAdd.tsx      -- inline quick-add input at top of task list
│
├── projects/
│   ├── ProjectCard.tsx       -- project grid card with progress
│   └── ProjectForm.tsx       -- create/edit project modal form
│
├── calendar/
│   ├── CalendarGrid.tsx      -- month grid view
│   ├── CalendarDay.tsx       -- day detail view
│   └── EventForm.tsx         -- create/edit event modal
│
├── notes/
│   ├── NotesList.tsx         -- left panel: searchable note list
│   └── NoteEditor.tsx        -- right panel: markdown editor
│
└── ai/
    ├── ChatMessage.tsx       -- single message bubble (user or AI)
    ├── ChatInput.tsx         -- textarea + send button
    └── ConversationList.tsx  -- sidebar list of past conversations
```

### V0 Prompt Strategy

When using V0 to generate components, always include this in your prompt:

```
"Build a [component name] React component with:
- Dark theme background: #010133
- Glass card style: rgba(255,255,255,0.04) background, 1px border rgba(255,255,255,0.09)
- Primary accent: #00d4ff (cyan)
- Secondary accent: #00e87a (green)
- Font: use system font stack (no imports needed)
- Use Tailwind CSS only
- TypeScript with proper prop types
- No external UI libraries except what's in shadcn/ui"
```

---

## PART 6: EXACT API ROUTES

### Architecture Decision: Use Supabase Client Directly (Not a Custom Backend)

In V1, you do NOT need a separate backend server. Here's why:

```
❌ SKIP THIS: Frontend → Express/Fastify API → Supabase → Database
✅ DO THIS:  Frontend → Supabase JS Client → Database (with RLS)
             Frontend → Next.js API Route → AI Provider (for AI only)
```

The only reason to use Next.js API Routes in V1 is for:
1. Calling AI APIs (can't expose API keys to frontend)
2. Any logic that needs to run server-side securely

Everything else calls Supabase directly from the frontend using the `@supabase/supabase-js` client.

---

### API Routes Needed (4 routes only)

```
app/api/
├── ai/
│   └── chat/
│       └── route.ts     -- POST: send message, get AI response (streaming)
│
├── ai/
│   └── summarize/
│       └── route.ts     -- POST: summarize a note or project description
│
├── search/
│   └── route.ts         -- GET: search across tasks + projects + notes
│
└── upload/
    └── route.ts         -- POST: get signed URL for file upload to Supabase storage
```

### Route Details

**POST /api/ai/chat**
```typescript
// Request body
{
  messages: { role: 'user' | 'assistant', content: string }[],
  context?: {
    type: 'project' | 'task' | 'note',
    data: string  // stringified relevant data
  }
}

// Response: text/event-stream (streaming)
// Use Vercel AI SDK: it handles streaming cleanly

// System prompt (keep it simple for V1):
// "You are ARIA, the AI assistant for Melhek Technologies.
//  You help the team with tasks, projects, and knowledge management.
//  Be concise, practical, and professional.
//  [context if provided]"
```

**POST /api/ai/summarize**
```typescript
// Request body
{ content: string, type: 'note' | 'project' }

// Response
{ summary: string }  // 2-3 sentence summary

// Used for: auto-summarizing long notes, project descriptions
```

**GET /api/search**
```typescript
// Query params: ?q=search+term
// Searches: tasks (title), projects (name), notes (title + content)
// Uses Supabase full-text search on notes, ILIKE for tasks/projects
// Returns: { tasks: Task[], projects: Project[], notes: Note[] }
// Limit: top 5 results per category
```

**POST /api/upload**
```typescript
// Request body: { filename: string, contentType: string, noteId: string }
// Returns: { signedUrl: string, path: string }
// Frontend uses signedUrl to PUT file directly to Supabase storage
// This keeps the API key server-side
```

---

### Supabase Data Queries (Used in Frontend Directly)

These are not API routes — they're called directly from React components using the Supabase client. Examples of the key queries:

```typescript
// Get today's tasks for dashboard
const { data: todayTasks } = await supabase
  .from('tasks')
  .select('*, assignee:profiles(full_name, avatar_url), project:projects(name, color)')
  .eq('status', 'todo')
  .lte('due_date', today)
  .order('priority', { ascending: false })
  .limit(10);

// Get project with task progress
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    owner:profiles(full_name, avatar_url),
    tasks(id, status)
  `)
  .eq('id', projectId)
  .single();

// Full-text search on notes
const { data: notes } = await supabase
  .from('notes')
  .select('id, title, content, updated_at')
  .textSearch('title, content', searchQuery, { type: 'websearch' })
  .limit(20);
```

---

## PART 7: EXACT FILE STRUCTURE

This is the complete directory structure. Every folder. Every key file. Nothing extra.

```
melhek-os/
│
├── app/                                  -- Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   │
│   ├── (app)/
│   │   ├── layout.tsx                    -- AppShell wraps all app pages
│   │   ├── page.tsx                      -- Dashboard
│   │   ├── tasks/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── notes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── ai/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── ai/
│   │   │   ├── chat/route.ts
│   │   │   └── summarize/route.ts
│   │   ├── search/route.ts
│   │   └── upload/route.ts
│   │
│   ├── globals.css                       -- Tailwind base + custom CSS variables
│   └── layout.tsx                        -- Root layout: fonts + providers
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── CommandPalette.tsx
│   │   └── AppShell.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── SlideOver.tsx
│   │   ├── Avatar.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Spinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Toast.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskDetail.tsx
│   │   └── TaskQuickAdd.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   └── ProjectForm.tsx
│   ├── calendar/
│   │   ├── CalendarGrid.tsx
│   │   ├── CalendarDay.tsx
│   │   └── EventForm.tsx
│   ├── notes/
│   │   ├── NotesList.tsx
│   │   └── NoteEditor.tsx
│   └── ai/
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       └── ConversationList.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     -- Browser Supabase client (singleton)
│   │   ├── server.ts                     -- Server Supabase client (for API routes)
│   │   └── middleware.ts                 -- Auth middleware (refresh sessions)
│   ├── ai/
│   │   └── aria.ts                       -- System prompt + AI helpers
│   └── utils.ts                          -- cn(), formatDate(), truncate(), etc.
│
├── hooks/
│   ├── useUser.ts                        -- Current user + profile
│   ├── useTasks.ts                       -- Tasks CRUD operations
│   ├── useProjects.ts                    -- Projects CRUD operations
│   ├── useCalendar.ts                    -- Events CRUD operations
│   └── useNotes.ts                       -- Notes CRUD operations
│
├── types/
│   └── index.ts                          -- All TypeScript interfaces (generated from DB schema)
│
├── middleware.ts                          -- Protect (app) routes, redirect to login
│
├── .env.local                            -- Supabase URL, anon key, OpenAI/Anthropic key
├── .env.example                          -- Template (commit this, NOT .env.local)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## PART 8: EXACT AUTH SYSTEM

### How It Works (Simple Version)

```
User visits /tasks
  → middleware.ts checks: is there a Supabase session?
  → NO → redirect to /login
  → YES → render page

User logs in at /login
  → supabase.auth.signInWithPassword({ email, password })
  → Supabase sets HttpOnly cookie automatically
  → redirect to /

User logs out
  → supabase.auth.signOut()
  → redirect to /login
```

### Key Files

**middleware.ts** (root level — protects all app routes)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect all /app routes
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Don't let logged-in users see login page
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

**lib/supabase/client.ts** (browser client — used in React components)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**hooks/useUser.ts**
```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
            setLoading(false)
          })
      }
    })
  }, [])

  return { profile, loading }
}
```

### First User Setup
1. Create user in Supabase Auth dashboard (or use the Supabase SQL editor to insert)
2. The trigger auto-creates their profile row
3. Done — no registration page needed for internal tools

---

## PART 9: EXACT DEVELOPMENT ORDER

Build in this exact order. Each step produces a usable result. Never skip ahead.

---

### WEEK 1: Foundation (Days 1–5)

**Day 1 — Project Setup**
```
1. npx create-next-app@latest melhek-os --typescript --tailwind --app
2. Install dependencies:
   npm install @supabase/supabase-js @supabase/ssr
   npm install @vercel/ai ai                    (AI SDK for streaming)
   npm install cmdk                             (Command palette)
   npm install sonner                           (Toasts)
   npm install @radix-ui/react-dialog           (Modal)
   npm install @radix-ui/react-select           (Select dropdown)
   npm install react-day-picker date-fns        (Date picker)
   npm install @uiw/react-md-editor             (Markdown editor for notes)
   npm install lucide-react                     (Icons)
3. Set up Supabase project (free tier)
4. Run all SQL from Part 3 in Supabase SQL editor
5. Add .env.local with Supabase keys
6. Push to GitHub
7. Connect to Vercel (free tier) — get a real URL on day 1
```

**Day 2 — Design System**
```
1. Set up globals.css with CSS variables (colors from brand)
2. Set up tailwind.config.ts with brand colors
3. Use V0 to generate ALL ui/ components:
   - Button, Input, Textarea, Select, Badge, Card
   - Modal, SlideOver, Avatar, Spinner, EmptyState
   - ProgressBar, Toast (configure sonner)
4. Build Sidebar.tsx + Topbar.tsx + AppShell.tsx
5. Build login page
6. Test auth flow: login → redirect to dashboard
```

**Day 3 — Dashboard + Basic Layout**
```
1. Build Dashboard page (4 KPI cards, placeholder data)
2. Wire up Supabase: get real task counts for KPI cards
3. Build CommandPalette.tsx (cmdk library — 30 min job)
4. Wire ⌘K to open command palette
5. Make all 12 pages exist with placeholder content
   (so navigation works end-to-end)
```

**Day 4–5 — Tasks Module**
```
Day 4:
1. Build TaskCard.tsx + TaskQuickAdd.tsx
2. Build /tasks page with task list
3. Wire up useTasks.ts hook (create, read, update, delete)
4. Quick-add task from top input: hit Enter → task appears

Day 5:
1. Build TaskDetail.tsx (SlideOver panel)
2. Wire status, priority, assignee, project, due date
3. Test full task CRUD: create → update → complete → delete
4. Add task filtering: by status, by project
```

---

### WEEK 2: Core Modules (Days 6–10)

**Day 6–7 — Projects Module**
```
Day 6:
1. Build ProjectCard.tsx + ProjectForm.tsx
2. Build /projects page (grid of project cards)
3. Wire useProjects.ts: CRUD operations
4. Progress bar: computed from tasks ratio

Day 7:
1. Build /projects/[id] page
2. Show tasks filtered to this project
3. Add "Notes" tab (shows linked notes — empty for now)
4. Test: create project → add tasks → see progress update
```

**Day 8 — Calendar Module**
```
1. Build CalendarGrid.tsx (month view)
   Tip: use react-big-calendar or build manually with date-fns
2. Build EventForm.tsx (create/edit event modal)
3. Wire useCalendar.ts: CRUD operations
4. Show task due dates as read-only items on calendar
5. Click day → show day detail with events
```

**Day 9 — Notes Module**
```
1. Build NotesList.tsx (left panel with search)
2. Build NoteEditor.tsx (right panel — markdown editor)
3. Wire useNotes.ts: CRUD operations
4. Auto-save: debounced 1s after keystroke
5. Tag input: comma-separated, stored as text[]
6. Pin/unpin notes
7. Full-text search using Supabase textSearch()
```

**Day 10 — AI Assistant**
```
1. Build /api/ai/chat/route.ts (Vercel AI SDK streaming)
2. Build ChatMessage.tsx + ChatInput.tsx + ConversationList.tsx
3. Build /ai page (chat interface)
4. Test streaming responses
5. Wire conversation history to Supabase (save + load)
6. Add context quick-select: "Talk about [project name]"
```

---

### WEEK 3: Polish + Stability (Days 11–15)

**Day 11 — Search**
```
1. Build /api/search/route.ts
2. Wire command palette search to this API
3. Results show: tasks, projects, notes grouped
4. Click result → navigate to that item
```

**Day 12 — Error Handling + Loading States**
```
1. Add loading skeletons to all list views
2. Add error boundaries to all pages
3. Add toast notifications for all mutations
   "Task created ✓" / "Failed to save — try again"
4. Empty states for all lists (EmptyState component)
5. Test with slow network (Chrome DevTools throttling)
```

**Day 13 — Settings + Polish**
```
1. Build /settings page: name, avatar, timezone, password
2. Wire avatar upload to Supabase storage
3. Polish Sidebar: active states, hover states, collapsed state
4. Polish Dashboard: make it actually useful with real data
5. Add user onboarding: /onboarding page for first login
```

**Day 14 — AI Summarize + Notes Enhancement**
```
1. Build /api/ai/summarize/route.ts
2. Add "Summarize" button to long notes
3. AI summary appears above the note content
4. Add project description AI enhancement (optional)
```

**Day 15 — QA + Deploy**
```
1. Test every page on mobile (Chrome responsive mode)
2. Test all auth flows: login, logout, session expiry
3. Test all CRUD operations: create, edit, delete
4. Fix any broken layouts
5. Deploy to Vercel production
6. Set up Supabase production project (separate from dev)
7. Configure environment variables in Vercel
8. SHIP IT
```

---

## PART 10: WHAT SHOULD NOT BE BUILT YET

Be disciplined. When an idea comes up during build, add it to a backlog file, not the codebase.

### Hard "Not Yet" List

```
❌ CRM / Contacts           → V2
❌ Automation builder       → V2
❌ Invoicing / Finance       → V2
❌ Team chat / Comments      → V2 (tasks don't need comments in V1)
❌ Kanban board view         → V1.5 (list view first)
❌ Subtasks                  → V1.5
❌ Recurring tasks           → V1.5
❌ Time tracking             → V1.5
❌ Google Calendar sync      → V1.5
❌ File attachments on tasks → V1.5 (notes can have attachments)
❌ Task dependencies         → V2
❌ Gantt / timeline          → V2
❌ Email notifications       → V1.5 (in-app only for now)
❌ Push notifications        → V2
❌ Multi-org support         → V2
❌ Custom fields             → V2
❌ Activity log              → V1.5
❌ Report builder            → V2
❌ AI health scoring         → V2 (need historical data first)
❌ Role permissions (RBAC)   → V1.5 (admin/member toggle is fine)
❌ Public API / Webhooks     → V2
❌ Native mobile app         → V2 (responsive web is fine)
❌ Dark/light toggle         → Always dark for now
❌ Localization (Arabic etc) → V2
```

---

## PART 11: WHAT TO MOCK IN V1

Mock these features — they appear real to users but aren't fully built.

### Mock #1: Dashboard AI Brief
**Reality:** A static/template string with real data filled in.
**Looks like:** "Good morning Ahmed. You have 3 tasks due today..."
**Implementation:**
```typescript
// Don't call AI for this. Just format a string:
const brief = `Good morning, ${profile.full_name}. 
You have ${overdueTasks.length} overdue tasks and 
${todayTasks.length} tasks due today. 
${activeProjects.length} projects are currently active.`
```

### Mock #2: "AI-suggested priority"
**Reality:** Sort tasks by due date proximity + manually set priority.
**Looks like:** The top 3 tasks have a subtle ✦ "AI Prioritized" label.
**Implementation:** Just flag tasks with due_date = today or overdue as high priority. Show the label. No AI involved.

### Mock #3: Notification Bell
**Reality:** A static counter showing unread task count.
**Looks like:** Bell icon with a number badge.
**Implementation:**
```typescript
const unreadCount = overdueTasks.length + tasksDueToday.length
```

### Mock #4: "Search across everything"
**Reality:** Only searches tasks (title), projects (name), notes (full-text).
**Looks like:** A unified search that feels comprehensive.
**Implementation:** The /api/search route runs 3 parallel queries.

### Mock #5: AI Context Awareness
**Reality:** When user is on a project page and opens AI, manually pass project data as context.
**Looks like:** ARIA "knows" what project you're looking at.
**Implementation:**
```typescript
// In the project detail page:
const contextString = `
  Current project: ${project.name}
  Status: ${project.status}
  Tasks: ${tasks.length} total, ${doneTasks.length} completed
  Target date: ${project.target_date}
`
// Pass this as the system context to /api/ai/chat
```

---

## PART 12: AI FEATURES — REAL VS FAKE IN V1

### REAL (build these properly)

| Feature | Implementation |
|---------|---------------|
| AI chat (ARIA) | Vercel AI SDK + Claude/OpenAI, streaming, stored history |
| Note summarizer | Single API call, 2-3 sentence output |
| Context injection | Pass current page data as system context |

### FAKE / SIMPLIFIED (mock these)

| Feature | What to show | Real cost to fake |
|---------|-------------|-------------------|
| Daily AI brief | Template string with real data | 30 minutes |
| AI task prioritization | Sort by due date | Already built |
| AI relationship health | Color-code by last-updated date | 1 hour |
| "ARIA is typing..." | Show typing dots for 0.8s before streaming | 15 minutes |
| AI memory / learning | It doesn't remember between sessions. That's fine. | Mock: "I remember you prefer..." hardcoded in system prompt |

### AI Provider Choice

For V1, use **Claude claude-sonnet-4-20250514** (Anthropic).

```typescript
// lib/ai/aria.ts
export const ARIA_SYSTEM_PROMPT = `
You are ARIA, the AI assistant for Melhek Technologies — an internal productivity system.

You help the team with:
- Reviewing and prioritizing tasks and projects
- Drafting emails, proposals, and documents
- Answering questions from notes and knowledge base
- Analyzing project status and risks

Keep responses concise and practical. Use markdown formatting.
Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
`
```

**Budget estimate for V1 AI usage (5 users, light usage):**
~$5–15/month. Completely manageable.

---

## PART 13: THE CLEANEST ARCHITECTURE FOR A SOLO FOUNDER

### The Mental Model

```
Browser (React)
  ↓ reads/writes directly
Supabase (your backend — auth + db + storage)
  ↕ RLS enforces security
Postgres (your real database)

  + for AI only:
Browser (React)
  ↓ POST request
Next.js API Route (server, hides API keys)
  ↓ POST request
Claude / OpenAI (AI responses, streamed back)
```

### State Management Strategy

No Redux. No Zustand. No complex state.

```typescript
// Use this simple pattern everywhere:
// 1. Local state for UI (modals open/closed, form values)
const [isOpen, setIsOpen] = useState(false)

// 2. Custom hooks for server data (call Supabase, return data + loading + error)
const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks()

// 3. Optimistic updates for perceived speed
const updateTask = async (id: string, updates: Partial<Task>) => {
  // Update local state immediately (optimistic)
  setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  // Then sync to Supabase
  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  // If error, revert
  if (error) setTasks(originalTasks)
}
```

### TypeScript Types (generate from Supabase)

```bash
# Run this to auto-generate types from your Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

Then create simplified wrappers:
```typescript
// types/index.ts
import type { Database } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  project?: Pick<Project, 'id' | 'name' | 'color'>
}
export type Project = Database['public']['Tables']['projects']['Row']
export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type AIConversation = Database['public']['Tables']['ai_conversations']['Row']
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...   # safe to expose (RLS protects data)
ANTHROPIC_API_KEY=sk-ant-...               # NEVER expose this (server-only)
# or if using OpenAI:
OPENAI_API_KEY=sk-...                      # NEVER expose this (server-only)
```

### Package.json (Exact Dependencies for V1)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.4.0",
    "ai": "^3.3.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "cmdk": "^1.0.0",
    "sonner": "^1.5.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "react-day-picker": "^8.10.0",
    "date-fns": "^3.6.0",
    "@uiw/react-md-editor": "^4.0.0",
    "lucide-react": "^0.396.0",
    "tailwind-merge": "^2.3.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

## PART 14: CURSOR AI WORKFLOW

### How to Use Cursor Effectively for This Build

**Rule 1: One component per Cursor conversation**
Don't ask Cursor to build the whole app. Ask it to build `TaskCard.tsx`. When done, new conversation for `TaskDetail.tsx`.

**Rule 2: Always provide types first**
Paste your TypeScript types into the conversation before asking for a component. Cursor's output quality increases dramatically.

**Rule 3: Cursor prompt templates**

For a new component:
```
I'm building Melhek OS — a dark-themed internal productivity tool.
Colors: bg #010133, card rgba(255,255,255,0.04), border rgba(255,255,255,0.09), accent #00d4ff
Font: system UI. Tailwind CSS only. TypeScript.

Here are my types:
[paste relevant types]

Build TaskCard.tsx — a single task row in a list view. It should show:
- Priority color dot (left side)
- Checkbox (toggle done)
- Task title (strikethrough when done)
- Due date (red if overdue)
- Project name with color indicator
- Assignee avatar
Props: task: Task, onUpdate: (id: string, updates: Partial<Task>) => void
```

For a Supabase hook:
```
Build a useTasks.ts React hook for Next.js 14 App Router using @supabase/supabase-js.
It should use the browser client from lib/supabase/client.ts.

Here's the tasks table schema: [paste SQL]
Here's the Task type: [paste type]

The hook should return:
- tasks: Task[] (filtered by assignee_id if myTasksOnly = true)
- loading: boolean
- error: string | null
- createTask(data): Promise<void>
- updateTask(id, updates): Promise<void>
- deleteTask(id): Promise<void>

Use optimistic updates for updateTask.
```

**Rule 4: Fix > Rewrite**
When Cursor gets something wrong, paste the error and say "fix this" — don't ask it to rewrite the whole component.

**Rule 5: Commit after every working feature**
```bash
git add . && git commit -m "feat: tasks CRUD working"
```
This gives you restore points when Cursor breaks something.

---

## SUMMARY: THE V1 IN ONE PAGE

```
STACK:   Next.js 14 + TypeScript + Tailwind + Supabase + Claude API
PAGES:   12 pages
TABLES:  6 Supabase tables
COMPONENTS: 26 React components
API ROUTES: 4 Next.js API routes (AI only)
BUILD TIME: 6–8 weeks (solo, AI-assisted)
USERS:   2–5 internal users
COST:    ~$0–20/month (Supabase free + Vercel free + ~$15 AI)

MODULES: Dashboard | Tasks | Projects | Calendar | Notes | AI

NOT BUILT: CRM | Automation | Finance | Hotel Ops | Agency Ops |
           Mobile App | Team Chat | Recurring Tasks | Reports

MOCKED:  AI daily brief | Priority scoring | Notification count

REAL AI: ARIA chat (streaming) | Note summarizer | Context injection

WEEK 1:  Setup → Design System → Dashboard → Tasks (fully working)
WEEK 2:  Projects → Calendar → Notes → AI Chat (all working)
WEEK 3:  Polish → Error handling → Settings → QA → SHIP
```

---

*V1 Blueprint v1.0 | Melhek Technologies | Internal*
*Next step after shipping V1: Add Kanban view, recurring tasks, Google Calendar sync → V1.5*
*After V1.5: CRM module → V2*
