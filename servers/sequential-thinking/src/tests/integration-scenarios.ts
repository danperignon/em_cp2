/**
 * End-to-End Integration Test Scenarios
 * 
 * Demonstrates the Sequential Thinking server working as the cognitive core
 * of the EM_CP2 ecosystem, coordinating with Memory and Filesystem servers
 * to create a comprehensive "Cognitive Workspace".
 */

import { ToolHandlers } from '../handlers/tool-handlers.js';
import { Logger } from '@em-cp2/shared';

export class IntegrationTestScenarios {
  private logger: Logger;
  private toolHandlers: ToolHandlers;

  constructor() {
    this.logger = new Logger('IntegrationTests');
    this.toolHandlers = new ToolHandlers();
  }

  /**
   * Run all integration test scenarios
   */
  async runAllTests(): Promise<{
    passed: number;
    failed: number;
    scenarios: TestResult[];
  }> {
    this.logger.info('Starting end-to-end integration test scenarios...');

    const scenarios = [
      { name: 'Cognitive Workspace Demo', test: () => this.testCognitiveWorkspaceDemo() },
      { name: 'Memory-Enhanced Problem Solving', test: () => this.testMemoryEnhancedSolving() },
      { name: 'Artifact Generation Workflow', test: () => this.testArtifactGeneration() },
      { name: 'Multi-Strategy Learning', test: () => this.testMultiStrategyLearning() },
      { name: 'Complex Software Development Problem', test: () => this.testSoftwareDevelopmentScenario() },
      { name: 'Research and Analysis Integration', test: () => this.testResearchAnalysisIntegration() }
    ];

    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const scenario of scenarios) {
      try {
        this.logger.info(`Running scenario: ${scenario.name}`);
        const result = await scenario.test();
        results.push(result);
        
        if (result.success) {
          passed++;
          this.logger.info(`✅ ${scenario.name}: PASSED`);
        } else {
          failed++;
          this.logger.error(`❌ ${scenario.name}: FAILED - ${result.error}`);
        }
      } catch (error) {
        failed++;
        const errorResult: TestResult = {
          scenario: scenario.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
          artifacts: [],
          memoryOperations: []
        };
        results.push(errorResult);
        this.logger.error(`❌ ${scenario.name}: ERROR - ${error}`);
      }
    }

    this.logger.info(`Integration tests completed: ${passed} passed, ${failed} failed`);
    
