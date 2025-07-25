/**
 * Memory Server Integration
 *
 * Provides cognitive knowledge base functionality by integrating with the
 * EM_CP2 Memory server for persistent reasoning pattern storage and retrieval.
 */
import type { ReasoningState, ProblemDefinition, DecompositionStrategy, SolutionQuality } from '../types/index.js';
export interface MemoryStorageOptions {
    namespace?: string;
    persistenceLevel?: 'session' | 'project' | 'global';
    expirationDays?: number;
}
export interface StoredReasoningPattern {
    id: string;
    problemType: string;
    strategy: DecompositionStrategy;
    successRate: number;
    averageDuration: number;
    qualityScores: SolutionQuality[];
    usageCount: number;
    lastUsed: number;
    createdAt: number;
    context: {
        domain: string;
        complexity: string;
        constraints: string[];
    };
}
export interface StoredSolution {
    id: string;
    problemFingerprint: string;
    reasoningState: ReasoningState;
    quality: SolutionQuality;
    metadata: {
        createdAt: number;
        usageCount: number;
        rating: number;
        tags: string[];
    };
}
export declare class MemoryIntegration {
    private logger;
    private namespace;
    private isAvailable;
    constructor(namespace?: string);
    /**
     * Initialize connection to Memory server
     */
    private initializeMemoryConnection;
    /**
     * Store a successful reasoning pattern for future learning
     */
    storeReasoningPattern(pattern: Omit<StoredReasoningPattern, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>, options?: MemoryStorageOptions): Promise<string>;
    /**
     * Retrieve reasoning patterns for a given problem type
     */
    getReasoningPatterns(problemType: string, domain?: string, complexity?: string): Promise<StoredReasoningPattern[]>;
    /**
     * Store a complete solution for future reference
     */
    storeSolution(solution: Omit<StoredSolution, 'id' | 'metadata'>, tags?: string[], rating?: number): Promise<string>;
    /**
     * Find similar solutions based on problem fingerprint
     */
    findSimilarSolutions(problemFingerprint: string, limit?: number): Promise<StoredSolution[]>;
    /**
     * Update pattern performance metrics
     */
    updatePatternPerformance(patternId: string, quality: SolutionQuality, duration: number): Promise<void>;
    /**
     * Get cognitive insights and recommendations
     */
    getCognitiveInsights(problemDefinition: ProblemDefinition): Promise<{
        recommendedStrategy: DecompositionStrategy | null;
        confidence: number;
        reasoning: string;
        similarProblems: number;
    }>;
    private storeInMemory;
    private queryMemory;
    private getPatternById;
    private calculateOverallQuality;
    private classifyProblemType;
    /**
     * Check if Memory integration is available
     */
    isMemoryAvailable(): boolean;
    /**
     * Get integration statistics
     */
    getIntegrationStats(): Promise<{
        isAvailable: boolean;
        totalPatterns: number;
        totalSolutions: number;
        lastSync: number;
    }>;
}
//# sourceMappingURL=memory-integration.d.ts.map