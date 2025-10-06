import debug from 'debug';
import fs from 'fs/promises';
import { join } from 'path';

import {
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    RSS_CURATE_STACK,
    REDIRECTS_JSON,
} from '../../../../constants';
import { exists, upload } from '../../../../services/aws';

const logger = debug('workers:rss:checkExistsFile');

const data = (url: string) => `
<rss>
<channel>
    <title>VITRUVEO - RSS CURATE STACK</title>
    <link>${url}</link>
    <description>VITRUVEO is a platform for creators to share their work with the world.</description>
    <language>en</language>
</channel>
</rss>`;

export const checkExistsFile = async () => {
    const fileName = join(ASSET_TEMP_DIR, RSS_CURATE_STACK);

    try {
        // check exists
        const hasFile = await exists({
            key: RSS_CURATE_STACK,
            bucket: GENERAL_STORAGE_NAME,
        });
        const redirectsRaw = await fetch(REDIRECTS_JSON);
        const redirects = await redirectsRaw.json();
        const url = redirects.common.vitruveo.base_url;
        logger('vitruveo base url: ', url);
        logger('hasFile', hasFile);

        if (!hasFile) {
            // create file
            await fs.mkdir(ASSET_TEMP_DIR, { recursive: true });
            await fs.writeFile(fileName, data(url));
            logger('File created');

            // upload file
            await upload({
                fileName,
                bucket: GENERAL_STORAGE_NAME,
                key: RSS_CURATE_STACK,
            });
            logger('File uploaded');
        }
    } catch (error) {
        logger('Error startFile', error);
    } finally {
        // remove file
        try {
            await fs.unlink(fileName);
        } catch (error) {
            // nothing
        }
    }
};
