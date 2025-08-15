import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const role = searchParams.get("role")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      const userRole = profile?.role || role || 'user'
      
      // Check if this is a new host who needs to complete registration
      const isNewHost = userRole === 'host' && !profile?.full_name

      // Send welcome email for verified users (but not for new hosts who haven't completed registration)
      if (data.user.email && profile?.full_name && !isNewHost) {
        try {
          await fetch(`${origin}/api/emails/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'welcome',
              userEmail: data.user.email,
              userName: profile.full_name,
              userRole: userRole,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the auth process if email fails
        }
      }

      // Determine redirect URL based on role
      const getRedirectUrl = (userRole: string, isNewHost: boolean = false) => {
        switch (userRole) {
          case 'host':
            const hostBaseUrl = process.env.NEXT_PUBLIC_HOST_URL ?? 'http://localhost:3002'
            // If this is a new host signup, redirect to registration form
            return isNewHost ? `${hostBaseUrl}/register` : hostBaseUrl
          case 'user':
          default:
            return process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3001'
        }
      }

      const redirectUrl = getRedirectUrl(userRole, isNewHost)
      
      // If redirecting to a different app, use external redirect
      if (redirectUrl !== origin) {
        return NextResponse.redirect(redirectUrl)
      }
      
      // Otherwise redirect within the current app
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
