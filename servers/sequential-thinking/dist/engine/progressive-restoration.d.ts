/**
 * Progressive Restoration Engine
 *
 * Enhanced startup restoration with progressive loading, health checks,
 * prioritization, and comprehensive validation with fallback strategies.
 */
import type { ReasoningState } from '../types/index.js';
import type { SessionHealthReport } from './session-validator.js';
import type { RecoveryResult } from './session-recovery.js';
export interface RestorationConfig {
    enableProgressiveLoading: boolean;
    maxConcurrentRestorations: number;
    healthScoreThreshold: number;
    enablePrioritization: boolean;
    timeoutPerSessionMs: number;
    maxRetryAttempts: number;
    retryDelayMs: number;
    enableDetailedReporting: boolean;
}
export interface RestorationPriority {
    sessionId: string;
    score: number;
    factors: {
        lastActivity: number;
        healthScore: number;
        complexity: number;
        dependencies: number;
        userPriority: number;
    };
}
export interface RestorationStage {
    name: string;
    description: string;
    sessionIds: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    results: RestorationResult[];
}
export interface RestorationResult {
    sessionId: string;
    success: boolean;
    strategy: 'direct' | 'repair' | 'recovery' | 'fallback';
    healthScore: number;
    restoredState?: ReasoningState;
    healthReport?: SessionHealthReport;
    recoveryResult?: RecoveryResult;
    issues: string[];
    warnings: string[];
    executionTimeMs: number;
    error?: string;
}
export interface RestorationPlan {
    totalSessions: number;
    stages: RestorationStage[];
    estimatedTimeMs: number;
    priorities: RestorationPriority[];
    config: RestorationConfig;
}
export interface RestorationReport {
    success: boolean;
    totalSessions: number;
    successfulRestorations: number;
    failedRestorations: number;
    repairedSessions: number;
    recoveredSessions: number;
    totalTimeMs: number;
    stages: RestorationStage[];
    healthDistribution: {
        healthy: number;
        warning: number;
        critical: number;
        corrupted: number;
    };
    strategies: {
        direct: number;
        repair: number;
        recovery: number;
        fallback: number;
    };
    errors: string[];
    warnings: string[];
}
export declare class ProgressiveRestoration {
    private stateStorage;
    private sessionValidator;
    private sessionRecovery;
    private eventManager;
    private logger;
    private config;
    private currentPlan?;
    private activeRestorations;
    constructor(stateStorage: any, sessionValidator: any, sessionRecovery: any, eventManager: any, config?: Partial<RestorationConfig>);
    /**
     * Execute progressive restoration of all active sessions
     */
    restoreActiveSessions(): Promise<RestorationReport>;
    /**
     * Create a restoration plan with prioritization and staging
     */
    private createRestorationPlan;
    /**
     * Calculate restoration priorities for sessions
     */
    private calculatePriorities;
    /**
     * Create restoration stages based on priorities and constraints
     */
    private createRestorationStages;
    /**
     * Execute the restoration plan stage by stage
     */
    private executeRestorationPlan;
    /**
     * Execute a single restoration stage
     */
    private executeRestorationStage;
    /**
     * Restore a single session with comprehensive error handling
     */
    private restoreSingleSession;
    private createBatches;
    private calculateActivityScore;
    private calculateComplexityScore;
    private calculateDependencyScore;
    private calculateUserPriorityScore;
    private calculateTotalPriorityScore;
    private estimateRestorationTime;
    private performQuickHealthCheck;
    private updateReportWithResult;
    private createEmptyReport;
    private createErrorReport;
    private finalizeReport;
    /**
     * Get current restoration status
     */
    getRestorationStatus(): {
        activeRestorations: number;
        currentPlan?: RestorationPlan;
    };
}
//# sourceMappingURL=progressive-restoration.d.ts.map