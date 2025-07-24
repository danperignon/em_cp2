# EM_CP2 Project Memory

## Project Overview
EM_CP2 is a modernized monorepo implementation of the Extensible Model Context Protocol (MCP) framework. Complete rewrite from em_cp (v1) addressing bloat and improving maintainability.

**Architecture**: pnpm workspaces + Turborepo + TypeScript strict mode + cross-client compatibility (Claude Desktop, Claude Code, Cline)

## Core Standards
- **Code**: 2-space indent, ESLint/Prettier, conventional commits, kebab-case files
- **MCP Patterns**: stdio/SSE/HTTP transport, Local→Project→User scoping, environment variables for secrets
- **Security**: OAuth 2.0, read-only default, input validation, timeout/retry logic

**See**: `docs/mcp-best-practices.md` for complete guidelines

## Directory Structure
```
em_cp2/
├── apps/           # Client-specific configurations only
├── servers/        # MCP server implementations
├── packages/       # Shared TypeScript packages
│   ├── core/      # Base MCP framework (@em-cp2/core)
│   ├── shared/    # Common utilities (@em-cp2/shared)
│   └── types/     # TypeScript definitions (@em-cp2/types)
├── docs/          # Centralized documentation
└── scripts/       # Build and automation scripts
```

## Key Commands
```bash
# Development
pnpm install/build/dev/test/lint/clean

# MCP testing
npx @modelcontextprotocol/inspector <server-command>
npx -y @modelcontextprotocol/server-everything stdio
node ./servers/example-server/dist/index.js
```

## MCP Server Development
- Each server is in `servers/<name>/` with its own package.json
- Extend `MCPServer` from `@em-cp2/core`
- Include both `claude-desktop.json` and `cline.json` configs
- Use workspace dependencies: `"@em-cp2/core": "workspace:*"`
- Build outputs go to `dist/` directory

## MCP Client Configurations

**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (JSON edit)
**Claude Code**: `.mcp.json` (local/project) or `claude mcp add <name> <command>` (CLI)  
**Cline/VSCode**: VSCode/VSCodium settings or `cline_mcp_settings.json`

**Key Difference**: Claude Code has built-in tools + dynamic server management; others spawn servers on startup

## Performance & Dependencies
- **Size**: 947MB → 123MB (87% reduction, zero duplication)
- **Build**: Turborepo caching (0.2s vs 30s), shared dependencies
- **Git**: Never commit build artifacts, use strict .gitignore

## Active MCP Migration Status

**Completed Servers**: 
- ✅ Git (uvx mcp-server-git) - 13 tools, repository operations
- ✅ Time (uvx mcp-server-time v1.12.0) - timezone conversions, current time
- ✅ Memory (npx @modelcontextprotocol/server-memory) - knowledge graph persistent memory
- ✅ GitHub (HTTP remote server) - repository management, issues, PRs, workflows

**Current Configurations**:
- `.mcp.json` (project): everything, example-server, memory, filesystem, git, time, github
- `mcp.json` (local): everything-local, example-server-local, git-local, time-local, memory-local, github-local

**Next Phase**: Filesystem server integration, custom server evaluation per roadmap

## Setup Timeline (Condensed)

### 2025-07-18 - Initial Framework
✅ Monorepo setup (pnpm + Turborepo), TypeScript strict mode, MCP patterns, everything server, MCP Inspector v0.16.1

### 2025-07-20 - Migration Planning  
✅ Server analysis, outdated versions identified, serial implementation strategy

### 2025-07-21 - Active Migration
✅ **Git server**: uvx mcp-server-git (13 tools, KEEP decision)
✅ **Time server**: uvx mcp-server-time v1.12.0 (timezone tools, KEEP decision)

### 2025-07-23 - Memory & GitHub Server Integration
✅ **Memory server**: npx @modelcontextprotocol/server-memory (knowledge graph, KEEP decision)
✅ **GitHub server**: HTTP remote server (repository management, replaces archived GitHub server)

**Technical Decisions**: TypeScript, pnpm/Turborepo, uvx for Python packages, npx for Node packages, HTTP transport for remote servers, environment variables for secrets

## Repository & Backup Status
- **GitHub Repository**: https://github.com/danperignon/em_cp2
- **Backup Status**: ✅ All progress committed and pushed to GitHub
- **Last Backup**: 2025-07-23 (Memory & GitHub server integration)

## Key Files
- `CLAUDE.md` - This file (project context)
- `docs/roadmap.md` - Detailed living roadmap document
- `docs/mcp-best-practices.md` - Anthropic official guidelines
- `.mcp.json` / `mcp.json` - Server configurations