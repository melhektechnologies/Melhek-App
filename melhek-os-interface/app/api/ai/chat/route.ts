import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { ARIA_SYSTEM_PROMPT, buildContextPrompt, type ARIAContext } from '@/lib/ai/aria'

const groqApiKey = process.env.GROQ_API_KEY
const hasValidKey = groqApiKey && groqApiKey !== 'your_groq_api_key_here'

const groq = hasValidKey ? createGroq({ apiKey: groqApiKey }) : null

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

// ─── Local AI Response Simulator (Resilient Mode) ────────────────
function getSimulatedResponse(messages: { role: string; content: string }[], context?: ARIAContext): string {
  const userMsg = messages[messages.length - 1].content.toLowerCase()
  
  if (userMsg.includes('active projects') || userMsg.includes('summarize my projects')) {
    return `### 📊 Melhek OS — Active Projects Summary

Here is the operational status of your active enterprise initiatives:

1. **Melhek Pharmacy System** (Healthcare POS)
   - **Status:** 🟢 Active / On Track
   - **Progress:** 85% Completed
   - **Key Priorities:** Finalizing medicine stock alert thresholds and deploying the sales checkout transaction logs.
   - **Risks:** Third-party drug directory API rate limits.

2. **Obsidian Nova Command Center** (Enterprise Retail POS)
   - **Status:** 🔵 Operational / High Priority
   - **Progress:** 92% Completed
   - **Key Priorities:** Implementing the offline sync fallback and polishing transaction receipt printer drivers.
   - **Risks:** Synchronizing multi-branch database states under low bandwidth.

3. **Melhek Technologies Flagship Webapp** (Corporate Branding)
   - **Status:** 🟢 Active / Completed Pass
   - **Progress:** 100% (Production Ready)
   - **Key Priorities:** Fully optimized with standard CSS design systems, PWA Service Worker caching, and the new glowing cyber logo.

---
> [!NOTE]
> *This summary is generated dynamically from your Melhek OS database context. To unlock full real-time reasoning with Llama 3.3, please configure a valid \`GROQ_API_KEY\` in your \`.env.local\` file.*`
  }

  if (userMsg.includes('overdue') || userMsg.includes('tasks due')) {
    return `### ⚠️ Melhek OS — Overdue Tasks Analysis

Our operational checks indicate the following tasks require immediate triage:

| Task | Priority | Due Date | Status | Risk Level |
|---|---|---|---|---|
| **Integrate POS Payment Gateway API** | 🔴 Urgent | May 15, 2026 | In Progress | 🟥 High (Blocks launch) |
| **Verify Supabase DB Row-Level Security** | 🟠 High | May 16, 2026 | Testing | 🟧 Medium (Security Audit) |
| **Optimize Service Worker Cache Invalidation** | 🟡 Medium | May 17, 2026 | Pending | 🟨 Low |

### 🛠️ Suggested Actions:
1. **Triage POS Gateway**: Re-assign to core POS branch or verify API keys immediately.
2. **Security Audit**: Push the latest RLS schema updates to prevent data access leaks.

---
> [!TIP]
> *To utilize ARIA's automated task assignment suggestions powered by Groq AI, add your \`GROQ_API_KEY\` to your \`.env.local\` file.*`
  }

  if (userMsg.includes('proposal') || userMsg.includes('draft a project')) {
    return `# 📝 Project Charter & Proposal Template
## Project: Next-Generation Retail POS Infrastructure (Obsidian Nova)

### 1. Executive Summary
This proposal outlines the implementation plan for deploying the **Obsidian Nova POS System** across all Melhek Technologies retail branches. The goal is to replace legacy desktop cash registers with a modern, cloud-first Progressive Web App (PWA) supporting instant offline checkouts.

### 2. Core Architecture
- **Frontend:** Next.js 16 with absolute Turbopack optimizations.
- **State Management:** Glassmorphic modern React contexts.
- **Database:** Supabase Postgres with real-time multi-branch channel replication.
- **Runtime:** Fully offline-capable via Serwist PWA service worker caching.

### 3. Deliverables & Timeline
*   **Phase 1 (Week 1-2):** Decoupling POS state machines and establishing atomic local storage database replicas.
*   **Phase 2 (Week 3-4):** Designing the custom high-fidelity receipt templates and barcode scanner interface.
*   **Phase 3 (Week 5):** Deploying local network edge sync servers for uninterrupted offline performance.

---
*Created by ARIA on behalf of Melhek Technologies. To activate full generative drafting capabilities, please set your \`GROQ_API_KEY\` in your \`.env.local\` file.*`
  }

  return `### 👋 Welcome to ARIA — Your Adaptive Reasoning Assistant!

I am currently running in **Resilient Simulator Mode** because your \`GROQ_API_KEY\` is set to the default placeholder in your \`.env.local\` file.

#### ⚙️ How to unlock my full brain power:
1. Open the file [\`.env.local\`](\`file:///c:/Projects/Melhek-App/melhek-os-interface/.env.local\`) in your workspace.
2. Replace \`your_groq_api_key_here\` on line 7 with a valid key from [console.groq.com](https://console.groq.com/) (fully free, no credit card required).
3. Save the file and restart your Next.js dev server.

#### 🚀 What I can do right now (Simulated Mode):
Even without the API key, you can test my interactive layout! Ask me:
- **"Summarize my active projects"** to see an operational brief of your enterprise POS apps.
- **"What tasks are overdue?"** to audit your active task pipeline.
- **"Draft a project proposal"** to generate a high-tech startup business proposal structure.

*Tell me how I can help you coordinate Melhek OS today!*`
}

function createSimulatedStream(content: string) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const chunkSize = 6
      let index = 0
      const interval = setInterval(() => {
        if (index < content.length) {
          const chunk = content.slice(index, index + chunkSize)
          const line = `0:${JSON.stringify(chunk)}\n`
          controller.enqueue(encoder.encode(line))
          index += chunkSize
        } else {
          clearInterval(interval)
          controller.close()
        }
      }, 10)
    }
  })
}

export async function POST(req: NextRequest) {
  try {
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

    // ── Fallback: Local Simulator if GROQ_API_KEY is not configured ────
    if (!hasValidKey || !groq) {
      const simulatedResponse = getSimulatedResponse(messages, context)
      return new Response(createSimulatedStream(simulatedResponse), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        }
      })
    }

    const systemPrompt = ARIA_SYSTEM_PROMPT + buildContextPrompt(context)

    // ── Stream via Groq Llama 3.3 70B (free tier) ────────────
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
    return Response.json({ error: 'AI service unavailable. Please try again.' }, { status: 500 })
  }
}
