import nodemailer from 'nodemailer';
import { config } from '../config/app.config';
import { logger } from './logger.util';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: options.from || config.FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}:`, info.messageId);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string): Promise<void> {
    const resetLink = `${config.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password - Tazkartak';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Tazkartak</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #1976d2;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1565c0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tazkartak</div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello ${firstName ? firstName : 'there'},</p>
            
            <p>We received a request to reset your password for your Tazkartak account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1976d2;">${resetLink}</p>
            
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.
            </div>
            
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, please don't share this link with anyone. Tazkartak will never ask for your password via email.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from Tazkartak - Your Event Ticket Platform</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - Tazkartak
      
      Hello ${firstName ? firstName : 'there'},
      
      We received a request to reset your password for your Tazkartak account. If you made this request, click the link below to reset your password:
      
      ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      For security reasons, please don't share this link with anyone. Tazkartak will never ask for your password via email.
      
      ---
      Tazkartak - Your Event Ticket Platform
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const subject = 'Welcome to Tazkartak!';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome - Tazkartak</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #1976d2;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tazkartak</div>
            <h1 class="title">Welcome to Tazkartak!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${firstName ? firstName : 'there'},</p>
            
            <p>Welcome to Tazkartak! We're excited to have you join our community of event organizers and ticket buyers.</p>
            
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>Create and manage events</li>
              <li>Sell tickets online</li>
              <li>Track your sales and analytics</li>
              <li>Integrate with your website</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${config.FRONTEND_URL}/dashboard" class="button">Get Started</a>
            </div>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Tazkartak!</p>
            <p>Your Event Ticket Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Tazkartak!
      
      Hello ${firstName ? firstName : 'there'},
      
      Welcome to Tazkartak! We're excited to have you join our community of event organizers and ticket buyers.
      
      Your account has been successfully created. You can now create and manage events, sell tickets online, track your sales and analytics, and integrate with your website.
      
      Get started: ${config.FRONTEND_URL}/dashboard
      
      If you have any questions or need help getting started, don't hesitate to reach out to our support team.
      
      Thank you for choosing Tazkartak!
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendEmailVerificationEmail(email: string, verificationToken: string, firstName?: string): Promise<void> {
    const verificationLink = `${config.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email - Tazkartak';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Tazkartak</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #1976d2;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Tazkartak</div>
            <h1 class="title">Verify Your Email</h1>
          </div>
          
          <div class="content">
            <p>Hello ${firstName ? firstName : 'there'},</p>
            
            <p>Thank you for registering with Tazkartak! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify My Email</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1976d2;">${verificationLink}</p>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with Tazkartak, please ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Tazkartak!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Email Verification - Tazkartak
      
      Hello ${firstName ? firstName : 'there'},
      
      Thank you for registering with Tazkartak! To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with Tazkartak, please ignore this email.
      
      Thank you for choosing Tazkartak!
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();

// Export individual functions for backward compatibility
export const sendEmail = (options: EmailOptions) => emailService.sendEmail(options);
export const sendPasswordResetEmail = (email: string, resetToken: string, firstName?: string) => 
  emailService.sendPasswordResetEmail(email, resetToken, firstName);
export const sendWelcomeEmail = (email: string, firstName?: string) => 
  emailService.sendWelcomeEmail(email, firstName);
export const sendEmailVerificationEmail = (email: string, verificationToken: string, firstName?: string) => 
  emailService.sendEmailVerificationEmail(email, verificationToken, firstName);
