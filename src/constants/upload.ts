export const ASSET_STORAGE_PROVIDER =
    process.env.ASSET_STORAGE_PROVIDER || 'S3';

export const STORE_STORAGE_PROVIDER =
    process.env.STORE_STORAGE_PROVIDER || 'S3';

export const ARTCARDS_TEMPLATE_STORAGE_PROVIDER =
    process.env.TEMPLATE_STORAGE_PROVIDER || 'S3';

export const ASSET_STORAGE_NAME = process.env.ASSET_STORAGE_NAME || '';
export const ASSET_STORAGE_URL = process.env.ASSET_STORAGE_URL || '';

export const GENERAL_STORAGE_NAME = process.env.GENERAL_STORAGE_NAME || '';
export const GENERAL_STORAGE_URL = process.env.GENERAL_STORAGE_URL || '';

export const STORE_STORAGE_URL =
    process.env.STORE_STORAGE_URL ||
    'https://vitruveo-studio-dev-stores.s3.amazonaws.com';

export const STORE_STORAGE_NAME =
    process.env.STORE_STORAGE_NAME || 'vitruveo-studio-dev-stores';

export const ARTCARDS_TEMPLATE_STORAGE_NAME =
    process.env.ARTCARDS_TEMPLATE_STORAGE_NAME || 'vitruveo-artcards-templates';

export const PRINT_OUTPUTS_STORAGE_URL =
    process.env.PRINT_OUTPUTS_STORAGE_URL ||
    'https://vitruveo-studio-dev-print-outputs.s3.amazonaws.com';

export const PRINT_OUTPUTS_STORAGE_NAME =
    process.env.PRINT_OUTPUTS_STORAGE_NAME ||
    'vitruveo-studio-qa-print-outputs';
