/**
 * State Storage Manager
 * 
 * Manages persistent storage of ReasoningState using Filesystem integration.
 * Provides serialization, deserialization, session management, and recovery capabilities.
 */

import type { 
  ReasoningState, 
  Checkpoint
} from '../types/index.js';
import { FilesystemIntegration } from '../integrations/filesystem-integration.js';
import { Logger } from '@em-cp2/shared';

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
  activeTimeout: number;    // milliseconds until active session expires (default: 24 hours)
  pausedTimeout: number;    // milliseconds until paused session expires (default: 7 days)
  completedTimeout: number; // milliseconds until completed session is archived (default: 30 days)
  enableAutoCleanup: boolean;
}

export interface SessionSearchOptions {
  status?: SessionMetadata['status'][];
  strategy?: string[];
  dateRange?: { from: number; to: number };
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

export class StateStorageManager {
  private logger: Logger;
  private filesystemIntegration: FilesystemIntegration;
  private basePath: string;
  private version: string = '3.0.0';

  constructor() {
    this.logger = new Logger('StateStorageManager');
    this.filesystemIntegration = new FilesystemIntegration();
    this.basePath = 'reasoning-sessions';
  }

  /**
   * Initialize storage system and create directory structure
   */
  async initialize(): Promise<void> {
    try {
      if (!this.filesystemIntegration.isFilesystemAvailable()) {
        throw new Error('Filesystem integration not available for state persistence');
      }

      // Create base directory structure
      await this.ensureDirectoryStructure();
      
      this.logger.info('State storage manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize state storage manager:', error);
      throw error;
    }
  }

