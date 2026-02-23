import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function requireUser() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    return user
}
