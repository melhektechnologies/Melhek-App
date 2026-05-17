import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const q = req.nextUrl.searchParams.get('q')
    if (!q || q.length < 2) return Response.json({ results: [] })

    const searchPattern = `%${q}%`

    // Execute searches in parallel
    const [tasksRes, projectsRes, notesRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, project_id')
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(5),
      supabase
        .from('projects')
        .select('id, name, status, icon')
        .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(5),
      supabase
        .from('notes')
        .select('id, title, is_pinned')
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
        .limit(5),
    ])

    const results = [
      ...(tasksRes.data ?? []).map(t => ({ type: 'task', id: t.id, title: t.title, meta: t.status, link: '/tasks' })),
      ...(projectsRes.data ?? []).map(p => ({ type: 'project', id: p.id, title: p.name, meta: p.status, icon: p.icon, link: `/projects/${p.id}` })),
      ...(notesRes.data ?? []).map(n => ({ type: 'note', id: n.id, title: n.title, meta: n.is_pinned ? 'Pinned' : '', link: '/notes' })),
    ]

    return Response.json({ results })
  } catch (err) {
    console.error('[Search API]', err)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
