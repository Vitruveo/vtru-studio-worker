/* eslint-disable no-underscore-dangle */
import debug from 'debug';
import { join } from 'path';
import fs from 'fs/promises';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

import {
    ASSET_STORAGE_URL,
    ASSET_TEMP_DIR,
    RABBITMQ_EXCHANGE_ASSETS,
    SITEMAP_NAME,
} from '../../constants';
import { sentry, queue } from '../../services';
import type { AddUrlParams, Asset, RemoveUrlParams } from './types';
import { download, upload } from '../../services/aws';
import { STORE_BUCKET_NAME } from '../../constants/store';

const logger = debug('workers:assets');

const addUrl = ({ raw, item }: AddUrlParams) => {
    let response = raw.urlset.url;

    // check if item not exists
    if (!response) {
        response = {
            loc: `${ASSET_STORAGE_URL}/${item.formats.original.path}`,
            id: item._id.toString(),
            lastmod: new Date().toISOString(),
            changefreq: 'daily',
            priority: '0.8',
        };

        return response;
    }

    // check if item is not array
    if (!Array.isArray(response)) {
        response = [response];
        response.push({
            loc: `${ASSET_STORAGE_URL}/${item.formats.original.path}`,
            id: item._id.toString(),
            lastmod: new Date().toISOString(),
            changefreq: 'daily',
            priority: '0.8',
        });
        return response;
    }

    // check if item is array
    if (Array.isArray(response)) {
        response.push({
            loc: `${ASSET_STORAGE_URL}/${item.formats.original.path}`,
            id: item._id.toString(),
            lastmod: new Date().toISOString(),
            changefreq: 'daily',
            priority: '0.8',
        });
        return response;
    }

    return response;
};

const removeUrl = ({ raw, item }: RemoveUrlParams) => {
    const response = raw.urlset.url;

    if (!response) {
        return null;
    }

    if (!Array.isArray(response)) {
        if (response.id === item) {
            return null;
        }
        return response;
    }

    if (Array.isArray(response)) {
        return response.filter((url) => url.id !== item);
    }

    return response;
};

const executeInsert = async (data: Asset) => {
    // TODO: Implement this function
};
const executeReplace = async (data: Asset) => {
    const fileName = join(ASSET_TEMP_DIR, SITEMAP_NAME);
    try {
        if (!data?.formats?.original?.path) {
            logger('Original path not found');
            return;
        }

        // download
        await download({
            fileName: SITEMAP_NAME,
            key: SITEMAP_NAME,
            bucket: STORE_BUCKET_NAME,
        });

        // read file
        const content = await fs.readFile(fileName);

        // check valid xml
        const validator = XMLValidator.validate(content.toString());
        logger('validator', validator);

        // parse file xml to json
        const parser = new XMLParser();
        const parsedData = parser.parse(content.toString());
        console.log('parsedData', parsedData);

        const url = addUrl({ raw: parsedData, item: data });

        console.log('url', url);

        if (typeof parsedData.urlset === 'string') {
            parsedData.urlset = { url };
        } else {
            parsedData.urlset.url = url;
        }
        logger('added url');

        // parse file json to xml
        const builder = new XMLBuilder();
        const xmlContent = builder.build(parsedData);
        logger('parsed data to XML success');

        // write file
        await fs.writeFile(fileName, xmlContent);

        // upload file
        await upload({
            bucket: STORE_BUCKET_NAME,
            fileName,
            key: SITEMAP_NAME,
        });
        logger('File sitemap replaced ');
    } catch (error) {
        logger('Error replace file sitemap', error);
    } finally {
        // remove file
        fs.unlink(fileName).catch(() => {
            // nothing
        });
    }
};
const executeDelete = async (data: Asset['_id']) => {
    const fileName = join(ASSET_TEMP_DIR, SITEMAP_NAME);
    try {
        if (!data) {
            logger('Asset not found');
            return;
        }

        // download
        await download({
            fileName: SITEMAP_NAME,
            key: SITEMAP_NAME,
            bucket: STORE_BUCKET_NAME,
        });

        // read file
        const content = await fs.readFile(fileName);

        // check valid xml
        const validator = XMLValidator.validate(content.toString());
        logger('validator', validator);

        // parse file xml to json
        const parser = new XMLParser();
        const parsedData = parser.parse(content.toString());
        console.log('parsedData', parsedData);

        if (typeof parsedData.urlset === 'string') {
            logger('parsedData.urlset not elements');
            return;
        }

        const url = removeUrl({ raw: parsedData, item: data });

        console.log('url', url);

        parsedData.urlset.url = url;
        logger('added url');

        // parse file json to xml
        const builder = new XMLBuilder();
        const xmlContent = builder.build(parsedData);
        logger('parsed data to XML success');

        // write file
        await fs.writeFile(fileName, xmlContent);

        // upload file
        await upload({
            bucket: STORE_BUCKET_NAME,
            fileName,
            key: SITEMAP_NAME,
        });
        logger('File sitemap replaced ');
    } catch (error) {
        logger('Error replace file sitemap', error);
    } finally {
        // remove file
        fs.unlink(fileName).catch(() => {
            // nothing
        });
    }
};

// TODO: create dead letter for queue.
export const start = async () => {
    logger('Starting worker assets');
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

    logger('Channel worker assets started');

    const logQueue = `${RABBITMQ_EXCHANGE_ASSETS}.create`;
    logger('logQueue', logQueue);
    channel.assertExchange(RABBITMQ_EXCHANGE_ASSETS, 'topic', {
        durable: true,
    });
    channel.assertQueue(logQueue, { durable: false });
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_ASSETS, 'create');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_ASSETS, 'replace');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_ASSETS, 'insert');
    channel.bindQueue(logQueue, RABBITMQ_EXCHANGE_ASSETS, 'delete');
    channel.consume(logQueue, async (data) => {
        if (!data) return;
        try {
            // parse envelope
            const parsedMessage = JSON.parse(data.content.toString().trim());

            if (data.fields.routingKey === 'insert') {
                await executeInsert(parsedMessage);
            }

            if (data.fields.routingKey === 'replace') {
                await executeReplace(parsedMessage);
            }

            if (data.fields.routingKey === 'delete') {
                await executeDelete(parsedMessage);
            }

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
