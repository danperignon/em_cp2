# MCP Server Migration Plan - Living Document

**Last Updated**: 2025-07-21  
**Status**: Active Migration  
**Approach**: Serial implementation - one server at a time

## Overview

This document tracks the migration of MCP servers from the legacy em_cp setup to the new em_cp2 monorepo structure. Each server will be implemented, tested, and evaluated individually before proceeding to the next.

## Current State Analysis

### Official MCP Reference Servers (2025)
From modelcontextprotocol/servers repository:
1. **Everything** - Reference/test server with prompts, resources, and tools
2. **Fetch** - Web content fetching and conversion
3. **Filesystem** - Secure file operations with configurable access controls  
4. **Git** - Tools to read, search, and manipulate Git repositories
5. **Memory** - Knowledge graph-based persistent memory system
6. **Sequential Thinking** - Dynamic and reflective problem-solving
7. **Time** - Time and timezone conversion capabilities

### Currently Configured Servers
| Server | Type | Location | Status | Decision |
|--------|------|----------|---------|----------|
| Filesystem | Official | npx (latest) | Active | ✅ Keep (already using npx) |
| Fetch | Official | uvx | Active | ✅ Keep (already using uvx) |
| Sequential Thinking | Official | em_cp directory | Outdated | 🔄 Needs migration |
| Memory | Official | Local package | Outdated | 🔄 Needs update |
| Puppeteer | Archived | npx | Active | ❓ Evaluate need |
| GitHub | Archived | Local package | Active | ❓ Evaluate need |
| Excel | Custom | em_cp | Active | ❓ TBD |
| Browsertools | Custom | MCP wrapper | Active | ❓ TBD |
| Web-search | Custom | em_cp | Active | ❓ TBD |
| Web-research | Custom | em_cp | Active | ❓ TBD |
| Text-editor | Third-party | uvx | Active | ❓ TBD |
| Markdownify | Custom | em_cp | Active | ❓ TBD |
| Obsidian | Custom | em_cp | Active | ❓ TBD |

## Migration Plan

### Phase 1: Official Server Implementation (Current)
Implementing missing official servers in order of utility:

#### 1. Git Server ⏳ Pending
- **Purpose**: Repository operations, code search, version control
- **Implementation**: Use npx for always-latest version
- **Testing**: Basic git operations on em_cp2 repo
- **Decision**: _TBD after testing_

#### 2. Time Server ⏳ Pending  
- **Purpose**: Time/timezone conversions and utilities
- **Implementation**: Migrate from custom to official version
- **Testing**: Compare with existing custom implementation
- **Decision**: _TBD after testing_

### Phase 2: Server Updates 🔮 Future
- Memory server - Update to latest version
- Sequential Thinking - Migrate to em_cp2 structure
- Everything server - Consider for development/testing

### Phase 3: Custom Server Evaluation 🔮 Future
Each custom server will be evaluated for:
1. Current usage frequency
2. Available alternatives in 2025
3. Maintenance burden vs benefit
4. Security considerations (API keys, etc.)

### Phase 4: New Server Discovery 🔮 Future
Research and evaluate new MCP servers available in 2025:
- Check modelcontextprotocol/servers for new additions
- Review community servers for useful tools
- Consider Microsoft C# SDK servers

## Implementation Details

### Standard Setup Process
1. **For Official Servers**:
   ```bash
   # Use npx for Node.js servers (always latest)
   npx -y @modelcontextprotocol/server-name
   
   # Use uvx for Python servers (always latest)
   uvx mcp-server-name
   ```

2. **For Custom Servers in em_cp2**:
   - Create new package in `servers/` directory
   - Extend MCPServer from `@em-cp2/core`
   - Include cross-client configs
   - Build with Turborepo

### Configuration Updates
- **Claude Desktop**: Update claude_desktop_config.json
- **Cline**: Update VSCodium settings
- **Claude Code**: Use `claude mcp add` commands

## Progress Tracking

### Completed ✅
- [x] Project analysis and planning
- [x] Identified official vs custom servers
- [x] Created migration strategy

### In Progress 🚧
- [ ] Git server implementation
- [ ] Time server implementation

### Upcoming 📋
- [ ] Memory server update
- [ ] Custom server evaluations
- [ ] New server research

## Decision Log

| Date | Server | Decision | Rationale |
|------|--------|----------|-----------|
| 2025-07-21 | Plan Created | Serial approach | Allows evaluation of each server's utility |

## Security Considerations

### API Keys to Migrate
- GitHub PAT (currently exposed in config)
- Google Search API credentials  
- Obsidian API key
- Consider using environment variables or secure vault

### Trust Boundaries
- Only use official or well-vetted community servers
- Review custom server code before deployment
- Implement proper sandboxing where needed

## Notes

- Anthropic GitHub and Puppeteer servers are now archived but still functional
- Microsoft is developing C# SDK for MCP (2025)
- OpenAI and Google DeepMind adopted MCP standard in 2025
- Monthly update checks recommended via `scripts/check-mcp-updates.sh`

---

This is a living document. Updates will be made as servers are implemented and decisions are finalized.