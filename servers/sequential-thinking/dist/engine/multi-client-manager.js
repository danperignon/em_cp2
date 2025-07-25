/**
 * Multi-Client Session Manager
 *
 * Manages concurrent access to reasoning sessions from multiple clients,
 * providing locking mechanisms, access control, and conflict prevention.
 */
import { Logger } from '@em-cp2/shared';
export class MultiClientManager {
    logger;
    config;
    clientSessions;
    sessionLocks; // sessionId -> locks
    clientConnections; // sessionId -> clientIds
    lockQueue; // sessionId -> pending requests
    cleanupInterval = null;
    constructor(config = {}) {
        this.logger = new Logger('MultiClientManager');
        this.config = {
            maxClientsPerSession: 5,
            lockTimeoutMs: 30000, // 30 seconds
            clientTimeoutMs: 300000, // 5 minutes
            enableReadLocks: true,
            enableWriteLocks: true,
            enableExclusiveLocks: true,
            lockGranularity: 'session',
            conflictResolution: 'first_wins',
            ...config
        };
        this.clientSessions = new Map();
        this.sessionLocks = new Map();
        this.clientConnections = new Map();
        this.lockQueue = new Map();
        this.startCleanupScheduler();
    }
    /**
     * Register a new client connection to a session
     */
    async registerClient(clientId, sessionId, clientInfo, accessLevel = 'read') {
        try {
            // Check if session already has maximum clients
            const existingConnections = this.clientConnections.get(sessionId) || new Set();
            if (existingConnections.size >= this.config.maxClientsPerSession && !existingConnections.has(clientId)) {
                return {
                    success: false,
                    error: `Session ${sessionId} has reached maximum client limit (${this.config.maxClientsPerSession})`
                };
            }
            // Create or update client session
            const clientSession = {
                clientId,
                sessionId,
                connectionTime: Date.now(),
                lastActivity: Date.now(),
                accessLevel,
                clientInfo,
                locks: []
            };
            this.clientSessions.set(clientId, clientSession);
            // Update session connections
            if (!this.clientConnections.has(sessionId)) {
                this.clientConnections.set(sessionId, new Set());
            }
            this.clientConnections.get(sessionId).add(clientId);
            this.logger.info(`Client ${clientId} registered for session ${sessionId} with ${accessLevel} access`);
            return {
                success: true,
                clientSession
            };
        }
        catch (error) {
            this.logger.error('Error registering client:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Unregister a client from a session
     */
    async unregisterClient(clientId) {
        try {
            const clientSession = this.clientSessions.get(clientId);
            if (!clientSession) {
                return { success: true, releasedLocks: 0 }; // Already unregistered
            }
            const { sessionId } = clientSession;
            // Release all locks held by this client
            const releasedLocks = await this.releaseAllClientLocks(clientId);
            // Remove from session connections
            const connections = this.clientConnections.get(sessionId);
            if (connections) {
                connections.delete(clientId);
                if (connections.size === 0) {
                    this.clientConnections.delete(sessionId);
                }
            }
            // Remove client session
            this.clientSessions.delete(clientId);
            this.logger.info(`Client ${clientId} unregistered from session ${sessionId}, released ${releasedLocks} locks`);
            return {
                success: true,
                releasedLocks
            };
        }
        catch (error) {
            this.logger.error('Error unregistering client:', error);
            return {
                success: false,
                releasedLocks: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Acquire a lock on a session
     */
    async acquireLock(request) {
        try {
            const { sessionId, clientId, lockType, lockScope = 'full_session', timeoutMs = this.config.lockTimeoutMs } = request;
            // Validate client is registered
            const clientSession = this.clientSessions.get(clientId);
            if (!clientSession) {
                return {
                    success: false,
                    error: `Client ${clientId} is not registered`
                };
            }
            // Check access permissions
            if (!this.canClientAcquireLock(clientSession, lockType)) {
                return {
                    success: false,
                    error: `Client ${clientId} does not have permission to acquire ${lockType} lock`
                };
            }
            // Check for lock conflicts
            const conflictResult = this.checkLockConflicts(sessionId, lockType, lockScope, clientId);
            if (!conflictResult.canAcquire) {
                // Add to queue if there are conflicts
                if (!this.lockQueue.has(sessionId)) {
                    this.lockQueue.set(sessionId, []);
                }
                this.lockQueue.get(sessionId).push(request);
                return {
                    success: false,
                    error: 'Lock conflicts detected, added to queue',
                    conflictingLocks: conflictResult.conflictingLocks,
                    waitTime: this.estimateWaitTime(sessionId, request)
                };
            }
            // Create the lock
            const lockId = this.generateLockId();
            const lock = {
                lockId,
                sessionId,
                clientId,
                lockType,
                lockScope,
                acquiredAt: Date.now(),
                expiresAt: Date.now() + timeoutMs,
                reason: request.reason
            };
            // Store the lock
            if (!this.sessionLocks.has(sessionId)) {
                this.sessionLocks.set(sessionId, []);
            }
            this.sessionLocks.get(sessionId).push(lock);
            // Add to client's locks
            clientSession.locks.push(lock);
            clientSession.lastActivity = Date.now();
            this.logger.info(`Lock ${lockId} acquired by client ${clientId} on session ${sessionId} (${lockType}/${lockScope})`);
            return {
                success: true,
                lockId,
                lock
            };
        }
        catch (error) {
            this.logger.error('Error acquiring lock:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Release a specific lock
     */
    async releaseLock(lockId) {
        try {
            let lockFound = false;
            let sessionId = '';
            let clientId = '';
            // Find and remove the lock
            for (const [sid, locks] of this.sessionLocks.entries()) {
                const lockIndex = locks.findIndex(lock => lock.lockId === lockId);
                if (lockIndex !== -1) {
                    const lock = locks[lockIndex];
                    sessionId = sid;
                    clientId = lock.clientId;
                    // Remove from session locks
                    locks.splice(lockIndex, 1);
                    if (locks.length === 0) {
                        this.sessionLocks.delete(sid);
                    }
                    // Remove from client locks
                    const clientSession = this.clientSessions.get(clientId);
                    if (clientSession) {
                        const clientLockIndex = clientSession.locks.findIndex(l => l.lockId === lockId);
                        if (clientLockIndex !== -1) {
                            clientSession.locks.splice(clientLockIndex, 1);
                        }
                    }
                    lockFound = true;
                    break;
                }
            }
            if (!lockFound) {
                return {
                    success: false,
                    processedQueue: false,
                    error: `Lock ${lockId} not found`
                };
            }
            this.logger.info(`Lock ${lockId} released by client ${clientId} on session ${sessionId}`);
            // Process pending lock requests for this session
            const processedQueue = await this.processPendingLocks(sessionId);
            return {
                success: true,
                processedQueue
            };
        }
        catch (error) {
            this.logger.error('Error releasing lock:', error);
            return {
                success: false,
                processedQueue: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get session access information
     */
    getSessionAccessInfo(sessionId) {
        const connections = this.clientConnections.get(sessionId) || new Set();
        const locks = this.sessionLocks.get(sessionId) || [];
        const activeClients = Array.from(connections)
            .map(clientId => this.clientSessions.get(clientId))
            .filter((client) => client !== undefined);
        // Calculate metrics
        let totalConnections = 0;
        let totalSessionTime = 0;
        let lockConflicts = 0;
        for (const client of activeClients) {
            totalConnections++;
            totalSessionTime += Date.now() - client.connectionTime;
        }
        const lastModified = Math.max(...locks.map(lock => lock.acquiredAt), ...activeClients.map(client => client.lastActivity), 0);
        const lastModifiedBy = activeClients
            .sort((a, b) => b.lastActivity - a.lastActivity)[0]?.clientId || 'unknown';
        return {
            sessionId,
            activeClients,
            activeLocks: locks,
            accessMetrics: {
                totalConnections,
                currentConnections: connections.size,
                lockConflicts,
                averageSessionTime: totalConnections > 0 ? totalSessionTime / totalConnections : 0
            },
            lastModified,
            lastModifiedBy
        };
    }
    /**
     * Get all active client sessions
     */
    getActiveClients() {
        return Array.from(this.clientSessions.values());
    }
    /**
     * Update client activity timestamp
     */
    updateClientActivity(clientId) {
        const clientSession = this.clientSessions.get(clientId);
        if (clientSession) {
            clientSession.lastActivity = Date.now();
        }
    }
    /**
     * Check if a client can perform an operation on a session
     */
    canClientAccessSession(clientId, sessionId, operation) {
        const clientSession = this.clientSessions.get(clientId);
        if (!clientSession || clientSession.sessionId !== sessionId) {
            return false;
        }
        const accessLevels = {
            read: ['read', 'write', 'admin'],
            write: ['write', 'admin'],
            admin: ['admin']
        };
        return accessLevels[operation].includes(clientSession.accessLevel);
    }
    /**
     * Force release all locks for a session (admin operation)
     */
    async forceReleaseSessionLocks(sessionId) {
        try {
            const locks = this.sessionLocks.get(sessionId) || [];
            const releasedCount = locks.length;
            // Remove locks from client sessions
            for (const lock of locks) {
                const clientSession = this.clientSessions.get(lock.clientId);
                if (clientSession) {
                    clientSession.locks = clientSession.locks.filter(l => l.lockId !== lock.lockId);
                }
            }
            // Clear session locks
            this.sessionLocks.delete(sessionId);
            // Clear lock queue
            this.lockQueue.delete(sessionId);
            this.logger.warn(`Force released ${releasedCount} locks for session ${sessionId}`);
            return {
                success: true,
                releasedLocks: releasedCount
            };
        }
        catch (error) {
            this.logger.error('Error force releasing session locks:', error);
            return {
                success: false,
                releasedLocks: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Shutdown multi-client manager
     */
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        // Release all locks and disconnect all clients
        const clientIds = Array.from(this.clientSessions.keys());
        for (const clientId of clientIds) {
            await this.unregisterClient(clientId);
        }
        this.logger.info('MultiClientManager shutdown completed');
    }
    // Private methods
    canClientAcquireLock(clientSession, lockType) {
        switch (lockType) {
            case 'read':
                return this.config.enableReadLocks && ['read', 'write', 'admin'].includes(clientSession.accessLevel);
            case 'write':
                return this.config.enableWriteLocks && ['write', 'admin'].includes(clientSession.accessLevel);
            case 'exclusive':
                return this.config.enableExclusiveLocks && clientSession.accessLevel === 'admin';
            default:
                return false;
        }
    }
    checkLockConflicts(sessionId, requestedType, requestedScope, clientId) {
        const existingLocks = this.sessionLocks.get(sessionId) || [];
        const now = Date.now();
        // Filter out expired locks
        const activeLocks = existingLocks.filter(lock => lock.expiresAt > now);
        const conflictingLocks = [];
        for (const lock of activeLocks) {
            // Same client can have multiple read locks
            if (lock.clientId === clientId && requestedType === 'read' && lock.lockType === 'read') {
                continue;
            }
            // Check for conflicts based on lock types and scopes
            const hasConflict = this.lockTypesConflict(lock.lockType, requestedType) ||
                this.lockScopesConflict(lock.lockScope, requestedScope);
            if (hasConflict) {
                conflictingLocks.push(lock);
            }
        }
        return {
            canAcquire: conflictingLocks.length === 0,
            conflictingLocks
        };
    }
    lockTypesConflict(existingType, requestedType) {
        // Exclusive locks conflict with everything
        if (existingType === 'exclusive' || requestedType === 'exclusive') {
            return true;
        }
        // Write locks conflict with other write locks
        if (existingType === 'write' && requestedType === 'write') {
            return true;
        }
        // Write locks conflict with read locks
        if ((existingType === 'write' && requestedType === 'read') ||
            (existingType === 'read' && requestedType === 'write')) {
            return true;
        }
        // Multiple read locks are allowed
        return false;
    }
    lockScopesConflict(existingScope, requestedScope) {
        // Full session locks conflict with everything
        if (existingScope === 'full_session' || requestedScope === 'full_session') {
            return true;
        }
        // Same scope conflicts
        return existingScope === requestedScope;
    }
    async processPendingLocks(sessionId) {
        const queue = this.lockQueue.get(sessionId);
        if (!queue || queue.length === 0) {
            return false;
        }
        let processed = false;
        const remaining = [];
        for (const request of queue) {
            const result = await this.acquireLock(request);
            if (result.success) {
                processed = true;
                this.logger.info(`Processed queued lock request for client ${request.clientId} on session ${sessionId}`);
            }
            else {
                remaining.push(request);
            }
        }
        // Update queue with remaining requests
        if (remaining.length === 0) {
            this.lockQueue.delete(sessionId);
        }
        else {
            this.lockQueue.set(sessionId, remaining);
        }
        return processed;
    }
    estimateWaitTime(sessionId, request) {
        const locks = this.sessionLocks.get(sessionId) || [];
        const now = Date.now();
        let earliestExpiry = Infinity;
        for (const lock of locks) {
            if (this.lockTypesConflict(lock.lockType, request.lockType)) {
                earliestExpiry = Math.min(earliestExpiry, lock.expiresAt);
            }
        }
        return earliestExpiry === Infinity ? 0 : Math.max(0, earliestExpiry - now);
    }
    async releaseAllClientLocks(clientId) {
        const clientSession = this.clientSessions.get(clientId);
        if (!clientSession) {
            return 0;
        }
        const lockIds = clientSession.locks.map(lock => lock.lockId);
        let releasedCount = 0;
        for (const lockId of lockIds) {
            const result = await this.releaseLock(lockId);
            if (result.success) {
                releasedCount++;
            }
        }
        return releasedCount;
    }
    generateLockId() {
        return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startCleanupScheduler() {
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 60000); // Run every minute
    }
    performCleanup() {
        const now = Date.now();
        // Clean up expired locks
        let expiredLocks = 0;
        for (const [sessionId, locks] of this.sessionLocks.entries()) {
            const activeLocks = locks.filter(lock => {
                if (lock.expiresAt <= now) {
                    expiredLocks++;
                    return false;
                }
                return true;
            });
            if (activeLocks.length === 0) {
                this.sessionLocks.delete(sessionId);
            }
            else if (activeLocks.length !== locks.length) {
                this.sessionLocks.set(sessionId, activeLocks);
            }
        }
        // Clean up inactive clients
        let inactiveClients = 0;
        for (const [clientId, clientSession] of this.clientSessions.entries()) {
            if (now - clientSession.lastActivity > this.config.clientTimeoutMs) {
                this.unregisterClient(clientId);
                inactiveClients++;
            }
        }
        if (expiredLocks > 0 || inactiveClients > 0) {
            this.logger.debug(`Cleanup: removed ${expiredLocks} expired locks and ${inactiveClients} inactive clients`);
        }
    }
}
//# sourceMappingURL=multi-client-manager.js.map