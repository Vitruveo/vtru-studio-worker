import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StoreEnvelope, StoreStorageProvider } from '../types';
import {
    AWS_DEFAULT_REGION,
    AWS_PRESIGNING_EXPIRES_IN,
    STORE_STORAGE_NAME,
} from '../../../constants';
import { logger } from '../../../services';

interface PreSignedUrlParams {
    path: string;
    metadata: { [key: string]: string };
    method: 'PUT';
    origin: 'stores';
}

export class S3 implements StoreStorageProvider {
    private loggerProvider: logger.Logger;

    constructor() {
        this.loggerProvider = logger.createLogger();
        this.loggerProvider.prepare({ namespace: 'storeStorage' });
    }

    createPreSignedUrlWithClient(params: PreSignedUrlParams) {
        const client = new S3Client({
            region: AWS_DEFAULT_REGION,
        });

        const bucket = {
            Bucket: STORE_STORAGE_NAME,
            Key: params.path,
            Metadata: params.metadata,
        };

        const command = new PutObjectCommand(bucket);

        return getSignedUrl(client, command, {
            expiresIn: AWS_PRESIGNING_EXPIRES_IN,
        });
    }

    async createUrl(envelope: StoreEnvelope): Promise<string> {
        const url = await this.createPreSignedUrlWithClient({
            path: envelope.path,
            origin: envelope.origin,
            method: envelope.method,
            metadata: envelope.metadata,
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
