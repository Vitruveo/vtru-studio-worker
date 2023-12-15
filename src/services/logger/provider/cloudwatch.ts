import debug from 'debug';
import {
    CloudWatchLogsClient,
    PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { AWS_DEFAULT_REGION, NODE_ENV } from '../../../constants';
import { captureException } from '../../sentry';
import type { Logger, LoggerPrepareParams, LoggerEvent } from '../types';

const logger = debug('services:logger:cloudwatch');

export class CloudWatch implements Logger {
    private logStreamName: string | null = null;

    private logGroupName: string | null = null;

    private client: CloudWatchLogsClient | null = null;

    public async prepare({ namespace }: LoggerPrepareParams): Promise<void> {
        this.logStreamName = namespace;
        this.logGroupName = `vitruveo.studio.${NODE_ENV}`;
        this.client = new CloudWatchLogsClient({
            region: AWS_DEFAULT_REGION,
        });
    }

    public async log({
        logLevel,
        message,
        timestamp,
        transactionId,
    }: LoggerEvent): Promise<void> {
        if (!this.client || !this.logGroupName || !this.logStreamName) {
            logger('Local logging: %O', {
                message,
                timestamp,
                transactionId,
            });
            return;
        }
        const envelope = {
            logGroupName: this.logGroupName,
            logStreamName: this.logStreamName,
            logEvents: [
                {
                    message: JSON.stringify({
                        logLevel,
                        message,
                        transactionId,
                    }),
                    timestamp: timestamp ?? Date.now(),
                },
            ],
        };
        try {
            const command = new PutLogEventsCommand(envelope);
            this.client.send(command);
            logger('CloudWatch logged: %O', {
                namespace: this.logStreamName,
                logLevel,
                message,
                transactionId,
            });
        } catch (error) {
            logger('CloudWatch failed: %O', {
                envelope,
                error,
            });
            captureException(error);
        }
    }
}
