# Read All EM_CP2 Documentation

Load comprehensive EM_CP2 project documentation by reading all 8 reference files:

## Core Documentation
1. **README.md** - Read the project overview, technology stack, and getting started guide
2. **CLAUDE.md** - Read the project memory and current context (skip if already loaded)

## Development Guidelines
3. **docs/roadmap.md** - Read the living development timeline, tracking progress and decisions
4. **docs/anti-bloat-guidelines.md** - Read and internalize the core development principles (especially the 94% reduction case study)
5. **docs/mcp-best-practices.md** - Read Anthropic's official MCP development guidelines
6. **docs/best-practices.md** - Read EM_CP2 specific development practices

## Operational References
7. **docs/quick-reference.md** - Read the essential commands and operational guide
8. **docs/configuration-examples.md** - Read about MCP's three-tier scoping system

## Instructions
1. Read each document systematically using the Read tool
2. Pay special attention to:
   - Anti-bloat principles (keep servers <1,000 lines)
   - Single responsibility pattern
   - The Sequential Thinking server simplification case study
   - MCP best practices from Anthropic
   - Configuration scoping (local → project → user)
3. After reading, provide a brief confirmation that all reference docs have been loaded

## Purpose
This command loads ALL documentation for comprehensive context when working on complex tasks, new features, or deep architectural work.

## When to Use
- Creating new MCP servers
- Major refactoring or architectural changes  
- Initial project onboarding
- Debugging complex cross-server issues
- Setting up new client configurations

## Quick Context Alternative
For most tasks, use `/read-essential-docs` which loads only 3 core documents (62.5% less context).