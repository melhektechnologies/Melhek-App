import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { ARIA_SYSTEM_PROMPT, buildSummaryPrompt } from '@/lib/ai/aria'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, data } = await req.json() as {
      type: 'project' | 'task' | 'note'
      data: string
    }

    if (!type || !data) return Response.json({ error: 'type and data required' }, { status: 400 })

    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'), // Fast 8B for summaries
      system: ARIA_SYSTEM_PROMPT,
      prompt: buildSummaryPrompt(type, data),
      maxOutputTokens: 256,
      temperature: 0.3,
    })

    return Response.json({ summary: text })
  } catch (err) {
    console.error('[ARIA Summary]', err)
    return Response.json({ error: 'Summary generation failed' }, { status: 500 })
  }
}
