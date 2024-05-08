import debug from 'debug';
import fs from 'fs/promises';
import { join } from 'path';

import {
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
    RSS_CURATE_STACK,
} from '../../../../constants';
import { exists, upload } from '../../../../services/aws';

const logger = debug('workers:rss:checkExistsFile');

const data = `
<rss>
<channel>
    <title>VITRUVEO - RSS CURATE STACK</title>
    <link>https://vitruveo.xyz/</link>
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
        logger('hasFile', hasFile);

        if (!hasFile) {
            // create file
            await fs.mkdir(ASSET_TEMP_DIR, { recursive: true });
            await fs.writeFile(fileName, data);
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
