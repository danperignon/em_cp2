/**
 * Pattern matching utilities for problem recognition and strategy selection
 */
import type { ProblemPattern, DecompositionStrategy, ProblemDefinition } from '../types/index.js';
/**
 * Built-in problem patterns based on cognitive science research
 */
export declare const PROBLEM_PATTERNS: ProblemPattern[];
/**
 * Analyze problem description to identify matching patterns
 */
export declare function identifyProblemPatterns(problem: ProblemDefinition): ProblemPattern[];
/**
 * Select optimal decomposition strategy based on problem analysis
 */
export declare function selectDecompositionStrategy(problem: ProblemDefinition, patterns: ProblemPattern[]): DecompositionStrategy;
/**
 * Estimate problem solving parameters based on pattern analysis
 */
export declare function estimateSolvingParameters(patterns: ProblemPattern[]): {
    estimatedSteps: number;
    estimatedDuration: number;
    confidenceLevel: number;
    recommendedDepth: number;
};
//# sourceMappingURL=pattern-matching.d.ts.map