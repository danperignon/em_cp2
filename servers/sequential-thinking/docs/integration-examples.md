# Sequential Thinking Integration Examples

This document demonstrates how the Sequential Thinking server works as the **cognitive orchestrator** within the EM_CP2 ecosystem, coordinating with Memory and Filesystem servers to create a powerful "Cognitive Workspace."

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Memory-Enhanced Problem Solving](#memory-enhanced-problem-solving)
3. [Artifact Generation Workflows](#artifact-generation-workflows)
4. [Multi-Strategy Optimization](#multi-strategy-optimization)
5. [Complex Development Scenarios](#complex-development-scenarios)
6. [Research and Analysis Integration](#research-and-analysis-integration)
7. [Integration Testing](#integration-testing)

## Quick Start Guide

### Basic Setup

Ensure Sequential Thinking server is configured in your MCP client:

```bash
# Build the server
cd servers/sequential-thinking
pnpm build

# Test server connection
node dist/index.js
```

### Simple Problem Decomposition

```javascript
// Basic problem solving with integrated learning
const result = await tools.decompose_problem({
  problem_description: "Create a user authentication system for a web application"
});

console.log(result);
// Returns:
// - Structured reasoning state with steps
// - Memory insights and recommendations
// - Generated artifacts in workspace
// - Quality assessment metrics
```

## Memory-Enhanced Problem Solving

The Sequential Thinking server learns from previous solutions to provide better recommendations.

### First Problem - Establishing Pattern

```javascript
// Solve an initial problem to establish learning pattern
const firstResult = await tools.decompose_problem({
  problem_description: `
    Debug a performance issue in a React application where the dashboard 
    is loading slowly. The issue appears to be related to excessive 
    re-renders and large data sets.
  `,
  decomposition_strategy: "divide_conquer"
});

// Server stores:
// - Problem pattern: "performance + react + debugging"
// - Successful strategy: "divide_conquer"
// - Quality metrics and execution details
```

### Second Problem - Leveraging Memory

```javascript
// Solve a similar problem - server uses learned patterns
const secondResult = await tools.decompose_problem({
  problem_description: `
    Optimize performance in a Vue.js application where the user list 
    page is slow. Users report that the page takes several seconds 
    to load and update.
  `
  // Note: No strategy specified - let memory recommend
});

// Memory integration provides:
// - Strategy recommendation: "divide_conquer" (based on similarity)
// - Confidence score: High (based on previous success)
// - Similar problems count: 1+
// - Adaptation suggestions for Vue.js vs React differences
```

### Memory Insights Analysis

```javascript
// Access memory insights from the result
const memoryInsights = secondResult.metadata.memoryInsights;

console.log({
  recommendedStrategy: memoryInsights.recommendedStrategy, // "divide_conquer"
  confidence: memoryInsights.confidence, // 0.85
  similarProblems: memoryInsights.similarProblems, // 1
  reasoning: "Found similar performance debugging pattern with high success rate"
});
```

## Artifact Generation Workflows

The Filesystem integration creates comprehensive documentation for every reasoning session.

### Comprehensive Artifact Example

```javascript
const result = await tools.decompose_problem({
  problem_description: `
    Plan and implement a CI/CD pipeline for a microservices architecture with:
    - Automated testing at multiple levels
    - Docker containerization  
    - Kubernetes deployment
    - Monitoring and alerting
    - Security scanning
    - Documentation generation
  `,
  depth_limit: 8
});

// Generated workspace structure:
// 2024-01-24-planning-a1b2c3/
// ├── manifest.json                 # Artifact catalog
// ├── solution-overview.md          # Comprehensive analysis
// ├── step-by-step-guide.md         # Execution instructions
// ├── reasoning-state.json          # Complete data export
// ├── reusable-template.md          # Template for similar problems
// └── steps/                        # Individual step artifacts
//     ├── step-1-analyze-requirements.md
//     ├── step-2-design-architecture.md
//     ├── step-3-implement-testing.md
//     └── ... (additional steps)
```

### Artifact Content Examples

#### Solution Overview (solution-overview.md)
```markdown
# Solution Overview

## Problem Definition
**Description:** Plan and implement a CI/CD pipeline for microservices...
**Domain:** DevOps  
**Complexity:** High  
**Goal State:** Production-ready CI/CD pipeline with comprehensive testing

## Solution Approach
**Strategy:** top_down (Decomposition)  
**Total Steps:** 12  
**Average Confidence:** 87.3%

## Quick Start
1. Review the [step-by-step guide](./step-by-step-guide.md)
2. Check individual step details in [steps/](./steps/)
3. Use the [reusable template](./reusable-template.md) for similar projects
```

#### Reusable Template (reusable-template.md)
```markdown
# CI/CD Pipeline Planning Template

## When to Use This Template
- **Problem Domain:** DevOps
- **Complexity Level:** High
- **Problem Type:** Contains keywords like: pipeline, deployment, testing, monitoring

## Template Steps
### 1. [Adapt]: Analyze current architecture and requirements
- **Reasoning Pattern:** Start with infrastructure assessment
- **Key Considerations:** [customize based on specific technology stack]
- **Success Criteria:** [define specific deployment metrics]

### 2. [Adapt]: Design pipeline architecture
- **Reasoning Pattern:** Consider microservices-specific needs
- **Key Considerations:** [customize for container orchestration platform]
- **Success Criteria:** [define scalability and reliability requirements]
```

## Multi-Strategy Optimization

Test different approaches to find the optimal strategy for specific problem types.

### Strategy Comparison Workflow

```javascript
// Test multiple strategies for the same problem
const strategies = ['top_down', 'bottom_up', 'divide_conquer', 'iterative'];
const baseProblem = 'Analyze and optimize database query performance for an e-commerce platform';

const results = [];

for (const strategy of strategies) {
  const result = await tools.decompose_problem({
    problem_description: baseProblem,
    decomposition_strategy: strategy,
    depth_limit: 5
  });
  
  results.push({
    strategy,
    steps: result.data.steps.length,
    confidence: result.metadata.qualityAssessment.confidence,
    artifacts: result.metadata.artifactManifest.totalFiles
  });
}

// Analyze which strategy worked best
const bestStrategy = results.reduce((best, current) => 
  current.confidence > best.confidence ? current : best
);

console.log(`Optimal strategy: ${bestStrategy.strategy} with ${bestStrategy.confidence * 100}% confidence`);
```

### Strategy Learning Over Time

```javascript
// After multiple problem-solving sessions, query memory for patterns
const currentState = await resources.read('thinking://current_state');
const memoryStats = JSON.parse(currentState.text).integrations.memory;

console.log({
  totalPatterns: memoryStats.totalPatterns,
  totalSolutions: memoryStats.totalSolutions,
  lastSync: new Date(memoryStats.lastSync)
});
```

## Complex Development Scenarios

### Full-Stack Application Development

```javascript
const complexResult = await tools.decompose_problem({
  problem_description: `
    Design and implement a real-time chat application with:
    
    FRONTEND: React + TypeScript, WebSocket connections, file upload,
    responsive design, dark/light themes
    
    BACKEND: Node.js/Express + Socket.io, PostgreSQL, Redis, JWT auth,
    rate limiting, message encryption, AWS S3 integration
    
    INFRASTRUCTURE: Docker containers, Kubernetes deployment, 
    CI/CD pipeline, monitoring/logging, load balancing
    
    CONSTRAINTS: 10,000+ concurrent users, <100ms latency, 
    99.9% uptime, GDPR compliance, 3-month timeline
  `,
  depth_limit: 10
});

// Results in comprehensive breakdown with:
// - 15+ detailed implementation steps
// - Architecture decision reasoning
// - Technology stack justifications  
// - Risk assessment and mitigation strategies
// - Performance optimization approaches
// - Compliance and security considerations

// Generated artifacts include:
// - Technical specification document
// - Implementation roadmap with timeline
// - Architecture diagrams (conceptual)
// - Testing strategy documentation
// - Deployment and scaling guides
```

### Quality Assessment

```javascript
const quality = complexResult.metadata.qualityAssessment;

console.log({
  completeness: quality.completeness,     // 0.92
  feasibility: quality.feasibility,       // 0.88
  efficiency: quality.efficiency,         // 0.85
  robustness: quality.robustness,         // 0.90
  innovation: quality.innovation,         // 0.75
  overallConfidence: quality.confidence   // 0.86
});
```

## Research and Analysis Integration

### Competitive Analysis Workflow

```javascript
const researchResult = await tools.decompose_problem({
  problem_description: `
    Conduct comprehensive competitive analysis for launching a SaaS 
    product in the project management space.
    
    RESEARCH OBJECTIVES:
    - Analyze top 10 competitors (features, pricing, positioning)
    - Identify market trends and growth opportunities
    - Assess competitive landscape and barriers to entry
    - Determine optimal pricing strategy and positioning
    - Analyze customer pain points with existing solutions
    
    DELIVERABLES:
    - Executive summary with recommendations
    - Detailed competitor analysis matrix
    - Market opportunity assessment
    - Go-to-market strategy outline
    - Risk assessment and mitigation strategies
    
    CONSTRAINTS: 6-week timeline, limited research budget
  `,
  decomposition_strategy: "top_down"
});

// Specialized for research workflows:
// - Systematic data collection methodology
// - Analysis framework development
// - Synthesis and insight generation
// - Strategic recommendation formulation
```

### Research Artifact Examples

The generated artifacts for research problems include:

- **Research methodology templates**
- **Data collection frameworks** 
- **Analysis worksheets and matrices**
- **Executive summary templates**
- **Presentation outline structures**

## Integration Testing

### Running Integration Test Scenarios

The server includes comprehensive integration tests that validate all workflows:

```javascript
// Access the integration test scenarios
import { IntegrationTestScenarios } from './src/tests/integration-scenarios.js';

const testRunner = new IntegrationTestScenarios();

// Run all integration tests
const results = await testRunner.runAllTests();

console.log({
  passed: results.passed,
  failed: results.failed,
  totalScenarios: results.scenarios.length
});

// Individual test scenarios:
// 1. Cognitive Workspace Demo - Complete workflow validation
// 2. Memory-Enhanced Problem Solving - Learning validation  
// 3. Artifact Generation Workflow - Filesystem integration validation
// 4. Multi-Strategy Learning - Strategy effectiveness testing
// 5. Complex Software Development Problem - Real-world scenario
// 6. Research and Analysis Integration - Analytical problem-solving
```

### Test Scenario Results

```javascript
// Example test result structure
const scenarioResult = {
  scenario: "Cognitive Workspace Demo",
  success: true,
  duration: 2847, // milliseconds
  artifacts: [
    {
      type: "markdown",
      filename: "solution-overview.md", 
      size: 4521,
      description: "Comprehensive solution overview"
    }
    // ... additional artifacts
  ],
  memoryOperations: [
    { type: "pattern_stored", success: true },
    { type: "solution_stored", success: true }
  ],
  metrics: {
    stepsGenerated: 8,
    averageConfidence: 0.87,
    strategyUsed: "top_down",
    memoryConfidence: 0.73
  }
};
```

## Best Practices

### 1. Problem Description Quality
- **Be specific**: Include context, constraints, and success criteria
- **Provide examples**: Reference similar problems or desired outcomes
- **Specify constraints**: Timeline, resources, technical limitations

### 2. Strategy Selection
- **Let memory recommend**: Don't specify strategy for learning benefit
- **Override when needed**: Use specific strategies for known problem types
- **Test multiple approaches**: For critical problems, compare strategies

### 3. Leveraging Memory Integration
- **Solve similar problems**: Build pattern recognition over time
- **Review memory insights**: Check confidence and recommendations
- **Refine problem descriptions**: Use successful patterns as templates

### 4. Utilizing Generated Artifacts
- **Save reusable templates**: Extract successful patterns for future use
- **Share step-by-step guides**: Use generated documentation for team coordination
- **Archive complete solutions**: Build organizational knowledge base

### 5. Integration Optimization
- **Monitor integration status**: Check current state resource regularly
- **Validate artifact generation**: Ensure Filesystem integration is working
- **Review memory statistics**: Track learning effectiveness over time

## Troubleshooting

### Common Issues

1. **Memory Integration Not Working**
   ```javascript
   // Check memory integration status
   const state = await resources.read('thinking://current_state');
   const memoryStatus = JSON.parse(state.text).integrations.memory;
   
   if (!memoryStatus.isAvailable) {
     console.log("Memory server not available - check MCP configuration");
   }
   ```

2. **No Artifacts Generated**
   ```javascript
   // Verify Filesystem integration
   const result = await tools.decompose_problem({ /* ... */ });
   
   if (!result.metadata.artifactManifest) {
     console.log("Filesystem integration disabled or failed");
   }
   ```

3. **Low Confidence Scores**
   - Provide more detailed problem descriptions
   - Include specific constraints and success criteria
   - Try different decomposition strategies
   - Review and refine based on quality assessment feedback

---

*This documentation reflects Sequential Thinking Server v2.0.0 with full Memory and Filesystem integration as part of the EM_CP2 ecosystem.*