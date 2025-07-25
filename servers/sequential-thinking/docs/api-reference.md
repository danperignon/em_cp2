# Sequential Thinking API Reference

Complete technical reference for integrating with the Sequential Thinking MCP server.

## Overview

The Sequential Thinking server provides:
- **1 MCP Tool**: `decompose_problem` - Core problem decomposition functionality  
- **3 MCP Resources**: Live state, pattern library, and quality metrics
- **3 MCP Prompts**: Problem analysis, strategy generation, and validation

## Tools

### `decompose_problem`

Break down complex problems into manageable sequential steps using cognitive patterns with integrated learning and artifact generation.

#### Input Schema

```typescript
interface DecomposeProblemArgs {
  problem_description: string;     // Required: 10-5000 characters
  decomposition_strategy?: DecompositionStrategy; // Optional: Strategy override
  depth_limit?: number;           // Optional: 1-10, default 5
}

type DecompositionStrategy = 
  | 'top_down'      // Analytical problems - start broad, refine details
  | 'bottom_up'     // Creative problems - build from components  
  | 'divide_conquer' // Complex problems - split into independent parts
  | 'incremental'   // Procedural problems - progressive elaboration
  | 'parallel'      // Research problems - simultaneous workstreams
  | 'iterative';    // Optimization problems - refine through cycles
```

#### Response Format

```typescript
interface DecomposeProblemResponse {
  success: boolean;
  data?: ReasoningState;
  error?: string;
  metadata?: {
    memoryInsights: CognitiveInsights;
    qualityAssessment: QualityAssessment;  
    artifactManifest: ArtifactManifest;
  };
}

interface ReasoningState {
  id: string;                    // Unique session identifier
  problem: ProblemDefinition;    // Analyzed problem structure
  strategy: StrategyDefinition;  // Selected decomposition strategy
  steps: ReasoningStep[];        // Generated solution steps
  totalSteps: number;           // Total number of steps
  currentStep: number;          // Current execution position
  timestamp: number;            // Session creation time
}

interface ReasoningStep {
  id: string;                   // Unique step identifier
  index: number;                // Step sequence number
  description: string;          // What this step accomplishes
  reasoning: string;            // Why this step is necessary
  confidence: number;           // Quality confidence (0-1)
  status: 'pending' | 'active' | 'completed' | 'failed';
  dependencies: string[];       // Required predecessor step IDs
  inputs: Record<string, any>;  // Required inputs for execution
  outputs: Record<string, any>; // Expected outputs from execution
  errors?: string[];           // Any validation errors
}
```

#### Memory Integration Response

```typescript
interface CognitiveInsights {
  recommendedStrategy?: DecompositionStrategy; // Memory-based recommendation
  confidence: number;                         // Recommendation confidence (0-1)
  similarProblems: number;                   // Count of similar past problems
  reasoning: string;                         // Explanation of recommendation
}
```

#### Filesystem Integration Response

```typescript
interface ArtifactManifest {
  reasoningStateId: string;     // Associated reasoning session
  workspacePath: string;        // Generated workspace directory
  artifacts: GeneratedArtifact[]; // List of created files
  createdAt: number;           // Workspace creation timestamp
  totalFiles: number;          // Total artifact count
}

interface GeneratedArtifact {
  type: 'markdown' | 'json' | 'text' | 'template';
  filename: string;            // File name
  path: string;               // Full file path
  description: string;        // Purpose description
  size: number;              // File size in bytes
  createdAt: number;         // Creation timestamp
}
```

#### Example Usage

```javascript
// Basic problem decomposition
const result = await tools.decompose_problem({
  problem_description: "Build a real-time chat application with React and Node.js"
});

// With strategy override
const result = await tools.decompose_problem({
  problem_description: "Optimize database performance for high-traffic application",
  decomposition_strategy: "divide_conquer",
  depth_limit: 8
});

// Access integrated results
console.log({
  steps: result.data.steps.length,
  strategy: result.data.strategy.name,
  memoryRecommendation: result.metadata.memoryInsights.recommendedStrategy,
  artifactsGenerated: result.metadata.artifactManifest.totalFiles,
  confidence: result.metadata.qualityAssessment.confidence
});
```

#### Error Handling

```typescript
interface ErrorResponse {
  success: false;
  error: string;
}

// Common errors:
// - "Input validation failed: problem_description is required"
// - "Input validation failed: problem_description must be at least 10 characters"  
// - "Invalid decomposition_strategy. Must be one of: top_down, bottom_up, ..."
// - "depth_limit must be between 1 and 10"
// - "Problem analysis failed: insufficient context provided"
// - "Decomposition engine error: strategy execution failed"
```

