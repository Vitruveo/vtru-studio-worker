import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { join, parse } from 'path';
import fs from 'fs/promises';

import type { DownloadOptions } from './types';
import { ASSET_TEMP_DIR, AWS_DEFAULT_REGION } from '../../../constants';

export const download = async ({ fileName, key, bucket }: DownloadOptions) => {
    const s3 = new S3Client({
        region: AWS_DEFAULT_REGION,
    });
    const data = await s3.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
    const endFileName = join(ASSET_TEMP_DIR, fileName);
    const parsedFileName = parse(endFileName);
    await fs.mkdir(parsedFileName.dir, { recursive: true });
    await fs.writeFile(
        join(ASSET_TEMP_DIR, fileName),
        data.Body as unknown as string
    );

    return data.Metadata;
};
