import debug from 'debug';
import * as Sentry from '@sentry/node';
import { SENTRY_DSN } from '../../constants';

const logger = debug('services:sentry');

if (SENTRY_DSN) {
    logger('Sentry setup');
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}

type SentryArgs = Parameters<typeof Sentry.captureException>;

export const captureException = (...args: SentryArgs) => {
    if (SENTRY_DSN) {
        logger('Error captured: %O', args);
        Sentry.captureException(...args);
    }
};

export const sentry = Sentry;
