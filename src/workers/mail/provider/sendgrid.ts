import debug from 'debug';
import { MailProvider, MailEnvelope } from '../types';

const logger = debug('workers:mail:sendgrid');

export class SendGrid implements MailProvider {
    async sendMail(envelope: MailEnvelope): Promise<string> {
        // Send mail using SendGrid
        logger('Sending mail using SendGrid: %O', envelope);
        throw new Error('Method not implemented.');
    }
}
