import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

import type { ExistsOptions } from './types';
import { AWS_DEFAULT_REGION } from '../../../constants';

export const exists = async ({ key, bucket }: ExistsOptions) => {
    const s3 = new S3Client({
        region: AWS_DEFAULT_REGION,
    });
    try {
        await s3.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
        return true;
    } catch (error) {
        return false;
    }
};