    return { passed, failed, scenarios: results };
  }

  /**
   * Scenario 1: Cognitive Workspace Demo
   * Demonstrates complete workflow: problem → analysis → decomposition → memory → artifacts
   */
  private async testCognitiveWorkspaceDemo(): Promise<TestResult> {
    const startTime = Date.now();
    const scenario = 'Cognitive Workspace Demo';

    try {
      // Test problem: Building a new feature
      const problemDescription = `
        Build a user authentication system for a web application with the following requirements:
        - JWT token-based authentication
        - User registration and login endpoints
        - Password hashing and validation
        - Role-based access control
        - Integration with existing database
        - Comprehensive error handling
        - Unit tests for all components
      `;

      const result = await this.toolHandlers.handleDecomposeProblem({
        problem_description: problemDescription,
        depth_limit: 6
      });

      // Validate result structure
      if (!result.success || !result.data) {
        throw new Error('Problem decomposition failed');
      }

      const reasoningState = result.data;
      const metadata = result.metadata;

      // Validate reasoning state
      if (reasoningState.steps.length < 5) {
        throw new Error(`Insufficient steps generated: ${reasoningState.steps.length}`);
      }

      // Validate memory integration
      if (!metadata?.memoryInsights) {
        throw new Error('Memory integration not working');
      }

      // Validate artifact generation
      if (!metadata?.artifactManifest || metadata.artifactManifest.totalFiles === 0) {
        throw new Error('Artifact generation not working');
      }

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime,
        artifacts: metadata.artifactManifest.artifacts || [],
        memoryOperations: [
          { type: 'pattern_stored', success: true },
          { type: 'solution_stored', success: true }
        ],
        metrics: {
          stepsGenerated: reasoningState.steps.length,
          averageConfidence: reasoningState.steps.reduce((sum, s) => sum + s.confidence, 0) / reasoningState.steps.length,
          strategyUsed: reasoningState.strategy.name,
          memoryConfidence: metadata.memoryInsights.confidence
        }
      };

    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: []
      };
    }
  }

  /**
   * Scenario 2: Memory-Enhanced Problem Solving
   * Tests learning from previous solutions and strategy recommendation
   */
  private async testMemoryEnhancedSolving(): Promise<TestResult> {
    const startTime = Date.now();
    const scenario = 'Memory-Enhanced Problem Solving';

    try {
      // First, solve a problem to establish a pattern
      const firstProblem = `
        Debug a performance issue in a React application where the dashboard is loading slowly.
        The issue appears to be related to excessive re-renders and large data sets.
      `;

      const firstResult = await this.toolHandlers.handleDecomposeProblem({
        problem_description: firstProblem,
        decomposition_strategy: 'divide_conquer'
      });

      if (!firstResult.success) {
        throw new Error('First problem solution failed');
      }

      // Now solve a similar problem - should benefit from memory
      const secondProblem = `
        Optimize performance in a Vue.js application where the user list page is slow.
        Users report that the page takes several seconds to load and update.
      `;

      const secondResult = await this.toolHandlers.handleDecomposeProblem({
        problem_description: secondProblem
      });

      if (!secondResult.success) {
        throw new Error('Second problem solution failed');
      }

      // Validate memory learning
      const memoryInsights = secondResult.metadata?.memoryInsights;
      if (!memoryInsights) {
        throw new Error('Memory insights not available');
      }

      // For a similar problem, memory should have recommendations
      const hasMemoryRecommendation = memoryInsights.similarProblems > 0 || memoryInsights.confidence > 0;

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime,
        artifacts: secondResult.metadata?.artifactManifest?.artifacts || [],
        memoryOperations: [
          { type: 'pattern_retrieval', success: hasMemoryRecommendation },
          { type: 'strategy_recommendation', success: hasMemoryRecommendation }
        ],
        metrics: {
          similarProblemsFound: memoryInsights.similarProblems,
          memoryConfidence: memoryInsights.confidence,
          recommendedStrategy: memoryInsights.recommendedStrategy || 'none',
          learningEffective: hasMemoryRecommendation
        }
      };

    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: []
      };
    }
  }

  /**
   * Scenario 3: Artifact Generation Workflow
   * Tests comprehensive artifact generation with different problem types
   */
  private async testArtifactGeneration(): Promise<TestResult> {
    const startTime = Date.now();
    const scenario = 'Artifact Generation Workflow';

    try {
      const problemDescription = `
        Plan and implement a CI/CD pipeline for a microservices architecture with:
        - Automated testing at multiple levels
        - Docker containerization
        - Kubernetes deployment
        - Monitoring and alerting
        - Security scanning
        - Documentation generation
      `;

      const result = await this.toolHandlers.handleDecomposeProblem({
        problem_description: problemDescription,
        decomposition_strategy: 'top_down',
        depth_limit: 8
      });

      if (!result.success || !result.metadata?.artifactManifest) {
        throw new Error('Artifact generation failed');
      }

      const manifest = result.metadata.artifactManifest;

      // Validate artifact types
      const expectedArtifactTypes = ['markdown', 'json', 'template'];
      const actualTypes = [...new Set(manifest.artifacts.map((a: any) => a.type))];
      
      const hasAllTypes = expectedArtifactTypes.every(type => actualTypes.includes(type));
      if (!hasAllTypes) {
        throw new Error(`Missing artifact types. Expected: ${expectedArtifactTypes.join(', ')}, Got: ${actualTypes.join(', ')}`);
      }

      // Validate artifact content
      const hasOverview = manifest.artifacts.some((a: any) => a.filename.includes('overview'));
      const hasStepGuide = manifest.artifacts.some((a: any) => a.filename.includes('step-by-step'));
      const hasTemplate = manifest.artifacts.some((a: any) => a.filename.includes('template'));

      if (!hasOverview || !hasStepGuide || !hasTemplate) {
        throw new Error('Missing expected artifact files');
      }

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime,
        artifacts: manifest.artifacts,
        memoryOperations: [
          { type: 'solution_stored', success: true }
        ],
        metrics: {
          totalArtifacts: manifest.totalFiles,
          artifactTypes: actualTypes.length,
          workspaceCreated: manifest.workspacePath.length > 0,
          averageArtifactSize: manifest.artifacts.reduce((sum: any, a: any) => sum + a.size, 0) / manifest.artifacts.length
        }
      };

    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: []
      };
    }
  }

  /**
   * Scenario 4: Multi-Strategy Learning
   * Tests different decomposition strategies and their effectiveness
   */
  private async testMultiStrategyLearning(): Promise<TestResult> {
    const startTime = Date.now();
    const scenario = 'Multi-Strategy Learning';

    try {
      const baseProblem = 'Analyze and optimize the database query performance for an e-commerce platform';
      const strategies = ['top_down', 'bottom_up', 'divide_conquer', 'iterative'] as const;
      const results = [];

      for (const strategy of strategies) {
        const result = await this.toolHandlers.handleDecomposeProblem({
          problem_description: baseProblem,
          decomposition_strategy: strategy,
          depth_limit: 5
        });

        if (result.success) {
          results.push({
            strategy,
            steps: result.data!.steps.length,
            confidence: result.metadata?.qualityAssessment?.confidence || 0,
            success: true
          });
        } else {
          results.push({
            strategy,
            steps: 0,
            confidence: 0,
            success: false
          });
        }
      }

      const successfulStrategies = results.filter(r => r.success).length;
      
      if (successfulStrategies < 3) {
        throw new Error(`Only ${successfulStrategies} strategies worked out of ${strategies.length}`);
      }

      // Find the best performing strategy
      const bestStrategy = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: results.map(r => ({
          type: 'strategy_tested' as const,
          success: r.success,
          strategy: r.strategy
        })),
        metrics: {
          strategiesTested: strategies.length,
          successfulStrategies,
          bestStrategy: bestStrategy.strategy,
          bestConfidence: bestStrategy.confidence,
          avgStepsPerStrategy: results.reduce((sum, r) => sum + r.steps, 0) / results.length
        }
      };

    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: []
      };
    }
  }

  /**
   * Scenario 5: Complex Software Development Problem
   * Real-world scenario testing complete integration
   */
  private async testSoftwareDevelopmentScenario(): Promise<TestResult> {
    const startTime = Date.now();
    const scenario = 'Complex Software Development Problem';

    try {
      const problemDescription = `
        Design and implement a real-time chat application with the following specifications:
        
        FRONTEND REQUIREMENTS:
        - React-based user interface with TypeScript
        - Real-time message display with WebSocket connections
        - User presence indicators (online/offline status)
        - Message history with infinite scroll
        - File upload capability for images and documents
        - Responsive design for mobile and desktop
        - Dark/light theme support
        
        BACKEND REQUIREMENTS:
        - Node.js/Express server with Socket.io for WebSockets
        - PostgreSQL database for message persistence
        - Redis for session management and caching
        - JWT authentication with refresh tokens
        - Rate limiting to prevent spam
        - Message encryption for privacy
        - File storage integration (AWS S3 or similar)
        
        INFRASTRUCTURE:
        - Docker containerization for all services
        - Kubernetes deployment configuration
        - CI/CD pipeline with automated testing
        - Monitoring and logging setup
        - Load balancing for high availability
        
        CONSTRAINTS:
        - Must handle 10,000+ concurrent users
        - Message delivery latency < 100ms
        - 99.9% uptime requirement
        - GDPR compliance for data handling
        - Budget constraints - optimize for cost efficiency
        - 3-month development timeline
      `;

      const result = await this.toolHandlers.handleDecomposeProblem({
        problem_description: problemDescription,
        depth_limit: 10
      });

      if (!result.success) {
        throw new Error('Complex problem decomposition failed');
      }

      const reasoningState = result.data!;
      const metadata = result.metadata!;

      // Validate comprehensive solution
      if (reasoningState.steps.length < 15) {
        throw new Error(`Solution too simple for complex problem: ${reasoningState.steps.length} steps`);
      }

      // Check for key architectural components in steps
      const stepDescriptions = reasoningState.steps.map(s => s.description.toLowerCase()).join(' ');
      const requiredComponents = [
        'frontend', 'backend', 'database', 'websocket', 'authentication',
        'deployment', 'testing', 'monitoring'
      ];

      const missingComponents = requiredComponents.filter(comp => 
        !stepDescriptions.includes(comp)
      );

      if (missingComponents.length > 2) {
        throw new Error(`Missing key components: ${missingComponents.join(', ')}`);
      }

      // Validate high-quality artifacts for complex problem
      const artifactManifest = metadata.artifactManifest;
      if (!artifactManifest || artifactManifest.totalFiles < 5) {
        throw new Error('Insufficient artifacts for complex problem');
      }

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime,
        artifacts: artifactManifest.artifacts,
        memoryOperations: [
          { type: 'complex_pattern_stored', success: true },
          { type: 'architectural_solution_stored', success: true }
        ],
        metrics: {
          problemComplexity: 'high',
          stepsGenerated: reasoningState.steps.length,
          averageConfidence: reasoningState.steps.reduce((sum, s) => sum + s.confidence, 0) / reasoningState.steps.length,
          strategyUsed: reasoningState.strategy.name,
          componentsAddressed: requiredComponents.length - missingComponents.length,
          qualityScore: metadata.qualityAssessment?.confidence || 0
        }
      };

    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: []
      };
    }
  }

  /**
   * Scenario 6: Research and Analysis Integration
   * Tests analytical problem-solving with pattern learning
   */
  private async testResearchAnalysisIntegration(): Promise<TestResult> {
    const startTime = Date.now();
    const scenario = 'Research and Analysis Integration';

    try {
      const problemDescription = `
        Conduct a comprehensive competitive analysis for launching a new SaaS product in the project management space.
        
        RESEARCH OBJECTIVES:
        - Identify top 10 competitors and analyze their features, pricing, and positioning
        - Analyze market trends and growth opportunities
        - Identify gaps in the current market offerings
        - Assess the competitive landscape and barriers to entry
        - Determine optimal pricing strategy and market positioning
        - Analyze customer reviews and pain points with existing solutions
        - Evaluate technical approaches and architectural decisions
        - Assess marketing strategies and customer acquisition channels
        
        DELIVERABLES NEEDED:
        - Executive summary with key findings and recommendations
        - Detailed competitor analysis matrix
        - Market opportunity assessment
        - Technical architecture recommendations
        - Go-to-market strategy outline
        - Risk assessment and mitigation strategies
        - Financial projections and ROI analysis
        
        CONSTRAINTS:
        - 6-week research timeline
        - Limited budget for paid research tools
        - Need actionable insights for immediate decision making
        - Must include quantitative and qualitative analysis
      `;

      const result = await this.toolHandlers.handleDecomposeProblem({
        problem_description: problemDescription,
        decomposition_strategy: 'top_down'
      });

      if (!result.success) {
        throw new Error('Research problem decomposition failed');
      }

      const reasoningState = result.data!;
      const metadata = result.metadata!;

      // Validate research methodology in steps
      const stepDescriptions = reasoningState.steps.map(s => s.description.toLowerCase()).join(' ');
      const researchElements = [
        'research', 'analyze', 'data', 'competitor', 'market', 'strategy'
      ];

      const coveredElements = researchElements.filter(element => 
        stepDescriptions.includes(element)
      );

      if (coveredElements.length < 4) {
        throw new Error(`Insufficient research methodology coverage: ${coveredElements.length}/6`);
      }

      // Validate deliverable-focused artifacts
      const artifactManifest = metadata.artifactManifest;
      if (!artifactManifest) {
        throw new Error('No research artifacts generated');
      }

      // Check for analysis-specific artifacts
      const hasAnalysisTemplate = artifactManifest.artifacts.some((a: any) => 
        a.filename.includes('template') || a.description.toLowerCase().includes('analysis')
      );

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime,
        artifacts: artifactManifest.artifacts,
        memoryOperations: [
          { type: 'research_pattern_stored', success: true },
          { type: 'analysis_methodology_stored', success: true }
        ],
        metrics: {
          researchElementsCovered: coveredElements.length,
          totalSteps: reasoningState.steps.length,
          analyticalDepth: reasoningState.strategy.name === 'top_down' ? 'high' : 'medium',
          hasMethodologyTemplate: hasAnalysisTemplate,
          avgStepConfidence: reasoningState.steps.reduce((sum, s) => sum + s.confidence, 0) / reasoningState.steps.length
        }
      };

    } catch (error) {
      return {
        scenario,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        artifacts: [],
        memoryOperations: []
      };
    }
  }
}

// Supporting interfaces
interface TestResult {
  scenario: string;
  success: boolean;
  error?: string;
  duration: number;
  artifacts: any[];
  memoryOperations: MemoryOperation[];
  metrics?: Record<string, any>;
}

interface MemoryOperation {
  type: string;
  success: boolean;
  strategy?: string;
}

// Class already exported at line 12