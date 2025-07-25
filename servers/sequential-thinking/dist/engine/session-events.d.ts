/**
 * Session Lifecycle Event System
 *
 * Event-driven architecture for session state changes with configurable hooks,
 * monitoring capabilities, and lifecycle management integration.
 */
import type { ReasoningState } from '../types/index.js';
import type { SessionMetadata } from './state-storage-manager.js';
import type { SessionHealthReport } from './session-validator.js';
import type { RecoveryResult } from './session-recovery.js';
export type SessionEventType = 'session_created' | 'session_loaded' | 'session_saved' | 'session_updated' | 'session_paused' | 'session_resumed' | 'session_completed' | 'session_failed' | 'session_timeout' | 'session_cleanup' | 'session_recovered' | 'health_check_passed' | 'health_check_failed' | 'validation_warning' | 'recovery_started' | 'recovery_completed' | 'recovery_failed' | 'session_restoration_started' | 'session_restoration_completed' | 'session_restoration_failed' | 'restoration_stage_started' | 'restoration_stage_completed' | 'client_connected' | 'client_disconnected' | 'lock_acquired' | 'lock_released' | 'locks_force_released' | 'lock_conflict' | 'client_timeout';
export interface SessionEvent {
    id: string;
    type: SessionEventType;
    sessionId: string;
    timestamp: number;
    source: string;
    data: SessionEventData;
    metadata?: Record<string, unknown>;
}
export interface SessionEventData {
    previousState?: Partial<ReasoningState>;
    currentState?: Partial<ReasoningState>;
    metadata?: SessionMetadata;
    healthReport?: SessionHealthReport;
    recoveryResult?: RecoveryResult;
    error?: string;
    reason?: string;
    context?: Record<string, unknown>;
    clientId?: string;
    clientInfo?: {
        type: 'claude-desktop' | 'claude-code' | 'cline' | 'api' | 'unknown';
        version?: string;
        userAgent?: string;
    };
    accessLevel?: 'read' | 'write' | 'admin';
    releasedLocks?: number;
    lockId?: string;
    lockType?: 'read' | 'write' | 'exclusive';
    lockScope?: 'full_session' | 'step_execution' | 'metadata_only';
    processedQueue?: boolean;
}
export type SessionEventHandler = (event: SessionEvent) => Promise<void> | void;
export interface EventSubscription {
    id: string;
    eventTypes: SessionEventType[];
    handler: SessionEventHandler;
    priority: number;
    enabled: boolean;
    filter?: (event: SessionEvent) => boolean;
}
export interface SessionEventConfig {
    enableEventHistory: boolean;
    maxHistorySize: number;
    enableMetrics: boolean;
    enableAsyncHandlers: boolean;
    handlerTimeoutMs: number;
    retryFailedHandlers: boolean;
    maxRetries: number;
}
export interface SessionEventMetrics {
    totalEvents: number;
    eventsByType: Map<SessionEventType, number>;
    handlerExecutions: number;
    handlerFailures: number;
    averageHandlerTime: number;
    lastEventTime: number;
}
export declare class SessionEventManager {
    private logger;
    private config;
    private subscriptions;
    private eventHistory;
    private metrics;
    private handlerStats;
    constructor(config?: Partial<SessionEventConfig>);
    /**
     * Subscribe to session lifecycle events
     */
    subscribe(eventTypes: SessionEventType | SessionEventType[], handler: SessionEventHandler, options?: {
        priority?: number;
        filter?: (event: SessionEvent) => boolean;
        id?: string;
    }): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Enable or disable a subscription
     */
    setSubscriptionEnabled(subscriptionId: string, enabled: boolean): boolean;
    /**
     * Emit a session event
     */
    emit(type: SessionEventType, sessionId: string, data: SessionEventData, options?: {
        source?: string;
        metadata?: Record<string, unknown>;
        skipHistory?: boolean;
    }): Promise<void>;
    /**
     * Get event history with optional filtering
     */
    getEventHistory(filter?: {
        sessionId?: string;
        eventType?: SessionEventType;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }): SessionEvent[];
    /**
     * Get event metrics and statistics
     */
    getMetrics(): {
        overview: SessionEventMetrics;
        handlerStats: Array<{
            subscriptionId: string;
            executions: number;
            failures: number;
            averageTime: number;
            successRate: number;
        }>;
        eventDistribution: Array<{
            eventType: SessionEventType;
            count: number;
            percentage: number;
        }>;
    };
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Get all active subscriptions
     */
    getSubscriptions(): Array<{
        id: string;
        eventTypes: SessionEventType[];
        priority: number;
        enabled: boolean;
        hasFilter: boolean;
    }>;
    private initializeBuiltinHandlers;
    private handleSessionLifecycleLogging;
    private handleHealthMonitoring;
    private handleRecoveryTracking;
    private executeHandler;
    private updateMetrics;
    private addToHistory;
    private generateId;
    private executeWithTimeout;
    private sleep;
}
//# sourceMappingURL=session-events.d.ts.map