import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import debug from 'debug';

import type { UploadOptions } from './types';
import { AWS_DEFAULT_REGION } from '../../../constants';

const logger = debug('services:aws:s3:upload');

export const upload = async ({ fileName, key, bucket }: UploadOptions) => {
    const s3 = new S3Client({
        region: AWS_DEFAULT_REGION,
    });
    const body = await fs.readFile(fileName);
    await s3
        .send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
            })
        )
        .catch((error) => {
            logger('Error upload file', error);
        });
};
