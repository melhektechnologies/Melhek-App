import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { ARIA_SYSTEM_PROMPT, buildContextPrompt, type ARIAContext } from '@/lib/ai/aria'

// ─── Auth guard helper ────────────────────────────────────────
async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(req: NextRequest) {
  try {
    // ── Check Groq configuration ──────────────────────────────
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return Response.json({ 
        error: 'GROQ_API_KEY is not configured on Vercel. Please add it to your Vercel Dashboard under "Project Settings" -> "Environment Variables".' 
      }, { status: 500 })
    }

    // ── Security: require authenticated user ─────────────────
    const user = await getAuthUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { messages, context } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      context?: ARIAContext
    }

    if (!messages?.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    const systemPrompt = ARIA_SYSTEM_PROMPT + buildContextPrompt(context)

    // ── Stream via Groq Llama 3.3 70B (free tier) ────────────
    const groq = createGroq({ apiKey })
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages,
      maxOutputTokens: 1024,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[ARIA Chat]', err)
    const errMsg = err instanceof Error ? err.message : 'Unknown AI service error'
    return Response.json({ error: `Groq AI Error: ${errMsg}` }, { status: 500 })
  }
}
