/**
 * @em-cp2/core - Core MCP server framework
 * 
 * Provides base classes and utilities for creating MCP servers
 * that work across Claude Desktop and Cline.
 */

export { MCPServer } from './server.js';
export { CrossClientAdapter } from './adapters/cross-client.js';
export { ServerConfig } from './config.js';
export * from './types.js';