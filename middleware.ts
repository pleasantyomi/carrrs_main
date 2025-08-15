import { createClient } from "@/lib/supabase/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const { supabase, response } = await createClient(request)

  // Get authenticated user session
  const { data: { session }, error } = await supabase.auth.getSession()

  // Allow public paths
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/',
    '/cars',  // Allow viewing cars, but booking will be protected
    '/services',
    '/experiences'
  ]

  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path + '/')
  )

  // Public paths are always accessible
  if (isPublicPath) {
    return response
  }

  // Protected paths require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Check verification for booking paths
  if (request.nextUrl.pathname.includes('/booking')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_verified) {
      return NextResponse.redirect(new URL('/dashboard/verification', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
