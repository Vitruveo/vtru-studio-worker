import debug from 'debug';
import { nanoid } from 'nanoid';
import { RABBITMQ_EXCHANGE_CREATORS } from '../../constants';
import { sentry, queue, logger as remoteLogger } from '../../services';
import {
    AssetEnvelope,
    GeneratePreSignedURLParams,
    SendToExchangeCreatorsParams,
} from './types';
import { createAssetStorageProvider } from './factory';

const logger = debug('workers:asset:storage');

const status: {
    channel: queue.Channel | null;
} = {
    channel: null,
};

const uniqueId = nanoid();

interface MessageParams {
    envelope: AssetEnvelope;
    result: string;
    error?: Error;
}

const message = ({ envelope, result, error }: MessageParams) =>
    `Key: ${envelope.path}, Result: ${result}${
        error ? `, Error: ${error}` : ''
    }`;

// TODO: use a separeted file for this function
export const sendToExchangeCreators = async ({
    envelope,
    routingKey = 'preSignedURL',
}: SendToExchangeCreatorsParams) => {
    try {
        if (!status.channel) {
            status.channel = await queue.getChannel();

            if (!status.channel) {
                logger('Channel not available');
                process.exit(1);
            }
            status.channel.on('close', () => {
                logger('Channel closed');
                process.exit(1);
            });
            status.channel.on('error', (error) => {
                logger('Error occurred in channel:', error);
                process.exit(1);
            });

            status.channel.assertExchange(RABBITMQ_EXCHANGE_CREATORS, 'topic', {
                durable: true,
            });
        }

        if (status.channel) {
            status.channel.publish(
                RABBITMQ_EXCHANGE_CREATORS,
                routingKey,
                Buffer.from(envelope)
            );
        }
    } catch (error) {
        logger('Error sending to queue: %O', error);
        sentry.captureException(error, { tags: { scope: 'sendToQueue' } });
    }
};

// TODO: use a separeted file for this function
export const generatePreSignedURL = async ({
    envelope,
}: GeneratePreSignedURLParams): Promise<boolean> => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'assetStorage' });

    try {
        const { creatorId, transactionId } = envelope;

        const assetStorageProvider = createAssetStorageProvider();
        const preSignedURL = await assetStorageProvider.createUrl(envelope);

        console.log('preSignedURL', preSignedURL);

        await sendToExchangeCreators({
            envelope: JSON.stringify({
                preSignedURL,
                creatorId,
                transactionId,
                path: envelope.path,
                origin: envelope.origin,
                method: envelope.method,
            }),
        });

        await loggerProvider.log({
            message: message({
                envelope,
                result: 'success',
            }),
            logLevel: 'info',
        });
        return true;
    } catch (presignedError) {
        // avoid to duplicate error in sentry
        sentry.captureException(presignedError);
        await loggerProvider.log({
            message: message({
                envelope,
                result: 'failed',
                error: presignedError as Error,
            }),
            logLevel: 'error',
        });
    }
    return false;
};

// TODO: criar dead letter para queue
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

    logger('Channel worker asset storage started');

    const logQueue = `${RABBITMQ_EXCHANGE_CREATORS}.assets.${uniqueId}`;

    channel.assertExchange(RABBITMQ_EXCHANGE_CREATORS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_CREATORS, 'assets');
    channel.consume(logQueue, async (data) => {
        if (!data) return;

        try {
            // parse envelope
            const parsedMessage = JSON.parse(
                data.content.toString().trim()
            ) as AssetEnvelope;

            // TODO: handle message as switch case (based on method)
            if (parsedMessage.method === 'DELETE') {
                // FIX: do not place logic inside this function (only calls) and log all calls
                const assetStorageProvider = createAssetStorageProvider();
                // FIX: always use named parameters
                await assetStorageProvider.deleteFiles(parsedMessage);
            } else {
                await generatePreSignedURL({ envelope: parsedMessage });
            }
        } catch (parsingError) {
            sentry.captureException(parsingError);
        }
        channel.ack(data);
    });
};
