import { createWriteStream } from 'fs';
import { join } from 'path';
class Logger {
    constructor() {
        this.logStream = null;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
        this.minLevel = process.env.LOG_LEVEL || 'info';
        // En producción, crear archivo de logs
        if (process.env.NODE_ENV === 'production') {
            try {
                const logPath = join(process.cwd(), 'logs', 'app.log');
                this.logStream = createWriteStream(logPath, { flags: 'a' });
            }
            catch (error) {
                console.error('Failed to create log stream:', error);
            }
        }
    }
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.minLevel];
    }
    formatMessage(entry) {
        const { timestamp, level, message, data, context } = entry;
        const contextStr = context ? `[${context}]` : '';
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}${dataStr}`;
    }
    log(level, message, data, context) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            context,
        };
        const formatted = this.formatMessage(entry);
        // Console output con colores
        const colors = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m', // Green
            warn: '\x1b[33m', // Yellow
            error: '\x1b[31m', // Red
        };
        const reset = '\x1b[0m';
        console.log(`${colors[level]}${formatted}${reset}`);
        // Escribir a archivo en producción
        if (this.logStream) {
            this.logStream.write(formatted + '\n');
        }
    }
    debug(message, data, context) {
        this.log('debug', message, data, context);
    }
    info(message, data, context) {
        this.log('info', message, data, context);
    }
    warn(message, data, context) {
        this.log('warn', message, data, context);
    }
    error(message, error, context) {
        const errorData = error instanceof Error
            ? {
                errorMessage: error.message,
                stack: error.stack,
                name: error.name,
            }
            : error;
        this.log('error', message, errorData, context);
    }
    // Helpers para logging HTTP
    http(method, url, status, duration) {
        const durationStr = duration ? ` - ${duration}ms` : '';
        this.info(`${method} ${url} ${status}${durationStr}`, undefined, 'HTTP');
    }
    // Helper para logging de base de datos
    db(query, duration) {
        const durationStr = duration ? ` (${duration}ms)` : '';
        this.debug(`Query: ${query}${durationStr}`, undefined, 'DB');
    }
    // Cerrar el stream al finalizar
    close() {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}
// Singleton instance
export const logger = new Logger();
// Cerrar el logger al salir
process.on('beforeExit', () => {
    logger.close();
});
