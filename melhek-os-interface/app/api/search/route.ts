import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ tasks: [], projects: [] })
  }

  const [tasksResult, projectsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, project:projects!tasks_project_id_fkey(id, name, color)')
      .ilike('title', `%${q}%`)
      .limit(6),
    supabase
      .from('projects')
      .select('id, name, status, color, icon')
      .ilike('name', `%${q}%`)
      .limit(5),
  ])

  return NextResponse.json({
    tasks: tasksResult.data ?? [],
    projects: projectsResult.data ?? [],
  })
}
