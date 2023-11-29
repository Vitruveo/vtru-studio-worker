import debug from 'debug';
import { nanoid } from 'nanoid';
import {
    CloudWatchLogsClient,
    PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
    RABBITMQ_EXCHANGE_EXPRESS,
    AWS_DEFAULT_REGION,
    NODE_ENV,
} from '../../constants';
import { getChannel } from '../../services/rabbitmq';
import { captureException } from '../../services/sentry';

const logger = debug('worker:express');
const uniqueId = nanoid();

const cloudWatchLogsClient = new CloudWatchLogsClient({
    region: AWS_DEFAULT_REGION,
});

export const start = async () => {
    const channel = await getChannel();
    const logQueue = `${RABBITMQ_EXCHANGE_EXPRESS}.log.${uniqueId}`;

    channel?.assertExchange(RABBITMQ_EXCHANGE_EXPRESS, 'topic', {
        durable: true,
    });
    channel?.assertQueue(logQueue, { durable: false });
    channel?.bindQueue(logQueue, RABBITMQ_EXCHANGE_EXPRESS, 'log');

    channel?.consume(logQueue, (message) => {
        if (!message) return;

        const log = message.content.toString().trim();
        const logEvent = {
            logGroupName: `vitruveo.studio.${NODE_ENV}`,
            logStreamName: 'express',
            logEvents: [
                {
                    message: log,
                    timestamp: Date.now(),
                },
            ],
        };
        const command = new PutLogEventsCommand(logEvent);
        try {
            cloudWatchLogsClient.send(command);
            channel?.ack(message);
        } catch (error) {
            captureException(error);
            logger('Failed to send log to CloudWatch: %O', error);
            channel?.nack(message);
        }
    });
};
