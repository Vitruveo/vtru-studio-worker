import { SendGrid } from './provider';
import { MAIL_PROVIDER } from '../../constants';

export const createMailProvider = () => {
    if (MAIL_PROVIDER === 'sendgrid') {
        return new SendGrid();
    }
    if (MAIL_PROVIDER === 'mailgun') {
        // return new MailGun();
    }
    if (MAIL_PROVIDER === 'mailchimp') {
        // return new MailChimp();
    }
    throw new Error('Invalid mail provider');
};
