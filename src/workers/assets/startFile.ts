import { join } from 'path';
import fs from 'fs/promises';
import debug from 'debug';

import {
    ASSET_TEMP_DIR,
    SITEMAP_NAME,
    STORE_BUCKET_NAME,
} from '../../constants';
import { exists, upload } from '../../services/aws';

const logger = debug('workers:sitemap:checkExistsSitemapFile');

const data = `
<urlset>
    
</urlset>
`;

export const checkExistsSitemapFile = async () => {
    const fileName = join(ASSET_TEMP_DIR, SITEMAP_NAME);

    try {
        // check exists
        const hasFile = await exists({
            key: SITEMAP_NAME,
            bucket: STORE_BUCKET_NAME,
        });
        logger('hasFile sitemap', hasFile);

        if (!hasFile) {
            // create file
            await fs.mkdir(ASSET_TEMP_DIR, { recursive: true });
            await fs.writeFile(fileName, data);
            logger('File sitemap created');

            // upload file
            await upload({
                fileName,
                bucket: STORE_BUCKET_NAME,
                key: SITEMAP_NAME,
            });
            logger('File sitemap uploaded');
        }
    } catch (error) {
        logger('Error start file sitemap', error);
    } finally {
        // remove file
        fs.unlink(fileName).catch(() => {
            // nothing
        });
    }
};
