import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static instance: EmailService;
  private readonly fromEmail: string;

  private constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@carrrs.company';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail({ to, subject, html, from }: EmailTemplate) {
    try {
      const result = await resend.emails.send({
        from: from || this.fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      console.log('Email sent successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(userEmail: string, userName: string, userRole: 'user' | 'host') {
    const isHost = userRole === 'host';
    const dashboardUrl = isHost 
      ? process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3002'
      : process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Carrrs!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">carrrs.</div>
            </div>
            <div class="content">
              <h1>Welcome to Carrrs${isHost ? ' Host Community' : ''}!</h1>
              <p>Hi ${userName},</p>
              <p>Welcome to Carrrs! We're excited to have you join our community${isHost ? ' of hosts' : ''}.</p>
              
              ${isHost ? `
                <p>As a host, you can now:</p>
                <ul>
                  <li>List your cars, stays, and services</li>
                  <li>Manage your bookings and earnings</li>
                  <li>Connect with customers across Nigeria</li>
                </ul>
              ` : `
                <p>As a customer, you can now:</p>
                <ul>
                  <li>Browse and book unique cars</li>
                  <li>Find amazing stays</li>
                  <li>Discover local services</li>
                </ul>
              `}
              
              <a href="${dashboardUrl}" class="button">
                Go to ${isHost ? 'Host ' : ''}Dashboard
              </a>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Carrrs Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Carrrs. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Welcome to Carrrs${isHost ? ' Host Community' : ''}!`,
      html,
    });
  }

  // Email verification reminder
  async sendVerificationEmail(userEmail: string, userName: string, verificationLink: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify your email - Carrrs</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">carrrs.</div>
            </div>
            <div class="content">
              <h1>Verify your email address</h1>
              <p>Hi ${userName},</p>
              <p>Thanks for signing up for Carrrs! To complete your registration, please verify your email address by clicking the button below.</p>
              
              <a href="${verificationLink}" class="button">Verify Email Address</a>
              
              <p>If you didn't create an account with Carrrs, you can safely ignore this email.</p>
              <p>This verification link will expire in 24 hours.</p>
              
              <p>Best regards,<br>The Carrrs Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Carrrs. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Verify your email address - Carrrs',
      html,
    });
  }

  // Booking confirmation email
  async sendBookingConfirmationEmail(
    userEmail: string,
    userName: string,
    bookingDetails: {
      id: string;
      itemType: 'car' | 'stay' | 'service';
      itemName: string;
      startDate: string;
      endDate?: string;
      totalAmount: number;
      location: string;
    }
  ) {
    const { id, itemType, itemName, startDate, endDate, totalAmount, location } = bookingDetails;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmed - Carrrs</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .content { padding: 30px 0; }
            .booking-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .success { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">carrrs.</div>
            </div>
            <div class="content">
              <h1>🎉 Booking Confirmed!</h1>
              <p>Hi ${userName},</p>
              <p class="success">Your booking has been confirmed!</p>
              
              <div class="booking-card">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <span><strong>Booking ID:</strong></span>
                  <span>#${id}</span>
                </div>
                <div class="detail-row">
                  <span><strong>${itemType.charAt(0).toUpperCase() + itemType.slice(1)}:</strong></span>
                  <span>${itemName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Location:</strong></span>
                  <span>${location}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Start Date:</strong></span>
                  <span>${new Date(startDate).toLocaleDateString()}</span>
                </div>
                ${endDate ? `
                <div class="detail-row">
                  <span><strong>End Date:</strong></span>
                  <span>${new Date(endDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span><strong>Total Amount:</strong></span>
                  <span>₦${totalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001'}/bookings" class="button">
                View Booking Details
              </a>
              
              <p>You'll receive further communication from the host with pickup/checkin details.</p>
              <p>If you have any questions about your booking, please contact us.</p>
              
              <p>Best regards,<br>The Carrrs Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Carrrs. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Booking Confirmed - ${itemName}`,
      html,
    });
  }

  // Payment confirmation email
  async sendPaymentConfirmationEmail(
    userEmail: string,
    userName: string,
    paymentDetails: {
      transactionId: string;
      amount: number;
      bookingId: string;
      itemName: string;
      paymentMethod: string;
    }
  ) {
    const { transactionId, amount, bookingId, itemName, paymentMethod } = paymentDetails;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmed - Carrrs</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .content { padding: 30px 0; }
            .payment-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .success { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">carrrs.</div>
            </div>
            <div class="content">
              <h1>💳 Payment Confirmed!</h1>
              <p>Hi ${userName},</p>
              <p class="success">Your payment has been successfully processed!</p>
              
              <div class="payment-card">
                <h3>Payment Details</h3>
                <div class="detail-row">
                  <span><strong>Transaction ID:</strong></span>
                  <span>#${transactionId}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Amount:</strong></span>
                  <span>₦${amount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Booking:</strong></span>
                  <span>#${bookingId} - ${itemName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Payment Method:</strong></span>
                  <span>${paymentMethod}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Date:</strong></span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001'}/bookings" class="button">
                View Booking
              </a>
              
              <p>Your booking is now confirmed and you'll hear from the host soon with further details.</p>
              <p>Save this email as your receipt.</p>
              
              <p>Best regards,<br>The Carrrs Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Carrrs. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Payment Confirmed - ₦${amount.toLocaleString()}`,
      html,
    });
  }

  // Host notification for new booking
  async sendHostBookingNotificationEmail(
    hostEmail: string,
    hostName: string,
    bookingDetails: {
      id: string;
      customerName: string;
      customerEmail: string;
      itemType: 'car' | 'stay' | 'service';
      itemName: string;
      startDate: string;
      endDate?: string;
      totalAmount: number;
    }
  ) {
    const { id, customerName, customerEmail, itemType, itemName, startDate, endDate, totalAmount } = bookingDetails;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Booking Received - Carrrs</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .content { padding: 30px 0; }
            .booking-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .highlight { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">carrrs.</div>
            </div>
            <div class="content">
              <h1>🎉 New Booking Received!</h1>
              <p>Hi ${hostName},</p>
              <p class="highlight">Great news! You have a new booking.</p>
              
              <div class="booking-card">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <span><strong>Booking ID:</strong></span>
                  <span>#${id}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Customer:</strong></span>
                  <span>${customerName} (${customerEmail})</span>
                </div>
                <div class="detail-row">
                  <span><strong>${itemType.charAt(0).toUpperCase() + itemType.slice(1)}:</strong></span>
                  <span>${itemName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Start Date:</strong></span>
                  <span>${new Date(startDate).toLocaleDateString()}</span>
                </div>
                ${endDate ? `
                <div class="detail-row">
                  <span><strong>End Date:</strong></span>
                  <span>${new Date(endDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span><strong>Total Amount:</strong></span>
                  <span>₦${totalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3002'}/bookings" class="button">
                Manage Booking
              </a>
              
              <p>Please contact the customer with pickup/checkin details and any other important information.</p>
              
              <p>Best regards,<br>The Carrrs Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Carrrs. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: hostEmail,
      subject: `New Booking: ${itemName} - ₦${totalAmount.toLocaleString()}`,
      html,
    });
  }
}

export const emailService = EmailService.getInstance();
