export interface CreatorsAssetsEnvelope {
    key: string;
    creatorId: string;
}

export interface UploadProvider {
    upload(params: CreatorsAssetsEnvelope): Promise<string>;
}
