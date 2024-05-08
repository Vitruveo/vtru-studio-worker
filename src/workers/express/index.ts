import debug from 'debug';
import { nanoid } from 'nanoid';
import { RABBITMQ_EXCHANGE_EXPRESS } from '../../constants';
import { sentry, queue, logger as remoteLogger } from '../../services';

const logger = debug('workers:express');

const uniqueId = nanoid();

export const start = async () => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'express' });

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

    logger('Channel worker express started');

    const logQueue = `${RABBITMQ_EXCHANGE_EXPRESS}.log.${uniqueId}`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_EXPRESS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_EXPRESS, 'log');

    channel.consume(logQueue, async (message) => {
        if (!message) return;

        const envelope = message.content.toString().trim();
        try {
            await loggerProvider.log({
                message: JSON.stringify({
                    envelope,
                    result: 'success',
                }),
                logLevel: 'info',
            });

            channel.ack(message);
        } catch (error) {
            sentry.captureException(error);

            channel.nack(message);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);

        // disconnect from RabbitMQ
        await queue.disconnect();
    });
};
