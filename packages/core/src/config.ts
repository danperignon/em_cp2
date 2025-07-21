/**
 * Server configuration utilities
 */

import type { MCPServerOptions } from './types.js';

export class ServerConfig {
  constructor(private options: MCPServerOptions) {}

  getName(): string {
    return this.options.name;
  }

  getVersion(): string {
    return this.options.version;
  }

  getDescription(): string {
    return this.options.description;
  }

  getCapabilities(): Record<string, unknown> {
    return this.options.capabilities || {};
  }
}