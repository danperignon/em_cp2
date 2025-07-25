/**
 * Chain Manager
 *
 * Coordinates ReasoningState lifecycle, manages step execution order,
 * handles checkpoints, and provides progress tracking capabilities.
 */
import type { ReasoningState, ReasoningStep, ProblemDefinition, DecompositionStrategy, ReasoningMetadata, Checkpoint } from '../types/index.js';
import { type SessionHealthReport } from './session-validator.js';
import { type RecoveryResult, type RecoveryErrorType } from './session-recovery.js';
import { type SessionEventType } from './session-events.js';
import { type ClientSession, type LockRequest, type SessionAccessInfo } from './multi-client-manager.js';
import { type StateConflict, type ConflictResolution } from './conflict-resolver.js';
export declare class ChainManager {
    private logger;
    private activeStates;
    private stateStorage;
    private sessionValidator;
    private sessionRecovery;
    private eventManager;
    private progressiveRestoration;
    private multiClientManager;
    private conflictResolver;
    private persistenceEnabled;
    private cleanupInterval;
    private cleanupIntervalMs;
    constructor();
    /**
     * Initialize the ChainManager with persistent storage
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the ChainManager and cleanup resources
     */
    shutdown(): Promise<void>;
    /**
     * Perform progressive restoration of active sessions on startup
     */
    private restoreActiveSessions;
    /**
     * Perform basic fallback restoration if progressive restoration fails
     */
    private performBasicFallbackRestoration;
    /**
     * Get restoration system status and metrics
     */
    getRestorationMetrics(): {
        progressiveRestorationAvailable: boolean;
        activeRestorations: number;
        currentPlan?: any;
    };
    /**
     * Create a new reasoning state from problem and steps
     */
    createReasoningState(problem: ProblemDefinition, steps: ReasoningStep[], strategy: DecompositionStrategy, metadata?: Partial<ReasoningMetadata>): Promise<ReasoningState>;
    /**
     * Execute the next step in the reasoning chain
     */
    executeNextStep(stateId: string): Promise<{
        success: boolean;
        updatedState?: ReasoningState;
        error?: string;
    }>;
    /**
     * Execute all remaining steps in the reasoning chain
     */
    executeAllSteps(stateId: string): Promise<{
        success: boolean;
        finalState?: ReasoningState;
        executedSteps: number;
        error?: string;
    }>;
    /**
     * Get the current state of a reasoning chain
     */
    getReasoningState(stateId: string): ReasoningState | null;
    /**
     * Get progress information for a reasoning state
     */
    getProgress(stateId: string): {
        currentStep: number;
        totalSteps: number;
        completedSteps: number;
        failedSteps: number;
        progressPercentage: number;
        estimatedTimeRemaining?: number;
    } | null;
    /**
     * Create a checkpoint for the current state
     */
    createCheckpoint(state: ReasoningState, label: string, auto?: boolean): Promise<Checkpoint>;
    /**
     * Restore state from a checkpoint
     */
    restoreFromCheckpoint(stateId: string, checkpointId: string): Promise<{
        success: boolean;
        restoredState?: ReasoningState;
        error?: string;
    }>;
    /**
     * Remove a reasoning state from active management
     */
    removeReasoningState(stateId: string, status?: 'completed' | 'archived'): Promise<boolean>;
    /**
     * Get all active reasoning states
     */
    getActiveStates(): ReasoningState[];
    /**
     * Load a session from persistent storage and add to active management
     */
    loadSession(sessionId: string): Promise<{
        success: boolean;
        state?: ReasoningState;
        error?: string;
    }>;
    /**
     * Save a session to persistent storage with backup
     */
    saveSession(stateId: string, createBackup?: boolean): Promise<{
        success: boolean;
        sessionPath?: string;
        error?: string;
    }>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        totalSessions: number;
        activeSessions: number;
        completedSessions: number;
        totalSizeBytes: number;
        oldestSession: number;
        newestSession: number;
    }>;
    /**
     * List all saved sessions
     */
    listSavedSessions(options?: any): Promise<{
        success: boolean;
        sessions?: any[];
        error?: string;
    }>;
    /**
     * Get a specific active reasoning state
     */
    getActiveState(stateId: string): ReasoningState | null;
    /**
     * Save session state with options
     */
    saveSessionState(stateId: string, options?: {
        updateMetadata?: boolean;
        createBackup?: boolean;
    }): Promise<{
        success: boolean;
        sessionPath?: string;
        error?: string;
    }>;
    /**
     * Load session state
     */
    loadSessionState(sessionId: string): Promise<{
        success: boolean;
        state?: ReasoningState;
        metadata?: any;
        error?: string;
    }>;
    /**
     * Resume a session from a specific step
     */
    resumeSession(sessionId: string, continueFromStep?: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Validate session health and optionally repair issues
     */
    validateSessionHealth(sessionId: string, attemptRepair?: boolean): Promise<{
        success: boolean;
        healthReport?: SessionHealthReport;
        repairResult?: {
            repairedIssues: string[];
            remainingIssues: number;
        };
        error?: string;
    }>;
    /**
     * Attempt to recover a failed or corrupted session
     */
    recoverSession(sessionId: string, errorType?: RecoveryErrorType): Promise<{
        success: boolean;
        recoveryResult?: RecoveryResult;
        error?: string;
    }>;
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
    /**
     * Update session status
     */
    updateSessionStatus(sessionId: string, status: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Start background cleanup scheduler
     */
    private startBackgroundCleanup;
    /**
     * Stop background cleanup scheduler
     */
    private stopBackgroundCleanup;
    /**
     * Perform background cleanup of expired sessions
     */
    private performBackgroundCleanup;
    /**
     * Save all active sessions (used during shutdown)
     */
    private saveAllActiveSessions;
    /**
     * Update session activity timestamp (heartbeat)
     */
    private updateSessionActivity;
    /**
     * Persist a reasoning state to storage
     */
    private persistState;
    private generateStateId;
    private createReasoningStrategy;
    private createMetadata;
    private validateReasoningState;
    private checkDependencies;
    private simulateStepExecution;
    private isSignificantStep;
    /**
     * Subscribe to session lifecycle events
     */
    subscribeToEvents(eventTypes: SessionEventType | SessionEventType[], handler: (event: any) => Promise<void> | void, options?: {
        priority?: number;
        filter?: (event: any) => boolean;
        id?: string;
    }): string;
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents(subscriptionId: string): boolean;
    /**
     * Get session event history
     */
    getSessionEventHistory(filter?: {
        sessionId?: string;
        eventType?: SessionEventType;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }): any[];
    /**
     * Get event system metrics
     */
    getEventMetrics(): {
        overview: any;
        handlerStats: any[];
        eventDistribution: any[];
    };
    /**
     * Emit a custom session event (for external integrations)
     */
    emitSessionEvent(eventType: SessionEventType, sessionId: string, data: any, source?: string): Promise<void>;
    /**
     * Register a client for concurrent session access
     */
    registerClient(clientId: string, sessionId: string, clientInfo: {
        type: 'claude-desktop' | 'claude-code' | 'cline' | 'api' | 'unknown';
        version?: string;
        userAgent?: string;
    }, accessLevel?: 'read' | 'write' | 'admin'): Promise<{
        success: boolean;
        clientSession?: ClientSession;
        error?: string;
    }>;
    /**
     * Unregister a client from session access
     */
    unregisterClient(clientId: string): Promise<{
        success: boolean;
        releasedLocks: number;
        error?: string;
    }>;
    /**
     * Acquire a lock on a session for safe concurrent access
     */
    acquireSessionLock(request: LockRequest): Promise<{
        success: boolean;
        lockId?: string;
        error?: string;
        waitTime?: number;
    }>;
    /**
     * Release a session lock
     */
    releaseSessionLock(lockId: string): Promise<{
        success: boolean;
        processedQueue: boolean;
        error?: string;
    }>;
    /**
     * Get session access information including active clients and locks
     */
    getSessionAccessInfo(sessionId: string): SessionAccessInfo;
    /**
     * Get all active client sessions
     */
    getActiveClientSessions(): ClientSession[];
    /**
     * Check if a client can perform an operation on a session
     */
    canClientAccessSession(clientId: string, sessionId: string, operation: 'read' | 'write' | 'admin'): boolean;
    /**
     * Force release all locks for a session (admin operation)
     */
    forceReleaseSessionLocks(sessionId: string): Promise<{
        success: boolean;
        releasedLocks: number;
        error?: string;
    }>;
    /**
     * Enhanced executeNextStep with multi-client support
     */
    executeNextStepWithLock(stateId: string, clientId: string, options?: {
        lockTimeoutMs?: number;
        requireExclusiveLock?: boolean;
    }): Promise<{
        success: boolean;
        updatedState?: ReasoningState;
        lockId?: string;
        error?: string;
    }>;
    /**
     * Enhanced createReasoningState with multi-client support
     */
    createReasoningStateWithClient(problem: ProblemDefinition, steps: ReasoningStep[], strategy: DecompositionStrategy, clientId: string, clientInfo: {
        type: 'claude-desktop' | 'claude-code' | 'cline' | 'api' | 'unknown';
        version?: string;
        userAgent?: string;
    }, metadata?: Partial<ReasoningMetadata>): Promise<{
        success: boolean;
        state?: ReasoningState;
        clientSession?: ClientSession;
        error?: string;
    }>;
    /**
     * Update reasoning state with conflict detection and resolution
     */
    updateStateWithConflictResolution(stateId: string, clientId: string, stateUpdate: Partial<ReasoningState>): Promise<{
        success: boolean;
        updatedState?: ReasoningState;
        conflicts?: StateConflict[];
        resolutions?: ConflictResolution[];
        error?: string;
    }>;
    /**
     * Get active conflicts for a session
     */
    getActiveConflicts(sessionId?: string): StateConflict[];
    /**
     * Get conflict resolution statistics
     */
    getConflictStats(): import("./conflict-resolver.js").ConflictResolutionStats;
    /**
     * Get conflict resolution history
     */
    getConflictHistory(limit?: number): ConflictResolution[];
    /**
     * Manually resolve a specific conflict
     */
    resolveConflict(conflictId: string): Promise<{
        success: boolean;
        resolution?: ConflictResolution;
        error?: string;
    }>;
    /**
     * Force resolve all conflicts for a session
     */
    forceResolveAllConflicts(sessionId: string): Promise<{
        success: boolean;
        resolvedCount: number;
        failedCount: number;
        resolutions: ConflictResolution[];
        errors: string[];
    }>;
    private getConflictingClients;
    private getPendingClientUpdates;
}
//# sourceMappingURL=chain-manager.d.ts.map