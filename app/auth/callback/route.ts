import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/'

    if (!next.startsWith('/')) next = '/'

    if (!code) {
      console.error("❌ No code in callback URL")
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error("❌ Supabase session exchange error:", sessionError.message)
      return NextResponse.redirect(`${origin}/error`)
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      console.error("❌ Could not fetch user:", userError?.message)
      return NextResponse.redirect(`${origin}/error`)
    }

    // ✅ Check if user exists in DB
    const { data: existingUser, error: selectError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", userData.user.email)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("❌ Error checking user:", selectError.message)
    }

    // ✅ If user not found, insert new one
    if (!existingUser) {
      const { error: insertError } = await supabase.from("user_profiles").insert({
        email: userData.user.email,
        username: userData.user.user_metadata?.user_name ?? userData.user.user_metadata?.preferred_username ?? "unknown"
      })

      if (insertError) {
        console.error("❌ Error inserting user:", insertError.message)
      }
    }

    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } catch (err) {
    console.error("❌ Unexpected error in /auth/callback:", err)
    return NextResponse.redirect(`${new URL(request.url).origin}/error`)
  }
}
