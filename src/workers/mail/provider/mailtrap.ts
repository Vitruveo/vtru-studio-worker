import debug from 'debug';
import nodemailer from 'nodemailer';
import { MailProvider, MailEnvelope } from '../types';
import {
    MAIL_MAILTRAP_FROM,
    MAIL_MAILTRAP_PASS,
    MAIL_MAILTRAP_USER,
} from '../../../constants';

const logger = debug('workers:mail:mailtrap');

export class MailTrap implements MailProvider {
    async sendMail(envelope: MailEnvelope): Promise<string> {
        // Send mail using mailtrap
        logger('Sending mail using MailTrap: %O', envelope);
        const transporter = nodemailer.createTransport({
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: MAIL_MAILTRAP_USER,
                pass: MAIL_MAILTRAP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: MAIL_MAILTRAP_FROM,
            to: envelope.to,
            subject: envelope.subject,
            text: `Code: ${envelope.text}`,
        });

        return info.messageId;
    }

    async sendMailWithoutTemplate(): Promise<string> {
        return 'not implemented yet';
    }
}
