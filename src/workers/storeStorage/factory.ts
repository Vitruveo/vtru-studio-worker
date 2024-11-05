import { S3 } from './provider';
import { STORE_STORAGE_PROVIDER } from '../../constants';

export const createStoreStorageProvider = () => {
    if (STORE_STORAGE_PROVIDER === 'S3') {
        return new S3();
    }
    throw new Error('Invalid asset storage provider');
};
