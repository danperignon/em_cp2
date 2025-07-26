# EM_CP2 - Extensible Model Context Protocol v2

A modern, efficient monorepo implementation of the Model Context Protocol (MCP) framework, designed for cross-client compatibility between Claude Desktop, Claude Code, and Cline.

**🌟 Repository**: https://github.com/danperignon/em_cp2  
**📊 Status**: 7 active MCP servers configured and documented  
**💾 Backup**: ✅ All progress committed and pushed to GitHub

## 🚀 Key Improvements over v1

- **90% smaller footprint** (~100MB vs 947MB)
- **Shared dependencies** via pnpm workspaces
- **Turborepo caching** for 100x faster builds
- **Single source of truth** for documentation
- **Type-safe** shared packages
- **Modern tooling** with automated formatting and linting
- **Anti-bloat principles** to keep servers focused and maintainable

## 📁 Project Structure

```
em_cp2/
├── servers/                 # MCP server implementations
│   ├── example-server/     # Custom server with client configs
│   │   ├── claude-desktop.json  # Claude Desktop config
│   │   └── cline.json          # Cline config
│   └── sequential-thinking-simplified/  # Problem decomposition server
│       ├── claude-desktop.json  # Claude Desktop config
│       └── cline.json          # Cline config
├── packages/               # Shared code
│   ├── core/              # Core MCP framework
│   ├── shared/            # Shared utilities
│   └── types/             # TypeScript type definitions
├── docs/                   # Centralized documentation
├── scripts/                # Build and maintenance scripts
├── .mcp.json              # Project scope MCP configurations
├── mcp.json               # Local scope MCP configurations
├── claude-desktop-config.json  # Root template
├── cline-config.json           # Root template
├── package.json            # Root package configuration
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── turbo.json              # Turborepo configuration
└── tsconfig.base.json      # Base TypeScript config
```

## 🛠️ Technology Stack

- **Package Manager**: pnpm (efficient disk usage, strict dependencies)
- **Build System**: Turborepo (intelligent caching, parallel execution)
- **Language**: TypeScript 5.4+
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Node**: 18.0.0+

## 🚦 Getting Started

### Prerequisites

```bash
# Install pnpm globally
npm install -g pnpm@latest

# Verify versions
node --version  # Should be >= 18.0.0
pnpm --version  # Should be >= 8.0.0
```

### Installation

```bash
# Clone the repository
git clone https://github.com/danperignon/em_cp2.git
cd em_cp2

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start development mode (watches all packages)
pnpm dev

# Run tests
pnpm test

# Lint and format code
pnpm lint
pnpm format

# Type checking
pnpm typecheck
```

### Testing with MCP Inspector

```bash
# Test the official everything server
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-everything stdio

# Test your custom server
pnpm build  # Build first
npx @modelcontextprotocol/inspector node ./servers/example-server/dist/index.js

# Opens browser at http://localhost:6274 with visual debugging interface
```

## 📦 Creating a New MCP Server

```bash
# Use the server template
pnpm create-server <server-name>

# Navigate to the new server
cd servers/<server-name>

# Start development
pnpm dev
```

## 🔧 Cross-Client Support

MCP servers work across multiple clients:
- **Claude Desktop** - Standalone desktop application
- **Claude Code** - Official CLI tool (`claude mcp add`)
- **Cline** - VSCode extension

Each server can have client-specific configurations:

```
servers/my-server/
├── src/                    # Shared server code
├── claude-desktop.json     # Claude Desktop config
└── cline.json             # Cline config
```

### Adding Servers to Clients

**Claude Desktop:**
- Config: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Edit JSON file directly, restart Claude Desktop

**Claude Code:**
- Configs: `./.mcp.json` (local), `~/.config/claude-code/mcp.json` (user)
- Add via CLI:
```bash
claude mcp add my-server node /path/to/server/dist/index.js
```

**Cline (VSCode/VSCodium):**
- VSCodium: `~/Library/Application Support/VSCodium/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- VSCode: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Or configure in settings: `cline.mcpServers`

## 🔄 MCP Server Maintenance

**Status**: All MCP servers need updating (versions 3+ months old)

**Planned**: Complete rebuild using latest MCP SDK and em_cp2 structure
- Official servers: Use `npx -y` for always-latest versions  
- Custom servers: Rebuild in `servers/` directory
- Monthly update checks: `./scripts/check-mcp-updates.sh`

See `CLAUDE.md` for detailed rebuild plan and maintenance procedures.

## 📚 Documentation

- **[Quick Reference](./docs/quick-reference.md)** - Essential commands and patterns
- **[Roadmap](./docs/roadmap.md)** - Detailed development tracking
- **[MCP Best Practices](./docs/mcp-best-practices.md)** - Anthropic official guidelines
- **[Configuration Examples](./docs/configuration-examples.md)** - Setup patterns
- **[Project Memory](./CLAUDE.md)** - Current project context

## 🤝 Contributing

### Important Development Principles
- **Keep servers focused**: < 1,000 lines, single responsibility
- **Avoid over-engineering**: No enterprise patterns for simple MCP servers
- **Review guidelines**: See [Anti-Bloat Guidelines](./docs/anti-bloat-guidelines.md)

## 📄 License

MIT License