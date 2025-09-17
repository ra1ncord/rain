// logger.ts
import { findByNameLazy } from "@metro";

type LoggerFunction = (...messages: any[]) => void;
export interface Logger {
    log: LoggerFunction;
    info: LoggerFunction;
    warn: LoggerFunction;
    error: LoggerFunction;
    time: LoggerFunction;
    trace: LoggerFunction;
    verbose: LoggerFunction;
}

// Private variable to hold the initialized logger instance
let _logger: Logger | null = null;

// Getter to initialize the logger only once
function getLogger(): Logger {
    if (!_logger) {
        const LoggerClass = findByNameLazy("Logger");

        if (!LoggerClass) {
            throw new Error("Failed to find 'Logger' class from metro.");
        }
        _logger = new LoggerClass("rain");
    }
    return _logger!;
}

// Remove the explicit type annotation. TypeScript will infer the correct type.
export const logger = new Proxy({} as Logger, {
    get(target, prop, receiver) {
        const actualLogger = getLogger();
        const func = Reflect.get(actualLogger, prop, receiver);

        if (typeof func === 'function') {
            return func.bind(actualLogger);
        }
        return func;
    }
});