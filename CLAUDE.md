# EM_CP2 Project Memory

## Quick Context
EM_CP2 is a clean monorepo implementation of MCP (Model Context Protocol) servers. Built from scratch to replace bloated em_cp v1, focusing on maintainability and single-purpose servers.

**Current State**: 9 active MCP servers | ~850 lines avg per server | 87% smaller than v1

## Core Principles
1. **Single Responsibility**: Each server does ONE thing well (<1,000 lines)
2. **No Over-Engineering**: No enterprise patterns in MCP context
3. **Composition Over Complexity**: Use existing servers, don't rebuild
4. **Anti-Bloat**: See `docs/anti-bloat-guidelines.md` (Sequential Thinking case study)

## Architecture
- **Stack**: pnpm workspaces + Turborepo + TypeScript strict mode
- **Clients**: Claude Desktop, Claude Code, Cline (cross-compatible)
- **Patterns**: stdio/SSE/HTTP transport, environment variables for secrets

## Directory Structure
```
em_cp2/
├── servers/                    # MCP server implementations
│   ├── example-server/        # Template server with client configs
│   └── sequential-thinking-simplified/  # Problem decomposition (821 lines)
├── packages/                   # Shared TypeScript packages
│   ├── core/                  # Base MCP framework (@em-cp2/core)
│   ├── shared/                # Common utilities (@em-cp2/shared)
│   └── types/                 # TypeScript definitions (@em-cp2/types)
├── docs/                      # Documentation (8 files)
│   ├── anti-bloat-guidelines.md  # Core principles & 94% reduction case study
│   ├── mcp-best-practices.md    # Anthropic official MCP guidelines
│   ├── roadmap.md               # Living timeline & decision history
│   ├── configuration-examples.md # Three-tier MCP scoping explained
│   └── [4 more...]              # See docs/ for full list
├── scripts/                   # Build and automation
│   └── check-mcp-updates.sh   # Check for MCP updates
├── .claude/                   # Claude-specific files
├── .github/                   # GitHub configuration
│   └── workflows/             # GitHub Actions workflows
├── .mcp.json                  # Project scope MCP configurations
├── mcp.json                   # Local scope MCP configurations
├── claude-desktop-config.json # Claude Desktop root template
├── cline-config.json          # Cline root template  
├── package.json               # Root package configuration
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── turbo.json                 # Turborepo configuration
├── tsconfig.json              # Root TypeScript config
├── tsconfig.base.json         # Base TypeScript config
├── README.md                  # Project overview
└── CLAUDE.md                  # This file (project context)
```

## Active Servers
| Server | Purpose | Tools | Command |
|--------|---------|-------|---------|
| Everything | Reference/testing server | 8 | `npx @modelcontextprotocol/server-everything` |
| Git | Repository operations | 13 | `uvx mcp-server-git` |
| Time | Timezone conversions | 2 | `uvx mcp-server-time` |
| Memory | Knowledge graph storage | 9 | `npx @modelcontextprotocol/server-memory` |
| GitHub | Issues, PRs, workflows | 71+ | `https://api.githubcopilot.com/mcp/` |
| Filesystem | Secure file operations | 13 | `npx @modelcontextprotocol/server-filesystem` |
| Fetch | Web content retrieval | 1 | `uvx mcp-server-fetch` |
| Example | Framework demo | 2 | `node ./servers/example-server/dist/index.js` |
| Sequential Thinking | Problem decomposition | 1 | `node ./servers/sequential-thinking-simplified/dist/index.js` |

## Key Commands
```bash
pnpm install          # Install dependencies
pnpm build           # Build all packages
npx @modelcontextprotocol/inspector <cmd>  # Test any MCP server
```

## Adding a New Server
1. **Check need**: Can existing servers handle it? (compose, don't complicate)
2. **Keep focused**: <1,000 lines, 1-5 tools max
3. **Use template**: Copy `example-server`, modify as needed
4. **Test thoroughly**: Use MCP Inspector before integration
5. **Document clearly**: Single sentence purpose in README

## Important Lessons
- **Sequential Thinking**: Reduced from 13,441 to 821 lines (94% reduction)
- **Why**: Avoided enterprise patterns, kept single focus
- **Result**: Same functionality, 94% less complexity

## Project Health
- **Total Size**: ~123MB (vs 947MB in v1)
- **Build Time**: <1s with cache (vs 30s in v1)
- **Maintainability**: High (small, focused servers)
- **Documentation**: Comprehensive (see docs/)

## Key Resources

### Essential Documentation
- **Project Roadmap**: `docs/roadmap.md` - Detailed timeline, decisions, and future plans
- **Anti-Bloat Guidelines**: `docs/anti-bloat-guidelines.md` - Core development principles (94% reduction case study)
- **MCP Best Practices**: `docs/mcp-best-practices.md` - Anthropic's official MCP guidelines
- **Configuration Guide**: `docs/configuration-examples.md` - MCP's three-tier scoping system explained

### Quick References
- **Repository**: https://github.com/danperignon/em_cp2
- **Config Files**: `.mcp.json` (project scope) / `mcp.json` (local scope)
- **Operational Guide**: `docs/quick-reference.md` - Commands, status, and locations

## Reference Documents

Complete list of reference documentation for the EM_CP2 project.

### Slash Commands
- **`/read-essential-docs`** - Load 3 core documents for quick context (recommended)
- **`/read-all-docs`** - Load all 8 documents for comprehensive context

### Essential Documentation (loaded by `/read-essential-docs`)
1. **CLAUDE.md** - Project memory, current state, and quick context (this file)
2. **docs/anti-bloat-guidelines.md** - Core principles preventing over-engineering
3. **docs/roadmap.md** - Living development timeline, decisions, and future plans

### Task-Specific Documentation (additional docs in `/read-all-docs`)
4. **README.md** - Project overview, getting started, and technology stack
5. **docs/mcp-best-practices.md** - Anthropic's official MCP development guidelines
6. **docs/best-practices.md** - EM_CP2 specific development practices
7. **docs/quick-reference.md** - Essential commands and operational guide
8. **docs/configuration-examples.md** - MCP three-tier scoping system explained

---
*Remember: When in doubt, leave it out. Complexity is the enemy of maintainability.*