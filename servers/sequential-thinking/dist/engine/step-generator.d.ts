/**
 * Step Generator
 *
 * Generates ReasoningStep objects with comprehensive metadata,
 * confidence assessment, and dependency management.
 */
import type { ReasoningStep } from '../types/index.js';
export interface StepCreateOptions {
    description: string;
    reasoning: string;
    index: number;
    dependencies?: string[];
    confidence?: number;
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    status?: ReasoningStep['status'];
}
export declare class StepGenerator {
    private logger;
    constructor();
    /**
     * Create a new reasoning step with full metadata
     */
    createStep(options: StepCreateOptions): Promise<ReasoningStep>;
    /**
     * Create multiple related steps with automatic dependency management
     */
    createStepSequence(stepDescriptions: string[], baseOptions?: Partial<StepCreateOptions>): Promise<ReasoningStep[]>;
    /**
     * Create parallel steps that can execute concurrently
     */
    createParallelSteps(stepDescriptions: string[], sharedDependencies?: string[], baseOptions?: Partial<StepCreateOptions>): Promise<ReasoningStep[]>;
    /**
     * Update an existing step with new information
     */
    updateStep(step: ReasoningStep, updates: Partial<Pick<ReasoningStep, 'status' | 'outputs' | 'confidence' | 'errors' | 'duration'>>): Promise<ReasoningStep>;
    /**
     * Generate unique step ID
     */
    private generateStepId;
    /**
     * Enhance step description with contextual information
     */
    private enhanceDescription;
    /**
     * Enhance reasoning with additional context
     */
    private enhanceReasoning;
    /**
     * Calculate default confidence based on step characteristics
     */
    private calculateDefaultConfidence;
    /**
     * Calculate confidence for steps in a sequence
     */
    private calculateSequenceConfidence;
    /**
     * Recalculate confidence based on step completion
     */
    private recalculateConfidence;
    /**
     * Validate step properties
     */
    private validateStep;
    /**
     * Enhance step with additional metadata
     */
    private enhanceStepMetadata;
    /**
     * Estimate step duration in milliseconds
     */
    private estimateStepDuration;
    /**
     * Assess step complexity
     */
    private assessStepComplexity;
    /**
     * Categorize step by type
     */
    private categorizeStep;
}
//# sourceMappingURL=step-generator.d.ts.map