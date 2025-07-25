/**
 * Core interfaces for Sequential Thinking reasoning state management
 */
export interface ReasoningState {
    id: string;
    timestamp: number;
    problem: ProblemDefinition;
    currentStep: number;
    totalSteps: number;
    steps: ReasoningStep[];
    strategy: ReasoningStrategy;
    metadata: ReasoningMetadata;
    checkpoints: Checkpoint[];
}
export interface ProblemDefinition {
    description: string;
    context: Record<string, unknown>;
    constraints: string[];
    goalState: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    domain: string;
}
export interface ReasoningStep {
    id: string;
    index: number;
    description: string;
    reasoning: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    dependencies: string[];
    confidence: number;
    timestamp: number;
    duration?: number;
    errors?: string[];
}
export interface ReasoningStrategy {
    name: string;
    type: 'hierarchical' | 'sequential' | 'parallel' | 'adaptive';
    parameters: Record<string, unknown>;
    adaptationTriggers: AdaptationTrigger[];
    performanceMetrics: PerformanceMetrics;
}
export interface AdaptationTrigger {
    condition: string;
    threshold: number;
    action: 'refine_decomposition' | 'change_strategy' | 'increase_depth' | 'seek_help';
}
export interface PerformanceMetrics {
    accuracy: number;
    efficiency: number;
    completionRate: number;
    averageConfidence: number;
    timeToSolution?: number;
}
export interface ReasoningMetadata {
    sessionId: string;
    userId?: string;
    clientType: string;
    version: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface Checkpoint {
    id: string;
    timestamp: number;
    stepIndex: number;
    state: Partial<ReasoningState>;
    label: string;
    auto: boolean;
}
export interface SolutionTree {
    root: TreeNode;
    metadata: {
        depth: number;
        totalNodes: number;
        completedNodes: number;
        failedNodes: number;
    };
}
export interface TreeNode {
    id: string;
    parentId?: string;
    children: string[];
    step: ReasoningStep;
    branch: 'main' | 'alternative' | 'exploration';
    score: number;
}
//# sourceMappingURL=reasoning-state.d.ts.map