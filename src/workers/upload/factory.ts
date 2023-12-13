import { S3 } from './provider';
import { UPLOAD_PROVIDER } from '../../constants';

export const createUploadProvider = () => {
    if (UPLOAD_PROVIDER === 'S3') {
        return new S3();
    }

    throw new Error('Invalid upload provider');
};
