import debug from 'debug';

import { Channel, getChannel } from '../../services/rabbitmq';

import { RABBITMQ_EXCHANGE_GRID } from '../../constants';

const logger = debug('services:grid:queue');

const status: {
    channel: Channel | null;
} = {
    channel: null,
};

// script to test generating a message and sending it to the grid exchange
export const sendToExchangeGrid = async (
    message: string,
    routingKey = 'toSend'
) => {
    try {
        if (!status.channel) {
            status.channel = await getChannel();
            logger('Asserting exchange: %s', RABBITMQ_EXCHANGE_GRID);
            status.channel!.assertExchange(RABBITMQ_EXCHANGE_GRID, 'topic', {
                durable: true,
            });
        }
        logger('Sending to grid exchange', {
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_GRID,
        });
        status.channel!.publish(
            RABBITMQ_EXCHANGE_GRID,
            routingKey,
            Buffer.from(message)
        );
    } catch (error) {
        logger('Error sending to exchange: %O', {
            error,
            message,
            routingKey,
            exchange: RABBITMQ_EXCHANGE_GRID,
        });
        // captureException(error, {
        //     extra: {
        //         message,
        //         routingKey,
        //         exchange: RABBITMQ_EXCHANGE_GRID,
        //     },
        //     tags: { scope: 'sendToExchangegrid' },
        // });
    }
};
