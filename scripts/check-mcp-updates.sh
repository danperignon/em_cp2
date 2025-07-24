#!/bin/bash

# MCP Server Update Check Script
# Run monthly to check for MCP server updates

echo "🔍 Checking MCP Server Updates - $(date)"
echo "========================================="

# Get current directory (works from any location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📍 Project directory: $PROJECT_DIR"
echo ""

echo "📦 Current active MCP server versions:"
echo "----------------------------------------"

# Check versions of currently configured servers
echo "Everything server (reference/testing):"
npm view @modelcontextprotocol/server-everything version

echo "Memory server (knowledge graph):"
npm view @modelcontextprotocol/server-memory version

echo "Filesystem server (file operations):"
npm view @modelcontextprotocol/server-filesystem version

echo "Git server (repository operations):"
echo "  Using uvx mcp-server-git (latest via uvx)"

echo "Time server (timezone conversions):"
echo "  Using uvx mcp-server-time (latest via uvx)"

echo "GitHub server (remote HTTP):"
echo "  Using GitHub Copilot MCP API (remote service)"

echo ""
echo "🎯 Update procedure for EM_CP2:"
echo "1. Review versions above against your current configurations"
echo "2. Update .mcp.json (project scope) and mcp.json (local scope) as needed"
echo "3. For uvx servers, they auto-update to latest on each run"
echo "4. Test with MCP Inspector: npx @modelcontextprotocol/inspector <server-command>"
echo "5. Verify cross-client compatibility (Claude Desktop, Claude Code, Cline)"

echo ""
echo "📋 Current server architecture:"
echo "- Everything: @modelcontextprotocol/server-everything (npm)"
echo "- Memory: @modelcontextprotocol/server-memory (npm)" 
echo "- Filesystem: @modelcontextprotocol/server-filesystem (npm)"
echo "- Git: mcp-server-git (uvx - auto-latest)"
echo "- Time: mcp-server-time (uvx - auto-latest)"
echo "- GitHub: Remote HTTP server (api.githubcopilot.com)"
echo "- Example: Custom EM_CP2 server (local development)"

echo ""
echo "✅ Update check complete. Next check recommended: $(date -d '+1 month' +'%B %Y' 2>/dev/null || date -v+1m +'%B %Y' 2>/dev/null || echo 'next month')"