import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { type, ...emailData } = await request.json();

    let result;

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(
          emailData.userEmail,
          emailData.userName,
          emailData.userRole
        );
        break;

      case 'verification':
        result = await emailService.sendVerificationEmail(
          emailData.userEmail,
          emailData.userName,
          emailData.verificationLink
        );
        break;

      case 'booking-confirmation':
        result = await emailService.sendBookingConfirmationEmail(
          emailData.userEmail,
          emailData.userName,
          emailData.bookingDetails
        );
        break;

      case 'payment-confirmation':
        result = await emailService.sendPaymentConfirmationEmail(
          emailData.userEmail,
          emailData.userName,
          emailData.paymentDetails
        );
        break;

      case 'host-booking-notification':
        result = await emailService.sendHostBookingNotificationEmail(
          emailData.hostEmail,
          emailData.hostName,
          emailData.bookingDetails
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json(
        { success: true, data: result.data },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
