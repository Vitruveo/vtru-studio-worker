import debug from 'debug';
import { nanoid } from 'nanoid';
import fs, { promises } from 'fs';
import { dirname, join } from 'path';
import axios, { AxiosError } from 'axios';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';

import {
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    GENERAL_STORAGE_URL,
    RABBITMQ_EXCHANGE_GRID,
} from '../../constants';
import { queue } from '../../services';
import { GridEnvelope } from './types';
import { upload } from '../../services/aws';
import { sendToExchangeCreators } from '../../services/creators';
import { createBlankImage } from './blankImage';

const logger = debug('workers:grid');

const uniqueId = nanoid();
const width = 800;
const height = 800;
const gap = 20;

async function fetchImage(url: string) {
    try {
        const response = await axios({ url, responseType: 'arraybuffer' });

        const buffer = await sharp(response.data).png().toBuffer();

        return loadImage(buffer);
    } catch (error) {
        if (error instanceof AxiosError) {
            logger(
                'Error fetching image',
                error.response?.status,
                error.response?.data
            );
        }
        if (error instanceof Error) {
            logger('Error fetching image', error.message);
        }
        // load a blank image
        return loadImage(createBlankImage());
    }
}

// TODO: create dead letter for queue.
export const start = async () => {
    const channel = await queue.getChannel();

    if (!channel) {
        logger('Channel not available');
        process.exit(1);
    }
    channel.on('close', () => {
        logger('Channel closed');
        process.exit(1);
    });
    channel.on('error', (error) => {
        logger('Error occurred in channel:', error);
        process.exit(1);
    });

    logger('Channel worker grid started');

    const logQueue = `${RABBITMQ_EXCHANGE_GRID}.toSend.${uniqueId}`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_GRID, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_GRID, 'toSend');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            const { size, pathName, assets, creatorId } = JSON.parse(
                data.content.toString().trim()
            ) as GridEnvelope;

            logger('Received message', { size, pathName, assets });

            const endFileName = join(ASSET_TEMP_DIR, pathName);
            await promises.mkdir(dirname(endFileName), { recursive: true });

            const tileWidth = (width - (size - 1) * gap) / size;
            const tileHeight = (height - (size - 1) * gap) / size;

            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            logger('Loading images');
            const images = await Promise.all(assets.map(fetchImage));
            logger('Images loaded');

            images.filter(Boolean).forEach((image, index) => {
                const x = (index % size) * (tileWidth + gap);
                const y = Math.floor(index / size) * (tileHeight + gap);
                ctx.drawImage(image!, x, y, tileWidth, tileHeight);
            });

            await new Promise((resolve, reject) => {
                const out = fs.createWriteStream(endFileName);
                const stream = canvas.createPNGStream();

                stream.pipe(out);

                out.on('error', (error) => {
                    reject(error);
                });

                out.on('finish', () => {
                    resolve(true);
                });
            });
            logger(`The PNG file was created at ${pathName}`);

            // upload to S3
            await upload({
                bucket: GENERAL_STORAGE_NAME,
                key: pathName,
                fileName: endFileName,
            });
            logger('Uploaded grid');

            logger(`${GENERAL_STORAGE_URL}/${pathName}`);

            // apagar o grid
            logger('Deleting grid');
            promises
                .unlink(endFileName)
                .catch((error) => logger('Error deleting grid', error));

            logger('Deleted grid');

            await sendToExchangeCreators(
                JSON.stringify({
                    path: pathName,
                    url: `${GENERAL_STORAGE_URL}/${pathName}`,
                    creatorId,
                }),
                'userNotification'
            );
        } catch (error) {
            logger('Error processing message', error);
        } finally {
            channel.ack(data);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);

        // disconnect from RabbitMQ
        await queue.disconnect();
    });
};
