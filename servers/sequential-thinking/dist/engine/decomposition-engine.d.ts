/**
 * Decomposition Engine
 *
 * Core engine that implements 6 different problem decomposition strategies
 * based on cognitive science and problem-solving research.
 */
import type { ProblemDefinition, ReasoningStep, DecompositionStrategy, DecompositionOptions } from '../types/index.js';
export declare class DecompositionEngine {
    private logger;
    private stepGenerator;
    constructor();
    /**
     * Decompose a problem using the specified strategy
     */
    decompose(problem: ProblemDefinition, strategy: DecompositionStrategy, options: DecompositionOptions): Promise<ReasoningStep[]>;
    /**
     * Top-Down Decomposition: Start broad, refine details hierarchically
     */
    private topDownDecomposition;
    /**
     * Bottom-Up Decomposition: Build from atomic components upward
     */
    private bottomUpDecomposition;
    /**
     * Divide & Conquer: Split into independent subproblems
     */
    private divideConquerDecomposition;
    /**
     * Incremental Decomposition: Progressive step-by-step elaboration
     */
    private incrementalDecomposition;
    /**
     * Parallel Decomposition: Identify concurrent workstreams
     */
    private parallelDecomposition;
    /**
     * Iterative Decomposition: Refine solution through improvement cycles
     */
    private iterativeDecomposition;
    private identifySubGoals;
    private identifyAtomicActions;
    private identifySubproblems;
    private generateIncrementalSteps;
    private identifyParallelWorkstreams;
    private identifySynchronizationPoints;
    private createDetailedTasks;
    private groupIntoComponents;
    private postProcessSteps;
}
//# sourceMappingURL=decomposition-engine.d.ts.map