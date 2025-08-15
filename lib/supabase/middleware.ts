import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function createClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create a response to modify cookies if needed
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: any) {
        response.cookies.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });

  return { supabase, response };
}

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create a response to attach cookies if needed
  let response = NextResponse.next();

  // Create Supabase client for SSR
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Check if this is an auth callback
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Refresh session if expired
  await supabase.auth.getSession();

  // Protected routes - redirect to login if not authenticated
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/signup") ||
    request.nextUrl.pathname === "/auth/callback";

  if (!isAuthRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      const redirectUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
