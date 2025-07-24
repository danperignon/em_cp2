# EM_CP2 Best Practices

## Directory Management

### 1. **Use .gitignore Properly**
- Never commit `node_modules/`, `dist/`, or `venv/` directories
- Exclude all build artifacts and temporary files
- Keep the repository focused on source code

### 2. **Shared Dependencies**
- All common dependencies go in the root `package.json`
- Server-specific dependencies go in their respective `package.json`
- Use workspace protocol: `"@em-cp2/core": "workspace:*"`

### 3. **Avoid Duplication**
- Documentation templates in `/docs/templates/`
- Shared utilities in `/packages/shared/`
- Common types in `/packages/types/`

## Project Management

### 1. **Monorepo Structure**
```
em_cp2/
├── servers/     # Independent MCP servers
│   └── example-server/  # Custom server with client configs
├── packages/    # Shared code
├── docs/        # Centralized documentation
├── scripts/     # Automation scripts
├── .mcp.json    # Project scope configurations
└── mcp.json     # Local scope configurations
```

### 2. **Version Control**
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Tag releases with semantic versioning
- Keep a CHANGELOG.md updated

### 3. **Build Performance**
- Turborepo caches build outputs
- Use `pnpm build` for full builds
- Use `pnpm dev` for watch mode
- Clean with `pnpm clean` when needed

## Cross-Client Support

### 1. **Configuration Files**
Each server should have:
- `claude-desktop.json` - Claude Desktop config
- `cline.json` - Cline/VSCode config
- Single source implementation in `src/`

### 2. **Environment Differences**
Handle client-specific behavior through:
```typescript
const isClaudeDesktop = process.env.MCP_CLIENT === 'claude-desktop';
const isCline = process.env.MCP_CLIENT === 'cline';
```

### 3. **Testing**
- Test with both clients during development
- Use environment variables for client-specific tests
- Document any client-specific limitations

## Code Quality

### 1. **TypeScript**
- Strict mode enabled
- No implicit any
- Proper error handling with types

### 2. **Linting & Formatting**
- ESLint for code quality
- Prettier for consistent formatting
- Husky for pre-commit hooks

### 3. **Documentation**
- JSDoc comments for public APIs
- README.md for each server
- Examples in documentation

## Performance

### 1. **Dependencies**
- Audit dependencies regularly
- Remove unused dependencies
- Use `pnpm why <package>` to check usage

### 2. **Build Optimization**
- Incremental TypeScript compilation
- Turborepo remote caching (optional)
- Parallel builds with `turbo`

### 3. **Runtime Performance**
- Lazy load heavy dependencies
- Use streaming for large data
- Implement proper error boundaries