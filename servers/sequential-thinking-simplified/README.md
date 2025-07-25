# Sequential Thinking MCP Server (Simplified)

A focused cognitive reasoning server that provides structured problem decomposition using 6 proven strategies.

## Core Functionality

- **Single Purpose**: Break complex problems into manageable steps
- **6 Strategies**: Top-down, bottom-up, divide & conquer, incremental, parallel, iterative
- **Learning**: Remembers successful patterns via Memory server integration  
- **Output**: Generates structured reasoning artifacts via Filesystem server

## Architecture

```
src/
├── index.ts              # MCP server entry point (~150 lines)
├── decomposition.ts      # Core decomposition engine (~300 lines)
├── strategies.ts         # Strategy implementations (~200 lines)
├── integrations.ts       # Memory & Filesystem integration (~150 lines)
└── types.ts              # TypeScript types (~50 lines)
```

Total: ~850 lines of focused, maintainable code

## Usage

### MCP Tool

```javascript
// Single tool: decompose_problem
const result = await tools.decompose_problem({
  problem_description: "Build a REST API with Node.js and Express",
  strategy: "top_down", // optional, auto-selected if not provided
  depth_limit: 5        // optional, defaults to 4
});
```

### Response Structure

```javascript
{
  problem: {
    description: string,
    type: "analytical" | "creative" | "procedural" | "optimization",
    complexity: "low" | "medium" | "high"
  },
  strategy: {
    name: string,
    reasoning: string
  },
  steps: [
    {
      id: string,
      description: string,
      reasoning: string,
      confidence: number,
      dependencies: string[]
    }
  ],
  artifacts: {
    overview: string,     // Path to generated markdown overview
    steps: string[]       // Paths to individual step files
  }
}
```

## Installation

```bash
# Build the server
cd servers/sequential-thinking-simplified
pnpm build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Configuration

Add to your MCP client configuration:

```json
{
  "sequential-thinking": {
    "command": "node",
    "args": ["./servers/sequential-thinking-simplified/dist/index.js"]
  }
}
```

## Philosophy

This server follows the principle of "do one thing well". It focuses solely on problem decomposition, leveraging other MCP servers for persistence and output rather than reimplementing these features.