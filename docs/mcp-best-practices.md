# MCP Best Practices - Anthropic Official Guidelines

## Overview

This document compiles official best practices from Anthropic for developing Model Context Protocol (MCP) servers, based on their 2025 documentation and recommendations.

## 🏗️ Server Architecture

### 1. **Transport Support**
Implement support for multiple transport types:
- **stdio**: Process-based communication (default for local servers)
- **SSE**: Server-Sent Events for real-time communication
- **HTTP**: RESTful communication for remote servers

### 2. **Client-Server Pattern**
- Claude acts as the **MCP client**
- Your server responds to MCP protocol messages
- Enable **real-time communication** capabilities
- Design for **stateless interactions** where possible

### 3. **Server Scoping Strategy**
Configure servers at appropriate scopes:

```
Local Scope (./mcp.json)
├── Personal servers
├── Experimental configurations  
└── Sensitive project credentials

Project Scope (./.mcp.json)
├── Team-shared servers
├── Project-specific tools
└── Collaboration requirements

User Scope (~/.mcp.json)
├── Personal utilities
├── Development tools
└── Cross-project services
```

**Precedence**: Local → Project → User (local overrides others)

## 🛡️ Security Best Practices

### 1. **Third-Party Server Warning**
> "Use third party MCP servers at your own risk. Make sure you trust the MCP servers, and be especially careful when using MCP servers that talk to the internet, as these can expose you to prompt injection risk."

### 2. **Authentication Patterns**
- Implement **OAuth 2.0** authentication flow
- Provide **secure token storage** in OS secret vault
- Support **automatic token refreshing**
- Use environment variable expansion: `${API_KEY}`

### 3. **Prompt Injection Protection**
- Be aware that malicious servers may include hidden instructions
- Claude has built-in protections, but monitor tool inputs/outputs
- Only connect to **trusted servers**
- Implement **read-only access** by default where possible

## 🔧 Implementation Patterns

### 1. **Resource Implementation**
Resources should be **referenceable** and **discoverable**:

```typescript
// Resources are accessible via @ mentions
// @server:protocol://resource/path
export const resources = [
  {
    uri: "file://project/readme.md",
    name: "Project README",
    description: "Main project documentation",
    mimeType: "text/markdown"
  }
];
```

### 2. **Tool Implementation**
Follow standardized tool patterns:

```typescript
export const tools = [
  {
    name: "read_file",
    description: "Read contents of a file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" }
      },
      required: ["path"]
    }
  }
];
```

### 3. **Prompt Implementation**
Prompts should be **discoverable** as slash commands:

```typescript
// Accessible via /mcp__servername__promptname
export const prompts = [
  {
    name: "analyze_code",
    description: "Analyze code quality and suggest improvements",
    arguments: [
      {
        name: "language",
        description: "Programming language",
        required: true
      }
    ]
  }
];
```

## 📦 Desktop Extensions (DXT) Best Practices

### 1. **Manifest Structure**
Create proper `manifest.json`:

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "Description of server capabilities",
  "server": {
    "command": "node",
    "args": ["dist/index.js"]
  },
  "userConfig": {
    "api_key": {
      "type": "string",
      "description": "API key for service",
      "required": true,
      "secret": true
    }
  }
}
```

### 2. **Configuration Management**
- Declare required user configuration
- Use secret vault for sensitive data
- Support environment variable substitution
- Validate configuration before server start

## 🔄 Error Handling & Reliability

### 1. **Connection Management**
- Configure appropriate **startup timeouts**
- Handle **connection closed** scenarios gracefully
- Implement **retry logic** for transient failures
- Provide clear error messages

### 2. **Error Response Format**
Standardize error responses:

```typescript
interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}
```

### 3. **Timeout Handling**
- Set reasonable timeouts for operations
- Implement **graceful degradation**
- Provide timeout configuration options

## 🎯 Development Workflow

### 1. **SDK Usage**
Use official MCP SDKs:
- **TypeScript**: `@modelcontextprotocol/sdk`
- **Python**: `mcp`
- **Other languages**: Available in official repository

### 2. **Testing Strategy**
- Test with **both Claude Desktop and Cline**
- Implement **unit tests** for tool functions
- Test **error scenarios** and edge cases
- Validate **schema compliance**

### 3. **Documentation Requirements**
- Clear **tool descriptions**
- **Parameter documentation**
- **Usage examples**
- **Error code explanations**

## 🚀 Performance & Scalability

### 1. **Resource Management**
- Implement **lazy loading** for heavy resources
- Use **streaming** for large data transfers
- Cache frequently accessed data
- Clean up resources properly

### 2. **Batching Operations**
- Support **bulk operations** where appropriate
- Implement **pagination** for large result sets
- Use **efficient data structures**

## 📋 Configuration Examples

### Local Development
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

### Remote Production
```json
{
  "mcpServers": {
    "api-server": {
      "type": "sse",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    }
  }
}
```

## 🔍 Debugging & Monitoring

### 1. **MCP Inspector (Essential Tool)**
The **official debugging tool** for MCP server development:

```bash
# Install and launch (latest: v0.16.1+)
npx @modelcontextprotocol/inspector <server-command>

