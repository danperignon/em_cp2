# EM_CP2 Project Memory

## Quick Context
EM_CP2 is a clean monorepo implementation of MCP (Model Context Protocol) servers. Built from scratch to replace bloated em_cp v1, focusing on maintainability and single-purpose servers.

**Current State**: 7 active MCP servers | ~850 lines avg per server | 87% smaller than v1

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
├── docs/                      # Documentation
│   ├── anti-bloat-guidelines.md  # IMPORTANT: Read before developing
│   ├── mcp-best-practices.md    # Anthropic official guidelines
│   └── roadmap.md               # Detailed project history
├── scripts/                   # Build and automation
├── .mcp.json                  # Project scope MCP configurations
├── mcp.json                   # Local scope MCP configurations
└── CLAUDE.md                  # This file (project context)
```

## Active Servers
| Server | Purpose | Tools | Command |
|--------|---------|-------|---------|
| Git | Repository operations | 13 | `uvx mcp-server-git` |
| Time | Timezone conversions | 2 | `uvx mcp-server-time` |
| Memory | Knowledge graph storage | 5 | `npx @modelcontextprotocol/server-memory` |
| GitHub | Issues, PRs, workflows | HTTP | `https://api.githubcopilot.com/mcp/` |
| Filesystem | Secure file operations | 6 | `npx @modelcontextprotocol/server-filesystem` |
| Example | Framework demo | 3 | `node ./servers/example-server/dist/index.js` |
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
- **Repository**: https://github.com/danperignon/em_cp2
- **Roadmap**: `docs/roadmap.md` (detailed timeline & decisions)
- **Guidelines**: `docs/mcp-best-practices.md` + `docs/anti-bloat-guidelines.md`
- **Configs**: `.mcp.json` (project) / `mcp.json` (local)

---
*Remember: When in doubt, leave it out. Complexity is the enemy of maintainability.*