## Resources

### `thinking://current_state`

Live server state with integration status and active sessions.

#### Response Format

```typescript
interface CurrentState {
  activeStates: number;        // Number of active reasoning sessions
  timestamp: number;          // Current server timestamp
  serverStatus: 'active';     // Server operational status
  integrations: {
    memory: MemoryIntegrationStats;
    filesystem: FilesystemIntegrationStats;
  };
}

interface MemoryIntegrationStats {
  isAvailable: boolean;       // Memory server connection status
  totalPatterns: number;      // Stored reasoning patterns count
  totalSolutions: number;     // Stored solution count
  lastSync: number;          // Last synchronization timestamp
}

interface FilesystemIntegrationStats {
  isAvailable: boolean;       // Filesystem server connection status  
  baseDirectory: string;      // Workspace base directory path
  totalWorkspaces: number;    // Created workspace count
  totalArtifacts: number;     // Generated artifact count
}
```

#### Example Usage

```javascript
const state = await resources.read('thinking://current_state');
const data = JSON.parse(state.contents[0].text);

console.log({
  activeProblems: data.activeStates,
  memoryAvailable: data.integrations.memory.isAvailable,
  filesystemAvailable: data.integrations.filesystem.isAvailable,
  totalPatterns: data.integrations.memory.totalPatterns
});
```

### `thinking://pattern_library`

Available cognitive patterns and decomposition strategies.

#### Response Format

```typescript
interface PatternLibrary {
  availablePatterns: string[];    // Cognitive pattern identifiers
  strategies: DecompositionStrategy[]; // Available decomposition strategies
}

// Pattern types:
// - 'analytical_breakdown'    - Systematic analysis and evaluation
// - 'creative_exploration'    - Innovation and ideation workflows  
// - 'procedural_execution'    - Step-by-step implementation
// - 'diagnostic_investigation' - Problem identification and debugging
// - 'strategic_planning'      - High-level planning and coordination
// - 'research_synthesis'      - Information gathering and analysis
// - 'optimization_tuning'     - Performance and efficiency improvement
```

### `thinking://quality_metrics`

Quality assessment criteria and validation framework.

#### Response Format

```typescript
interface QualityMetrics {
  qualityDimensions: string[];    // Assessment criteria
  validationCriteria: string[];   // Validation checks
}

// Quality dimensions:
// - 'completeness'    - Solution covers all requirements
// - 'feasibility'     - Steps are practically executable  
// - 'efficiency'      - Optimal resource utilization
// - 'robustness'      - Handles edge cases and errors
// - 'innovation'      - Creative and effective approaches
// - 'confidence'      - Overall solution reliability

// Validation criteria:
// - 'logicalConsistency'   - Steps follow logical sequence
// - 'feasibilityCheck'     - Each step is practically achievable
// - 'constraintCompliance' - Solution respects given constraints
// - 'stakeholderAlignment' - Addresses all stakeholder needs
// - 'riskAssessment'       - Identifies and mitigates risks
```

## Prompts

### `analyze_problem_structure`

Generate cognitive pattern-based problem analysis.

#### Arguments

```typescript
interface AnalyzeProblemArgs {
  problem_description: string;  // Required: Problem to analyze
  include_patterns?: boolean;   // Optional: Include pattern matching
}
```

#### Generated Prompt

```
Analyze the following problem structure and identify key components:

[problem_description]

Please provide:
1. Problem classification and domain
2. Key constraints and requirements  
3. Success criteria and goal state
4. Complexity assessment
[5. Matching cognitive patterns and recommended strategies] // if include_patterns=true
```

### `generate_solution_strategy`

Create comprehensive solution strategy based on problem analysis.

#### Arguments

```typescript
interface GenerateStrategyArgs {
  problem_context: string;      // Required: Problem context
  strategy_preference?: string; // Optional: Preferred approach
}
```

#### Generated Prompt

```
Based on the following problem context, generate a comprehensive solution strategy:

[problem_context]

Consider:
1. Optimal decomposition approach
2. Resource requirements and constraints
3. Risk factors and mitigation strategies  
4. Success metrics and validation methods

[Preferred strategy: [strategy_preference]] // if provided
```

### `validate_reasoning_chain`

Validate reasoning chain quality and provide improvement recommendations.

