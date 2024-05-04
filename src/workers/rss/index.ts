import debug from 'debug';
import fs from 'fs/promises';
import { join } from 'path';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

import {
    RABBITMQ_EXCHANGE_RSS,
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    RSS_NAME,
    RSS_AMOUNT_ITEMS,
} from '../../constants';
import { sentry, queue } from '../../services';
import { AddItemParams, Payload } from './types';
import { download, upload } from '../../services/aws';
import { captureException } from '../../services/sentry';

const logger = debug('workers:rss');

const addItem = ({ raw, item }: AddItemParams) => {
    let response = raw.rss.channel.item;

    // check if item not exists
    if (!response) {
        response = {
            title: item.title,
            link: item.url,
            description: `creator: ${item.creator}; sound: ${
                item.sound
            }; assets: ${item.assets.join(',')}`,
            pubDate: new Date().toISOString(),
        };

        return response;
    }

    // check if item is not array
    if (!Array.isArray(response)) {
        response = [response];
        response.push({
            title: item.title,
            link: item.url,
            description: `creator: ${item.creator}; sound: ${
                item.sound
            }; assets: ${item.assets.join(',')}`,
            pubDate: new Date().toISOString(),
        });
        return response;
    }

    // check if item is array
    if (Array.isArray(response)) {
        if (response.length >= RSS_AMOUNT_ITEMS) {
            for (let i = RSS_AMOUNT_ITEMS; i <= response.length; i += 1) {
                // remove first item
                response.shift();
            }
        }

        response.push({
            title: item.title,
            link: item.url,
            description: `creator: ${item.creator}; sound: ${
                item.sound
            }; assets: ${item.assets.join(',')}`,
            pubDate: new Date().toISOString(),
        });
        return response;
    }

    return response;
};

const execute = async ({ assets, creator, sound, title, url }: Payload) => {
    const fileName = join(ASSET_TEMP_DIR, RSS_NAME);
    try {
        // download
        await download({
            fileName: RSS_NAME,
            key: RSS_NAME,
            bucket: GENERAL_STORAGE_NAME,
        });

        // read file
        const data = await fs.readFile(fileName);

        // check valid xml
        const validator = XMLValidator.validate(data.toString());
        logger('validator', validator);

        // parse file xml to json
        const parser = new XMLParser();
        const parsedData = parser.parse(data.toString());
        logger('parsed data to JSON success');

        const response = addItem({
            raw: parsedData,
            item: { assets, creator, sound, title, url },
        });

        parsedData.rss.channel.item = response;
        logger('added item');

        // parse file json to xml
        const builder = new XMLBuilder();
        const xmlContent = builder.build(parsedData);
        logger('parsed data to XML success');

        // write file
        await fs.writeFile(fileName, xmlContent);

        // upload file
        await upload({
            bucket: GENERAL_STORAGE_NAME,
            fileName,
            key: RSS_NAME,
        });
        logger('File uploaded');
    } catch (error) {
        logger('Error execute', error);
        captureException(error, { tags: { scope: 'rss' } });
    } finally {
        try {
            // remove file
            await fs.unlink(fileName);
        } catch (error) {
            // nothing
        }
    }
};

// TODO: create dead letter for queue.
export const start = async () => {
    logger('Starting worker rss');
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

    logger('Channel worker rss started');

    const logQueue = `${RABBITMQ_EXCHANGE_RSS}.create`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_RSS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_RSS, 'create');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            // parse envelope
            const parsedMessage = JSON.parse(data.content.toString().trim());
            await execute(parsedMessage);

            channel.ack(data);
        } catch (parsingError) {
            sentry.captureException(parsingError);
            channel.nack(data);
        }
    });

    process.once('SIGINT', async () => {
        logger(`Deleting queue ${logQueue}`);
        await channel.deleteQueue(logQueue);

        // disconnect from RabbitMQ
        await queue.disconnect();
    });
};
