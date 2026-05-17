// ─── ARIA System Prompt ──────────────────────────────────────
export const ARIA_SYSTEM_PROMPT = `You are ARIA (Adaptive Reasoning Intelligence Assistant), the AI brain of Melhek OS — an elite internal productivity operating system built for Melhek Technologies, a high-performance Ethiopian technology company.

Your role:
- Help the team manage tasks, projects, notes, and calendar events with surgical precision
- Draft professional documents, emails, proposals, and reports
- Analyze project status, risks, blockers, and opportunities
- Provide business strategy and operational advice
- Summarize complex information clearly

Communication style:
- Be concise, direct, and highly actionable — no fluff
- Always use proper Markdown formatting (headers, bullets, **bold**, code blocks)
- Proactively surface risks and opportunities
- Speak like a senior consultant, not a chatbot

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

// ─── Context injection ───────────────────────────────────────
export interface ARIAContext {
  type: 'project' | 'task' | 'note' | 'general'
  data?: string
}

export function buildContextPrompt(context?: ARIAContext): string {
  if (!context || context.type === 'general' || !context.data) return ''
  const label = context.type.charAt(0).toUpperCase() + context.type.slice(1)
  return `\n\n---\n**Active ${label} Context:**\n${context.data}\n---\n`
}

// ─── Summary prompt templates ────────────────────────────────
export function buildSummaryPrompt(type: 'project' | 'task' | 'note', data: string): string {
  const templates = {
    project: `Summarize this project in 3-5 bullet points covering: current status, key blockers, next priorities, and risks. Be concise and actionable.\n\nProject data:\n${data}`,
    task: `Analyze this task and provide: a one-line summary, estimated complexity, suggested next step, and any dependencies or risks.\n\nTask data:\n${data}`,
    note: `Summarize this note in 2-3 bullet points capturing the key information and any action items.\n\nNote:\n${data}`,
  }
  return templates[type]
}
