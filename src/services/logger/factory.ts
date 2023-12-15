import type { Logger } from './types';
import { CloudWatch, Local } from './provider';
import { LOGGER_PROVIDER } from '../../constants';

export const createLogger = (): Logger => {
    if (LOGGER_PROVIDER === 'cloudwatch') {
        return new CloudWatch();
    }
    return new Local();
};
