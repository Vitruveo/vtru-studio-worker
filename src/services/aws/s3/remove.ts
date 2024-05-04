import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

import type { RemoveOptions } from './types';
import { AWS_DEFAULT_REGION } from '../../../constants';

export const remove = async ({ key, bucket }: RemoveOptions) => {
    const s3 = new S3Client({
        region: AWS_DEFAULT_REGION,
    });

    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
};
