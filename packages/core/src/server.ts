import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { 
  MCPServerOptions, 
  ServerMetadata, 
  MCPServerInterface,
  MCPResponse,
  MCPErrorCode
} from './types.js';
import type { MCPResource, MCPPrompt, MCPTool, MCPError } from '@em-cp2/types';

/**
 * Base class for all MCP servers in the EM_CP2 framework
 * Follows Anthropic's official MCP patterns
 */
export abstract class MCPServer implements MCPServerInterface {
  protected server: Server;
  protected metadata: ServerMetadata;

  // Official MCP patterns
  public resources?: MCPResource[];
  public prompts?: MCPPrompt[];
  public tools?: MCPTool[];

  constructor(options: MCPServerOptions) {
    this.metadata = {
      name: options.name,
      version: options.version,
      description: options.description,
    };

    this.server = new Server(
      {
        name: this.metadata.name,
        version: this.metadata.version,
      },
      {
        capabilities: options.capabilities || {},
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup server-specific handlers
   * Must be implemented by each server
   */
  protected abstract setupHandlers(): void;

  /**
   * Create standardized success response
   */
  protected createSuccessResponse<T>(data: T): MCPResponse<T> {
    return {
      success: true,
      data
    };
  }

  /**
   * Create standardized error response
   */
  protected createErrorResponse(
    code: MCPErrorCode, 
    message: string, 
    data?: unknown
  ): MCPResponse<never> {
    return {
      success: false,
      error: { code, message, data }
    };
  }

  /**
   * Validate required parameters
   */
  protected validateParameters(
    params: Record<string, unknown>, 
    required: string[]
  ): MCPError | null {
    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        return {
          code: -32602,
          message: `Missing required parameter: ${param}`,
          data: { parameter: param }
        };
      }
    }
    return null;
  }

  /**
   * Start the server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error(`${this.metadata.name} server v${this.metadata.version} started`);
  }

  /**
   * Get server metadata for client configuration
   */
  getMetadata(): ServerMetadata {
    return this.metadata;
  }

  /**
   * Get server interface (resources, prompts, tools)
   */
  getInterface(): MCPServerInterface {
    return {
      resources: this.resources,
      prompts: this.prompts,
      tools: this.tools
    };
  }
}