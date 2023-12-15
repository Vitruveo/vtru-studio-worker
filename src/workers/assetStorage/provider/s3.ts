import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AssetEnvelope, AssetStorageProvider } from '../types';
import {
    ASSET_STORAGE_NAME,
    AWS_DEFAULT_REGION,
    AWS_PRESIGNING_EXPIRES_IN,
} from '../../../constants';
import { logger } from '../../../services';

interface PreSignedUrlParams {
    path: string;
}

export class S3 implements AssetStorageProvider {
    private loggerProvider: logger.Logger;

    constructor() {
        this.loggerProvider = logger.createLogger();
        this.loggerProvider.prepare({ namespace: 'assetStorage' });
    }

    createPreSignedUrlWithClient({ path }: PreSignedUrlParams) {
        const client = new S3Client({
            region: AWS_DEFAULT_REGION,
        });
        const command = new PutObjectCommand({
            Bucket: ASSET_STORAGE_NAME,
            Key: path,
        });
        return getSignedUrl(client, command, {
            expiresIn: AWS_PRESIGNING_EXPIRES_IN,
        });
    }

    async createUrlForUpload(envelope: AssetEnvelope): Promise<string> {
        const url = await this.createPreSignedUrlWithClient({
            path: envelope.path,
        });
        this.loggerProvider.log({
            message: JSON.stringify({
                ...envelope,
                url,
            }),
            logLevel: 'info',
        });
        return url;
    }
}
