# EM_CP2 Project Memory

## Project Overview
EM_CP2 is a modernized monorepo implementation of the Extensible Model Context Protocol (MCP) framework. This is a complete rewrite from em_cp (v1) to address bloat and improve maintainability.

## Architecture Principles
- **Monorepo with pnpm workspaces** - Single dependency tree, shared packages
- **Turborepo for builds** - Intelligent caching, parallel execution
- **TypeScript strict mode** - Type safety across all packages
- **Cross-client compatibility** - Works with Claude Desktop, Claude Code, and Cline/VSCode

## Code Conventions
- Use 2-space indentation for all files
- ESLint + Prettier for consistent formatting
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- File naming: kebab-case for files, PascalCase for classes
- Import order: external deps, internal deps, relative imports

## MCP Development Standards (Anthropic Official)
**See**: `docs/mcp-best-practices.md` for complete guidelines

### Key Patterns
- **Transport Support**: stdio (local), SSE (real-time), HTTP (remote)
- **Security First**: OAuth 2.0, secret vault, read-only default
- **Scoping Strategy**: Local → Project → User precedence
- **Error Handling**: Standardized error format with proper timeouts
- **Resource Pattern**: `@server:protocol://resource/path` for references
- **Prompt Pattern**: `/mcp__servername__promptname` for slash commands

### Critical Security Notes
- Trust only verified MCP servers
- Monitor for prompt injection attacks
- Use environment variables for secrets: `${API_KEY}`
- Implement connection timeouts and retry logic

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
- `pnpm install` - Install all dependencies
- `pnpm build` - Build all packages and servers
- `pnpm dev` - Start development mode (watch all packages)
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint and format all code
- `pnpm clean` - Clean all build artifacts

## MCP Development Commands
- `npx @modelcontextprotocol/inspector <server-command>` - Launch MCP Inspector for debugging
- `npx -y @modelcontextprotocol/server-everything stdio` - Test official everything server
- `node ./servers/example-server/dist/index.js` - Run custom server for testing

### Adding MCP Servers to Clients

**Claude Desktop**: 
- Config location: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Servers run as separate processes
- Edit JSON file directly

**Claude Code**: 
- Config locations:
  - Local: `./.mcp.json` (current project)
  - Project: `./.mcp.json` (shared with team)
  - User: `~/.config/claude-code/mcp.json` (all projects)
- Use CLI commands: `claude mcp add <name> <command> [args...]`
- Servers run as separate processes

**Cline/VSCode/VSCodium**: 
- Config locations:
  - VSCodium: `~/Library/Application Support/VSCodium/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
  - VSCode: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Or in VSCode/VSCodium settings: `cline.mcpServers`
- Servers run as separate processes

## MCP Server Development
- Each server is in `servers/<name>/` with its own package.json
- Extend `MCPServer` from `@em-cp2/core`
- Include both `claude-desktop.json` and `cline.json` configs
- Use workspace dependencies: `"@em-cp2/core": "workspace:*"`
- Build outputs go to `dist/` directory

## Cross-Client Support
MCP servers are designed to work with multiple clients:
- **Claude Desktop** - Standalone desktop application
- **Claude Code** - Official CLI tool from Anthropic
- **Cline** - VSCode extension for Claude integration

Each server needs:
- `claude-desktop.json` - Configuration for Claude Desktop
- `cline.json` - Configuration for Cline/VSCode extension
- Environment detection via `process.env.MCP_CLIENT` if needed
- Shared source code in `src/` directory

### Claude Code Configuration
Add servers using the CLI:
```bash
# Add a stdio server
claude mcp add <name> node /path/to/server/dist/index.js

# Add with environment variables
claude mcp add <name> -e API_KEY=value -- node server.js

