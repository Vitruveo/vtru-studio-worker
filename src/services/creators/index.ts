import debug from 'debug';

import { Channel, getChannel } from '../rabbitmq';
import { captureException } from '../sentry';
import { RABBITMQ_EXCHANGE_CREATORS } from '../../constants';

const logger = debug('services:creators:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

export const sendToExchangeCreators = async (
    message: string,
    routingKey = 'preSignedURL'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_CREATORS);
            status.channel!.assertExchange(
                RABBITMQ_EXCHANGE_CREATORS,
                'topic',
                {
                    durable: true,
                }
            );
        }
        logger('Sending to creators exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_CREATORS,
        });
        status.channel!.publish(
            RABBITMQ_EXCHANGE_CREATORS,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_CREATORS,
        });
        captureException(error, {
            extra: {
                message,
                routingKey,
                exchange: RABBITMQ_EXCHANGE_CREATORS,
            },
            tags: { scope: 'sendToExchangeCreators' },
        });
    }
};
