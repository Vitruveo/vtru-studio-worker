export interface SendToExchangeCreatorsParams {
    envelope: string;
    routingKey?: string;
}

export interface StoreEnvelope {
    path: string;
    metadata: { [key: string]: string };
    method: 'PUT';
    origin: 'stores';
    creatorId: string;
    transactionId: string;
}

export interface GeneratePreSignedURLParams {
    envelope: StoreEnvelope;
}

export interface DeleteFilesParams {
    objectKeys: string[];
}

export interface StoreStorageProvider {
    createUrl(params: StoreEnvelope): Promise<string>;
}
