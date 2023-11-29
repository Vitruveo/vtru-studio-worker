/* eslint-disable no-await-in-loop */
import debug from 'debug';

const logger = debug('utils');

export const removeAccents = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '');

// eslint-disable-next-line no-unused-vars
type Callback<T, R> = (item: T, workerId: number) => Promise<R>;

export const throttle = async <T, R>(lista: T[], callback: Callback<T, R>, simultaneous: number) => {
    const parallels: number[] = [];
    for (let x = 1; x <= simultaneous; x += 1) parallels.push(x);

    return Promise.all(
        parallels.map((workerId) => {
            const job = async () => {
                for (; lista.length > 0; ) {
                    const item = lista.shift() as T;
                    await callback(item, workerId);
                }
            };
            return job();
        }),
    );
};

export const delay = async (timeout = 1000) =>
    new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });

type CallbackRetry<T> = () => Promise<T>;

export const retry = async <T>(
    cb: CallbackRetry<T>,
    maxRetries = 10,
    delayTimeout = 1000,
    description = '',
): Promise<T> => {
    for (let tentative = 1; tentative <= maxRetries; tentative += 1) {
        try {
            const result: T = await cb();
            return result;
        } catch (err) {
            logger(`Retry: ${tentative}/${maxRetries} [${description}] - Error: ${err}`);
            await delay(delayTimeout);
        }
    }
    throw Error(`Exceeded ${maxRetries} for ${description || 'call function'}`);
};
