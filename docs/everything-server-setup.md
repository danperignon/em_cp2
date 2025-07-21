# Everything Server Setup & Testing

## Overview

The "everything" server is Anthropic's official reference implementation that demonstrates all MCP protocol features in one server. It's perfect for learning and testing MCP patterns.

## Installation Completed ✅

```bash
pnpm add -w @modelcontextprotocol/server-everything
```

## Server Capabilities

Based on the initialization response, the everything server supports:

### **Capabilities**
- ✅ **Prompts**: Interactive prompt system
- ✅ **Resources**: With subscription support (paginated, real-time updates)
- ✅ **Tools**: Full tool interface
- ✅ **Logging**: Debug and monitoring
- ✅ **Completions**: Argument auto-completion

### **Key Features**
- **100 test resources**: Even IDs = text, odd IDs = binary data
- **Pagination**: 10 items per page with cursor navigation
- **Real-time updates**: Resource updates every 10 seconds
- **Progress notifications**: For long-running operations
- **Multi-modal testing**: Text + image content support
- **Auto-completion**: For prompt parameters and resource IDs

## Configuration Files Created

### **Project Scope** (`.mcp.json`)
```json
{
  "mcpServers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {
        "DEBUG": "${DEBUG:-false}"
      }
    }
  }
}
```

### **Local Scope** (`mcp.json`)
```json
{
  "mcpServers": {
    "everything-local": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### **Claude Desktop** (`claude-desktop-config.json`)
```json
{
  "mcpServers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"],
      "env": {}
    }
  }
}
```

### **Cline** (`cline-config.json`)
```json
{
  "everything": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-everything"],
    "env": {},
    "disabled": false
  }
}
```

## Testing Results ✅

**Server Initialization**: ✅ Success
```json
{
  "protocolVersion": "2024-11-05",
  "serverInfo": {
    "name": "example-servers/everything", 
    "version": "1.0.0"
  },
  "capabilities": {
    "prompts": {},
    "resources": {"subscribe": true},
    "tools": {},
    "logging": {},
    "completions": {}
  }
}
```

## Server Instructions

The everything server includes these special instructions:

> "Testing and demonstration server for MCP protocol features. Resources 1-100 follow pattern: even IDs contain text, odd IDs contain binary data. Resources paginated at 10 items per page with cursor-based navigation."

**Easter Egg**: If you ask the server about its instructions, it will respond with: "🎉 Server instructions are working! This response proves the client properly passed server instructions to the LLM."

## Usage Patterns to Test

### **Resources**
- Access via: `@everything:test://static/resource/{id}`
- Pattern: Even IDs (2,4,6...) = text, Odd IDs (1,3,5...) = binary
- Updates: Every 10 seconds for subscribed resources

### **Prompts** 
- Access via: `/mcp__everything__<prompt_name>`
- `complex_prompt`: Multi-modal (text + images)
- `resource_prompt`: Embeds resource content

### **Tools**
- Progress notifications with `_meta.progressToken`
- Auto-completion for parameters
- Real-time updates and subscriptions

## Performance Characteristics

- **Auto logs**: Every 20 seconds (filtered by log level)
- **Stderr notifications**: Every 30 seconds  
- **Resource updates**: Every 10 seconds for active subscriptions
- **Log level changes**: Real-time filtering

## Next Steps

1. **Test with Claude Desktop**: Copy `claude-desktop-config.json` to Claude's config location
2. **Test with Cline**: Use `cline-config.json` in VSCode Cline settings
3. **Explore features**: Try the different resource types, prompts, and tools
4. **Learn patterns**: Use this as reference for building custom servers

---

*The everything server is now ready to use as a complete MCP reference implementation!*