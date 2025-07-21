# MCP Configuration Examples

This document provides configuration examples for the three scoping levels supported by MCP: Local, Project, and User.

## Scoping Hierarchy

**Precedence Order**: Local → Project → User (local overrides others)

```
Local Scope (./mcp.json)          # Highest priority
├── Personal configurations
├── Experimental setups
└── Sensitive project credentials

Project Scope (./.mcp.json)       # Team-shared
├── Collaborative servers
├── Project-specific tools
└── Shared development resources

User Scope (~/.mcp.json)          # Lowest priority
├── Personal utilities
├── Cross-project tools
└── Development preferences
```

## Local Scope Configuration

**File**: `./mcp.json` (in project root)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["./node_modules/@em-cp2/filesystem-server/dist/index.js", "/path/to/project"],
      "env": {
        "DEBUG": "true"
      }
    },
    "memory": {
      "command": "node", 
      "args": ["./node_modules/@em-cp2/memory-server/dist/index.js"],
      "env": {
        "MEMORY_PERSIST_PATH": "./local-memory.json",
        "MAX_MEMORY_ITEMS": "1000"
      }
    },
    "api-server": {
      "type": "sse",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer ${LOCAL_API_KEY}",
        "X-Project": "local-development"
      }
    }
  }
}
```

**Use Cases:**
- Development with local API keys
- Project-specific file access paths
- Experimental server configurations
- Override team settings for personal needs

## Project Scope Configuration

**File**: `./.mcp.json` (in project root, committed to git)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "database": {
      "type": "http",
      "url": "${DATABASE_MCP_URL:-https://db.example.com/mcp}",
      "headers": {
        "Authorization": "Bearer ${DATABASE_TOKEN}",
        "X-Environment": "${NODE_ENV:-development}"
      }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {
        "ALLOWED_DOMAINS": "api.openweathermap.org,jsonplaceholder.typicode.com"
      }
    },
    "slack": {
      "command": "node",
      "args": ["./servers/slack-server/dist/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_WORKSPACE": "${SLACK_WORKSPACE}"
      }
    }
  }
}
```

**Use Cases:**
- Team-shared server configurations
- Project-specific integrations (GitHub repo, Slack workspace)
- Environment-specific settings
- Collaborative development tools

## User Scope Configuration  

**File**: `~/.mcp.json` (in user home directory)

```json
{
  "mcpServers": {
    "time": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"]
    },
    "weather": {
      "command": "node",
      "args": ["./personal-servers/weather/dist/index.js"],
      "env": {
        "WEATHER_API_KEY": "${WEATHER_API_KEY}",
        "DEFAULT_LOCATION": "San Francisco, CA"
      }
    },
    "notes": {
      "command": "node",
      "args": ["./personal-servers/notes/dist/index.js"],
      "env": {
        "NOTES_PATH": "~/Documents/notes",
        "SYNC_ENABLED": "true"
      }
    },
    "calculator": {
      "type": "sse",
      "url": "https://calculator-service.example.com/mcp",
      "headers": {
        "X-User": "${USER}",
        "Authorization": "Bearer ${CALCULATOR_TOKEN}"
      }
    }
  }
}
```

**Use Cases:**
- Personal productivity tools
- Cross-project utilities (time, calculator)
- Personal note-taking systems
- User-specific preferences

## Environment Variable Examples

Create `.env` files for each scope:

### Local Environment (`.env.local`)
```bash
# Local development secrets
LOCAL_API_KEY=sk-local-dev-key-12345
DEBUG=true
LOG_LEVEL=debug

# Override team settings
MAX_MEMORY_ITEMS=500
CACHE_TTL=300
```

### Project Environment (`.env`)
```bash
# Team-shared environment variables
GITHUB_TOKEN=ghp_team_token_here
DATABASE_TOKEN=db_prod_token_here  
SLACK_BOT_TOKEN=xoxb-team-slack-token
SLACK_WORKSPACE=company-workspace

# Project settings
NODE_ENV=development
DATABASE_MCP_URL=https://db.company.com/mcp
```

