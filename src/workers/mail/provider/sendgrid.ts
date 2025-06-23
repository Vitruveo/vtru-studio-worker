import sgMail, { MailDataRequired } from '@sendgrid/mail';
import {
    MailProvider,
    MailEnvelope,
    MailEnvelopeWithoutTemplate,
} from '../types';
import { MAIL_SENDGRID_API_KEY, MAIL_SENDGRID_FROM } from '../../../constants';

export class SendGrid implements MailProvider {
    constructor() {
        sgMail.setApiKey(MAIL_SENDGRID_API_KEY);
    }

    async sendMail(envelope: MailEnvelope): Promise<string> {
        const msg: MailDataRequired = {
            from: MAIL_SENDGRID_FROM,
            to: envelope.to,
            templateId: envelope.template,
            dynamicTemplateData: {
                code: envelope.text,
                link: envelope.link,
                creator: envelope.creator,
                title: envelope.title,
                consignMessage: envelope.consignMessage,
                transactionLink: envelope.transactionLink || '',
                thumbnail: envelope.thumbnail || '',
                vaultExplorer: envelope.vaultExplorer || '',
                mintExplorer: envelope.mintExplorer || '',
                username: envelope.username || '',
                wallet: envelope.wallet || '',
                currentDate: envelope.currentDate || '',
            },
        };

        const [response] = await sgMail.send(msg);

        return response.statusCode.toString();
    }

    async sendMailWithoutTemplate(
        mail: MailEnvelopeWithoutTemplate
    ): Promise<string> {
        const msg: MailDataRequired = {
            from: MAIL_SENDGRID_FROM,
            to: mail.to,
            subject: mail.subject,
            html: mail.html,
        };

        const [response] = await sgMail.send(msg);

        return response.statusCode.toString();
    }
}
