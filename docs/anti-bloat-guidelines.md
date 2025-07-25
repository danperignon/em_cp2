# Anti-Bloat Guidelines for EM_CP2 Development

## Overview

These guidelines exist to prevent the over-engineering that occurred with the Sequential Thinking server (13,441 lines → 821 lines). Follow these principles to keep servers focused, maintainable, and aligned with MCP philosophy.

## Core Principles

### 1. **Single Responsibility**
- Each MCP server should do ONE thing well
- If you need multiple features, create multiple servers
- If a server description requires "and" multiple times, it's too complex

### 2. **Size Limits**
- **Target**: < 1,000 lines total per server
- **Maximum**: 2,000 lines (requires justification)
- **Per file**: < 400 lines (split if larger)
- **Per function**: < 50 lines

### 3. **Tool Count**
- **Ideal**: 1-3 MCP tools per server
- **Maximum**: 5 tools (with strong justification)
- **Red flag**: > 10 tools means scope creep

## Red Flags to Avoid

### ❌ Enterprise Patterns in MCP Context
- Multi-client session management
- Complex locking mechanisms
- Distributed system patterns
- Event-driven architectures
- State synchronization engines

**Why**: MCP servers typically handle single-client connections. These patterns add complexity without value.

### ❌ Premature Abstractions
- Abstract base classes before concrete need
- Generic frameworks for hypothetical use cases
- Plugin systems without actual plugins
- Configuration systems for unchanging values

**Why**: YAGNI (You Aren't Gonna Need It). Build for current needs, not imagined futures.

### ❌ Feature Creep Indicators
- "While we're at it, let's also add..."
- "It might be useful to have..."
- "In case we need it later..."
- "For maximum flexibility..."

**Why**: Every feature adds maintenance burden. Only add what provides immediate value.

## Good Practices

### ✅ Start Minimal
```typescript
// GOOD: Start with core functionality
export class SimpleServer {
  async handleTool(name: string, args: any) {
    // One clear purpose
  }
}

// BAD: Start with everything
export class ComplexServer {
  private sessionManager: SessionManager;
  private lockManager: LockManager;
  private eventBus: EventBus;
  private conflictResolver: ConflictResolver;
  // ... 10 more subsystems
}
```

### ✅ Compose, Don't Complicate
- Use existing MCP servers for additional features
- Memory server for persistence
- Filesystem server for file operations
- Don't reimplement what already exists

### ✅ Clear Boundaries
```typescript
// GOOD: Clear, focused interface
interface ProblemDecomposer {
  decompose(problem: string): Promise<Steps[]>;
}

// BAD: Kitchen sink interface
interface EverythingManager {
  decompose(): Promise<any>;
  manage(): Promise<any>;
  coordinate(): Promise<any>;
  synchronize(): Promise<any>;
  // ... 20 more methods
}
```

## Review Checklist

Before committing any new server or major feature:

- [ ] **Purpose**: Can you explain the server's purpose in one sentence?
- [ ] **Size**: Is the implementation under 1,000 lines?
- [ ] **Dependencies**: Are you leveraging existing servers instead of reimplementing?
- [ ] **Complexity**: Would a new developer understand it in 30 minutes?
- [ ] **Tools**: Does each MCP tool have a clear, single purpose?
- [ ] **Value**: Does every line of code provide immediate value?

## Case Study: Sequential Thinking Server

### What Went Wrong
- Started with simple problem decomposition
- Added multi-client management (unnecessary)
- Added locking and conflict resolution (overkill)
- Added event systems and monitoring (enterprise patterns)
- Result: 13,441 lines of unmaintainable code

### The Fix
- Removed everything except core decomposition
- Kept the 6 cognitive strategies
- Simple integration points
- Result: 821 lines of focused, maintainable code

### Lesson Learned
**Complexity is the enemy of maintainability.** When in doubt, leave it out.

## Enforcement

1. **Code Reviews**: Use this document as a checklist
2. **Metrics**: Track lines of code per server
3. **Refactoring**: If a server exceeds limits, split or simplify
4. **Documentation**: Complexity requires justification in writing

## Remember

> "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry

MCP servers should embody this principle. Keep them simple, focused, and valuable.