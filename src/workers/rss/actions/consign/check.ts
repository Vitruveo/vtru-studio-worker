import debug from 'debug';
import fs from 'fs/promises';
import { join } from 'path';

import { ASSET_TEMP_DIR, GENERAL_STORAGE_NAME } from '../../../../constants';
import { exists, upload } from '../../../../services/aws';
import { CheckExistsFileParams } from './types';

const logger = debug('workers:rss:consign:checkExistsFile');

const data = ({ title }: { title: string }) => `
<rss>
<channel>
    <title>VITRUVEO - RSS ${title}</title>
    <link>https://vitruveo.xyz/</link>
    <description>VITRUVEO is a platform for creators to share their work with the world.</description>
    <language>en</language>
</channel>
</rss>`;

export const checkExistsFile = async ({
    name,
    title,
}: CheckExistsFileParams) => {
    const fileName = join(ASSET_TEMP_DIR, name);

    try {
        // check exists
        const hasFile = await exists({
            key: name,
            bucket: GENERAL_STORAGE_NAME,
        });
        logger(`has file ${name}: `, hasFile);

        if (!hasFile) {
            // create file
            await fs.mkdir(ASSET_TEMP_DIR, { recursive: true });
            await fs.writeFile(fileName, data({ title }));
            logger(`File created ${name}`);

            // upload file
            await upload({
                fileName,
                bucket: GENERAL_STORAGE_NAME,
                key: name,
            });
            logger(`File uploaded ${name}`);
        }
    } catch (error) {
        logger(`Error on check file ${name}`, error);
    } finally {
        // remove file
        fs.unlink(fileName).catch(() => {});
    }
};
