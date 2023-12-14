export interface AssetEnvelope {
    key: string;
    creatorId: string;
    transactionId: string;
}

export interface AssetStorageProvider {
    createAssetStorage(params: AssetEnvelope): Promise<string>;
}
