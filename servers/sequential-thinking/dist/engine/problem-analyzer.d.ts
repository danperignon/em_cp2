/**
 * Problem Analysis Engine
 *
 * Analyzes problem descriptions, identifies patterns, and recommends
 * optimal decomposition strategies using cognitive science principles.
 */
import type { ProblemDefinition, DecompositionStrategy, ProblemContext } from '../types/index.js';
export declare class ProblemAnalyzer {
    private logger;
    constructor();
    /**
     * Analyze a problem description and create a structured ProblemDefinition
     */
    analyzeProblem(description: string, initialContext?: Partial<ProblemContext>): Promise<ProblemDefinition>;
    /**
     * Recommend optimal decomposition strategy based on problem analysis
     */
    recommendStrategy(problem: ProblemDefinition): Promise<DecompositionStrategy>;
    /**
     * Get detailed analysis including patterns and parameters
     */
    getDetailedAnalysis(problem: ProblemDefinition): Promise<{
        problem: ProblemDefinition;
        matchedPatterns: import("../types/problem-types.js").ProblemPattern[];
        recommendedStrategy: DecompositionStrategy;
        estimatedParameters: {
            estimatedSteps: number;
            estimatedDuration: number;
            confidenceLevel: number;
            recommendedDepth: number;
        };
        analysisMetadata: {
            patternCount: number;
            confidenceLevel: number;
            primaryPattern: string;
            analysisTimestamp: number;
        };
    }>;
    /**
     * Extract context information from problem description
     */
    private extractContextFromDescription;
    /**
     * Extract constraints from problem description
     */
    private extractConstraints;
    /**
     * Extract goal state from problem description
     */
    private extractGoalState;
    /**
     * Assess problem complexity based on description
     */
    private assessComplexity;
    /**
     * Identify problem domain based on description
     */
    private identifyDomain;
    /**
     * Get domain-specific keywords for analysis
     */
    private getDomainKeywords;
}
//# sourceMappingURL=problem-analyzer.d.ts.map