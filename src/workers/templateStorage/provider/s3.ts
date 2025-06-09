import {
    GetObjectCommand,
    PutObjectCommand,
    PutObjectCommandInput,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { TemplateEnvelope, TemplateStorageProvider } from '../types';
import {
    AWS_DEFAULT_REGION,
    AWS_PRESIGNING_EXPIRES_IN,
    ARTCARDS_TEMPLATE_STORAGE_NAME,
} from '../../../constants';
import { logger } from '../../../services';

interface PreSignedUrlParams {
    path: string;
    metadata: { [key: string]: string };
}

export class S3 implements TemplateStorageProvider {
    private loggerProvider: logger.Logger;

    constructor() {
        this.loggerProvider = logger.createLogger();
        this.loggerProvider.prepare({ namespace: 'templateStorage' });
    }

    createPreSignedUrlWithClient(params: PreSignedUrlParams) {
        const client = new S3Client({
            region: AWS_DEFAULT_REGION,
        });

        const commands: PutObjectCommandInput = {
            Bucket: ARTCARDS_TEMPLATE_STORAGE_NAME,
            Key: params.path,
            ContentType: params.metadata['Content-Type'],
        };

        console.log('commands', commands);

        const command = new PutObjectCommand(commands);

        return getSignedUrl(client, command, {
            expiresIn: AWS_PRESIGNING_EXPIRES_IN,
        });
    }

    async createUrl(envelope: TemplateEnvelope): Promise<string> {
        const url = await this.createPreSignedUrlWithClient({
            path: envelope.path,
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

    async getData() {
        const client = new S3Client({
            region: AWS_DEFAULT_REGION,
        });

        const response = new GetObjectCommand({
            Bucket: ARTCARDS_TEMPLATE_STORAGE_NAME,
            Key: 'templates.json',
        });

        return client.send(response);
    }

    async uploadData(data: string) {
        const client = new S3Client({
            region: AWS_DEFAULT_REGION,
        });

        const response = new PutObjectCommand({
            Bucket: ARTCARDS_TEMPLATE_STORAGE_NAME,
            Key: 'templates.json',
            Body: data,
            ContentType: 'application/json',
        });

        return client.send(response);
    }
}
