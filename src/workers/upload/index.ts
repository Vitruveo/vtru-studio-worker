import debug from 'debug';
import { nanoid } from 'nanoid';
import {
    CloudWatchLogsClient,
    PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
    RABBITMQ_EXCHANGE_CREATORS,
    AWS_DEFAULT_REGION,
    NODE_ENV,
} from '../../constants';
import { getChannel } from '../../services/rabbitmq';
import { captureException } from '../../services/sentry';
import { CreatorsAssetsEnvelope } from './types';
import { createUploadProvider } from './factory';

const logger = debug('worker:creators.upload.assets');
const uniqueId = nanoid();

const cloudWatchLogsClient = new CloudWatchLogsClient({
    region: AWS_DEFAULT_REGION,
});

interface LogEventParams {
    envelope: CreatorsAssetsEnvelope;
    result: string;
    error?: Error;
}

const logEvent = ({ envelope, result, error }: LogEventParams) => ({
    logGroupName: `vitruveo.studio.${NODE_ENV}`,
    logStreamName: 'mail',
    logEvents: [
        {
            message: `Key: ${envelope.key}, Result: ${result}${
                error ? `, Error: ${error}` : ''
            }`,
            timestamp: Date.now(),
        },
    ],
});

export const sendToExchangeCreators = async (
    message: string,
    routingKey = 'preSignedURL'
) => {
    try {
        const channel = await getChannel();
        channel?.assertExchange(RABBITMQ_EXCHANGE_CREATORS, 'topic', {
            durable: true,
        });

        if (channel) {
            channel.publish(
                RABBITMQ_EXCHANGE_CREATORS,
                routingKey,
                Buffer.from(message)
            );
        }
    } catch (error) {
        logger('Error sending to queue: %O', error);
        captureException(error, { tags: { scope: 'sendToQueue' } });
    }
};

export const generatePreSignedURL = async (
    envelope: CreatorsAssetsEnvelope
): Promise<boolean> => {
    try {
        const { creatorId } = envelope;

        const uploadProvider = createUploadProvider();
        const preSignedURL = await uploadProvider.upload(envelope);

        await sendToExchangeCreators(
            JSON.stringify({ preSignedURL, creatorId })
        );

        // log upload sent
        const command = new PutLogEventsCommand(
            logEvent({
                envelope,
                result: 'success',
            })
        );
        cloudWatchLogsClient.send(command);
        return true;
    } catch (presignedError) {
        // avoid to duplicate error in sentry
        logger('Failed to presigned: %O', presignedError);
        captureException(presignedError);
        try {
            // log presigned failed
            const command = new PutLogEventsCommand(
                logEvent({
                    envelope,
                    result: 'failed',
                    error: presignedError as Error,
                })
            );
            cloudWatchLogsClient.send(command);
        } catch (cloudWatchError) {
            // avoid to duplicate error in sentry
        }
    }
    return false;
};

export const start = async () => {
    const channel = await getChannel();
    const logQueue = `${RABBITMQ_EXCHANGE_CREATORS}.assets.${uniqueId}`;

    channel?.assertExchange(RABBITMQ_EXCHANGE_CREATORS, 'topic', {
        durable: true,
    });
    channel?.assertQueue(logQueue, { durable: false });
    channel?.bindQueue(logQueue, RABBITMQ_EXCHANGE_CREATORS, 'assets');

    channel?.consume(logQueue, async (message) => {
        if (!message) return;

        try {
            // parse envelope
            const parsedMessage = JSON.parse(
                message.content.toString().trim()
            ) as CreatorsAssetsEnvelope;
            await generatePreSignedURL(parsedMessage);
        } catch (parsingError) {
            captureException(parsingError);
        }
        channel?.ack(message);
    });
};
