import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { MailProvider, MailEnvelope } from '../types';
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
                transactionLink: envelope.transactionLink || '',
                thumbnail: envelope.thumbnail || '',
            },
        };

        const [response] = await sgMail.send(msg);

        return response.statusCode.toString();
    }
}
