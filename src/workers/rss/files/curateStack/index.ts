import fs from 'fs/promises';
import debug from 'debug';
import { join } from 'path';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

import {
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    RSS_CURATE_STACK,
    RSS_AMOUNT_ITEMS,
} from '../../../../constants';
import {
    AddItemCurateStackParams,
    PayloadCurateStack,
    RenderDescription,
} from './types';
import { download, upload } from '../../../../services/aws';
import { captureException } from '../../../../services/sentry';
import { checkExistsFile } from './check';
import { convertDescription } from '../utils/convertDescription';

const logger = debug('workers:rss:curateStack');

const renderDescription = ({
    title,
    sound,
    assets,
    url,
}: RenderDescription) => `
<p>Title: <strong>${title}</strong></p>
<p>Sound: <strong>${sound}</strong></p>
<div><video controls><source src="${url}" type="video/mp4"></video></div>
<table>
    <thead>
        <tr>
            <th style="magin-right: 10px;">Title</th>
            <th style="magin-right: 10px;">Description</th>
            <th style="magin-right: 10px;">Artist</th>
            <th style="magin-right: 10px;">Link</th>
        </tr>
    </thead>
    <tbody>
        ${assets
            .map(
                (asset) => `
                    <tr>
                        <td style="magin-right: 10px;"><p>${
                            asset.title
                        }</p></td>
                        <td style="magin-right: 10px;"><p>${convertDescription(
                            asset.description
                        )}</p></td>
                        <td style="magin-right: 10px;"><p>${
                            asset.artist
                        }</p></td>
                        <td style="magin-right: 10px;"><a href="${
                            asset.url
                        }" target="_blank">View on Store</a></td>
                    </tr>
                `
            )
            .join('')}
    </tbody>
</table>
`;

const addItemCurateStack = ({ raw, item }: AddItemCurateStackParams) => {
    let response = raw.rss.channel.item;

    // check if item not exists
    if (!response) {
        response = {
            title: item.title,
            link: item.url,
            description: renderDescription(item),
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
            description: renderDescription(item),
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
            description: renderDescription(item),
            pubDate: new Date().toISOString(),
        });
        return response;
    }

    return response;
};

export const handleCurateStack = async ({
    assets,
    sound,
    title,
    url,
}: PayloadCurateStack) => {
    const fileName = join(ASSET_TEMP_DIR, RSS_CURATE_STACK);
    try {
        await checkExistsFile();

        // download
        await download({
            fileName: RSS_CURATE_STACK,
            key: RSS_CURATE_STACK,
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

        const response = addItemCurateStack({
            raw: parsedData,
            item: { assets, sound, title, url },
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
            key: RSS_CURATE_STACK,
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
