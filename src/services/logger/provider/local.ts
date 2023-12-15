import debug from 'debug';
import { NODE_ENV } from '../../../constants';
import type { Logger, LoggerEvent, LoggerPrepareParams } from '../types';

const logger = debug('services:logger:local');

export class Local implements Logger {
    private namespace: string | null = null;

    public async prepare({ namespace }: LoggerPrepareParams): Promise<void> {
        this.namespace = namespace;
    }

    public async log({
        logLevel,
        message,
        timestamp,
        transactionId,
    }: LoggerEvent): Promise<void> {
        logger('Local logging: %O', {
            env: NODE_ENV,
            namespace: this.namespace,
            logLevel,
            message,
            timestamp,
            transactionId,
        });
    }
}
