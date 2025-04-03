export interface ExistsOptions {
    key: string;
    bucket: string;
}

export interface DownloadOptions {
    fileName: string;
    key: string;
    bucket: string;
}

export interface UploadOptions {
    fileName: string;
    key: string;
    bucket: string;
}

export interface UploadBufferOptions {
    buffer: Buffer;
    key: string;
    bucket: string;
}

export interface RemoveOptions {
    key: string;
    bucket: string;
}
