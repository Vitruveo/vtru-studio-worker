import 'dotenv/config';
import debug from 'debug';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getConnection } from './services/rabbitmq';
import { captureException } from './services/sentry';
import { start as expressStart } from './workers/express';
import { start as mailStart } from './workers/mail';
import { start as assetStorageStart } from './workers/assetStorage';

dayjs.extend(utc);
dayjs.extend(timezone);

const logger = debug('core');
debug.enable('core:*,services:*,workers:*');

// #region arguments
const workers: Record<string, boolean> = {
    all: false,
    express: false,
    mail: false,
    assetStorage: false,
};

// sample argv: [ '/usr/bin/node', '/home/rodrigo/Projects/vitruveo-studio/core/dist/index.js', 'express', 'mail' ]
if (process.argv.length === 2) {
    workers.all = true;
} else {
    process.argv.forEach((arg, i) => {
        if (i < 2) return;
        workers[arg] = true;
    });
}
// #endregion arguments

const start = async () => {
    logger('Worker starting');

    const rabbitmqStatus = await getConnection();
    if (!rabbitmqStatus.isConnected || !rabbitmqStatus.connection) {
        logger('RabbitMQ connection failed, retrying in 10 seconds...');
        setTimeout(start, 10000);
        return;
    }

    rabbitmqStatus.connection.on('close', () => {
        logger('RabbitMQ connection closed, restarting in 10 seconds...');
        setTimeout(start, 10000);
    });

    rabbitmqStatus.connection.on('error', (error) => {
        console.error('Error occurred in RabbitMQ connection:', error);
    });

    if (workers.all || workers.express) await expressStart();
    if (workers.all || workers.mail) await mailStart();
    if (workers.all || workers.assetStorage) await assetStorageStart();
    logger('Worker started');
};

start().catch((error) => {
    logger('Worker failed to start');
    captureException(error);
    process.exit(1);
});