# List configured servers
claude mcp list
```

### How Claude Code Accesses MCP Servers

**Architecture Comparison:**

1. **Claude Desktop & Cline:**
   - Direct process spawning
   - Client spawns MCP server processes on startup
   - Communicates via stdio/pipes
   - Servers stay running while client is open

2. **Claude Code:**
   - Dynamic server management
   - Spawns servers on-demand when tools are needed
   - Can add/remove servers during runtime
   - Supports multiple transport types (stdio, SSE, HTTP)
   - Built-in tools (Read, Write, Bash) are NOT MCP servers

**Key Differences:**
- **Built-in vs External**: Claude Code has built-in tools; MCP servers are additional
- **Configuration**: Claude Code uses CLI commands vs JSON file editing
- **Lifecycle**: Claude Code manages server lifecycle dynamically
- **Permissions**: Claude Code has its own permission system for built-in tools

## Dependencies
- **Never commit** `node_modules/`, `dist/`, `venv/`, or `*.tsbuildinfo`
- Use `.gitignore` strictly - repository should be source code only
- Root package.json has shared devDependencies (TypeScript, ESLint, etc.)
- Server-specific dependencies go in their respective package.json

## Migration from EM_CP v1
- Original project was 947MB with massive duplication
- v2 goal: <100MB with zero duplication
- Avoid copying entire node_modules or venv directories
- Consolidate documentation - no per-server README duplication

## Performance Goals
- Turborepo should cache builds (0.2s vs 30s for cached builds)
- Shared dependencies eliminate redundancy
- TypeScript project references for incremental compilation
- pnpm workspaces for efficient disk usage

## MCP Server Maintenance & Updates

### Version Management Strategy
- **Current Status**: All MCP servers are outdated (versions from early 2025)
- **Latest Versions**: Memory 2025.4.25, GitHub 2025.4.8, Filesystem 2025.7.1, Puppeteer 2025.5.12
- **Update Strategy**: Full rebuild planned using latest versions and em_cp2 monorepo structure

### Planned Full Rebuild (Next Session)
1. **Official Servers** - Update to latest versions using npx for always-current installs:
   - `npx -y @modelcontextprotocol/server-filesystem`
   - `npx -y @modelcontextprotocol/server-puppeteer` 
   - `uvx mcp-server-fetch`
   - Install latest memory, github servers in em_cp2

2. **Custom Servers** - Rebuild in em_cp2/servers/ using latest MCP SDK:
   - browsertools, time, web-search, web-research
   - markdownify, excel, obsidian, sequentialthinking-tools

3. **Configuration Migration**:
   - Update Claude Desktop config to point to em_cp2 locations
   - Update Cline config to use new server paths
   - Add servers to Claude Code via `claude mcp add`

4. **Cleanup**: Delete old `/Users/danielrowe/MCP/` and `/Users/danielrowe/Desktop/em_cp/` directories

### Maintenance Automation
- **Monthly Update Script**: `scripts/check-mcp-updates.sh` created for version checking
- **Calendar Reminder**: Set monthly reminder to run update check procedure
- **Version Pinning**: Consider pinning versions in production, use npx for always-latest
- **No Official Auto-Updates**: MCP ecosystem doesn't have automated updates yet

### Update Procedure (Monthly)
1. Run `./scripts/check-mcp-updates.sh` to check latest versions
2. Compare with current configurations
3. Update configs if needed
4. Test with MCP Inspector
5. Set next month's reminder

## Setup History & Changes

### 2025-07-18 - Initial EM_CP2 Setup
**Completed Tasks:**
- ✅ Created CLAUDE.md for project context
- ✅ Installed dependencies with pnpm workspaces 
- ✅ Built all packages successfully (812ms build time)
- ✅ Verified TypeScript project references working
- ✅ Set up Turborepo caching (3/4 packages cached on rebuild)
- ✅ Documented Anthropic's official MCP best practices in `docs/mcp-best-practices.md`
- ✅ Updated core framework with official MCP patterns (resources, prompts, tools)
- ✅ Added DXT (Desktop Extensions) manifest support for one-click installations
- ✅ Implemented standardized error handling with MCP error codes
- ✅ Created configuration examples for Local/Project/User scoping
- ✅ Installed and configured official "everything" MCP server for testing
- ✅ Set up cross-client configurations (Claude Desktop + Cline)
- ✅ Tested MCP Inspector v0.16.1 for visual debugging and development

**Current State:**
- Size: 123MB (87% reduction from 947MB v1)
- Node modules: 1 shared vs 337 scattered
- Packages: 4 total (@em-cp2/types, shared, core, example-server)
- Build system: Turborepo with intelligent caching
- Official MCP server: "everything" v2025.7.1 installed and tested
- MCP Inspector: v0.16.1 verified working for visual debugging
- Cross-client configs: Ready for Claude Desktop, Claude Code, and Cline deployment

### 2025-07-20 - MCP Server Analysis & Rebuild Planning
**Analysis Completed:**
- ✅ Identified outdated MCP server versions (months behind latest)
- ✅ Researched latest MCP ecosystem updates (2025 features)
- ✅ Found Cline configuration locations (VSCodium and legacy)
- ✅ Cleaned up conflicting Roo Cline extension
- ✅ Created automated update check script
- ✅ Planned complete MCP server rebuild strategy

**Next Phase: Full MCP Rebuild**
- Rebuild all custom servers using latest MCP SDK (1.16.0)
- Migrate to em_cp2 monorepo structure
- Update all client configurations
- Implement monthly maintenance schedule

### 2025-07-21 - MCP Migration Plan & Serial Implementation
**Strategy Finalized:**
- ✅ Created comprehensive migration plan in `docs/mcp-migration-plan.md`
- ✅ Identified 7 official MCP reference servers from Anthropic
- ✅ Analyzed current 13-server configuration for gaps and duplicates
- ✅ Adopted serial implementation approach (one server at a time)
- ✅ Documented API key security issues requiring environment variable migration

**Active Migration Phase:**
- **Living Document**: `docs/mcp-migration-plan.md` tracks all decisions and progress
- **Serial Approach**: Implement → Test → Evaluate → Keep/Discard for each server
- **Priority Order**: Git server → Time server → Memory update → Custom evaluations
- **Security Focus**: Remove exposed API keys, use environment variables
- **Decision-Driven**: Only keep servers that provide clear utility

**Current Status**: Ready to begin with Git server implementation

### Technical Decisions Made
1. **TypeScript over JavaScript**: Type safety for MCP protocol compliance
2. **pnpm over npm/yarn**: Efficient disk usage, workspace support
3. **Turborepo over Lerna/Nx**: Simplicity and speed for build orchestration
4. **ESLint + Prettier**: Automated code quality and formatting
5. **Monorepo structure**: Eliminates dependency duplication
6. **npx for MCP servers**: Always use latest versions automatically
7. **Monthly manual updates**: Until MCP ecosystem adds auto-update features

## Context for Future Sessions
This project addresses the bloat in the original em_cp directory which grew to 947MB due to:
- 337 node_modules directories
- Duplicate Python virtual environments  
- 611 README files with repeated content
- Multiple package managers (npm, pnpm, yarn)
- No shared dependency management

The new structure eliminates all these issues while maintaining the core goal: MCP servers that work seamlessly with Claude Desktop, Claude Code, and Cline.

## Change Tracking Protocol
- **Update CLAUDE.md** after major structural changes
- **Use conventional commits** for all changes (feat:, fix:, docs:)
- **Tag releases** with semantic versioning
- **Document architectural decisions** in this file
- **Record performance metrics** (build times, sizes) for regression detection