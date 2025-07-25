/**
 * Session Recovery Engine
 *
 * Implements multiple recovery strategies for reasoning sessions:
 * - Full recovery from persistent storage
 * - Partial recovery with data reconstruction
 * - Checkpoint-based recovery with rollback
 * - Progressive recovery with health validation
 */
import { Logger } from '@em-cp2/shared';
export class SessionRecovery {
    logger;
    config;
    strategies;
    recoveryStats;
    constructor(config = {}) {
        this.logger = new Logger('SessionRecovery');
        this.config = {
            maxRetryAttempts: 3,
            retryDelayMs: 1000,
            exponentialBackoffMultiplier: 2,
            enableProgressiveRecovery: true,
            healthScoreThreshold: 40,
            timeoutMs: 30000,
            ...config
        };
        this.strategies = [];
        this.recoveryStats = new Map();
        this.initializeStrategies();
    }
    /**
     * Attempt to recover a session using available strategies
     */
    async recoverSession(sessionId, errorType, context = {}) {
        const startTime = Date.now();
        const recoveryContext = {
            sessionId,
            errorType,
            attemptNumber: 1,
            maxAttempts: this.config.maxRetryAttempts,
            ...context
        };
        this.logger.info(`Starting recovery for session ${sessionId} (error: ${errorType})`);
        // Get applicable strategies sorted by priority
        const applicableStrategies = this.strategies
            .filter(strategy => strategy.canHandle(recoveryContext))
            .sort((a, b) => b.priority - a.priority);
        if (applicableStrategies.length === 0) {
            return {
                success: false,
                strategy: 'none',
                recoveryType: 'minimal',
                confidence: 0,
                issues: ['No applicable recovery strategies found'],
                metrics: this.createEmptyMetrics(Date.now() - startTime),
                error: 'No recovery strategies available for this error type'
            };
        }
        // Try each strategy with retry logic
        for (const strategy of applicableStrategies) {
            let lastResult = null;
            for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
                recoveryContext.attemptNumber = attempt;
                try {
                    this.logger.debug(`Attempting recovery with strategy '${strategy.name}' (attempt ${attempt}/${this.config.maxRetryAttempts})`);
                    const result = await this.executeWithTimeout(strategy.execute(recoveryContext), this.config.timeoutMs);
                    if (result.success) {
                        // Update success rate for this strategy
                        this.updateStrategyMetrics(strategy.name, result.metrics, true);
                        this.logger.info(`Successfully recovered session ${sessionId} using strategy '${strategy.name}' (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
                        return result;
                    }
                    lastResult = result;
                    // If this is not the last attempt, wait with exponential backoff
                    if (attempt < this.config.maxRetryAttempts) {
                        const delay = this.config.retryDelayMs * Math.pow(this.config.exponentialBackoffMultiplier, attempt - 1);
                        this.logger.debug(`Strategy '${strategy.name}' failed (attempt ${attempt}), retrying in ${delay}ms`);
                        await this.sleep(delay);
                    }
                }
                catch (error) {
                    this.logger.warn(`Strategy '${strategy.name}' threw error on attempt ${attempt}:`, error);
                    lastResult = {
                        success: false,
                        strategy: strategy.name,
                        recoveryType: 'minimal',
                        confidence: 0,
                        issues: [error instanceof Error ? error.message : 'Unknown error'],
                        metrics: this.createEmptyMetrics(Date.now() - startTime),
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }
            // Update failure metrics for this strategy
            if (lastResult) {
                this.updateStrategyMetrics(strategy.name, lastResult.metrics, false);
            }
        }
        // All strategies failed
        const totalTime = Date.now() - startTime;
        this.logger.error(`Failed to recover session ${sessionId} after trying ${applicableStrategies.length} strategies`);
        return {
            success: false,
            strategy: 'all_failed',
            recoveryType: 'minimal',
            confidence: 0,
            issues: [`All ${applicableStrategies.length} recovery strategies failed`],
            metrics: this.createEmptyMetrics(totalTime),
            error: 'All recovery strategies exhausted'
        };
    }
    /**
     * Get recovery statistics for monitoring
     */
    getRecoveryStats() {
        const strategyStats = Array.from(this.recoveryStats.entries()).map(([name, metrics]) => ({
            name,
            successRate: metrics.successRate,
            averageTime: metrics.recoveryTimeMs,
            totalAttempts: Math.round(metrics.recoveryTimeMs / 1000) // Rough approximation
        }));
        const totalAttempts = strategyStats.reduce((sum, stat) => sum + stat.totalAttempts, 0);
        const successfulRecoveries = strategyStats.reduce((sum, stat) => sum + (stat.totalAttempts * stat.successRate), 0);
        const averageRecoveryTime = strategyStats.reduce((sum, stat) => sum + stat.averageTime, 0) / strategyStats.length || 0;
        return {
            totalAttempts,
            successfulRecoveries: Math.round(successfulRecoveries),
            averageRecoveryTime,
            strategyStats
        };
    }
    // Private methods
    initializeStrategies() {
        // Strategy 1: Full state recovery (highest priority)
        this.strategies.push({
            name: 'full_state_recovery',
            priority: 100,
            description: 'Attempt full state recovery from persistent storage',
            canHandle: (context) => context.metadata !== undefined,
            execute: this.executeFullStateRecovery.bind(this)
        });
        // Strategy 2: Checkpoint rollback recovery
        this.strategies.push({
            name: 'checkpoint_rollback',
            priority: 80,
            description: 'Rollback to the most recent valid checkpoint',
            canHandle: (context) => !!(context.availableCheckpoints && context.availableCheckpoints.length > 0),
            execute: this.executeCheckpointRollback.bind(this)
        });
        // Strategy 3: Partial state reconstruction
        this.strategies.push({
            name: 'partial_reconstruction',
            priority: 60,
            description: 'Reconstruct session from partial data',
            canHandle: (context) => context.lastKnownState !== undefined,
            execute: this.executePartialReconstruction.bind(this)
        });
        // Strategy 4: Minimal state recovery (lowest priority, always available)
        this.strategies.push({
            name: 'minimal_recovery',
            priority: 20,
            description: 'Create minimal working state from available data',
            canHandle: () => true,
            execute: this.executeMinimalRecovery.bind(this)
        });
        this.logger.info(`Initialized ${this.strategies.length} recovery strategies`);
    }
    async executeFullStateRecovery(context) {
        const startTime = Date.now();
        try {
            // This would integrate with StateStorageManager to reload the full session
            // For now, we'll simulate a full recovery
            if (!context.metadata) {
                throw new Error('Metadata required for full state recovery');
            }
            // Simulate loading from storage (in real implementation, this would call StateStorageManager)
            const recoveredState = context.lastKnownState;
            if (!recoveredState) {
                throw new Error('Could not load state from storage');
            }
            return {
                success: true,
                recoveredState,
                strategy: 'full_state_recovery',
                recoveryType: 'full',
                confidence: 0.95,
                issues: [],
                metrics: {
                    recoveryTimeMs: Date.now() - startTime,
                    dataIntegrityScore: 1.0,
                    stepsCovered: recoveredState.totalSteps,
                    checkpointsUsed: 0,
                    successRate: this.getStrategySuccessRate('full_state_recovery')
                }
            };
        }
        catch (error) {
            return {
                success: false,
                strategy: 'full_state_recovery',
                recoveryType: 'minimal',
                confidence: 0,
                issues: [error instanceof Error ? error.message : 'Unknown error'],
                metrics: this.createEmptyMetrics(Date.now() - startTime),
                error: error instanceof Error ? error.message : 'Full recovery failed'
            };
        }
    }
    async executeCheckpointRollback(context) {
        const startTime = Date.now();
        try {
            if (!context.availableCheckpoints || context.availableCheckpoints.length === 0) {
                throw new Error('No checkpoints available for rollback');
            }
            // Find the most recent valid checkpoint
            const sortedCheckpoints = context.availableCheckpoints
                .filter(cp => cp.state && cp.state.steps)
                .sort((a, b) => b.timestamp - a.timestamp);
            if (sortedCheckpoints.length === 0) {
                throw new Error('No valid checkpoints found');
            }
            const latestCheckpoint = sortedCheckpoints[0];
            // Reconstruct state from checkpoint
            const recoveredState = {
                ...context.lastKnownState,
                currentStep: latestCheckpoint.state.currentStep || 0,
                steps: latestCheckpoint.state.steps || []
            };
            const stepsCovered = recoveredState.steps.length;
            const dataIntegrityScore = stepsCovered / (context.lastKnownState?.totalSteps || stepsCovered);
            return {
                success: true,
                recoveredState,
                strategy: 'checkpoint_rollback',
                recoveryType: 'checkpoint_rollback',
                confidence: Math.min(0.9, dataIntegrityScore + 0.1),
                issues: stepsCovered < (context.lastKnownState?.totalSteps || 0) ?
                    [`Rolled back to checkpoint, lost ${(context.lastKnownState?.totalSteps || 0) - stepsCovered} steps`] : [],
                metrics: {
                    recoveryTimeMs: Date.now() - startTime,
                    dataIntegrityScore,
                    stepsCovered,
                    checkpointsUsed: 1,
                    successRate: this.getStrategySuccessRate('checkpoint_rollback')
                }
            };
        }
        catch (error) {
            return {
                success: false,
                strategy: 'checkpoint_rollback',
                recoveryType: 'minimal',
                confidence: 0,
                issues: [error instanceof Error ? error.message : 'Unknown error'],
                metrics: this.createEmptyMetrics(Date.now() - startTime),
                error: error instanceof Error ? error.message : 'Checkpoint rollback failed'
            };
        }
    }
    async executePartialReconstruction(context) {
        const startTime = Date.now();
        try {
            if (!context.lastKnownState) {
                throw new Error('No state data available for reconstruction');
            }
            const state = context.lastKnownState;
            const issues = [];
            // Reconstruct missing or corrupted data
            let reconstructedState = { ...state };
            // Fix missing or invalid step indices
            if (reconstructedState.steps) {
                reconstructedState.steps.forEach((step, index) => {
                    if (step.index !== index) {
                        step.index = index;
                        issues.push(`Fixed step index for step ${index + 1}`);
                    }
                    if (!step.id) {
                        step.id = `reconstructed-step-${index}`;
                        issues.push(`Generated missing ID for step ${index + 1}`);
                    }
                });
            }
            // Fix step count inconsistencies
            if (reconstructedState.steps && reconstructedState.totalSteps !== reconstructedState.steps.length) {
                reconstructedState.totalSteps = reconstructedState.steps.length;
                issues.push('Fixed step count mismatch');
            }
            // Validate current step bounds
            if (reconstructedState.currentStep > reconstructedState.totalSteps) {
                reconstructedState.currentStep = reconstructedState.totalSteps;
                issues.push('Fixed current step index out of bounds');
            }
            const dataIntegrityScore = Math.max(0.5, 1 - (issues.length * 0.1));
            return {
                success: true,
                recoveredState: reconstructedState,
                strategy: 'partial_reconstruction',
                recoveryType: 'reconstructed',
                confidence: dataIntegrityScore,
                issues,
                metrics: {
                    recoveryTimeMs: Date.now() - startTime,
                    dataIntegrityScore,
                    stepsCovered: reconstructedState.steps?.length || 0,
                    checkpointsUsed: 0,
                    successRate: this.getStrategySuccessRate('partial_reconstruction')
                }
            };
        }
        catch (error) {
            return {
                success: false,
                strategy: 'partial_reconstruction',
                recoveryType: 'minimal',
                confidence: 0,
                issues: [error instanceof Error ? error.message : 'Unknown error'],
                metrics: this.createEmptyMetrics(Date.now() - startTime),
                error: error instanceof Error ? error.message : 'Partial reconstruction failed'
            };
        }
    }
    async executeMinimalRecovery(context) {
        const startTime = Date.now();
        try {
            // Create a minimal working state
            const minimalState = {
                id: context.sessionId,
                timestamp: Date.now(),
                problem: {
                    description: 'Recovered session with minimal data',
                    context: { recoveryType: 'minimal', recoveredAt: Date.now() },
                    constraints: [],
                    goalState: 'Restore session functionality',
                    complexity: 'simple',
                    domain: 'general'
                },
                currentStep: 0,
                totalSteps: 1,
                steps: [{
                        id: 'recovery-step-1',
                        index: 0,
                        description: 'Session recovery placeholder step',
                        reasoning: 'This step was created during session recovery',
                        confidence: 0.5,
                        dependencies: [],
                        inputs: {},
                        outputs: {},
                        status: 'pending',
                        timestamp: Date.now()
                    }],
                strategy: {
                    name: 'recovery',
                    type: 'sequential',
                    parameters: {},
                    adaptationTriggers: [],
                    performanceMetrics: {
                        accuracy: 0,
                        efficiency: 0,
                        completionRate: 0,
                        averageConfidence: 0.5
                    }
                },
                metadata: {
                    sessionId: context.sessionId,
                    clientType: 'sequential-thinking-server',
                    version: '2.0.0',
                    tags: ['recovered', 'minimal'],
                    priority: 'low'
                },
                checkpoints: []
            };
            return {
                success: true,
                recoveredState: minimalState,
                strategy: 'minimal_recovery',
                recoveryType: 'minimal',
                confidence: 0.3,
                issues: ['Created minimal recovery state', 'Original session data may be lost'],
                metrics: {
                    recoveryTimeMs: Date.now() - startTime,
                    dataIntegrityScore: 0.3,
                    stepsCovered: 1,
                    checkpointsUsed: 0,
                    successRate: this.getStrategySuccessRate('minimal_recovery')
                }
            };
        }
        catch (error) {
            return {
                success: false,
                strategy: 'minimal_recovery',
                recoveryType: 'minimal',
                confidence: 0,
                issues: [error instanceof Error ? error.message : 'Unknown error'],
                metrics: this.createEmptyMetrics(Date.now() - startTime),
                error: error instanceof Error ? error.message : 'Even minimal recovery failed'
            };
        }
    }
    createEmptyMetrics(recoveryTimeMs) {
        return {
            recoveryTimeMs,
            dataIntegrityScore: 0,
            stepsCovered: 0,
            checkpointsUsed: 0,
            successRate: 0
        };
    }
    getStrategySuccessRate(strategyName) {
        const metrics = this.recoveryStats.get(strategyName);
        return metrics?.successRate || 0.5; // Default to 50% if no historical data
    }
    updateStrategyMetrics(strategyName, metrics, success) {
        const existing = this.recoveryStats.get(strategyName) || {
            recoveryTimeMs: 0,
            dataIntegrityScore: 0,
            stepsCovered: 0,
            checkpointsUsed: 0,
            successRate: 0.5
        };
        // Update with exponential moving average
        const alpha = 0.2; // Learning rate
        this.recoveryStats.set(strategyName, {
            recoveryTimeMs: existing.recoveryTimeMs * (1 - alpha) + metrics.recoveryTimeMs * alpha,
            dataIntegrityScore: existing.dataIntegrityScore * (1 - alpha) + metrics.dataIntegrityScore * alpha,
            stepsCovered: existing.stepsCovered * (1 - alpha) + metrics.stepsCovered * alpha,
            checkpointsUsed: existing.checkpointsUsed * (1 - alpha) + metrics.checkpointsUsed * alpha,
            successRate: existing.successRate * (1 - alpha) + (success ? 1 : 0) * alpha
        });
    }
    async executeWithTimeout(promise, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Recovery operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            promise
                .then(result => {
                clearTimeout(timeout);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=session-recovery.js.map