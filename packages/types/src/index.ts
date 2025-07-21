/**
 * @em-cp2/types - Shared TypeScript type definitions
 */

export interface ClientType {
  CLAUDE_DESKTOP: 'claude-desktop';
  CLINE: 'cline';
}

export interface ServerConfig {
  name: string;
  version: string;
  description: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface CrossClientServerConfig {
  claudeDesktop?: ServerConfig;
  cline?: ServerConfig;
}

// Official MCP Types (following Anthropic patterns)

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Desktop Extensions (DXT) Types
export interface DXTManifest {
  name: string;
  version: string;
  description: string;
  server: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
  userConfig?: Record<string, DXTConfigField>;
}

export interface DXTConfigField {
  type: "string" | "number" | "boolean";
  description: string;
  required?: boolean;
  secret?: boolean;
  default?: unknown;
}