/**
 * Input validation and schema validation utilities
 */
import type { ProblemDefinition, ReasoningState, ReasoningStep, DecompositionStrategy } from '../types/index.js';
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    field: string;
    code: string;
    constructor(message: string, field: string, code?: string);
}
/**
 * Validate problem definition input
 */
export declare function validateProblemDefinition(input: unknown): ProblemDefinition;
/**
 * Validate decomposition strategy
 */
export declare function validateDecompositionStrategy(strategy: unknown): DecompositionStrategy;
/**
 * Validate reasoning step
 */
export declare function validateReasoningStep(input: unknown): Partial<ReasoningStep>;
/**
 * Validate state management parameters
 */
export declare function validateStateManagementParams(input: unknown): {
    action: 'save' | 'load' | 'update' | 'branch';
    stateData?: Record<string, unknown>;
    checkpointLabel?: string;
    mergeStrategy?: string;
};
/**
 * Validate strategy adaptation parameters
 */
export declare function validateStrategyAdaptationParams(input: unknown): {
    currentProgress: Record<string, unknown>;
    performanceMetrics: Record<string, unknown>;
    availableStrategies?: string[];
    adaptationTriggers?: string[];
};
/**
 * Validate reasoning state for consistency
 */
export declare function validateReasoningStateConsistency(state: ReasoningState): string[];
/**
 * Sanitize text input to prevent issues
 */
export declare function sanitizeTextInput(input: string): string;
//# sourceMappingURL=validation.d.ts.map