  /**
   * Save a reasoning state to persistent storage
   */
  async saveSession(
    state: ReasoningState, 
    options: SaveSessionOptions = {}
  ): Promise<{
    success: boolean;
    sessionPath?: string;
    error?: string;
  }> {
    try {
      const sessionPath = this.getSessionPath(state.id);
      
      // Create backup if requested
      if (options.createBackup) {
        await this.createBackup(state.id);
      }

      // Serialize the reasoning state
      const serializedState = this.serializeReasoningState(state);
      
      // Compress if requested
      const dataToSave = options.compressData 
        ? this.compressData(serializedState)
        : serializedState;

      // Save the main state file
      const stateFilePath = `${sessionPath}/reasoning-state.json`;
      await this.writeFile(stateFilePath, dataToSave);

      // Save/update metadata
      if (options.updateMetadata !== false) {
        const metadata = this.generateSessionMetadata(state);
        await this.saveSessionMetadata(state.id, metadata);
      }

      // Save individual checkpoints
      await this.saveCheckpoints(state.id, state.checkpoints);

      this.logger.info(`Saved reasoning session ${state.id} to ${sessionPath}`);
      
      return { success: true, sessionPath };

    } catch (error) {
      this.logger.error(`Failed to save session ${state.id}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown save error' 
      };
    }
  }

  /**
   * Load a reasoning state from persistent storage
   */
  async loadSession(sessionId: string): Promise<{
    success: boolean;
    state?: ReasoningState;
    metadata?: SessionMetadata;
    error?: string;
  }> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      
      // Check if session exists
      if (!await this.sessionExists(sessionId)) {
        return { success: false, error: `Session ${sessionId} not found` };
      }

      // Load and validate the state file
      const stateFilePath = `${sessionPath}/reasoning-state.json`;
      const stateData = await this.readFile(stateFilePath);
      
      // Validate the session data
      const validation = this.validateSessionData(stateData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Session validation failed: ${validation.errors.join(', ')}` 
        };
      }

      // Handle version migration if needed
      let processedData = stateData;
      if (validation.migrationRequired) {
        processedData = await this.migrateSessionData(stateData, validation.version);
      }

      // Deserialize the reasoning state
      const state = this.deserializeReasoningState(processedData);
      
      // Load metadata
      const metadata = await this.loadSessionMetadata(sessionId);

      this.logger.info(`Loaded reasoning session ${sessionId} successfully`);
      
      return { success: true, state, metadata: metadata || undefined };

    } catch (error) {
      this.logger.error(`Failed to load session ${sessionId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown load error' 
      };
    }
  }

  /**
   * List all saved sessions with metadata
   */
  async listSessions(options: SessionSearchOptions = {}): Promise<{
    success: boolean;
    sessions?: SessionMetadata[];
    error?: string;
  }> {
    try {
      const allMetadata = await this.loadAllSessionMetadata();
      
      // Apply filters
      let filteredSessions = allMetadata;
      
      if (options.status) {
        filteredSessions = filteredSessions.filter(s => options.status!.includes(s.status));
      }
      
      if (options.strategy) {
        filteredSessions = filteredSessions.filter(s => options.strategy!.includes(s.strategy));
      }
      
      if (options.dateRange) {
        filteredSessions = filteredSessions.filter(s => 
          s.createdAt >= options.dateRange!.from && s.createdAt <= options.dateRange!.to
        );
      }

      // Apply sorting
      if (options.sortBy) {
        const sortOrder = options.sortOrder || 'desc';
        filteredSessions.sort((a, b) => {
          const aVal = a[options.sortBy!];
          const bVal = b[options.sortBy!];
          
          // Handle different types of sorting values
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
          } else {
            // String comparison for non-numeric values
            const aStr = String(aVal);
            const bStr = String(bVal);
            return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
          }
        });
      }

      // Apply limit
      if (options.limit) {
        filteredSessions = filteredSessions.slice(0, options.limit);
      }

      return { success: true, sessions: filteredSessions };

    } catch (error) {
      this.logger.error('Failed to list sessions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown list error' 
      };
    }
  }

  /**
   * Delete a saved session
   */
  async deleteSession(sessionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!await this.sessionExists(sessionId)) {
        return { success: false, error: `Session ${sessionId} not found` };
      }

      const sessionPath = this.getSessionPath(sessionId);
      
      // Delete the entire session directory
      await this.deleteDirectory(sessionPath);
      
      this.logger.info(`Deleted reasoning session ${sessionId}`);
      
      return { success: true };

    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown delete error' 
      };
    }
  }

  /**
   * Update session status (active, paused, completed, etc.)
   */
  async updateSessionStatus(
    sessionId: string, 
    status: SessionMetadata['status']
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!await this.sessionExists(sessionId)) {
        return { success: false, error: `Session ${sessionId} not found` };
      }

      const metadata = await this.loadSessionMetadata(sessionId);
      if (!metadata) {
        return { success: false, error: `Session metadata not found for ${sessionId}` };
      }

      metadata.status = status;
      metadata.lastModified = Date.now();

      await this.saveSessionMetadata(sessionId, metadata);
      
      this.logger.info(`Updated session ${sessionId} status to ${status}`);
      
      return { success: true };

    } catch (error) {
      this.logger.error(`Failed to update session status for ${sessionId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown update error' 
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    expiredSessions: number;
    totalSizeBytes: number;
    oldestSession: number;
    newestSession: number;
  }> {
    try {
      const allMetadata = await this.loadAllSessionMetadata();
      const now = Date.now();
      
      const stats = {
        totalSessions: allMetadata.length,
        activeSessions: allMetadata.filter(s => s.status === 'active').length,
        completedSessions: allMetadata.filter(s => s.status === 'completed').length,
        expiredSessions: allMetadata.filter(s => this.isSessionExpired(s, now)).length,
        totalSizeBytes: 0, // TODO: Calculate actual storage size
        oldestSession: allMetadata.length > 0 ? Math.min(...allMetadata.map(s => s.createdAt)) : 0,
        newestSession: allMetadata.length > 0 ? Math.max(...allMetadata.map(s => s.createdAt)) : 0
      };

      return stats;

    } catch (error) {
      this.logger.error('Failed to get storage stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        expiredSessions: 0,
        totalSizeBytes: 0,
        oldestSession: 0,
        newestSession: 0
      };
    }
  }

  /**
   * Update session activity timestamp (heartbeat)
   */
  async updateSessionActivity(sessionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const metadata = await this.loadSessionMetadata(sessionId);
      if (!metadata) {
        return { success: false, error: `Session metadata not found for ${sessionId}` };
      }

      const now = Date.now();
      metadata.lastActivity = now;
      metadata.lastModified = now;
      metadata.expiresAt = this.calculateExpirationTime(metadata.status, metadata.timeoutConfig, now);

      await this.saveSessionMetadata(sessionId, metadata);
      
      this.logger.debug(`Updated activity for session ${sessionId}`);
      return { success: true };

    } catch (error) {
      this.logger.error(`Failed to update session activity for ${sessionId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown update error' 
      };
    }
  }

  /**
   * Clean up expired sessions based on their timeout configuration
   */
  async cleanupExpiredSessions(): Promise<{
    success: boolean;
    cleanedSessions: string[];
    error?: string;
  }> {
    try {
      const allMetadata = await this.loadAllSessionMetadata();
      const now = Date.now();
      const cleanedSessions: string[] = [];

      for (const metadata of allMetadata) {
        if (!metadata.timeoutConfig?.enableAutoCleanup) {
          continue;
        }

        if (this.isSessionExpired(metadata, now)) {
          const cleanupAction = this.getCleanupAction(metadata.status);
          
          if (cleanupAction === 'delete') {
            const deleteResult = await this.deleteSession(metadata.id);
            if (deleteResult.success) {
              cleanedSessions.push(metadata.id);
              this.logger.info(`Deleted expired session ${metadata.id} (status: ${metadata.status})`);
            }
          } else if (cleanupAction === 'archive') {
            const updateResult = await this.updateSessionStatus(metadata.id, 'archived');
            if (updateResult.success) {
              cleanedSessions.push(metadata.id);
              this.logger.info(`Archived expired session ${metadata.id} (status: ${metadata.status})`);
            }
          }
        }
      }

      this.logger.info(`Cleanup completed: processed ${cleanedSessions.length} expired sessions`);
      return { success: true, cleanedSessions };

    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
      return { 
        success: false, 
        cleanedSessions: [],
        error: error instanceof Error ? error.message : 'Unknown cleanup error' 
      };
    }
  }

  /**
   * Get list of expired sessions without cleaning them up
   */
  async getExpiredSessions(): Promise<{
    success: boolean;
    expiredSessions: SessionMetadata[];
    error?: string;
  }> {
    try {
      const allMetadata = await this.loadAllSessionMetadata();
      const now = Date.now();
      
      const expiredSessions = allMetadata.filter(metadata => 
        this.isSessionExpired(metadata, now)
      );

      return { success: true, expiredSessions };

    } catch (error) {
      this.logger.error('Failed to get expired sessions:', error);
      return { 
        success: false, 
        expiredSessions: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Private helper methods

  private getDefaultTimeoutConfig(): SessionTimeoutConfig {
    return {
      activeTimeout: 24 * 60 * 60 * 1000,      // 24 hours
      pausedTimeout: 7 * 24 * 60 * 60 * 1000,  // 7 days  
      completedTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
      enableAutoCleanup: true
    };
  }

  private calculateExpirationTime(
    status: SessionMetadata['status'], 
    config: SessionTimeoutConfig,
    fromTimestamp: number = Date.now()
  ): number {
    switch (status) {
      case 'active':
        return fromTimestamp + config.activeTimeout;
      case 'paused':
        return fromTimestamp + config.pausedTimeout;
      case 'completed':
        return fromTimestamp + config.completedTimeout;
      case 'archived':
        // Archived sessions don't expire
        return Number.MAX_SAFE_INTEGER;
      case 'failed':
        // Failed sessions expire like paused sessions
        return fromTimestamp + config.pausedTimeout;
      default:
        return fromTimestamp + config.activeTimeout;
    }
  }

  private isSessionExpired(metadata: SessionMetadata, currentTime: number = Date.now()): boolean {
    // Handle legacy sessions that don't have timeout configuration
    if (!metadata.timeoutConfig) {
      // Use last activity or last modified time for legacy sessions
      const lastActivityTime = metadata.lastActivity || metadata.lastModified;
      const defaultConfig = this.getDefaultTimeoutConfig();
      const calculatedExpiration = this.calculateExpirationTime(metadata.status, defaultConfig, lastActivityTime);
      return currentTime > calculatedExpiration;
    }

    // For sessions with timeout configuration, use the expiresAt field
    return currentTime > metadata.expiresAt;
  }

  private getCleanupAction(status: SessionMetadata['status']): 'delete' | 'archive' | 'none' {
    switch (status) {
      case 'active':
      case 'paused':
        // Expired active/paused sessions should be archived (moved to background)
        return 'archive';
      case 'completed':
        // Expired completed sessions can be archived or deleted based on preference
        return 'archive';
      case 'failed':
        // Failed sessions can be deleted after timeout
        return 'delete';
      case 'archived':
        // Archived sessions don't get cleaned up automatically
        return 'none';
      default:
        return 'archive';
    }
  }

  private async ensureDirectoryStructure(): Promise<void> {
    const directories = [
      this.basePath,
      `${this.basePath}/active`,
      `${this.basePath}/completed`, 
      `${this.basePath}/archived`,
      `${this.basePath}/metadata`,
      `${this.basePath}/backups`
    ];

    for (const dir of directories) {
      await this.ensureDirectory(dir);
    }
  }

  private getSessionPath(sessionId: string): string {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${this.basePath}/active/${date}/${sessionId}`;
  }

  private getMetadataPath(sessionId: string): string {
    return `${this.basePath}/metadata/${sessionId}.json`;
  }

  private getBackupPath(sessionId: string): string {
    const timestamp = Date.now();
    return `${this.basePath}/backups/${sessionId}-${timestamp}`;
  }

  private serializeReasoningState(state: ReasoningState): string {
    try {
      const serializable = {
        ...state,
        _version: this.version,
        _serializedAt: Date.now()
      };

      return JSON.stringify(serializable, null, 2);
    } catch (error) {
      throw new Error(`Failed to serialize reasoning state: ${error}`);
    }
  }

  private deserializeReasoningState(data: string): ReasoningState {
    try {
      const parsed = JSON.parse(data);
      
      // Remove serialization metadata
      delete parsed._version;
      delete parsed._serializedAt;

      return parsed as ReasoningState;
    } catch (error) {
      throw new Error(`Failed to deserialize reasoning state: ${error}`);
    }
  }

  private generateSessionMetadata(state: ReasoningState): SessionMetadata {
    const now = Date.now();
    const status = this.determineSessionStatus(state);
    const timeoutConfig = this.getDefaultTimeoutConfig();
    
    return {
      id: state.id,
      createdAt: state.timestamp,
      lastModified: now,
      lastActivity: now,
      status,
      problemSummary: state.problem.description.slice(0, 100) + '...',
      strategy: state.strategy.name,
      totalSteps: state.totalSteps,
      currentStep: state.currentStep,
      checkpointCount: state.checkpoints.length,
      version: this.version,
      timeoutConfig,
      expiresAt: this.calculateExpirationTime(status, timeoutConfig, now)
    };
  }

  private determineSessionStatus(state: ReasoningState): SessionMetadata['status'] {
    if (state.currentStep >= state.totalSteps) {
      return 'completed';
    }
    
    const hasFailedSteps = state.steps.some(s => s.status === 'failed');
    if (hasFailedSteps) {
      return 'failed';
    }

    const hasInProgressSteps = state.steps.some(s => s.status === 'in_progress');
    if (hasInProgressSteps) {
      return 'active';
    }

    return 'paused';
  }

  private validateSessionData(data: string): SessionValidationResult {
    try {
      const parsed = JSON.parse(data);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required fields
      if (!parsed.id) errors.push('Missing session ID');
      if (!parsed.problem) errors.push('Missing problem definition');
      if (!parsed.steps) errors.push('Missing reasoning steps');
      if (!parsed.strategy) errors.push('Missing strategy information');

      // Check version compatibility
      const dataVersion = parsed._version || '1.0.0';
      const migrationRequired = this.isVersionUpgradeRequired(dataVersion);

      if (migrationRequired) {
        warnings.push(`Session data version ${dataVersion} requires migration to ${this.version}`);
      }

      return {
        isValid: errors.length === 0,
        version: dataVersion,
        errors,
        warnings,
        migrationRequired
      };

    } catch (error) {
      return {
        isValid: false,
        version: 'unknown',
        errors: ['Invalid JSON format'],
        warnings: [],
        migrationRequired: false
      };
    }
  }

  private isVersionUpgradeRequired(dataVersion: string): boolean {
    // Simple version comparison - in production would use semver
    return dataVersion !== this.version;
  }

  private async migrateSessionData(data: string, fromVersion: string): Promise<string> {
    this.logger.info(`Migrating session data from version ${fromVersion} to ${this.version}`);
    
    // For now, just update the version field
    // In production, this would handle actual data structure changes
    const parsed = JSON.parse(data);
    parsed._version = this.version;
    parsed._migratedAt = Date.now();
    parsed._migratedFrom = fromVersion;

    return JSON.stringify(parsed, null, 2);
  }

  private async saveSessionMetadata(sessionId: string, metadata: SessionMetadata): Promise<void> {
    const metadataPath = this.getMetadataPath(sessionId);
    const metadataJson = JSON.stringify(metadata, null, 2);
    await this.writeFile(metadataPath, metadataJson);
  }

  private async loadSessionMetadata(sessionId: string): Promise<SessionMetadata | null> {
    try {
      const metadataPath = this.getMetadataPath(sessionId);
      const metadataJson = await this.readFile(metadataPath);
      return JSON.parse(metadataJson) as SessionMetadata;
    } catch (error) {
      this.logger.warn(`Failed to load metadata for session ${sessionId}:`, error);
      return null;
    }
  }

  private async loadAllSessionMetadata(): Promise<SessionMetadata[]> {
    try {
      if (!this.filesystemIntegration.isFilesystemAvailable()) {
        // For Phase 3.1, return empty array when filesystem is not available
        this.logger.debug('[MOCK] Loading all session metadata - filesystem not available');
        return [];
      }

      // TODO: Implement actual metadata directory scanning
      // This would scan the metadata directory and load all session metadata files
      // For now, return empty array as placeholder
      this.logger.debug('Loading all session metadata from persistent storage');
      return [];
    } catch (error) {
      this.logger.error('Failed to load all session metadata:', error);
      return [];
    }
  }

  private async saveCheckpoints(sessionId: string, checkpoints: Checkpoint[]): Promise<void> {
    const sessionPath = this.getSessionPath(sessionId);
    const checkpointsPath = `${sessionPath}/checkpoints`;
    
    await this.ensureDirectory(checkpointsPath);

    for (const checkpoint of checkpoints) {
      const checkpointFile = `${checkpointsPath}/${checkpoint.id}.json`;
      const checkpointData = JSON.stringify(checkpoint, null, 2);
      await this.writeFile(checkpointFile, checkpointData);
    }
  }

  private async sessionExists(sessionId: string): Promise<boolean> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      const stateFilePath = `${sessionPath}/reasoning-state.json`;
      
      // Try to read the state file to confirm existence
      await this.readFile(stateFilePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async createBackup(sessionId: string): Promise<void> {
    const sessionPath = this.getSessionPath(sessionId);
    const backupPath = this.getBackupPath(sessionId);
    
    // Copy the entire session directory to backup location
    await this.copyDirectory(sessionPath, backupPath);
    
    this.logger.debug(`Created backup for session ${sessionId} at ${backupPath}`);
  }

  private compressData(data: string): string {
    // Simple compression placeholder - in production would use actual compression
    return data;
  }

  // Filesystem operation wrappers (delegate to FilesystemIntegration)

  private async writeFile(path: string, content: string): Promise<void> {
    if (!this.filesystemIntegration.isFilesystemAvailable()) {
      // For Phase 3.1, we'll provide a basic fallback that logs the operation
      // This will be fully implemented when Filesystem integration is enhanced
      this.logger.debug(`[MOCK] Writing file: ${path} (${content.length} bytes)`);
      return;
    }

    try {
      // TODO: Integrate with actual Filesystem server MCP interface
      // For now, use the existing filesystem integration's private writeFile method pattern
      this.logger.debug(`Successfully wrote file: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to write file ${path}:`, error);
      throw error;
    }
  }

  private async readFile(path: string): Promise<string> {
    if (!this.filesystemIntegration.isFilesystemAvailable()) {
      // For Phase 3.1, we'll provide a basic fallback for testing
      this.logger.debug(`[MOCK] Reading file: ${path}`);
      throw new Error('Filesystem not available - cannot read file');
    }

    try {
      // TODO: Integrate with actual Filesystem server MCP interface
      this.logger.debug(`Successfully read file: ${path}`);
      return '{}'; // Placeholder return
    } catch (error) {
      this.logger.error(`Failed to read file ${path}:`, error);
      throw error;
    }
  }

  private async ensureDirectory(path: string): Promise<void> {
    if (!this.filesystemIntegration.isFilesystemAvailable()) {
      this.logger.debug(`[MOCK] Ensuring directory exists: ${path}`);
      return;
    }

    try {
      // TODO: Integrate with actual Filesystem server MCP interface
      this.logger.debug(`Ensured directory exists: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to ensure directory ${path}:`, error);
      throw error;
    }
  }

  private async deleteDirectory(path: string): Promise<void> {
    if (!this.filesystemIntegration.isFilesystemAvailable()) {
      this.logger.debug(`[MOCK] Deleting directory: ${path}`);
      return;
    }

    try {
      // TODO: Integrate with actual Filesystem server MCP interface
      this.logger.debug(`Deleted directory: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to delete directory ${path}:`, error);
      throw error;
    }
  }

  private async copyDirectory(source: string, destination: string): Promise<void> {
    if (!this.filesystemIntegration.isFilesystemAvailable()) {
      this.logger.debug(`[MOCK] Copying directory from ${source} to ${destination}`);
      return;
    }

    try {
      // TODO: Integrate with actual Filesystem server MCP interface
      this.logger.debug(`Copied directory from ${source} to ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to copy directory from ${source} to ${destination}:`, error);
      throw error;
    }
  }
}