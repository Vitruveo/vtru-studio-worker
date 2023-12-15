export interface AssetEnvelope {
    path: string;
    creatorId: string;
    transactionId: string;
}

export interface AssetStorageProvider {
    createUrlForUpload(params: AssetEnvelope): Promise<string>;
}
