export const RABBITMQ_URL =
    process.env.RABBITMQ_URL || 'amqp://admin:password@localhost';

export const RABBITMQ_EXCHANGE_EXPRESS =
    process.env.RABBITMQ_EXCHANGE_EXPRESS_LOG || 'express';
export const RABBITMQ_EXCHANGE_MAIL =
    process.env.RABBITMQ_EXCHANGE_MAIL || 'mail';
export const RABBITMQ_EXCHANGE_CREATORS =
    process.env.RABBITMQ_EXCHANGE_CREATORS || 'creators';
export const RABBITMQ_EXCHANGE_RSS = process.env.RABBITMQ_EXCHANGE_RSS || 'rss';
