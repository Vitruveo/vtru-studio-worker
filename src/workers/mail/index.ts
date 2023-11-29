import debug from 'debug';
import { nanoid } from 'nanoid';
import {
    CloudWatchLogsClient,
    PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
    RABBITMQ_EXCHANGE_MAIL,
    AWS_DEFAULT_REGION,
    NODE_ENV,
} from '../../constants';
import { getChannel } from '../../services/rabbitmq';
import { captureException } from '../../services/sentry';
import { MailEnvelope } from './types';
import { createMailProvider } from './factory';

const logger = debug('worker:mail');
const uniqueId = nanoid();

const cloudWatchLogsClient = new CloudWatchLogsClient({
    region: AWS_DEFAULT_REGION,
});

interface LogEventParams {
    envelope: MailEnvelope;
    result: string;
    error?: Error;
}

const logEvent = ({ envelope, result, error }: LogEventParams) => ({
    logGroupName: `vitruveo.studio.${NODE_ENV}`,
    logStreamName: 'mail',
    logEvents: [
        {
            message: `To: ${envelope.to}, Subject: ${
                envelope.subject
            }, Result: ${result}${error ? `, Error: ${error}` : ''}`,
            timestamp: Date.now(),
        },
    ],
});

export const sendMail = async (envelope: MailEnvelope): Promise<boolean> => {
    try {
        // send mail via generic interface (sendgrid, mailgun, etc)
        const mailProvider = createMailProvider();
        await mailProvider.sendMail(envelope);

        // log mail sent
        const command = new PutLogEventsCommand(
            logEvent({
                envelope,
                result: 'success',
            })
        );
        cloudWatchLogsClient.send(command);
        return true;
    } catch (mailError) {
        // avoid to duplicate error in sentry
        captureException(mailError);
        logger('Failed to send mail: %O', mailError);
        try {
            // log mail failed
            const command = new PutLogEventsCommand(
                logEvent({
                    envelope,
                    result: 'failed',
                    error: mailError as Error,
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
    const logQueue = `${RABBITMQ_EXCHANGE_MAIL}.toSend.${uniqueId}`;

    channel?.assertExchange(RABBITMQ_EXCHANGE_MAIL, 'topic', {
        durable: true,
    });
    channel?.assertQueue(logQueue, { durable: false });
    channel?.bindQueue(logQueue, RABBITMQ_EXCHANGE_MAIL, 'toSend');

    channel?.consume(logQueue, async (message) => {
        if (!message) return;

        try {
            // parse envelope
            const parsedMessage = JSON.parse(
                message.content.toString().trim()
            ) as MailEnvelope;
            const result = await sendMail(parsedMessage);
            if (result) {
                channel?.ack(message);
                return;
            }
        } catch (parsingError) {
            captureException(parsingError);
        }
        channel?.nack(message);
    });
};
