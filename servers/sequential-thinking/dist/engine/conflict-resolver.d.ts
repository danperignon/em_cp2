/**
 * Conflict Resolution Engine
 *
 * Handles simultaneous state modifications from multiple clients with
 * intelligent conflict detection, resolution strategies, and state merging.
 */
import type { ReasoningState } from '../types/index.js';
import type { SessionEventManager } from './session-events.js';
export interface StateConflict {
    conflictId: string;
    sessionId: string;
    conflictType: 'concurrent_modification' | 'step_overlap' | 'state_divergence' | 'lock_violation';
    clientA: string;
    clientB: string;
    stateA: Partial<ReasoningState>;
    stateB: Partial<ReasoningState>;
    baseState: Partial<ReasoningState>;
    detectedAt: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedFields: string[];
    metadata?: Record<string, unknown>;
}
export interface ConflictResolution {
    conflictId: string;
    strategy: 'merge' | 'client_priority' | 'timestamp_based' | 'manual_intervention' | 'rollback';
    resolvedState: ReasoningState;
    resolvedAt: number;
    resolutionConfidence: number;
    appliedChanges: Array<{
        field: string;
        action: 'keep_a' | 'keep_b' | 'merge' | 'discard';
        reason: string;
    }>;
    requiresReview: boolean;
    metadata?: Record<string, unknown>;
}
export interface ConflictDetectionOptions {
    enableFieldLevelDetection: boolean;
    enableSemanticAnalysis: boolean;
    conflictThreshold: number;
    prioritizeByTimestamp: boolean;
    prioritizeByClientType: boolean;
    allowAutomaticResolution: boolean;
    maxResolutionAttempts: number;
}
export interface ConflictResolutionStats {
    totalConflicts: number;
    resolvedConflicts: number;
    pendingConflicts: number;
    resolutionSuccessRate: number;
    averageResolutionTime: number;
    conflictsByType: Map<string, number>;
    resolutionsByStrategy: Map<string, number>;
    lastConflictTime: number;
}
export declare class ConflictResolver {
    private logger;
    private eventManager;
    private options;
    private activeConflicts;
    private resolutionHistory;
    private stats;
    constructor(eventManager: SessionEventManager, options?: Partial<ConflictDetectionOptions>);
    /**
     * Detect conflicts between two state modifications
     */
    detectConflicts(sessionId: string, clientA: string, stateA: Partial<ReasoningState>, clientB: string, stateB: Partial<ReasoningState>, baseState: Partial<ReasoningState>): Promise<StateConflict[]>;
    /**
     * Resolve a specific conflict using the most appropriate strategy
     */
    resolveConflict(conflictId: string): Promise<{
        success: boolean;
        resolution?: ConflictResolution;
        error?: string;
    }>;
    /**
     * Resolve all pending conflicts for a session
     */
    resolveAllConflicts(sessionId: string): Promise<{
        success: boolean;
        resolvedCount: number;
        failedCount: number;
        resolutions: ConflictResolution[];
        errors: string[];
    }>;
    /**
     * Get conflict resolution statistics
     */
    getConflictStats(): ConflictResolutionStats;
    /**
     * Get active conflicts for a session
     */
    getActiveConflicts(sessionId?: string): StateConflict[];
    /**
     * Get resolution history
     */
    getResolutionHistory(limit?: number): ConflictResolution[];
    private detectFieldConflicts;
    private detectSemanticConflicts;
    private detectStepExecutionConflicts;
    private detectStateDivergence;
    private selectResolutionStrategy;
    private applyResolutionStrategy;
    private applyMergeStrategy;
    private applyTimestampStrategy;
    private applyClientPriorityStrategy;
    private applyRollbackStrategy;
    private flagForManualIntervention;
    private deepEqual;
    private assessConflictSeverity;
    private calculateOverallSeverity;
    private calculateStateSimilarity;
    private shouldPreferClientA;
    private getClientPriority;
    private generateConflictId;
}
//# sourceMappingURL=conflict-resolver.d.ts.map