import { nanoid } from 'nanoid';
import { RABBITMQ_EXCHANGE_EXPRESS } from '../../constants';
import { sentry, queue, logger as remoteLogger } from '../../services';

const uniqueId = nanoid();

export const start = async () => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'express' });

    const channel = await queue.getChannel();
    channel?.on('close', () => {
        process.exit(1);
    });
    const logQueue = `${RABBITMQ_EXCHANGE_EXPRESS}.log.${uniqueId}`;

    channel?.assertExchange(RABBITMQ_EXCHANGE_EXPRESS, 'topic', {
        durable: true,
    });
    channel?.assertQueue(logQueue, { durable: false });
    channel?.bindQueue(logQueue, RABBITMQ_EXCHANGE_EXPRESS, 'log');

    channel?.consume(logQueue, async (message) => {
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

            channel?.ack(message);
        } catch (error) {
            sentry.captureException(error);

            channel?.nack(message);
        }
    });
};
