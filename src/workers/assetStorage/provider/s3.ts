import debug from 'debug';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { AssetEnvelope, AssetStorageProvider } from '../types';
import {
    ASSET_BUCKET_NAME,
    AWS_ACCESS_KEY_ID,
    AWS_DEFAULT_REGION,
    AWS_PRESIGNING_EXPIRES_IN,
    AWS_SECRET_ACCESS_KEY,
} from '../../../constants';

const logger = debug('workers:asset:storage:provider:s3');

interface PreSignedUrlParams {
    key: string;
}

export class S3 implements AssetStorageProvider {
    createPreSignedUrlWithClient({ key }: PreSignedUrlParams) {
        const client = new S3Client({
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
            region: AWS_DEFAULT_REGION,
        });
        const command = new PutObjectCommand({
            Bucket: ASSET_BUCKET_NAME,
            Key: key,
        });
        return getSignedUrl(client, command, {
            expiresIn: AWS_PRESIGNING_EXPIRES_IN,
        });
    }

    async createAssetStorage(envelope: AssetEnvelope): Promise<string> {
        logger('Upload using s3: %O', envelope);

        return 'https://aws-s3-url';

        // const clienUrl = await this.createPreSignedUrlWithClient({
        //     key: envelope.key,
        // });
        // return clienUrl;
    }
}
