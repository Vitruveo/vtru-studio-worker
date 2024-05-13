import debug from 'debug';

import { RABBITMQ_EXCHANGE_RSS } from '../../constants';
import { sentry, queue } from '../../services';

import { handleCurateStack, handleConsign, handleRemove } from './actions';

const logger = debug('workers:rss');

// TODO: create dead letter for queue.
export const start = async () => {
    logger('Starting worker rss');
    const channel = await queue.getChannel();

    if (!channel) {
        logger('Channel not available');
        process.exit(1);
    }
    channel.on('close', () => {
        logger('Channel closed');
        process.exit(1);
    });
    channel.on('error', (error) => {
        logger('Error occurred in channel:', error);
        process.exit(1);
    });

    logger('Channel worker rss started');

    const logQueue = `${RABBITMQ_EXCHANGE_RSS}.create`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_RSS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_RSS, 'create');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_RSS, 'consign');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_RSS, 'video');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_RSS, 'remove');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            // parse envelope
            const parsedMessage = JSON.parse(data.content.toString().trim());

            if (data.fields.routingKey === 'video') {
                await handleCurateStack(parsedMessage);
            }

            if (data.fields.routingKey === 'consign') {
                await handleConsign(parsedMessage);
            }

            if (data.fields.routingKey === 'remove') {
                await handleRemove(parsedMessage);
            }

            channel.ack(data);
        } catch (parsingError) {
            sentry.captureException(parsingError);
            channel.nack(data);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);

        // disconnect from RabbitMQ
        await queue.disconnect();
    });
};