# Examples
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-everything stdio
npx @modelcontextprotocol/inspector node ./dist/my-server.js
```

**Features:**
- **Visual interface**: Test tools, resources, prompts interactively
- **Protocol debugging**: See raw MCP JSON-RPC messages
- **Multi-transport**: stdio, SSE, HTTP support
- **Security**: Session token authentication (CVE-2025-49596 fixed)
- **Export configs**: Generate client configurations

**Security Requirements:**
- Use version **0.16.1+** (critical security fixes)
- Session token authentication enabled by default
- Local-only binding for security

### 2. **Logging Best Practices**
- Use **structured logging**
- Include **correlation IDs**
- Log **performance metrics**
- Avoid logging **sensitive data**

### 3. **Health Checks**
- Implement **health check endpoints**
- Monitor **dependency availability**
- Track **error rates**

## 📚 Additional Resources

- **MCP Quickstart Guide**: Step-by-step tutorial
- **Model Context Protocol GitHub**: Complete technical documentation
- **MCP Inspector GitHub**: [github.com/modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)
- **Official MCP Servers**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- **Desktop Extensions Spec**: DXT development guide

## 🧪 Testing & Development Workflow

### **1. Development Cycle**
```bash
# 1. Build your server
pnpm build

# 2. Test with MCP Inspector
npx @modelcontextprotocol/inspector node ./dist/index.js

# 3. Configure for clients
# Copy to Claude Desktop config or Cline settings

# 4. Test with real clients
# Test in Claude Desktop and/or Cline
```

### **2. Official Reference Servers**
Test against official implementations:
- `@modelcontextprotocol/server-everything` - Complete reference (all features)
- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-memory` - Knowledge graph storage
- `@modelcontextprotocol/server-fetch` - Web content retrieval
- `@modelcontextprotocol/server-git` - Git repository operations

### **3. Debugging Strategy**
1. **Start with Inspector**: Visual debugging and protocol validation
2. **Check logs**: Both server and client-side logging
3. **Test incrementally**: One tool/resource/prompt at a time
4. **Validate schemas**: Ensure JSON schema compliance
5. **Cross-client testing**: Verify both Claude Desktop and Cline compatibility

## 🎯 EM_CP2 Specific: Anti-Bloat Principles

### Keep Servers Focused
- **Target size**: < 1,000 lines per server
- **Maximum tools**: 5 per server (ideally 1-3)
- **Single responsibility**: If description needs multiple "and"s, split it

### Avoid Over-Engineering
- No multi-client management (MCP is typically single-client)
- No complex locking or distributed patterns
- No premature abstractions or plugin systems
- Build for current needs, not imagined futures

**See**: `docs/anti-bloat-guidelines.md` for detailed guidelines and the Sequential Thinking case study

## 🔄 Updates & Versioning

This document reflects Anthropic's official guidance as of 2025. Check the official documentation for the latest updates:
- [docs.anthropic.com/mcp](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)
- [MCP Inspector releases](https://github.com/modelcontextprotocol/inspector/releases)

---

*Last Updated: 2025-07-25*  
*Source: Anthropic Official Documentation + EM_CP2 Implementation Experience*