// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // Cấu hình transporter (sử dụng dịch vụ email như Gmail, SendGrid, SES...)
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Hoặc dịch vụ email khác (ví dụ: SendGrid, SES...)
      auth: {
        user: 'your-email@gmail.com', // Email của bạn
        pass: 'your-email-password', // Mật khẩu của email (hoặc App password nếu sử dụng Gmail)
      },
    });
  }

  // Hàm gửi email
  async sendMail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: 'your-email@gmail.com',
      to,
      subject,
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email', error);
    }
  }
}
