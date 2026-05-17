import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from './client'
import { redirect } from 'next/navigation'

/**
 * Gets the current authenticated user and profile from the database (Server Side).
 * Safely handles cases where no session exists.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { user, profile }
  } catch (error) {
    console.error('[getCurrentUser]', error)
    return null
  }
}

/**
 * Enforces authentication inside Server Components or Server Actions.
 * Redirects to /login if the user is unauthenticated.
 */
export async function requireAuth() {
  const authData = await getCurrentUser()
  if (!authData) {
    redirect('/login')
  }
  return authData
}

/**
 * Client-side or Server-side sign out handler.
 */
export async function signOut() {
  if (typeof window !== 'undefined') {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  } else {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
  }
}
