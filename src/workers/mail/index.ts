import { nanoid } from 'nanoid';
import { RABBITMQ_EXCHANGE_MAIL } from '../../constants';
import { sentry, queue, logger as remoteLogger } from '../../services';
import type { MailEnvelope } from './types';
import { createMailProvider } from './factory';

const uniqueId = nanoid();

interface MessageParams {
    envelope: MailEnvelope;
    result: string;
    error?: Error;
}

const message = ({ envelope, result, error }: MessageParams) =>
    `To: ${envelope.to}, Subject: ${envelope.subject}, Result: ${result}${
        error ? `, Error: ${error}` : ''
    }`;

export const sendMail = async (envelope: MailEnvelope): Promise<boolean> => {
    const mailProvider = createMailProvider();
    const loggerProvider = remoteLogger.createLogger();
    await loggerProvider.prepare({ namespace: 'mail' });
    try {
        await mailProvider.sendMail(envelope);
        await loggerProvider.log({
            message: message({
                envelope,
                result: 'success',
            }),
            logLevel: 'info',
        });
        return true;
    } catch (mailError) {
        // avoid to duplicate error in sentry
        sentry.captureException(mailError);
        await loggerProvider.log({
            message: message({
                envelope,
                result: 'failed',
                error: mailError as Error,
            }),
            logLevel: 'error',
        });
    }
    return false;
};

// TODO: create dead letter for queue.
export const start = async () => {
    const channel = await queue.getChannel();
    channel?.on('close', () => {
        process.exit(1);
    });
    const logQueue = `${RABBITMQ_EXCHANGE_MAIL}.toSend.${uniqueId}`;
    channel?.assertExchange(RABBITMQ_EXCHANGE_MAIL, 'topic', {
        durable: true,
    });
    channel?.assertQueue(logQueue, { durable: false });
    channel?.bindQueue(logQueue, RABBITMQ_EXCHANGE_MAIL, 'toSend');

    channel?.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            // parse envelope
            const parsedMessage = JSON.parse(
                data.content.toString().trim()
            ) as MailEnvelope;
            await sendMail(parsedMessage);
            channel?.ack(data);
        } catch (parsingError) {
            sentry.captureException(parsingError);
            channel?.nack(data);
        }
    });
};
