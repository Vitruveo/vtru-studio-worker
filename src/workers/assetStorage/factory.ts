import { S3 } from './provider';
import { ASSET_STORAGE_PROVIDER } from '../../constants';

export const createAssetStorageProvider = () => {
    if (ASSET_STORAGE_PROVIDER === 'S3') {
        return new S3();
    }
    throw new Error('Invalid asset storage provider');
};
