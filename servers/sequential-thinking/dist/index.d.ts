#!/usr/bin/env node
/**
 * Sequential Thinking MCP Server
 *
 * Advanced cognitive reasoning server providing structured problem-solving,
 * adaptive strategy selection, and persistent state management.
 *
 * Features:
 * - Problem decomposition with multiple strategies
 * - Step-by-step reasoning chains with validation
 * - Adaptive strategy selection based on performance
 * - Integration with Memory, Filesystem, and Git servers
 * - Metacognitive monitoring and reflection
 */
import { MCPServer } from '@em-cp2/core';
declare class SequentialThinkingServer extends MCPServer {
    private logger;
    private toolHandlers;
    constructor();
    protected setupHandlers(): Promise<void>;
    private setupServerInterface;
    private setupMCPHandlers;
}
export { SequentialThinkingServer };
//# sourceMappingURL=index.d.ts.map