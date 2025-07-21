/**
 * Simple logger utility for MCP servers
 */

export class Logger {
  constructor(private name: string) {}

  info(message: string, ...args: unknown[]): void {
    console.error(`[${this.name}] INFO: ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[${this.name}] ERROR: ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.error(`[${this.name}] WARN: ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.error(`[${this.name}] DEBUG: ${message}`, ...args);
    }
  }
}