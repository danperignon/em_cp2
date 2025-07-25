/**
 * End-to-End Integration Test Scenarios
 *
 * Demonstrates the Sequential Thinking server working as the cognitive core
 * of the EM_CP2 ecosystem, coordinating with Memory and Filesystem servers
 * to create a comprehensive "Cognitive Workspace".
 */
export declare class IntegrationTestScenarios {
    private logger;
    private toolHandlers;
    constructor();
    /**
     * Run all integration test scenarios
     */
    runAllTests(): Promise<{
        passed: number;
        failed: number;
        scenarios: TestResult[];
    }>;
    /**
     * Scenario 1: Cognitive Workspace Demo
     * Demonstrates complete workflow: problem → analysis → decomposition → memory → artifacts
     */
    private testCognitiveWorkspaceDemo;
    /**
     * Scenario 2: Memory-Enhanced Problem Solving
     * Tests learning from previous solutions and strategy recommendation
     */
    private testMemoryEnhancedSolving;
    /**
     * Scenario 3: Artifact Generation Workflow
     * Tests comprehensive artifact generation with different problem types
     */
    private testArtifactGeneration;
    /**
     * Scenario 4: Multi-Strategy Learning
     * Tests different decomposition strategies and their effectiveness
     */
    private testMultiStrategyLearning;
    /**
     * Scenario 5: Complex Software Development Problem
     * Real-world scenario testing complete integration
     */
    private testSoftwareDevelopmentScenario;
    /**
     * Scenario 6: Research and Analysis Integration
     * Tests analytical problem-solving with pattern learning
     */
    private testResearchAnalysisIntegration;
}
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
export {};
//# sourceMappingURL=integration-scenarios.d.ts.map