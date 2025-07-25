/**
 * Validation Engine
 *
 * Provides comprehensive quality assessment for reasoning chains,
 * step validation, and solution quality metrics.
 */
import type { ReasoningState, ReasoningStep, SolutionQuality } from '../types/index.js';
export interface ValidationResult {
    isValid: boolean;
    quality: SolutionQuality;
    issues: ValidationIssue[];
    recommendations: string[];
    overallScore: number;
}
export interface ValidationIssue {
    type: 'critical' | 'warning' | 'info';
    category: 'logical' | 'feasibility' | 'constraint' | 'quality' | 'dependency';
    message: string;
    stepId?: string;
    suggestion?: string;
}
export declare class ValidationEngine {
    private logger;
    constructor();
    /**
     * Assess the overall quality of a reasoning state
     */
    assessQuality(state: ReasoningState): Promise<SolutionQuality>;
    /**
     * Validate a complete reasoning chain
     */
    validateReasoningChain(state: ReasoningState): Promise<ValidationResult>;
    /**
     * Validate a single reasoning step
     */
    validateStep(step: ReasoningStep, context?: ReasoningState): Promise<{
        isValid: boolean;
        issues: ValidationIssue[];
        suggestions: string[];
    }>;
    private assessCompleteness;
    private assessFeasibility;
    private assessEfficiency;
    private assessRobustness;
    private assessInnovation;
    private assessConfidence;
    private validateLogicalConsistency;
    private validateFeasibility;
    private validateConstraintCompliance;
    private validateDependencies;
    private validateStepQuality;
    private calculateOverallQuality;
    private isStepActionable;
    private validateStepInContext;
    private checkLogicalConnection;
    private detectCircularDependencies;
    private identifyRedundantSteps;
    private calculateStepSimilarity;
    private checkGoalAlignment;
    private generateRecommendations;
}
//# sourceMappingURL=validation-engine.d.ts.map