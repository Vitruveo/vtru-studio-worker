import { RABBITMQ_EXCHANGE_CREATORS } from '../../constants';
import { sentry, queue, logger as remoteLogger } from '../../services';
import { sendToExchangeCreators } from '../../services/creators';
import { createStoreStorageProvider } from './factory';
import { GeneratePreSignedURLParams, StoreEnvelope } from './types';

interface MessageParams {
    envelope: StoreEnvelope;
    result: string;
    error?: Error;
}

const message = ({ envelope, result, error }: MessageParams) =>
    `Key: ${envelope.path}, Result: ${result}${
        error ? `, Error: ${error}` : ''
    }`;

// TODO: use a separeted file for this function
export const generatePreSignedURL = async ({
    envelope,
}: GeneratePreSignedURLParams): Promise<boolean> => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'assetStorage' });

    try {
        const { creatorId, transactionId } = envelope;

        const assetStorageProvider = createStoreStorageProvider();
        const preSignedURL = await assetStorageProvider.createUrl(envelope);

        await sendToExchangeCreators(
            JSON.stringify({
                preSignedURL,
                creatorId,
                transactionId,
                path: envelope.path,
                origin: envelope.origin,
                method: envelope.method,
                format: envelope.metadata.formatUpload,
            })
        );

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
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'storeStorage' });

    const channel = await queue.getChannel();

    if (!channel) {
        loggerProvider.log({
            message: 'Channel not available',
            logLevel: 'error',
        });
        process.exit(1);
    }
    channel.on('close', () => {
        loggerProvider.log({
            message: 'Channel closed',
            logLevel: 'error',
        });
        process.exit(1);
    });
    channel.on('error', (error) => {
        loggerProvider.log({
            message: `Error occurred in channel: ${error}`,
            logLevel: 'error',
        });
        process.exit(1);
    });

    loggerProvider.log({
        message: 'Channel worker store storage started',
        logLevel: 'info',
    });

    const logQueue = `${RABBITMQ_EXCHANGE_CREATORS}.stores`;
    loggerProvider.log({
        message: `Creating queue ${logQueue}`,
        logLevel: 'info',
    });
    channel.assertExchange(RABBITMQ_EXCHANGE_CREATORS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_CREATORS, 'stores');
    channel.consume(logQueue, async (data) => {
        if (!data) {
            loggerProvider.log({
                message: `No message received in queue ${logQueue}`,
                logLevel: 'info',
            });
            return;
        }
        try {
            if (data.fields.routingKey !== 'stores') {
                channel.nack(data);
                return;
            }

            const content = data.content.toString();

            loggerProvider.log({
                message: `Received message in queue ${logQueue}: ${content}`,
                logLevel: 'info',
            });
            // parse envelope
            const parsedMessage = JSON.parse(content.trim()) as StoreEnvelope;

            loggerProvider.log({
                message: `Parsed message in queue ${logQueue}: ${JSON.stringify(
                    parsedMessage
                )}`,
                logLevel: 'info',
            });

            await generatePreSignedURL({ envelope: parsedMessage });

            channel.ack(data);
            return;
        } catch (parsingError) {
            sentry.captureException(parsingError);
            loggerProvider.log({
                message: `Error parsing message in queue ${logQueue}: ${parsingError}`,
                logLevel: 'error',
            });
        }
        channel.nack(data);
    });

    process.once('SIGINT', async () => {
        loggerProvider.log({
            message: `Closing channel ${logQueue}`,
            logLevel: 'info',
        });
        await channel.close();

        // disconnect from RabbitMQ
        await queue.disconnect();
    });
};
