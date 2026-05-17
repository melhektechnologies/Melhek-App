// ============================================================
// MELHEK OS — TypeScript Types
// Matches Supabase schema exactly
// ============================================================

export type UserRole = 'admin' | 'member'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectStatus = 'active' | 'completed' | 'archived'

// ─── Profile ────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  timezone: string
  created_at: string
}

// ─── Project ────────────────────────────────────────────────
export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  color: string
  icon: string
  owner_id: string
  target_date: string | null
  created_at: string
  updated_at: string
  // Joined
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  tasks?: { id: string; status: TaskStatus }[]
}

export interface ProjectWithProgress extends Project {
  progress: number
  total_tasks: number
  done_tasks: number
}

// ─── Task ───────────────────────────────────────────────────
export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  project_id: string | null
  assignee_id: string | null
  created_by: string
  due_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
  // Joined
  assignee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  project?: Pick<Project, 'id' | 'name' | 'color'> | null
}

// ─── AI Conversation ─────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIConversation {
  id: string
  user_id: string
  title: string | null
  messages: ChatMessage[]
  context_type: 'task' | 'project' | 'general' | null
  context_id: string | null
  created_at: string
  updated_at: string
}

// ─── Note ────────────────────────────────────────────────────
export interface Note {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
  // Joined
  project?: Pick<Project, 'id' | 'name' | 'color' | 'icon'> | null
}

// ─── Dashboard Stats ────────────────────────────────────────
export interface DashboardStats {
  tasksDueToday: number
  overdueTasks: number
  activeProjects: number
  totalTasks: number
}

// ─── Calendar ────────────────────────────────────────────────
export type EventType = 'meeting' | 'reminder' | 'deadline' | 'block'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  type: EventType
  start_at: string
  end_at: string
  all_day: boolean
  color: string | null
  project_id: string | null
  task_id: string | null
  created_at: string
  updated_at: string
  // Joined
  project?: Pick<Project, 'id' | 'name' | 'color' | 'icon'> | null
}

// Synthetic task-due events merged into calendar
export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
  tasksDue: { id: string; title: string; priority: TaskPriority }[]
}

