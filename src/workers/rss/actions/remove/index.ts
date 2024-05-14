/* eslint-disable no-await-in-loop */
import { join } from 'path';
import debug from 'debug';
import fs from 'fs/promises';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';

import { ASSET_TEMP_DIR, GENERAL_STORAGE_NAME } from '../../../../constants';
import { download, exists, upload } from '../../../../services/aws';
import { PayloadRemove, RemoveItemParams } from './types';

const logger = debug('workers:rss:remove');

const licenses = ['nft.xml', 'remix.xml', 'stream.xml', 'print.xml'];

const removeItem = ({ raw, item }: RemoveItemParams) => {
    const response = raw.rss.channel.item;

    if (!response) return undefined;

    if (!Array.isArray(response)) {
        if (response.guid === item.id) return undefined;
    }

    if (Array.isArray(response)) {
        return response.filter((i) => i.guid !== item.id);
    }

    return response;
};

export const handleRemove = async ({ id }: PayloadRemove) => {
    for (let i = 0; i < licenses.length; i += 1) {
        const license = licenses[i];

        const fileName = join(ASSET_TEMP_DIR, license);
        try {
            const fileExists = await exists({
                key: license,
                bucket: GENERAL_STORAGE_NAME,
            });

            if (!fileExists) {
                logger(`File ${license} not exists`);
                return;
            }

            // download
            await download({
                fileName: license,
                key: license,
                bucket: GENERAL_STORAGE_NAME,
            });
            logger(`Downloaded ${license}`);

            // read file
            const data = await fs.readFile(fileName);

            // check valid xml
            const validator = XMLValidator.validate(data.toString());
            logger('validator', validator);

            // parse file xml to json
            const parser = new XMLParser();
            const parsedData = parser.parse(data.toString());
            logger('parsed data to JSON success');

            // add item
            const item = removeItem({ raw: parsedData, item: { id } });

            parsedData.rss.channel.item = item;
            logger('Success remove item');

            // parse file json to xml
            const builder = new XMLBuilder({
                ignoreAttributes: false,
                cdataPropName: '__cdata',
                format: true,
            });
            const xmlContent = builder.build(parsedData);
            logger('parsed data to XML success');

            // write file
            await fs.writeFile(fileName, xmlContent);
            logger('Success write file');

            // upload
            await upload({
                fileName,
                key: license,
                bucket: GENERAL_STORAGE_NAME,
            });
            logger(`Success license ${license}`);
        } catch (error) {
            logger(`Error on license ${license}`, error);
        } finally {
            fs.unlink(fileName).catch(() => {});
        }
    }
};
