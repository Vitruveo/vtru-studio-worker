export interface FormatMedia {
    size?: number;
    name?: string;
    load?: boolean;
    file?: File | string;
    customFile?: File | string;
    transactionId?: string;
    successUpload?: boolean;
}

export type Definition = 'square' | 'landscape' | 'portrait';

export interface OriginalFormatMedia extends FormatMedia {
    definition?: Definition;
    load?: boolean;
    path?: string;
    width?: number;
    height?: number;
    size?: number;
    successUpload?: boolean;
}

export type FileType = File | string;

interface Format {
    size?: number;
    load?: boolean;
    path?: string;
    file?: FileType;
    name?: string;
    customFile?: FileType;
    transactionId?: string;
}

export interface SectionsFormData {}

export interface RequestAssetUpload {
    transactionId: string;
    url: string;
    path: string;
    status: string;
    uploadProgress: number;
}

export interface LicensesFormValues {
    nft: {
        version: string;
        added: boolean;
        license: string;
        elastic: {
            editionPrice: number;
            numberOfEditions: number;
            totalPrice: number;
            editionDiscount: boolean;
        };
        single: {
            editionPrice: number;
        };
        unlimited: {
            editionPrice: number;
        };
        editionOption: 'elastic' | 'single' | 'unlimited' | string;
    };
    stream: {
        version: string;
        added: boolean;
    };
    print: {
        version: string;
        added: boolean;
        unitPrice: number;
    };
    remix: {
        version: string;
        added: boolean;
        unitPrice: number;
    };
}

export type AssetStatus = 'draft' | 'published' | 'archived' | 'preview' | '';

export type ConsignArtworkAssetStatus =
    | 'draft'
    | 'preview'
    | 'active'
    | 'hidden'
    | 'blocked';

export interface AssetConsignArtwork {
    artworkListing?: string;
    creatorWallet?: string;
    creatorCredits?: number;
    creatorContract?: string;
    status: ConsignArtworkAssetStatus;
}

export interface ContractExplorer {
    finishedAt: Date | null;
    assetId: number;
    assetRefId: number;
    creatorRefId: number;
    explorer: string;
    tx: string;
}

export interface Ipfs {
    original: string;
    display: string;
    exhibition: string;
    preview: string;
    print: string;
    arImage: string;
    arVideo: string;
    btsImage: string;
    btsVideo: string;
    codeZip: string;
    finishedAt: Date;
}

export interface c2pa {
    finishedAt: Date;
}

export interface Asset {
    _id: string;
    mediaAuxiliary: {
        description: string;
        formats: {
            arImage: Format;
            arVideo: Format;
            btsImage: Format;
            btsVideo: Format;
            codeZip: Format;
        };
    };
    formats: {
        original: OriginalFormatMedia;
        display: Format;
        exhibition: Format;
        preview: Format;
        print: Format;
    };
    isOriginal: boolean;
    generatedArtworkAI: boolean;
    notMintedOtherBlockchain: boolean;
    contract: boolean;
    assetMetadata?: {
        isCompleted?: boolean;
    } & SectionsFormData;
    requestAssetUpload: { [key: string]: RequestAssetUpload };
    // creatorMetadata: {
    //     creatorMetadataDefinitions: MetadataDefinitionTypes[];
    // };
    licenses?: LicensesFormValues;
    status: AssetStatus;
    framework: {
        createdAt: Date | null;
        updatedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    };
    consignArtwork?: AssetConsignArtwork;
    c2pa?: c2pa;
    contractExplorer?: ContractExplorer;
    ipfs?: Ipfs;
}

export interface Url {
    loc: string;
    lastmod: string;
    id: string;
    changefreq: string;
    priority: string;
}

export interface URLSet {
    urlset: {
        url: Url | Url[];
    };
}
export interface AddUrlParams {
    raw: URLSet;
    item: Asset;
}
export interface RemoveUrlParams {
    raw: URLSet;
    item: string;
}
