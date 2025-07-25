/**
 * Input validation and schema validation utilities
 */
/**
 * Validation error class
 */
export class ValidationError extends Error {
    field;
    code;
    constructor(message, field, code = 'VALIDATION_ERROR') {
        super(message);
        this.field = field;
        this.code = code;
        this.name = 'ValidationError';
    }
}
/**
 * Validate problem definition input
 */
export function validateProblemDefinition(input) {
    if (!input || typeof input !== 'object') {
        throw new ValidationError('Problem definition must be an object', 'root');
    }
    const problem = input;
    // Required fields
    if (!problem.description || typeof problem.description !== 'string') {
        throw new ValidationError('Problem description is required and must be a string', 'description');
    }
    if (problem.description.length < 10) {
        throw new ValidationError('Problem description must be at least 10 characters', 'description');
    }
    if (problem.description.length > 2000) {
        throw new ValidationError('Problem description must be less than 2000 characters', 'description');
    }
    if (!problem.goalState || typeof problem.goalState !== 'string') {
        throw new ValidationError('Goal state is required and must be a string', 'goalState');
    }
    // Optional fields with defaults
    const complexity = problem.complexity || 'moderate';
    if (!['simple', 'moderate', 'complex', 'expert'].includes(complexity)) {
        throw new ValidationError('Complexity must be simple, moderate, complex, or expert', 'complexity');
    }
    const constraints = Array.isArray(problem.constraints) ? problem.constraints : [];
    const context = problem.context && typeof problem.context === 'object' ? problem.context : {};
    const domain = typeof problem.domain === 'string' ? problem.domain : 'general';
    return {
        description: problem.description,
        goalState: problem.goalState,
        complexity: complexity,
        constraints: constraints,
        context: context,
        domain
    };
}
/**
 * Validate decomposition strategy
 */
export function validateDecompositionStrategy(strategy) {
    const validStrategies = [
        'top_down', 'bottom_up', 'divide_conquer', 'incremental', 'parallel', 'iterative'
    ];
    if (!strategy || typeof strategy !== 'string') {
        throw new ValidationError('Decomposition strategy must be a string', 'strategy');
    }
    if (!validStrategies.includes(strategy)) {
        throw new ValidationError(`Invalid strategy. Must be one of: ${validStrategies.join(', ')}`, 'strategy');
    }
    return strategy;
}
/**
 * Validate reasoning step
 */
export function validateReasoningStep(input) {
    if (!input || typeof input !== 'object') {
        throw new ValidationError('Reasoning step must be an object', 'root');
    }
    const step = input;
    if (step.description !== undefined && typeof step.description !== 'string') {
        throw new ValidationError('Step description must be a string', 'description');
    }
    if (step.reasoning !== undefined && typeof step.reasoning !== 'string') {
        throw new ValidationError('Step reasoning must be a string', 'reasoning');
    }
    if (step.confidence !== undefined) {
        const confidence = Number(step.confidence);
        if (isNaN(confidence) || confidence < 0 || confidence > 1) {
            throw new ValidationError('Confidence must be a number between 0 and 1', 'confidence');
        }
    }
    if (step.status !== undefined) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'skipped'];
        if (!validStatuses.includes(step.status)) {
            throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`, 'status');
        }
    }
    return step;
}
/**
 * Validate state management parameters
 */
export function validateStateManagementParams(input) {
    if (!input || typeof input !== 'object') {
        throw new ValidationError('State management parameters must be an object', 'root');
    }
    const params = input;
    const validActions = ['save', 'load', 'update', 'branch'];
    if (!params.action || !validActions.includes(params.action)) {
        throw new ValidationError(`Action must be one of: ${validActions.join(', ')}`, 'action');
    }
    if (params.checkpointLabel !== undefined && typeof params.checkpointLabel !== 'string') {
        throw new ValidationError('Checkpoint label must be a string', 'checkpointLabel');
    }
    if (params.mergeStrategy !== undefined && typeof params.mergeStrategy !== 'string') {
        throw new ValidationError('Merge strategy must be a string', 'mergeStrategy');
    }
    if (params.stateData !== undefined &&
        (params.stateData === null || typeof params.stateData !== 'object')) {
        throw new ValidationError('State data must be an object', 'stateData');
    }
    return {
        action: params.action,
        stateData: params.stateData,
        checkpointLabel: params.checkpointLabel,
        mergeStrategy: params.mergeStrategy
    };
}
/**
 * Validate strategy adaptation parameters
 */
export function validateStrategyAdaptationParams(input) {
    if (!input || typeof input !== 'object') {
        throw new ValidationError('Strategy adaptation parameters must be an object', 'root');
    }
    const params = input;
    if (!params.currentProgress || typeof params.currentProgress !== 'object') {
        throw new ValidationError('Current progress is required and must be an object', 'currentProgress');
    }
    if (!params.performanceMetrics || typeof params.performanceMetrics !== 'object') {
        throw new ValidationError('Performance metrics is required and must be an object', 'performanceMetrics');
    }
    if (params.availableStrategies !== undefined && !Array.isArray(params.availableStrategies)) {
        throw new ValidationError('Available strategies must be an array', 'availableStrategies');
    }
    if (params.adaptationTriggers !== undefined && !Array.isArray(params.adaptationTriggers)) {
        throw new ValidationError('Adaptation triggers must be an array', 'adaptationTriggers');
    }
    return {
        currentProgress: params.currentProgress,
        performanceMetrics: params.performanceMetrics,
        availableStrategies: params.availableStrategies,
        adaptationTriggers: params.adaptationTriggers
    };
}
/**
 * Validate reasoning state for consistency
 */
export function validateReasoningStateConsistency(state) {
    const errors = [];
    // Check step indices are sequential
    const sortedSteps = [...state.steps].sort((a, b) => a.index - b.index);
    for (let i = 0; i < sortedSteps.length; i++) {
        if (sortedSteps[i].index !== i) {
            errors.push(`Step index mismatch: expected ${i}, got ${sortedSteps[i].index}`);
        }
    }
    // Check current step is valid
    if (state.currentStep < 0 || state.currentStep >= state.totalSteps) {
        errors.push(`Current step ${state.currentStep} is out of range [0, ${state.totalSteps})`);
    }
    // Check dependencies exist
    for (const step of state.steps) {
        for (const depId of step.dependencies) {
            if (!state.steps.find(s => s.id === depId)) {
                errors.push(`Step ${step.id} depends on non-existent step ${depId}`);
            }
        }
    }
    // Check checkpoints are valid
    for (const checkpoint of state.checkpoints) {
        if (checkpoint.stepIndex < 0 || checkpoint.stepIndex >= state.steps.length) {
            errors.push(`Checkpoint ${checkpoint.id} has invalid step index ${checkpoint.stepIndex}`);
        }
    }
    return errors;
}
/**
 * Sanitize text input to prevent issues
 */
export function sanitizeTextInput(input) {
    return input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .slice(0, 2000); // Limit length
}
//# sourceMappingURL=validation.js.map