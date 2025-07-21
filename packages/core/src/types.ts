import type { ServerCapabilities } from '@modelcontextprotocol/sdk/types.js';
import type { MCPResource, MCPPrompt, MCPTool, MCPError } from '@em-cp2/types';

export interface MCPServerOptions {
  name: string;
  version: string;
  description: string;
  capabilities?: ServerCapabilities;
}

export interface ServerMetadata {
  name: string;
  version: string;
  description: string;
}

export interface CrossClientConfig {
  claudeDesktop?: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
  cline?: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

// Official MCP Server Interface
export interface MCPServerInterface {
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
  tools?: MCPTool[];
}

// Standardized Error Types
export type MCPErrorCode = 
  | -32700  // Parse error
  | -32600  // Invalid Request
  | -32601  // Method not found
  | -32602  // Invalid params
  | -32603  // Internal error
  | number; // Custom error codes

export interface MCPResult<T = unknown> {
  success: true;
  data: T;
}

export interface MCPErrorResult {
  success: false;
  error: MCPError;
}

export type MCPResponse<T = unknown> = MCPResult<T> | MCPErrorResult;