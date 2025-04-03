import debug from 'debug';
import rabbitmq, { Connection, Channel } from 'amqplib';
import { captureException } from '../sentry';
import { RABBITMQ_URL } from '../../constants';

const logger = debug('services:rabbitmq');

const status: {
    connection: Connection | null;
} = {
    connection: null,
};

export const getChannel = async () => {
    try {
        if (!status.connection) {
            logger('RabbitMQ connection not established');
            process.exit(1);
        }

        const channel = await status.connection.createChannel();
        return channel;
    } catch (error) {
        logger('Error creating channel: %O', error);
        captureException(error, { tags: { scope: 'rabbitmq' } });
        return null;
    }
};

export const disconnect = async () => {
    if (status.connection) {
        const oldConnection = status.connection;
        status.connection = null;

        try {
            await oldConnection.close();
            return; // exit function
        } catch (error) {
            logger('Error closing RabbitMQ connection: %O', error);
            captureException(error, { tags: { scope: 'rabbitmq' } });
            process.exit(1);
        }
    }

    logger('RabbitMQ connection not established');
    process.exit(1);
};

export const getConnection = async () => {
    try {
        status.connection = await rabbitmq.connect(RABBITMQ_URL);
        logger(`RabbitMQ connected: ${RABBITMQ_URL}`);

        status.connection.on('close', () => {
            logger('RabbitMQ connection closed');
            process.exit(1);
        });

        status.connection.on('error', (error) => {
            logger('Error occurred in RabbitMQ connection:', error);
            process.exit(1);
        });
    } catch (err) {
        logger('Error connecting to rabbitmq: %O', err);
        captureException(err, { tags: { scope: 'rabbitmq' } });
        process.exit(1);
    }
};
export { Channel };
