export const MAIL_PROVIDER = process.env.MAIL_PROVIDER || 'mailtrap';
export const MAIL_MAILTRAP_USER = process.env.MAIL_MAILTRAP_USER || '';
export const MAIL_MAILTRAP_PASS = process.env.MAIL_MAILTRAP_PASS || '';
export const MAIL_MAILTRAP_FROM =
    process.env.MAIL_MAILTRAP_FROM || 'tecnologia@jbtec.com.br';

export const MAIL_SENDGRID_API_KEY = process.env.MAIL_SENDGRID_API_KEY || '';
export const MAIL_SENDGRID_FROM = process.env.MAIL_SENDGRID_FROM || '';

export const MAIL_ENABLER = process.env.MAIL_ENABLER
    ? process.env.MAIL_ENABLER === 'true'
    : false;
