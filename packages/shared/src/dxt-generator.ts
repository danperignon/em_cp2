/**
 * Desktop Extensions (DXT) manifest generator
 * Following Anthropic's official DXT specifications
 */

import type { DXTManifest, DXTConfigField } from '@em-cp2/types';
import { promises as fs } from 'fs';
import { join } from 'path';

export class DXTGenerator {
  /**
   * Generate DXT manifest for a server
   */
  static generateManifest(options: {
    name: string;
    version: string;
    description: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    userConfig?: Record<string, DXTConfigField>;
  }): DXTManifest {
    return {
      name: options.name,
      version: options.version,
      description: options.description,
      server: {
        command: options.command,
        args: options.args,
        env: options.env
      },
      userConfig: options.userConfig
    };
  }

  /**
   * Save DXT manifest to file
   */
  static async saveManifest(
    serverPath: string, 
    manifest: DXTManifest
  ): Promise<void> {
    const manifestPath = join(serverPath, 'manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * Load DXT manifest from file
   */
  static async loadManifest(serverPath: string): Promise<DXTManifest> {
    const manifestPath = join(serverPath, 'manifest.json');
    const content = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as DXTManifest;
  }

  /**
   * Create common configuration fields
   */
  static createApiKeyConfig(): DXTConfigField {
    return {
      type: "string",
      description: "API key for authentication",
      required: true,
      secret: true
    };
  }

  static createUrlConfig(defaultUrl?: string): DXTConfigField {
    return {
      type: "string",
      description: "Service URL endpoint",
      required: false,
      default: defaultUrl
    };
  }

  static createTimeoutConfig(defaultTimeout: number = 30000): DXTConfigField {
    return {
      type: "number",
      description: "Request timeout in milliseconds",
      required: false,
      default: defaultTimeout
    };
  }

  /**
   * Validate DXT manifest
   */
  static validateManifest(manifest: DXTManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name) errors.push('Missing required field: name');
    if (!manifest.version) errors.push('Missing required field: version');
    if (!manifest.description) errors.push('Missing required field: description');
    if (!manifest.server?.command) errors.push('Missing required field: server.command');

    // Validate semantic versioning
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Version must follow semantic versioning (x.y.z)');
    }

    // Validate user config
    if (manifest.userConfig) {
      for (const [key, config] of Object.entries(manifest.userConfig)) {
        if (!['string', 'number', 'boolean'].includes(config.type)) {
          errors.push(`Invalid config type for ${key}: ${config.type}`);
        }
        if (!config.description) {
          errors.push(`Missing description for config field: ${key}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}