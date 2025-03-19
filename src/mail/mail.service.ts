import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly _mailerService: MailerService) {}

  /**
   * Send login notification email
   * @param email User's email
   */
  public async sendLogInEMail(email: string): Promise<void> {
    try {
      const today = new Date();
      await this._mailerService.sendMail({
        to: email,
        from: `<no-reply@my-domain.com>`, // Fixed typo in 'no-reply'
        subject: 'Login Notification',
        template: 'login',
        context: {
          email,
          date: today.toLocaleDateString(),
          time: today.toLocaleTimeString(),
        },
      });
    } catch (error) {
      console.error('Email service error:', error);
      // Don't throw, just log the error
    }
  }
}
