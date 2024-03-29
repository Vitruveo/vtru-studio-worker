export interface SendToExchangeCreatorsParams {
    envelope: string;
    routingKey?: string;
}

export interface AssetEnvelope {
    path: string;
    metadata: { [key: string]: string };
    deleteKeys?: string[];
    method: 'PUT' | 'DELETE';
    origin: 'asset' | 'profile';
    creatorId: string;
    transactionId: string;
}

export interface GeneratePreSignedURLParams {
    envelope: AssetEnvelope;
}

export interface DeleteFilesParams {
    objectKeys: string[];
}

export interface AssetStorageProvider {
    createUrl(params: AssetEnvelope): Promise<string>;
}
