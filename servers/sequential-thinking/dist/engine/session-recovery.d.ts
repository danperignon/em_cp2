/**
 * Session Recovery Engine
 *
 * Implements multiple recovery strategies for reasoning sessions:
 * - Full recovery from persistent storage
 * - Partial recovery with data reconstruction
 * - Checkpoint-based recovery with rollback
 * - Progressive recovery with health validation
 */
import type { ReasoningState, Checkpoint } from '../types/index.js';
import type { SessionMetadata } from './state-storage-manager.js';
import type { SessionHealthReport } from './session-validator.js';
export interface RecoveryStrategy {
    name: string;
    priority: number;
    description: string;
    canHandle: (context: RecoveryContext) => boolean;
    execute: (context: RecoveryContext) => Promise<RecoveryResult>;
}
export interface RecoveryContext {
    sessionId: string;
    errorType: RecoveryErrorType;
    lastKnownState?: ReasoningState;
    metadata?: SessionMetadata;
    healthReport?: SessionHealthReport;
    availableCheckpoints?: Checkpoint[];
    attemptNumber: number;
    maxAttempts: number;
}
export interface RecoveryResult {
    success: boolean;
    recoveredState?: ReasoningState;
    strategy: string;
    recoveryType: RecoveryType;
    confidence: number;
    issues: string[];
    metrics: RecoveryMetrics;
    error?: string;
}
export interface RecoveryMetrics {
    recoveryTimeMs: number;
    dataIntegrityScore: number;
    stepsCovered: number;
    checkpointsUsed: number;
    successRate: number;
}
export type RecoveryErrorType = 'corruption' | 'missing_data' | 'dependency_failure' | 'validation_failure' | 'timeout' | 'unknown';
export type RecoveryType = 'full' | 'partial' | 'checkpoint_rollback' | 'reconstructed' | 'minimal';
export interface RecoveryConfig {
    maxRetryAttempts: number;
    retryDelayMs: number;
    exponentialBackoffMultiplier: number;
    enableProgressiveRecovery: boolean;
    healthScoreThreshold: number;
    timeoutMs: number;
}
export declare class SessionRecovery {
    private logger;
    private config;
    private strategies;
    private recoveryStats;
    constructor(config?: Partial<RecoveryConfig>);
    /**
     * Attempt to recover a session using available strategies
     */
    recoverSession(sessionId: string, errorType: RecoveryErrorType, context?: Partial<RecoveryContext>): Promise<RecoveryResult>;
    /**
     * Get recovery statistics for monitoring
     */
    getRecoveryStats(): {
        totalAttempts: number;
        successfulRecoveries: number;
        averageRecoveryTime: number;
        strategyStats: Array<{
            name: string;
            successRate: number;
            averageTime: number;
            totalAttempts: number;
        }>;
    };
    private initializeStrategies;
    private executeFullStateRecovery;
    private executeCheckpointRollback;
    private executePartialReconstruction;
    private executeMinimalRecovery;
    private createEmptyMetrics;
    private getStrategySuccessRate;
    private updateStrategyMetrics;
    private executeWithTimeout;
    private sleep;
}
//# sourceMappingURL=session-recovery.d.ts.map