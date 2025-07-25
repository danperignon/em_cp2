/**
 * Multi-Client Session Manager
 *
 * Manages concurrent access to reasoning sessions from multiple clients,
 * providing locking mechanisms, access control, and conflict prevention.
 */
export interface ClientSession {
    clientId: string;
    sessionId: string;
    connectionTime: number;
    lastActivity: number;
    accessLevel: 'read' | 'write' | 'admin';
    clientInfo: {
        type: 'claude-desktop' | 'claude-code' | 'cline' | 'api' | 'unknown';
        version?: string;
        userAgent?: string;
    };
    locks: SessionLock[];
}
export interface SessionLock {
    lockId: string;
    sessionId: string;
    clientId: string;
    lockType: 'read' | 'write' | 'exclusive';
    acquiredAt: number;
    expiresAt: number;
    lockScope: 'full_session' | 'step_execution' | 'metadata_only';
    reason?: string;
}
export interface LockRequest {
    sessionId: string;
    clientId: string;
    lockType: 'read' | 'write' | 'exclusive';
    lockScope?: 'full_session' | 'step_execution' | 'metadata_only';
    timeoutMs?: number;
    reason?: string;
}
export interface LockResult {
    success: boolean;
    lockId?: string;
    lock?: SessionLock;
    error?: string;
    waitTime?: number;
    conflictingLocks?: SessionLock[];
}
export interface MultiClientConfig {
    maxClientsPerSession: number;
    lockTimeoutMs: number;
    clientTimeoutMs: number;
    enableReadLocks: boolean;
    enableWriteLocks: boolean;
    enableExclusiveLocks: boolean;
    lockGranularity: 'session' | 'step' | 'fine';
    conflictResolution: 'first_wins' | 'last_wins' | 'priority_based' | 'manual';
}
export interface SessionAccessInfo {
    sessionId: string;
    activeClients: ClientSession[];
    activeLocks: SessionLock[];
    accessMetrics: {
        totalConnections: number;
        currentConnections: number;
        lockConflicts: number;
        averageSessionTime: number;
    };
    lastModified: number;
    lastModifiedBy: string;
}
export declare class MultiClientManager {
    private logger;
    private config;
    private clientSessions;
    private sessionLocks;
    private clientConnections;
    private lockQueue;
    private cleanupInterval;
    constructor(config?: Partial<MultiClientConfig>);
    /**
     * Register a new client connection to a session
     */
    registerClient(clientId: string, sessionId: string, clientInfo: ClientSession['clientInfo'], accessLevel?: ClientSession['accessLevel']): Promise<{
        success: boolean;
        clientSession?: ClientSession;
        error?: string;
    }>;
    /**
     * Unregister a client from a session
     */
    unregisterClient(clientId: string): Promise<{
        success: boolean;
        releasedLocks: number;
        error?: string;
    }>;
    /**
     * Acquire a lock on a session
     */
    acquireLock(request: LockRequest): Promise<LockResult>;
    /**
     * Release a specific lock
     */
    releaseLock(lockId: string): Promise<{
        success: boolean;
        processedQueue: boolean;
        error?: string;
    }>;
    /**
     * Get session access information
     */
    getSessionAccessInfo(sessionId: string): SessionAccessInfo;
    /**
     * Get all active client sessions
     */
    getActiveClients(): ClientSession[];
    /**
     * Update client activity timestamp
     */
    updateClientActivity(clientId: string): void;
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
     * Shutdown multi-client manager
     */
    shutdown(): Promise<void>;
    private canClientAcquireLock;
    private checkLockConflicts;
    private lockTypesConflict;
    private lockScopesConflict;
    private processPendingLocks;
    private estimateWaitTime;
    private releaseAllClientLocks;
    private generateLockId;
    private startCleanupScheduler;
    private performCleanup;
}
//# sourceMappingURL=multi-client-manager.d.ts.map