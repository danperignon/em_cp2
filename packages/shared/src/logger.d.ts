/**
 * Simple logger utility for MCP servers
 */
export declare class Logger {
    private name;
    constructor(name: string);
    info(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
}
//# sourceMappingURL=logger.d.ts.map