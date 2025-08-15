import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, role = 'user' } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Determine redirect URL based on role
    const getRedirectUrl = (userRole: string) => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
      
      switch (userRole) {
        case 'host':
          return process.env.NEXT_PUBLIC_HOST_URL ?? 'http://localhost:3002';
        case 'user':
        default:
          return process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3001';
      }
    };

    const redirectUrl = getRedirectUrl(role);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/callback?role=${role}`,
        data: { role },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: 'Check your email to confirm your account.',
      role,
      redirectUrl
    });
  } catch (error) {
    console.error('Sign up API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
