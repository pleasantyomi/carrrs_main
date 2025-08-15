import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toast } from 'sonner';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Create booking (example structure)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        item_type: bookingData.itemType,
        item_id: bookingData.itemId,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        total_amount: bookingData.totalAmount,
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error('Failed to create booking');
    }

    // Get item details based on type
    let itemDetails: { name: string; location: string } | null = null;
    let hostDetails: { full_name: string; email: string } | null = null;

    switch (bookingData.itemType) {
      case 'car':
        const { data: car } = await supabase
          .from('cars')
          .select(`
            title,
            location,
            host_id,
            profiles!cars_host_id_fkey(full_name, email)
          `)
          .eq('id', bookingData.itemId)
          .single();
        itemDetails = { name: car?.title || 'Unknown Car', location: car?.location || 'Unknown' };
        const carHost = Array.isArray(car?.profiles) ? car.profiles[0] : car?.profiles;
        hostDetails = carHost ? { full_name: carHost.full_name || '', email: carHost.email || '' } : null;
        break;

      case 'stay':
        const { data: stay } = await supabase
          .from('stays')
          .select(`
            title,
            location,
            host_id,
            profiles!stays_host_id_fkey(full_name, email)
          `)
          .eq('id', bookingData.itemId)
          .single();
        itemDetails = { name: stay?.title || 'Unknown Stay', location: stay?.location || 'Unknown' };
        const stayHost = Array.isArray(stay?.profiles) ? stay.profiles[0] : stay?.profiles;
        hostDetails = stayHost ? { full_name: stayHost.full_name || '', email: stayHost.email || '' } : null;
        break;

      case 'service':
        const { data: service } = await supabase
          .from('services')
          .select(`
            title,
            location,
            host_id,
            profiles!services_host_id_fkey(full_name, email)
          `)
          .eq('id', bookingData.itemId)
          .single();
        itemDetails = { name: service?.title || 'Unknown Service', location: service?.location || 'Unknown' };
        const serviceHost = Array.isArray(service?.profiles) ? service.profiles[0] : service?.profiles;
        hostDetails = serviceHost ? { full_name: serviceHost.full_name || '', email: serviceHost.email || '' } : null;
        break;
    }

    // Send booking confirmation email to customer
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'booking-confirmation',
          userEmail: user.email,
          userName: userProfile?.full_name || 'Customer',
          bookingDetails: {
            id: booking.id,
            itemType: bookingData.itemType,
            itemName: itemDetails?.name || 'Unknown',
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            totalAmount: bookingData.totalAmount,
            location: itemDetails?.location || 'Unknown',
          },
        }),
      });
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
    }

    // Send booking notification email to host
    if (hostDetails?.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'host-booking-notification',
            hostEmail: hostDetails.email,
            hostName: hostDetails.full_name || 'Host',
            bookingDetails: {
              id: booking.id,
              customerName: userProfile?.full_name || 'Customer',
              customerEmail: user.email,
              itemType: bookingData.itemType,
              itemName: itemDetails?.name || 'Unknown',
              startDate: bookingData.startDate,
              endDate: bookingData.endDate,
              totalAmount: bookingData.totalAmount,
            },
          }),
        });
      } catch (emailError) {
        console.error('Failed to send host notification email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        booking,
        message: 'Booking created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
