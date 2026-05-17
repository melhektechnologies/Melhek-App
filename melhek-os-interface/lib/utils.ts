import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TaskPriority, TaskStatus, ProjectStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export function isDueToday(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate).toDateString() === new Date().toDateString()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

// ─── Priority Colors ────────────────────────────────────────
export function getPriorityConfig(priority: TaskPriority) {
  const map = {
    urgent: { bg: 'rgba(255,68,68,0.2)', text: '#ff4444', label: 'Urgent', dot: '#ff4444' },
    high: { bg: 'rgba(255,149,0,0.2)', text: '#ff9500', label: 'High', dot: '#ff9500' },
    medium: { bg: 'rgba(0,128,255,0.2)', text: '#00D4FF', label: 'Medium', dot: '#0080FF' },
    low: { bg: 'rgba(160,160,176,0.15)', text: '#a0a0b0', label: 'Low', dot: '#686878' },
  }
  return map[priority]
}

// ─── Status Colors ──────────────────────────────────────────
export function getStatusConfig(status: TaskStatus) {
  const map = {
    todo: { bg: 'rgba(160,160,176,0.15)', text: '#a0a0b0', label: 'To Do' },
    in_progress: { bg: 'rgba(0,128,255,0.2)', text: '#00D4FF', label: 'In Progress' },
    done: { bg: 'rgba(0,208,132,0.15)', text: '#00d084', label: 'Done' },
    cancelled: { bg: 'rgba(255,68,68,0.15)', text: '#ff6666', label: 'Cancelled' },
  }
  return map[status]
}

export function getProjectStatusConfig(status: ProjectStatus) {
  const map = {
    active: { bg: 'rgba(0,128,255,0.15)', text: '#00D4FF', label: 'Active' },
    completed: { bg: 'rgba(0,208,132,0.15)', text: '#00d084', label: 'Completed' },
    archived: { bg: 'rgba(160,160,176,0.15)', text: '#a0a0b0', label: 'Archived' },
  }
  return map[status]
}

// ─── Progress calculation ────────────────────────────────────
export function calcProgress(tasks: { status: string }[]): number {
  if (!tasks || tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}