### User Environment (`~/.env`)
```bash
# Personal API keys
WEATHER_API_KEY=your_weather_api_key
CALCULATOR_TOKEN=your_calc_token
USER=your_username

# Personal preferences
NOTES_PATH=/Users/you/Documents/claude-notes
DEFAULT_TIMEZONE=America/New_York
```

## Advanced Configuration Patterns

### Conditional Configuration
```json
{
  "mcpServers": {
    "database": {
      "type": "http",
      "url": "${NODE_ENV=production?https://prod-db.com:http://localhost:5432}/mcp",
      "headers": {
        "Authorization": "Bearer ${DATABASE_TOKEN}",
        "X-Environment": "${NODE_ENV:-development}"
      }
    }
  }
}
```

### Multiple Transport Types
```json
{
  "mcpServers": {
    "local-filesystem": {
      "command": "node",
      "args": ["./servers/filesystem/dist/index.js"]
    },
    "remote-api": {
      "type": "sse", 
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    },
    "http-service": {
      "type": "http",
      "url": "https://service.example.com/mcp",
      "timeout": 30000
    }
  }
}
```

### Server Groups by Environment
```json
{
  "mcpServers": {
    "memory-dev": {
      "command": "node",
      "args": ["./servers/memory/dist/index.js"],
      "env": {
        "MEMORY_PERSIST_PATH": "./dev-memory.json",
        "NODE_ENV": "development"
      }
    },
    "memory-prod": {
      "type": "sse",
      "url": "https://memory-service.prod.com/mcp",
      "headers": {
        "Authorization": "Bearer ${PROD_MEMORY_TOKEN}",
        "X-Environment": "production"
      }
    }
  }
}
```

## Security Best Practices

### 1. Secret Management
- Store secrets in environment variables, not configuration files
- Use different secrets for each scope/environment
- Never commit secrets to version control

### 2. Environment Variable Patterns
```bash
# Good: Scoped and descriptive
LOCAL_API_KEY=...
DEV_DATABASE_TOKEN=...
PROD_SLACK_TOKEN=...

# Bad: Generic and confusing
TOKEN=...
KEY=...
SECRET=...
```

### 3. Configuration File Security
```json
{
  "mcpServers": {
    "secure-api": {
      "type": "https",
      "url": "https://secure-api.com/mcp",
      "headers": {
        "Authorization": "Bearer ${SECURE_TOKEN}",
        "X-Signature": "${API_SIGNATURE}"
      },
      "timeout": 10000,
      "retries": 3
    }
  }
}
```

## Troubleshooting Configuration

### Check Configuration Precedence
```bash
# View effective configuration
claude config show

# Debug configuration loading
DEBUG=mcp:config claude
```

### Validate Environment Variables
```bash
# Check if variables are set
echo $GITHUB_TOKEN
echo $DATABASE_TOKEN

# Test variable expansion
envsubst < .mcp.json
```

### Common Issues

1. **Environment Variables Not Found**
   ```json
   // Bad: No fallback
   "token": "${MISSING_TOKEN}"
   
   // Good: With fallback
   "token": "${API_TOKEN:-default_dev_token}"
   ```

2. **Scope Conflicts**
   ```bash
   # Local overrides project
   ./mcp.json          # Wins
   ./.mcp.json         # Ignored
   
   # Check effective config
   claude config show --scope=all
   ```

3. **Path Resolution**
   ```json
   // Bad: Relative paths
   "command": "../servers/my-server"
   
   // Good: Absolute or workspace-relative
   "command": "node",
   "args": ["./node_modules/@em-cp2/my-server/dist/index.js"]
   ```

---

*For more configuration options, see the [MCP Best Practices](./mcp-best-practices.md) documentation.*