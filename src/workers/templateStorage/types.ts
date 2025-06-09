import {
    GetObjectCommandOutput,
    PutObjectCommandOutput,
} from '@aws-sdk/client-s3';

export interface SendToExchangeCreatorsParams {
    envelope: string;
    routingKey?: string;
}

export interface TemplateEnvelope {
    path: string;
    metadata: { [key: string]: string };
    userId: string;
    transactionId: string;
    values: { [key: string]: string };
}

export interface GeneratePreSignedURLParams {
    envelope: TemplateEnvelope;
}

export interface DeleteFilesParams {
    objectKeys: string[];
}

export interface TemplateStorageProvider {
    createUrl(params: TemplateEnvelope): Promise<string>;
    getData(): Promise<GetObjectCommandOutput>;
    uploadData(data: string): Promise<PutObjectCommandOutput>;
}
