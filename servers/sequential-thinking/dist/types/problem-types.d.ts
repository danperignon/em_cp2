/**
 * Problem classification and decomposition interfaces
 */
export type ProblemType = 'analytical' | 'creative' | 'procedural' | 'diagnostic' | 'planning' | 'research' | 'optimization';
export type DecompositionStrategy = 'top_down' | 'bottom_up' | 'divide_conquer' | 'incremental' | 'parallel' | 'iterative';
export interface ProblemPattern {
    id: string;
    name: string;
    description: string;
    problemTypes: ProblemType[];
    recommendedStrategy: DecompositionStrategy;
    indicators: string[];
    successRate: number;
    averageSteps: number;
    complexity: 'low' | 'medium' | 'high';
}
export interface DecompositionOptions {
    strategy: DecompositionStrategy;
    maxDepth: number;
    minSteps: number;
    maxSteps: number;
    parallelism: boolean;
    adaptiveThreshold: number;
    validation: boolean;
}
export interface ProblemContext {
    domain: string;
    timeConstraints?: {
        deadline?: number;
        urgency: 'low' | 'medium' | 'high' | 'critical';
    };
    resources?: {
        available: string[];
        limitations: string[];
    };
    stakeholders?: {
        primary: string[];
        secondary: string[];
    };
    constraints: string[];
    assumptions: string[];
}
export interface SolutionQuality {
    completeness: number;
    feasibility: number;
    efficiency: number;
    robustness: number;
    innovation: number;
    confidence: number;
}
export interface ValidationCriteria {
    logicalConsistency: boolean;
    feasibilityCheck: boolean;
    constraintCompliance: boolean;
    stakeholderAlignment: boolean;
    riskAssessment: boolean;
    performanceMetrics: string[];
}
//# sourceMappingURL=problem-types.d.ts.map