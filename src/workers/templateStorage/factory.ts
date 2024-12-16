import { S3 } from './provider';
import { ARTCARDS_TEMPLATE_STORAGE_PROVIDER } from '../../constants';

export const createTemplateStorageProvider = () => {
    if (ARTCARDS_TEMPLATE_STORAGE_PROVIDER === 'S3') {
        return new S3();
    }
    throw new Error('Invalid template storage provider');
};
