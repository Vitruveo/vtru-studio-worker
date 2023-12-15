export interface SendToExchangeCreatorsParams {
    envelope: string;
    routingKey?: string;
}

export interface AssetEnvelope {
    path: string;
    creatorId: string;
    transactionId: string;
}

export interface GeneratePreSignedURLParams {
    envelope: AssetEnvelope;
}

export interface AssetStorageProvider {
    createUrlForUpload(params: AssetEnvelope): Promise<string>;
}
