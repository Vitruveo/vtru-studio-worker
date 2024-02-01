import {
    PutObjectCommand,
    S3Client,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AssetEnvelope, AssetStorageProvider } from '../types';
import {
    ASSET_STORAGE_NAME,
    GENERAL_STORAGE_NAME,
    AWS_DEFAULT_REGION,
    AWS_PRESIGNING_EXPIRES_IN,
} from '../../../constants';
import { logger } from '../../../services';

interface PreSignedUrlParams {
    path: string;
    method: 'PUT' | 'DELETE';
    origin: 'asset' | 'profile';
}

export class S3 implements AssetStorageProvider {
    private loggerProvider: logger.Logger;

    constructor() {
        this.loggerProvider = logger.createLogger();
        this.loggerProvider.prepare({ namespace: 'assetStorage' });
    }

    createPreSignedUrlWithClient(params: PreSignedUrlParams) {
        const client = new S3Client({
            region: AWS_DEFAULT_REGION,
        });

        let command;
        const bucket = {
            Bucket:
                params.origin === 'asset'
                    ? ASSET_STORAGE_NAME
                    : GENERAL_STORAGE_NAME,
            Key: params.path,
        };

        if (params.method === 'PUT') {
            command = new PutObjectCommand(bucket);
        } else {
            command = new DeleteObjectCommand(bucket);
        }

        return getSignedUrl(client, command, {
            expiresIn: AWS_PRESIGNING_EXPIRES_IN,
        });
    }

    async createUrl(envelope: AssetEnvelope): Promise<string> {
        const url = await this.createPreSignedUrlWithClient({
            path: envelope.path,
            origin: envelope.origin,
            method: envelope.method,
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
