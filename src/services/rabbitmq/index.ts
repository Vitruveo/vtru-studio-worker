import debug from 'debug';
import rabbitmq, { Connection, Channel } from 'amqplib';
import { captureException } from '../sentry';
import { RABBITMQ_URL } from '../../constants';

const logger = debug('services:rabbitmq');

const status: {
    connection: Connection | null;
    isConnected: boolean;
} = {
    connection: null,
    isConnected: false,
};

export const disconnect = async () => {
    if (status.connection) {
        const oldConnection = status.connection;
        status.connection = null;
        await oldConnection.close();
    }
};

export const getConnection = async () => {
    try {
        if (!status.connection) {
            status.connection = await rabbitmq.connect(RABBITMQ_URL);
            status.isConnected = true;
        }
    } catch (err) {
        status.isConnected = false;
        status.connection = null;
        captureException(err, { tags: { scope: 'rabbitmq' } });
        logger('Error connecting to rabbitmq: %O', err);
    }
    return status;
};

export const getChannel = async () => {
    try {
        const { connection } = await getConnection();
        if (connection) {
            return connection.createChannel();
        }
    } catch (error) {
        captureException(error, { tags: { scope: 'rabbitmq' } });
    }
    return null;
};

export { Channel };
