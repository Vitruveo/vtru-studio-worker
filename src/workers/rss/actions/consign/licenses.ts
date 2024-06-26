/* eslint-disable no-underscore-dangle */
import debug from 'debug';
import { join } from 'path';
import fs from 'fs/promises';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';

import { download, upload } from '../../../../services/aws';
import {
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    RSS_AMOUNT_ITEMS,
} from '../../../../constants';
import {
    AddItemParams,
    Item,
    PayloadConsign,
    RenderDescription,
} from './types';
import { checkExistsFile } from './check';
import { isVideo } from '../utils/isVideo';

const logger = debug('workers:rss:consign');

const renderDescription = ({
    url,
    image,
    creator,
    title,
    description,
}: RenderDescription) => `
<p>Title: <strong>${title}</strong></p>
<p>Creator: <strong>${creator}</strong></p>
<br />
<p>${description}</p>
<div>
    ${
        isVideo(image)
            ? `<video controls style="width: 100%;"><source src="${image}" type="video/mp4"></video>`
            : `<img src="${image}" style="width: 100%;" />`
    }
</div>
<div style="width: 100%; text-align: center;">
<a href="${url}">View on Store</a>
</div>
`;

const addItemConsign = ({ raw, item }: AddItemParams) => {
    let response = raw.rss.channel.item;

    const newItem: Item = {
        title: item.title,
        link: item.url,
        description: {
            __cdata: renderDescription(item),
        },
        pubDate: new Date().toISOString(),
        guid: item.id,
    };

    // check if item not exists
    if (!response) {
        response = newItem;

        return response;
    }

    // check if item is not array
    if (!Array.isArray(response)) {
        response = [response];
        response.push(newItem);
    }

    // check if item is array
    if (Array.isArray(response)) {
        if (response.length >= RSS_AMOUNT_ITEMS) {
            for (let i = RSS_AMOUNT_ITEMS; i <= response.length; i += 1) {
                // remove first item
                response.shift();
            }
        }

        response.push(newItem);

        return response
            .map((cur) => {
                if (!cur.description?.__cdata) {
                    return {
                        ...cur,
                        description: {
                            __cdata:
                                typeof cur.description === 'string'
                                    ? cur.description
                                    : '',
                        },
                    };
                }
                return cur;
            })
            .reduce<Item[]>((acc, cur) => {
                // remove duplicate id
                if (acc.some((i) => i.guid === cur.guid)) return acc;
                return [...acc, cur];
            }, []);
    }

    return response;
};

export const handleConsignLicenses = async ({
    license,
    creator,
    title,
    url,
    image,
    description,
    id,
}: PayloadConsign) => {
    const fileName = join(ASSET_TEMP_DIR, license);
    try {
        await checkExistsFile({
            name: license,
            title: license.replace('.xml', ''),
        });

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
        const item = addItemConsign({
            raw: parsedData,
            item: { creator, title, url, license, image, description, id },
        });

        parsedData.rss.channel.item = item;
        parsedData.rss.channel.title = `VITRUVEO - RSS ${license
            .replace('.xml', '')
            .toUpperCase()}`;
        logger('Success add item');

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
};
