export interface LoggerEvent {
    logLevel: string;
    message: string;
    timestamp?: number;
    transactionId?: string;
}

export interface LoggerPrepareParams {
    namespace: string;
}

export interface Logger {
    // create all streams and groupStreams remotely
    prepare(params: LoggerPrepareParams): Promise<void>;

    // log an event
    log(params: LoggerEvent): Promise<void>;
}
