import debug from 'debug';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { CreatorsAssetsEnvelope, UploadProvider } from '../types';
import {
    AWS_ACCESS_KEY_ID,
    AWS_BUCKET_NAME,
    AWS_DEFAULT_REGION,
    AWS_PRESIGNING_EXPIRES_IN,
    AWS_SECRET_ACCESS_KEY,
} from '../../../constants';

const logger = debug('workers:upload:s3');

interface PresignedUrlParams {
    key: string;
}

export class S3 implements UploadProvider {
    createPresignedUrlWithClient({ key }: PresignedUrlParams) {
        const client = new S3Client({
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
            region: AWS_DEFAULT_REGION,
        });
        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: key,
        });
        return getSignedUrl(client, command, {
            expiresIn: AWS_PRESIGNING_EXPIRES_IN,
        });
    }

    async upload(envelope: CreatorsAssetsEnvelope): Promise<string> {
        logger('Upload using s3: %O', envelope);

        const clienUrl = await this.createPresignedUrlWithClient({
            key: envelope.key,
        });
        return clienUrl;
    }
}
