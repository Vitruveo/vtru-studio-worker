import debug from 'debug';
import { nanoid } from 'nanoid';
import { dirname, join } from 'path';
import { promises } from 'fs';
import {
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    GENERAL_STORAGE_URL,
    RABBITMQ_EXCHANGE_VIDEO,
} from '../../constants';
import { sentry, queue } from '../../services';
import { VideoEnvelope } from './types';
import { downloadStream } from './download';
import { upload } from '../../services/aws';

const logger = debug('workers:video');

const uniqueId = nanoid();

// TODO: create dead letter for queue.
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

    const logQueue = `${RABBITMQ_EXCHANGE_VIDEO}.toSend.${uniqueId}`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_VIDEO, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_VIDEO, 'toSend');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            const parsedMessage = JSON.parse(
                data.content.toString().trim()
            ) as VideoEnvelope;

            logger('Received message', parsedMessage);

            // download do video
            const endFileName = join(ASSET_TEMP_DIR, parsedMessage.path);
            await promises.mkdir(dirname(endFileName), { recursive: true });
            logger('endFileName', endFileName);

            logger('Downloading video');
            await downloadStream({ path: endFileName, url: parsedMessage.url });
            logger('Downloaded video');

            // upload do video
            logger('Uploading video');
            upload({
                bucket: GENERAL_STORAGE_NAME,
                key: parsedMessage.path,
                fileName: endFileName,
            }).finally(() => {
                logger('Uploaded video');

                console.log(`${GENERAL_STORAGE_URL}/${parsedMessage.path}`);

                // apagar o video
                logger('Deleting video');
                promises
                    .unlink(endFileName)
                    .catch((error) => logger('Error deleting video', error));

                logger('Deleted video');

                channel.ack(data);
            });
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
