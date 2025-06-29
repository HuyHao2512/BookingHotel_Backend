import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error(`Error sending email:`, error);
      throw new Error('Could not send email');
    }
  }
}
