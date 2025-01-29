import { Readable } from 'stream';
import { nanoid } from 'nanoid';
import { RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES } from '../../constants';
import { sentry, queue, logger as remoteLogger } from '../../services';
import { TemplateEnvelope, GeneratePreSignedURLParams } from './types';
import { createTemplateStorageProvider } from './factory';
import { sendToExchangeCreators } from '../../services/creators';

interface MessageParams {
    envelope: TemplateEnvelope;
    result: string;
    error?: Error;
}

const message = ({ envelope, result, error }: MessageParams) =>
    `Key: ${envelope.path}, Result: ${result}${
        error ? `, Error: ${error}` : ''
    }`;

export const generatePreSignedURL = async ({
    envelope,
}: GeneratePreSignedURLParams): Promise<boolean> => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'templateStorage' });

    try {
        const { userId, transactionId } = envelope;

        const templateStorageProvider = createTemplateStorageProvider();
        const preSignedURL = await templateStorageProvider.createUrl(envelope);

        await sendToExchangeCreators(
            JSON.stringify({
                preSignedURL,
                userId,
                transactionId,
                path: envelope.path,
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

export const generateJSON = async ({
    envelope,
}: GeneratePreSignedURLParams) => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'templateStorage' });
    try {
        const templateStorageProvider = createTemplateStorageProvider();
        const response = await templateStorageProvider.getData();

        const streamToString = (stream: Readable): Promise<string> =>
            new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () =>
                    resolve(Buffer.concat(chunks).toString('utf-8'))
                );
                stream.on('error', reject);
            });

        const fileContent = await streamToString(response.Body as Readable);

        const jsonContent = JSON.parse(fileContent);

        jsonContent.push({
            id: nanoid(),
            ...envelope.values,
        });

        await templateStorageProvider.uploadData(
            JSON.stringify(jsonContent, null, 2)
        );

        await loggerProvider.log({
            message: message({
                envelope,
                result: 'success',
            }),
            logLevel: 'info',
        });

        return true;
    } catch (error) {
        sentry.captureException(error);
        await loggerProvider.log({
            message: message({
                envelope,
                result: 'failed',
                error: error as Error,
            }),
            logLevel: 'error',
        });
    }
    return false;
};

// TODO: criar dead letter para queue
export const start = async () => {
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'templateStorage' });

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
        message: 'Channel worker template storage started',
        logLevel: 'info',
    });

    const logQueue = `${RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES}.upload`;
    loggerProvider.log({
        message: `Creating queue ${logQueue}`,
        logLevel: 'info',
    });
    channel.assertExchange(RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES, 'image');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_ARTCARDS_TEMPLATES, 'json');
    channel.consume(logQueue, async (data) => {
        if (!data) {
            loggerProvider.log({
                message: `No message received in queue ${logQueue}`,
                logLevel: 'info',
            });
            return;
        }
        try {
            const content = data.content.toString();

            loggerProvider.log({
                message: `Received message in queue ${logQueue}: ${content}`,
                logLevel: 'info',
            });
            // parse envelope
            const parsedMessage = JSON.parse(
                content.trim()
            ) as TemplateEnvelope;

            loggerProvider.log({
                message: `Parsed message in queue ${logQueue}: ${JSON.stringify(
                    parsedMessage
                )}`,
                logLevel: 'info',
            });

            if (data.fields.routingKey === 'image') {
                await generatePreSignedURL({ envelope: parsedMessage });
            }

            if (data.fields.routingKey === 'json') {
                await generateJSON({ envelope: parsedMessage });
            }

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
