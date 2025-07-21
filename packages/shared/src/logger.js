/**
 * Simple logger utility for MCP servers
 */
export class Logger {
    name;
    constructor(name) {
        this.name = name;
    }
    info(message, ...args) {
        console.error(`[${this.name}] INFO: ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[${this.name}] ERROR: ${message}`, ...args);
    }
    warn(message, ...args) {
        console.error(`[${this.name}] WARN: ${message}`, ...args);
    }
    debug(message, ...args) {
        if (process.env.DEBUG) {
            console.error(`[${this.name}] DEBUG: ${message}`, ...args);
        }
    }
}
