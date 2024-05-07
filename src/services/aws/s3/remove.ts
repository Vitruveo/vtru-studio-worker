import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import debug from 'debug';

import type { RemoveOptions } from './types';
import { AWS_DEFAULT_REGION } from '../../../constants';

const logger = debug('services:aws:s3:remove');

export const remove = async ({ key, bucket }: RemoveOptions) => {
    try {
        const s3 = new S3Client({
            region: AWS_DEFAULT_REGION,
        });

        await s3.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );

        logger('File removed successfully');
    } catch (error) {
        logger('Error remove file', error);
    }
};
