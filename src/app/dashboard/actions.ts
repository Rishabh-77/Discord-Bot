'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateConfig(formData: FormData) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const systemPrompt = formData.get('systemPrompt') as string
  const allowedChannelIds = formData.get('allowedChannelIds') as string

  const { error } = await supabase
    .from('agent_config')
    .upsert({ 
      owner_id: user.id, 
      system_prompt: systemPrompt, 
      allowed_channel_ids: allowedChannelIds,
      updated_at: new Date().toISOString()
    }, { onConflict: 'owner_id' })

  if (error) {
    return { error: 'Failed to save settings' }
  }

  revalidatePath('/dashboard')
  return { success: 'Settings saved successfully!' }
}

export async function resetMemory() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('agent_config')
    .update({ conversation_summary: '' })
    .eq('owner_id', user.id)

  if (error) return { error: 'Failed to reset memory' }

  revalidatePath('/dashboard')
  return { success: 'Memory wiped successfully.' }
}