import debug from 'debug';
import { nanoid } from 'nanoid';
import {
    PRINT_OUTPUTS_STORAGE_NAME,
    RABBITMQ_EXCHANGE_PRINT_OUTPUTS,
} from '../../constants';
import { sentry, queue } from '../../services';
import { uploadBuffer } from '../../services/aws';
import { PrintEnvelope } from './types';

const logger = debug('workers:printOutputs');

const uniqueId = nanoid();

export const start = async () => {
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

    logger('Channel worker video started');

    const logQueue = `${RABBITMQ_EXCHANGE_PRINT_OUTPUTS}.toSend.${uniqueId}`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_PRINT_OUTPUTS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_PRINT_OUTPUTS, 'toSend');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            const parsedMessage = JSON.parse(
                data.content.toString().trim()
            ) as PrintEnvelope;

            logger('parsedMessage', parsedMessage);

            await uploadBuffer({
                buffer: Buffer.from(parsedMessage.buffer.data),
                bucket: PRINT_OUTPUTS_STORAGE_NAME,
                key: parsedMessage.key,
            });

            channel.ack(data);
        } catch (parsingError) {
            sentry.captureException(parsingError);
            channel.nack(data);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);
        await queue.disconnect();
    });
};
