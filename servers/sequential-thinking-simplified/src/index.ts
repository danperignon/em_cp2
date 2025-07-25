#!/usr/bin/env node

/**
 * Sequential Thinking MCP Server (Simplified)
 * A focused cognitive reasoning server for problem decomposition
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '@em-cp2/shared';
import { z } from 'zod';

import { DecompositionEngine } from './decomposition.js';
import { ServerIntegrations } from './integrations.js';
import type { DecompositionStrategy } from './types.js';

// Tool input schema
const DecomposeProblemSchema = z.object({
  problem_description: z.string().describe('The problem to decompose'),
  strategy: z.enum([
    'top_down', 'bottom_up', 'divide_conquer', 
    'incremental', 'parallel', 'iterative'
  ]).optional().describe('Decomposition strategy (auto-selected if not provided)'),
  depth_limit: z.number().min(1).max(10).optional().describe('Maximum decomposition depth')
});

class SequentialThinkingServer {
  private server: Server;
  private logger: Logger;
  private engine: DecompositionEngine;
  private integrations: ServerIntegrations;

  constructor() {
    this.logger = new Logger('SequentialThinking');
    this.engine = new DecompositionEngine();
    this.integrations = new ServerIntegrations();
    
    this.server = new Server(
      {
        name: 'sequential-thinking-simplified',
        version: '1.0.0',
        maxRequestSize: 1024 * 1024  // 1MB
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'decompose_problem',
          description: 'Break down a complex problem into manageable steps using cognitive reasoning strategies',
          inputSchema: {
            type: 'object',
            properties: {
              problem_description: {
                type: 'string',
                description: 'The problem to decompose'
              },
              strategy: {
                type: 'string',
                enum: ['top_down', 'bottom_up', 'divide_conquer', 'incremental', 'parallel', 'iterative'],
                description: 'Decomposition strategy (auto-selected if not provided)'
              },
              depth_limit: {
                type: 'number',
                minimum: 1,
                maximum: 10,
                description: 'Maximum decomposition depth (default: 4)'
              }
            },
            required: ['problem_description']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'decompose_problem') {
        return this.handleDecomposeProblem(request.params.arguments);
      }
      
      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // Error handling
    this.server.onerror = (error) => {
      this.logger.error(`Server error: ${error}`);
    };
  }

  private async handleDecomposeProblem(args: unknown): Promise<any> {
    try {
      // Validate input
      const input = DecomposeProblemSchema.parse(args);
      
      this.logger.info(`Decomposing problem: "${input.problem_description.substring(0, 50)}..."`);

      // Perform decomposition
      const result = await this.engine.decompose(
        input.problem_description,
        input.strategy as DecompositionStrategy | undefined,
        input.depth_limit || 4
      );

      // Optional: Store pattern for learning
      await this.integrations.storePattern(result);

      // Optional: Generate artifacts
      const artifacts = await this.integrations.generateArtifacts(result);
      if (artifacts.overview || artifacts.steps) {
        result.artifacts = artifacts;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to decompose problem: ${errorMessage}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: errorMessage,
              success: false
            })
          }
        ]
      };
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Sequential Thinking Server (Simplified) started');
  }
}

// Start the server
const server = new SequentialThinkingServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});