#### Arguments

```typescript
interface ValidateChainArgs {
  reasoning_state: string;      // Required: Reasoning state to validate
}
```

#### Generated Prompt

```
Please validate the following reasoning chain for quality and feasibility:

[reasoning_state]

Evaluation criteria:
1. Logical consistency and flow
2. Step feasibility and clarity
3. Dependency correctness
4. Goal alignment
5. Overall solution quality

Provide specific feedback and improvement recommendations.
```

## Integration Patterns

### Memory-Enhanced Workflow

```javascript
// 1. Let memory recommend strategy
const result = await tools.decompose_problem({
  problem_description: "Complex problem description...",
  // Don't specify strategy - let memory recommend
});

// 2. Check memory insights
const insights = result.metadata.memoryInsights;
if (insights.confidence > 0.8) {
  console.log(`Using proven strategy: ${insights.recommendedStrategy}`);
  console.log(`Based on ${insights.similarProblems} similar problems`);
}

// 3. Memory automatically stores this session for future learning
```

### Filesystem Artifact Workflow

```javascript
// 1. Solve problem with artifact generation
const result = await tools.decompose_problem({
  problem_description: "Problem requiring comprehensive documentation..."
});

// 2. Access generated workspace
const manifest = result.metadata.artifactManifest;
console.log(`Workspace created: ${manifest.workspacePath}`);

// 3. Use generated artifacts
manifest.artifacts.forEach(artifact => {
  console.log(`${artifact.type}: ${artifact.filename} - ${artifact.description}`);
});

// Generated files:
// - solution-overview.md      (executive summary)
// - step-by-step-guide.md     (implementation guide)  
// - reasoning-state.json      (complete technical data)
// - reusable-template.md      (template for similar problems)
// - steps/*.md               (individual step details)
```

### Quality Assessment Workflow

```javascript
const result = await tools.decompose_problem({
  problem_description: "Problem description..."
});

const quality = result.metadata.qualityAssessment;

// Check overall confidence
if (quality.confidence < 0.8) {
  console.log("Low confidence - consider:");
  console.log("- More detailed problem description");
  console.log("- Specific constraints and requirements");
  console.log("- Different decomposition strategy");
}

// Review specific quality dimensions
console.log({
  completeness: quality.completeness,   // Are all requirements covered?
  feasibility: quality.feasibility,     // Are steps practically achievable?
  efficiency: quality.efficiency,       // Is resource usage optimal?
  robustness: quality.robustness,       // Does it handle edge cases?
  innovation: quality.innovation,       // Is the approach creative/effective?
});
```

## Error Reference

### Validation Errors

```typescript
// Input validation
"problem_description is required"
"problem_description must be a string"
"problem_description must be at least 10 characters"
"problem_description cannot exceed 5000 characters"
"Invalid decomposition_strategy. Must be one of: top_down, bottom_up, divide_conquer, incremental, parallel, iterative"
"depth_limit must be a number"  
"depth_limit must be between 1 and 10"

// Processing errors
"Problem analysis failed: insufficient context provided"
"Decomposition engine error: strategy execution failed"
"Validation engine error: quality assessment failed"
"Memory integration error: pattern storage failed"
"Filesystem integration error: artifact generation failed"
```

### Integration Errors

```typescript
// Memory integration
"Memory server not available - check MCP configuration"
"Memory pattern storage failed - insufficient data"
"Memory retrieval error - pattern database unavailable"

// Filesystem integration  
"Filesystem server not available - check MCP configuration"
"Artifact generation failed - insufficient disk space"
"Workspace creation error - permission denied"
```

## Performance Characteristics

- **Response Time**: <2s for typical problems, <5s for complex (depth 8+)
- **Memory Usage**: ~50MB base + ~5MB per active reasoning session
- **Artifact Generation**: ~1-5MB per workspace depending on problem complexity
- **Learning Storage**: ~1KB per stored pattern, ~10KB per complete solution
- **Concurrent Sessions**: Supports multiple simultaneous decomposition requests

## Version Compatibility

- **Sequential Thinking Server**: v2.0.0+
- **MCP Protocol**: v0.5.0+
- **Memory Server**: Any version with pattern storage support
- **Filesystem Server**: Any version with file creation support
- **EM_CP2 Core**: v2.0.0+

---

*For implementation examples and workflows, see [integration-examples.md](./integration-examples.md) and [cognitive-workspace-guide.md](./cognitive-workspace-guide.md).*