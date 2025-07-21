#!/bin/bash

# MCP Server Update Check Script
# Run monthly to check for MCP server updates

echo "🔍 Checking MCP Server Updates - $(date)"
echo "========================================="

cd /Users/danielrowe/Desktop/em_cp2

echo "📦 Current official MCP server versions:"
echo "----------------------------------------"

# Check current versions in configs
echo "Memory server:"
npm view @modelcontextprotocol/server-memory version
echo "GitHub server:" 
npm view @modelcontextprotocol/server-github version
echo "Filesystem server:"
npm view @modelcontextprotocol/server-filesystem version
echo "Puppeteer server:"
npm view @modelcontextprotocol/server-puppeteer version

echo ""
echo "🎯 Next steps to perform:"
echo "1. Compare versions above with your current configs"
echo "2. Update Claude Desktop config: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "3. Update Cline config: ~/Library/Application Support/VSCodium/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
echo "4. Test servers with MCP Inspector: npx @modelcontextprotocol/inspector <server-command>"
echo "5. Check MCP SDK updates: npm view @modelcontextprotocol/sdk version"

echo ""
echo "📋 Custom servers to rebuild if needed:"
echo "- browsertools, time, web-search, web-research, markdownify, excel, obsidian, sequentialthinking-tools"

echo ""
echo "✅ Update check complete. Set next reminder for $(date -v+1m +'%B %Y')"