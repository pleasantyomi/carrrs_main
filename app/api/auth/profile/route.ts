import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { full_name, phone, role } = await request.json();
    const updateData: any = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;

    const { data: profile, error: updateError } = await supabase
      .from('profiles').update(updateData).eq('id', user.id).select().single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile update API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
