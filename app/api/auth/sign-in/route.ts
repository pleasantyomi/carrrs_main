import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: session, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Get user profile to determine role and redirect URL
    let userRole = 'user';
    let redirectUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3001';

    if (session.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role) {
        userRole = profile.role;
        
        // Determine redirect URL based on role
        if (userRole === 'host') {
          redirectUrl = process.env.NEXT_PUBLIC_HOST_URL ?? 'http://localhost:3002';
        }
      }
    }

    return NextResponse.json({ 
      session,
      role: userRole,
      redirectUrl 
    });
  } catch (err) {
    console.error('Sign-in API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
