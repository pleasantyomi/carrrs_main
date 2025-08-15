import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
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

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        booking_id: paymentData.bookingId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        payment_method: paymentData.paymentMethod,
        payment_gateway: paymentData.gateway || 'flutterwave',
        transaction_id: paymentData.transactionId,
        status: 'completed'
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error('Failed to create payment record');
    }

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        cars(title, location),
        stays(title, location),
        services(title, location)
      `)
      .eq('id', paymentData.bookingId)
      .single();

    // Determine item details
    let itemName = 'Unknown';
    let itemLocation = 'Unknown';
    
    if (booking?.cars) {
      itemName = booking.cars.title;
      itemLocation = booking.cars.location;
    } else if (booking?.stays) {
      itemName = booking.stays.title;
      itemLocation = booking.stays.location;
    } else if (booking?.services) {
      itemName = booking.services.title;
      itemLocation = booking.services.location;
    }

    // Send payment confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'payment-confirmation',
          userEmail: user.email,
          userName: userProfile?.full_name || 'Customer',
          paymentDetails: {
            transactionId: paymentData.transactionId,
            amount: paymentData.amount,
            currency: paymentData.currency || 'USD',
            paymentMethod: paymentData.paymentMethod,
            bookingId: paymentData.bookingId,
            itemName,
            itemLocation,
            date: new Date().toISOString(),
          },
        }),
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    return NextResponse.json(
      {
        success: true,
        payment,
        message: 'Payment processed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
