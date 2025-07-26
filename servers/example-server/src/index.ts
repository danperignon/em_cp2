#!/usr/bin/env node

/**
 * Example MCP Server demonstrating EM_CP2 patterns and Anthropic best practices
 */

import { MCPServer } from '@em-cp2/core';
import { Logger } from '@em-cp2/shared';

class ExampleServer extends MCPServer {
  private logger?: Logger;

  constructor() {
    super({
      name: 'example-server',
      version: '2.0.0',
      description: 'Example MCP server demonstrating EM_CP2 patterns and Anthropic best practices',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    });

    this.logger = new Logger('ExampleServer');
    this.setupServerInterface();
  }

  /**
   * Setup resources, prompts, and tools (Anthropic official patterns)
   */
  private setupServerInterface(): void {
    // Resources: @server:protocol://resource/path
    this.resources = [
      {
        uri: "example://status",
        name: "Server Status",
        description: "Current server status and health information",
        mimeType: "application/json"
      },
      {
        uri: "example://docs/readme",
        name: "Documentation",
        description: "Server documentation and usage examples",
        mimeType: "text/markdown"
      }
    ];

    // Prompts: /mcp__servername__promptname
    this.prompts = [
      {
        name: "health_check",
        description: "Check server health and return status report",
        arguments: [
          {
            name: "include_metrics",
            description: "Include performance metrics in the report",
            required: false
          }
        ]
      },
      {
        name: "example_analysis", 
        description: "Perform example analysis with configurable parameters",
        arguments: [
          {
            name: "target",
            description: "Target to analyze",
            required: true
          },
          {
            name: "depth",
            description: "Analysis depth (shallow, medium, deep)",
            required: false
          }
        ]
      }
    ];

    // Tools: Standard MCP tool interface
    this.tools = [
      {
        name: "ping",
        description: "Simple ping tool to test server connectivity",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Optional message to include in response"
            }
          },
          required: []
        }
      },
      {
        name: "echo",
        description: "Echo back the provided text with optional transformations",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string", 
              description: "Text to echo back"
            },
            uppercase: {
              type: "boolean",
              description: "Convert to uppercase"
            }
          },
          required: ["text"]
        }
      }
    ];
  }

  protected setupHandlers(): void {
    /*
     * OFFICIAL MCP HANDLER PATTERNS (Anthropic 2025)
     * 
     * This example demonstrates the complete official patterns for:
     * 1. Resources: @server:protocol://resource/path
     * 2. Prompts: /mcp__servername__promptname  
     * 3. Tools: Standard MCP tool interface
     * 
     * The actual handler implementation would use proper MCP SDK schemas.
     * For a working example, see the official MCP server implementations at:
     * https://github.com/modelcontextprotocol/servers
     */

    // Resources would be handled like:
    // this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    //   resources: this.resources || []
    // }));
    //
    // this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    //   const { uri } = request.params;
    //   if (uri === "example://status") {
    //     return { contents: [{ uri, mimeType: "application/json", text: "..." }] };
    //   }
    // });

    // Prompts would be handled like:
    // this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    //   prompts: this.prompts || []
    // }));
    //
    // this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    //   const { name, arguments: args } = request.params;
    //   if (name === "health_check") {
    //     return { messages: [{ role: "user", content: { type: "text", text: "..." } }] };
    //   }
    // });

    // Tools would be handled like:
    // this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
    //   tools: this.tools || []
    // }));
    //
    // this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    //   const { name, arguments: args } = request.params;
    //   if (name === "ping") {
    //     return { content: [{ type: "text", text: "pong" }] };
    //   }
    // });

    // Skip logging if logger not initialized yet (called from parent constructor)
    if (!this.logger) return;
    
    this.logger.info('Example server configured with official MCP patterns (see comments for implementation)');
    this.logger.info(`Server interface defined: ${this.resources?.length || 0} resources, ${this.prompts?.length || 0} prompts, ${this.tools?.length || 0} tools`);
    
    // Log the actual patterns for reference
    this.logger.info('Resources available via: @example:status, @example:docs/readme');
    this.logger.info('Prompts available via: /mcp__example__health_check, /mcp__example__example_analysis');
    this.logger.info('Tools available: ping, echo');
  }
}

// Start the server
const server = new ExampleServer();
server.start().catch(console.error);