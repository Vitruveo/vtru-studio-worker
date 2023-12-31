export const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

export const AWS_PRESIGNING_EXPIRES_IN = process.env.AWS_PRESIGNING_EXPIRES_IN
    ? parseInt(process.env.AWS_PRESIGNING_EXPIRES_IN, 10)
    : 3600;
