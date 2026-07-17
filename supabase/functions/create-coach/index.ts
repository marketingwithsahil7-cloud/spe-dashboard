// Supabase Edge Function: create-coach
//
// Creates a full coach login (Supabase Auth user) + coaches table row in one
// atomic-ish operation. Requires the service_role key (never exposed to the
// frontend) to call auth.admin.createUser, so this must run server-side.
//
// Deploy with:
//   supabase functions deploy create-coach
//
// No extra secrets to set — SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are already injected automatically into every
// Edge Function's environment by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ACADEMY_ID = '00000000-0000-0000-0000-000000000001'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Scoped to the caller's own JWT — used only to identify who is calling.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) throw new Error('Not authenticated')

    // Service-role client — bypasses RLS, required for auth.admin.* calls.
    const admin = createClient(supabaseUrl, serviceKey)

    // Server-side owner check — never trust a client-supplied role flag here.
    const { data: callerCoach, error: callerErr } = await admin
      .from('coaches')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (callerErr) throw callerErr
    if (callerCoach?.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only the owner can create coach accounts' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const name: string = body.name?.trim()
    const email: string = body.email?.trim()
    const password: string = body.password
    const role: string = body.role
    const per_session_rate: number = Number(body.per_session_rate) || 300
    const coaching_days: string[] = Array.isArray(body.coaching_days) ? body.coaching_days : []

    if (!name || !email || !password || !role) {
      throw new Error('Missing required fields: name, email, password, role')
    }
    if (password.length < 6) throw new Error('Password must be at least 6 characters')
    if (!['head', 'assistant'].includes(role)) throw new Error('Role must be head or assistant')

    // 1. Create the auth login
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr) throw createErr

    // 2. Create the coaches row pointing at the new auth user
    const { data: coach, error: insertErr } = await admin
      .from('coaches')
      .insert({
        user_id: created.user.id,
        name,
        role,
        login_email: email,
        per_session_rate,
        coaching_days,
        is_active: true,
        academy_id: ACADEMY_ID,
      })
      .select()
      .single()

    if (insertErr) {
      // Roll back the orphaned auth user — no coach row means no usable login.
      await admin.auth.admin.deleteUser(created.user.id)
      throw insertErr
    }

    return new Response(JSON.stringify({ coach }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
