/**
 * Multi-Client Session Manager
 * 
 * Manages concurrent access to reasoning sessions from multiple clients,
 * providing locking mechanisms, access control, and conflict prevention.
 */

import { Logger } from '@em-cp2/shared';

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

export class MultiClientManager {
  private logger: Logger;
  private config: MultiClientConfig;
  private clientSessions: Map<string, ClientSession>;
  private sessionLocks: Map<string, SessionLock[]>; // sessionId -> locks
  private clientConnections: Map<string, Set<string>>; // sessionId -> clientIds
  private lockQueue: Map<string, LockRequest[]>; // sessionId -> pending requests
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<MultiClientConfig> = {}) {
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
  async registerClient(
    clientId: string,
    sessionId: string,
    clientInfo: ClientSession['clientInfo'],
    accessLevel: ClientSession['accessLevel'] = 'read'
  ): Promise<{
    success: boolean;
    clientSession?: ClientSession;
    error?: string;
  }> {
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
      const clientSession: ClientSession = {
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
      this.clientConnections.get(sessionId)!.add(clientId);

      this.logger.info(`Client ${clientId} registered for session ${sessionId} with ${accessLevel} access`);

      return {
        success: true,
        clientSession
      };

    } catch (error) {
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
  async unregisterClient(clientId: string): Promise<{
    success: boolean;
    releasedLocks: number;
    error?: string;
  }> {
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

    } catch (error) {
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
  async acquireLock(request: LockRequest): Promise<LockResult> {
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
        this.lockQueue.get(sessionId)!.push(request);

        return {
          success: false,
          error: 'Lock conflicts detected, added to queue',
          conflictingLocks: conflictResult.conflictingLocks,
          waitTime: this.estimateWaitTime(sessionId, request)
        };
      }

      // Create the lock
      const lockId = this.generateLockId();
      const lock: SessionLock = {
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
      this.sessionLocks.get(sessionId)!.push(lock);

      // Add to client's locks
      clientSession.locks.push(lock);
      clientSession.lastActivity = Date.now();

      this.logger.info(`Lock ${lockId} acquired by client ${clientId} on session ${sessionId} (${lockType}/${lockScope})`);

      return {
        success: true,
        lockId,
        lock
      };

    } catch (error) {
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
  async releaseLock(lockId: string): Promise<{
    success: boolean;
    processedQueue: boolean;
    error?: string;
  }> {
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

    } catch (error) {
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
  getSessionAccessInfo(sessionId: string): SessionAccessInfo {
    const connections = this.clientConnections.get(sessionId) || new Set();
    const locks = this.sessionLocks.get(sessionId) || [];
    
    const activeClients = Array.from(connections)
      .map(clientId => this.clientSessions.get(clientId))
      .filter((client): client is ClientSession => client !== undefined);

    // Calculate metrics
    let totalConnections = 0;
    let totalSessionTime = 0;
    let lockConflicts = 0;

    for (const client of activeClients) {
      totalConnections++;
      totalSessionTime += Date.now() - client.connectionTime;
    }

    const lastModified = Math.max(
      ...locks.map(lock => lock.acquiredAt),
      ...activeClients.map(client => client.lastActivity),
      0
    );

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
  getActiveClients(): ClientSession[] {
    return Array.from(this.clientSessions.values());
  }

  /**
   * Update client activity timestamp
   */
  updateClientActivity(clientId: string): void {
    const clientSession = this.clientSessions.get(clientId);
    if (clientSession) {
      clientSession.lastActivity = Date.now();
    }
  }

  /**
   * Check if a client can perform an operation on a session
   */
  canClientAccessSession(
    clientId: string, 
    sessionId: string, 
    operation: 'read' | 'write' | 'admin'
  ): boolean {
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
  async forceReleaseSessionLocks(sessionId: string): Promise<{
    success: boolean;
    releasedLocks: number;
    error?: string;
  }> {
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

    } catch (error) {
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
  async shutdown(): Promise<void> {
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

  private canClientAcquireLock(clientSession: ClientSession, lockType: string): boolean {
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

  private checkLockConflicts(
    sessionId: string, 
    requestedType: string, 
    requestedScope: string, 
    clientId: string
  ): { canAcquire: boolean; conflictingLocks: SessionLock[] } {
    const existingLocks = this.sessionLocks.get(sessionId) || [];
    const now = Date.now();
    
    // Filter out expired locks
    const activeLocks = existingLocks.filter(lock => lock.expiresAt > now);

    const conflictingLocks: SessionLock[] = [];

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

  private lockTypesConflict(existingType: string, requestedType: string): boolean {
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

  private lockScopesConflict(existingScope: string, requestedScope: string): boolean {
    // Full session locks conflict with everything
    if (existingScope === 'full_session' || requestedScope === 'full_session') {
      return true;
    }

    // Same scope conflicts
    return existingScope === requestedScope;
  }

  private async processPendingLocks(sessionId: string): Promise<boolean> {
    const queue = this.lockQueue.get(sessionId);
    if (!queue || queue.length === 0) {
      return false;
    }

    let processed = false;
    const remaining: LockRequest[] = [];

    for (const request of queue) {
      const result = await this.acquireLock(request);
      if (result.success) {
        processed = true;
        this.logger.info(`Processed queued lock request for client ${request.clientId} on session ${sessionId}`);
      } else {
        remaining.push(request);
      }
    }

    // Update queue with remaining requests
    if (remaining.length === 0) {
      this.lockQueue.delete(sessionId);
    } else {
      this.lockQueue.set(sessionId, remaining);
    }

    return processed;
  }

  private estimateWaitTime(sessionId: string, request: LockRequest): number {
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

  private async releaseAllClientLocks(clientId: string): Promise<number> {
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

  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupScheduler(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Run every minute
  }

  private performCleanup(): void {
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
      } else if (activeLocks.length !== locks.length) {
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