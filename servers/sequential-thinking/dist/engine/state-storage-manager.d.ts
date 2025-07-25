/**
 * State Storage Manager
 *
 * Manages persistent storage of ReasoningState using Filesystem integration.
 * Provides serialization, deserialization, session management, and recovery capabilities.
 */
import type { ReasoningState } from '../types/index.js';
export interface SessionMetadata {
    id: string;
    createdAt: number;
    lastModified: number;
    lastActivity: number;
    status: 'active' | 'paused' | 'completed' | 'archived' | 'failed';
    problemSummary: string;
    strategy: string;
    totalSteps: number;
    currentStep: number;
    checkpointCount: number;
    version: string;
    timeoutConfig: SessionTimeoutConfig;
    expiresAt: number;
}
export interface SessionTimeoutConfig {
    activeTimeout: number;
    pausedTimeout: number;
    completedTimeout: number;
    enableAutoCleanup: boolean;
}
export interface SessionSearchOptions {
    status?: SessionMetadata['status'][];
    strategy?: string[];
    dateRange?: {
        from: number;
        to: number;
    };
    limit?: number;
    sortBy?: 'createdAt' | 'lastModified' | 'strategy';
    sortOrder?: 'asc' | 'desc';
}
export interface SaveSessionOptions {
    updateMetadata?: boolean;
    createBackup?: boolean;
    compressData?: boolean;
}
export interface SessionValidationResult {
    isValid: boolean;
    version: string;
    errors: string[];
    warnings: string[];
    migrationRequired: boolean;
}
export declare class StateStorageManager {
    private logger;
    private filesystemIntegration;
    private basePath;
    private version;
    constructor();
    /**
     * Initialize storage system and create directory structure
     */
    initialize(): Promise<void>;
    /**
     * Save a reasoning state to persistent storage
     */
    saveSession(state: ReasoningState, options?: SaveSessionOptions): Promise<{
        success: boolean;
        sessionPath?: string;
        error?: string;
    }>;
    /**
     * Load a reasoning state from persistent storage
     */
    loadSession(sessionId: string): Promise<{
        success: boolean;
        state?: ReasoningState;
        metadata?: SessionMetadata;
        error?: string;
    }>;
    /**
     * List all saved sessions with metadata
     */
    listSessions(options?: SessionSearchOptions): Promise<{
        success: boolean;
        sessions?: SessionMetadata[];
        error?: string;
    }>;
    /**
     * Delete a saved session
     */
    deleteSession(sessionId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update session status (active, paused, completed, etc.)
     */
    updateSessionStatus(sessionId: string, status: SessionMetadata['status']): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        totalSessions: number;
        activeSessions: number;
        completedSessions: number;
        expiredSessions: number;
        totalSizeBytes: number;
        oldestSession: number;
        newestSession: number;
    }>;
    /**
     * Update session activity timestamp (heartbeat)
     */
    updateSessionActivity(sessionId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Clean up expired sessions based on their timeout configuration
     */
    cleanupExpiredSessions(): Promise<{
        success: boolean;
        cleanedSessions: string[];
        error?: string;
    }>;
    /**
     * Get list of expired sessions without cleaning them up
     */
    getExpiredSessions(): Promise<{
        success: boolean;
        expiredSessions: SessionMetadata[];
        error?: string;
    }>;
    private getDefaultTimeoutConfig;
    private calculateExpirationTime;
    private isSessionExpired;
    private getCleanupAction;
    private ensureDirectoryStructure;
    private getSessionPath;
    private getMetadataPath;
    private getBackupPath;
    private serializeReasoningState;
    private deserializeReasoningState;
    private generateSessionMetadata;
    private determineSessionStatus;
    private validateSessionData;
    private isVersionUpgradeRequired;
    private migrateSessionData;
    private saveSessionMetadata;
    private loadSessionMetadata;
    private loadAllSessionMetadata;
    private saveCheckpoints;
    private sessionExists;
    private createBackup;
    private compressData;
    private writeFile;
    private readFile;
    private ensureDirectory;
    private deleteDirectory;
    private copyDirectory;
}
//# sourceMappingURL=state-storage-manager.d.ts.map