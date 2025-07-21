/**
 * Cross-client adapter for handling Claude Desktop vs Cline differences
 */

import { detectClient } from '@em-cp2/shared';
import type { CrossClientConfig } from '../types.js';

export class CrossClientAdapter {
  private client: string;

  constructor() {
    this.client = detectClient();
  }

  getClientType(): string {
    return this.client;
  }

  isClaudeDesktop(): boolean {
    return this.client === 'claude-desktop';
  }

  isCline(): boolean {
    return this.client === 'cline';
  }

  adaptConfig(config: CrossClientConfig) {
    if (this.isClaudeDesktop() && config.claudeDesktop) {
      return config.claudeDesktop;
    }
    
    if (this.isCline() && config.cline) {
      return config.cline;
    }

    throw new Error(`No configuration found for client: ${this.client}`);
  }
}