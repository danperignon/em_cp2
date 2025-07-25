/**
 * Chain Manager
 *
 * Coordinates ReasoningState lifecycle, manages step execution order,
 * handles checkpoints, and provides progress tracking capabilities.
 */
import { StateStorageManager } from './state-storage-manager.js';
import { SessionValidator } from './session-validator.js';
import { SessionRecovery } from './session-recovery.js';
import { SessionEventManager } from './session-events.js';
import { ProgressiveRestoration } from './progressive-restoration.js';
import { MultiClientManager } from './multi-client-manager.js';
import { ConflictResolver } from './conflict-resolver.js';
import { Logger } from '@em-cp2/shared';
import { randomUUID } from 'crypto';
export class ChainManager {
    logger;
    activeStates;
    stateStorage;
    sessionValidator;
    sessionRecovery;
    eventManager;
    progressiveRestoration;
    multiClientManager;
    conflictResolver;
    persistenceEnabled;
    cleanupInterval = null;
    cleanupIntervalMs = 60 * 60 * 1000; // 1 hour
    constructor() {
        this.logger = new Logger('ChainManager');
        this.activeStates = new Map();
        this.stateStorage = new StateStorageManager();
        this.sessionValidator = new SessionValidator();
        this.sessionRecovery = new SessionRecovery();
        this.eventManager = new SessionEventManager();
        this.progressiveRestoration = new ProgressiveRestoration(this.stateStorage, this.sessionValidator, this.sessionRecovery, this.eventManager);
        this.multiClientManager = new MultiClientManager();
        this.conflictResolver = new ConflictResolver(this.eventManager);
        this.persistenceEnabled = true; // Can be configured via environment
    }
    /**
     * Initialize the ChainManager with persistent storage
     */
    async initialize() {
        try {
            await this.stateStorage.initialize();
            // Restore active sessions using progressive restoration
            await this.restoreActiveSessions();
            // Start background cleanup scheduler
            this.startBackgroundCleanup();
            this.logger.info('ChainManager initialized with persistent storage and background cleanup');
        }
        catch (error) {
            this.logger.error('Failed to initialize ChainManager:', error);
            // Continue without persistence if storage fails
            this.persistenceEnabled = false;
            this.logger.warn('Continuing without persistent storage');
        }
    }
    /**
     * Shutdown the ChainManager and cleanup resources
     */
    async shutdown() {
        try {
            // Stop background cleanup
            this.stopBackgroundCleanup();
            // Save all active sessions before shutdown
            await this.saveAllActiveSessions();
            // Shutdown multi-client manager
            await this.multiClientManager.shutdown();
            this.logger.info('ChainManager shutdown completed');
        }
        catch (error) {
            this.logger.error('Error during ChainManager shutdown:', error);
        }
    }
    /**
     * Perform progressive restoration of active sessions on startup
     */
    async restoreActiveSessions() {
        if (!this.persistenceEnabled) {
            this.logger.info('Persistence disabled, skipping session restoration');
            return;
        }
        try {
            this.logger.info('Starting progressive session restoration');
            // Execute progressive restoration
            const restorationReport = await this.progressiveRestoration.restoreActiveSessions();
            // Process restoration results
            if (restorationReport.success) {
                // Add successfully restored sessions to active states
                for (const stage of restorationReport.stages) {
                    for (const result of stage.results) {
                        if (result.success && result.restoredState) {
                            this.activeStates.set(result.sessionId, result.restoredState);
                        }
                    }
                }
                this.logger.info(`Progressive restoration completed successfully: ${restorationReport.successfulRestorations}/${restorationReport.totalSessions} sessions restored`);
                // Log detailed statistics
                if (restorationReport.repairedSessions > 0) {
                    this.logger.info(`Auto-repaired ${restorationReport.repairedSessions} sessions during restoration`);
                }
                if (restorationReport.recoveredSessions > 0) {
                    this.logger.info(`Recovered ${restorationReport.recoveredSessions} corrupted sessions during restoration`);
                }
                // Log health distribution
                const { healthDistribution } = restorationReport;
                this.logger.info(`Health distribution: ${healthDistribution.healthy} healthy, ${healthDistribution.warning} warning, ${healthDistribution.critical} critical, ${healthDistribution.corrupted} corrupted`);
            }
            else {
                this.logger.error(`Progressive restoration failed: ${restorationReport.errors.join(', ')}`);
                // Still add any successfully restored sessions
                let partiallyRestored = 0;
                for (const stage of restorationReport.stages) {
                    for (const result of stage.results) {
                        if (result.success && result.restoredState) {
                            this.activeStates.set(result.sessionId, result.restoredState);
                            partiallyRestored++;
                        }
                    }
                }
                if (partiallyRestored > 0) {
                    this.logger.info(`Partially restored ${partiallyRestored} sessions despite restoration failure`);
                }
            }
            // Log warnings if any
            if (restorationReport.warnings.length > 0) {
                this.logger.warn(`Restoration warnings: ${restorationReport.warnings.slice(0, 5).join(', ')}${restorationReport.warnings.length > 5 ? ' ...' : ''}`);
            }
        }
        catch (error) {
            this.logger.error('Critical error during progressive restoration:', error);
            // Fallback to basic restoration if progressive restoration fails completely
            this.logger.info('Attempting basic fallback restoration');
            await this.performBasicFallbackRestoration();
        }
    }
    /**
     * Perform basic fallback restoration if progressive restoration fails
     */
    async performBasicFallbackRestoration() {
        try {
            // Load sessions with minimal processing
            const sessionList = await this.stateStorage.listSessions({
                status: ['active', 'paused'],
                sortBy: 'lastModified',
                sortOrder: 'desc'
            });
            if (!sessionList.success || !sessionList.sessions) {
                this.logger.warn('Fallback restoration: Failed to retrieve session list');
                return;
            }
            let restored = 0;
            for (const sessionMeta of sessionList.sessions.slice(0, 10)) { // Limit to 10 most recent
                try {
                    const loadResult = await this.stateStorage.loadSession(sessionMeta.id);
                    if (loadResult.success && loadResult.state) {
                        // Minimal validation - just check if state has required fields
                        if (loadResult.state.steps && Array.isArray(loadResult.state.steps) &&
                            typeof loadResult.state.currentStep === 'number') {
                            this.activeStates.set(sessionMeta.id, loadResult.state);
                            restored++;
                            this.logger.debug(`Fallback restored session ${sessionMeta.id}`);
                        }
                    }
                }
                catch (error) {
                    this.logger.debug(`Fallback restoration failed for session ${sessionMeta.id}:`, error);
                }
            }
            this.logger.info(`Fallback restoration completed: ${restored} sessions restored`);
        }
        catch (error) {
            this.logger.error('Critical error during fallback restoration:', error);
        }
    }
    /**
     * Get restoration system status and metrics
     */
    getRestorationMetrics() {
        const status = this.progressiveRestoration.getRestorationStatus();
        return {
            progressiveRestorationAvailable: !!this.progressiveRestoration,
            activeRestorations: status.activeRestorations,
            currentPlan: status.currentPlan
        };
    }
    /**
     * Create a new reasoning state from problem and steps
     */
    async createReasoningState(problem, steps, strategy, metadata) {
        const timestamp = Date.now();
        const id = this.generateStateId();
        const reasoningState = {
            id,
            timestamp,
            problem,
            currentStep: 0,
            totalSteps: steps.length,
            steps,
            strategy: this.createReasoningStrategy(strategy),
            metadata: this.createMetadata(metadata),
            checkpoints: []
        };
        // Validate the reasoning state
        await this.validateReasoningState(reasoningState);
        // Create initial checkpoint
        await this.createCheckpoint(reasoningState, 'Initial state created', true);
        // Store in active states
        this.activeStates.set(id, reasoningState);
        // Persist to storage
        await this.persistState(reasoningState, 'Initial state creation');
        // Update session activity
        await this.updateSessionActivity(id);
        // Emit session created event
        await this.eventManager.emit('session_created', id, {
            currentState: reasoningState,
            context: { strategy, totalSteps: steps.length }
        }, { source: 'ChainManager.createReasoningState' });
        this.logger.info(`Created reasoning state ${id} with ${steps.length} steps using ${strategy} strategy`);
        return reasoningState;
    }
    /**
     * Execute the next step in the reasoning chain
     */
    async executeNextStep(stateId) {
        const state = this.activeStates.get(stateId);
        if (!state) {
            return { success: false, error: `Reasoning state ${stateId} not found` };
        }
        if (state.currentStep >= state.totalSteps) {
            return { success: false, error: 'All steps have been completed' };
        }
        try {
            const currentStepIndex = state.currentStep;
            const step = state.steps[currentStepIndex];
            // Check if dependencies are satisfied
            const dependenciesResult = await this.checkDependencies(state, step);
            if (!dependenciesResult.satisfied) {
                return {
                    success: false,
                    error: `Dependencies not satisfied: ${dependenciesResult.missing.join(', ')}`
                };
            }
            // Update step status to in_progress
            step.status = 'in_progress';
            step.timestamp = Date.now();
            // Execute the step (simulate execution for now)
            const executionResult = await this.simulateStepExecution(step);
            if (executionResult.success) {
                step.status = 'completed';
                step.outputs = executionResult.outputs || {};
                step.duration = Date.now() - step.timestamp;
                // Move to next step
                state.currentStep++;
                // Create checkpoint for significant steps
                if (this.isSignificantStep(step, state)) {
                    await this.createCheckpoint(state, `Completed step: ${step.description}`, true);
                }
                this.logger.info(`Executed step ${currentStepIndex + 1}/${state.totalSteps}: ${step.description}`);
            }
            else {
                step.status = 'failed';
                step.errors = executionResult.errors || ['Step execution failed'];
            }
            // Update active state
            this.activeStates.set(stateId, state);
            // Persist state after step execution
            if (executionResult.success) {
                await this.persistState(state, `Step ${currentStepIndex + 1} completed`);
            }
            else {
                await this.persistState(state, `Step ${currentStepIndex + 1} failed`);
            }
            // Update session activity
            await this.updateSessionActivity(stateId);
            // Emit session updated event
            await this.eventManager.emit('session_updated', stateId, {
                currentState: state,
                context: {
                    stepExecuted: currentStepIndex + 1,
                    stepStatus: step.status,
                    remainingSteps: state.totalSteps - state.currentStep
                }
            }, { source: 'ChainManager.executeNextStep' });
            // Check if session is complete
            if (state.currentStep >= state.totalSteps) {
                await this.eventManager.emit('session_completed', stateId, {
                    currentState: state,
                    context: { totalSteps: state.totalSteps, completionTime: Date.now() }
                }, { source: 'ChainManager.executeNextStep' });
            }
            return { success: executionResult.success, updatedState: state };
        }
        catch (error) {
            this.logger.error('Error executing step:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown execution error'
            };
        }
    }
    /**
     * Execute all remaining steps in the reasoning chain
     */
    async executeAllSteps(stateId) {
        const state = this.activeStates.get(stateId);
        if (!state) {
            return { success: false, executedSteps: 0, error: `Reasoning state ${stateId} not found` };
        }
        let executedSteps = 0;
        const maxSteps = state.totalSteps - state.currentStep;
        this.logger.info(`Executing ${maxSteps} remaining steps for state ${stateId}`);
        try {
            while (state.currentStep < state.totalSteps) {
                const result = await this.executeNextStep(stateId);
                if (!result.success) {
                    return {
                        success: false,
                        executedSteps,
                        error: result.error,
                        finalState: state
                    };
                }
                executedSteps++;
            }
            // Create final checkpoint
            await this.createCheckpoint(state, 'All steps completed successfully', true);
            this.logger.info(`Successfully executed all ${executedSteps} steps for state ${stateId}`);
            return {
                success: true,
                executedSteps,
                finalState: state
            };
        }
        catch (error) {
            this.logger.error('Error in executeAllSteps:', error);
            return {
                success: false,
                executedSteps,
                error: error instanceof Error ? error.message : 'Unknown error',
                finalState: state
            };
        }
    }
    /**
     * Get the current state of a reasoning chain
     */
    getReasoningState(stateId) {
        return this.activeStates.get(stateId) || null;
    }
    /**
     * Get progress information for a reasoning state
     */
    getProgress(stateId) {
        const state = this.activeStates.get(stateId);
        if (!state)
            return null;
        const completedSteps = state.steps.filter(s => s.status === 'completed').length;
        const failedSteps = state.steps.filter(s => s.status === 'failed').length;
        const progressPercentage = (completedSteps / state.totalSteps) * 100;
        // Estimate time remaining based on completed steps
        let estimatedTimeRemaining;
        if (completedSteps > 0) {
            const completedDurations = state.steps
                .filter(s => s.status === 'completed' && s.duration)
                .map(s => s.duration);
            if (completedDurations.length > 0) {
                const avgDuration = completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length;
                const remainingSteps = state.totalSteps - state.currentStep;
                estimatedTimeRemaining = avgDuration * remainingSteps;
            }
        }
        return {
            currentStep: state.currentStep,
            totalSteps: state.totalSteps,
            completedSteps,
            failedSteps,
            progressPercentage: Math.round(progressPercentage * 100) / 100,
            estimatedTimeRemaining
        };
    }
    /**
     * Create a checkpoint for the current state
     */
    async createCheckpoint(state, label, auto = false) {
        const checkpoint = {
            id: randomUUID(),
            timestamp: Date.now(),
            stepIndex: state.currentStep,
            state: {
                currentStep: state.currentStep,
                steps: state.steps.map(step => ({ ...step })), // Deep copy steps
            },
            label,
            auto
        };
        state.checkpoints.push(checkpoint);
        // Keep only last 10 checkpoints to manage memory
        if (state.checkpoints.length > 10) {
            state.checkpoints = state.checkpoints.slice(-10);
        }
        // Persist state for significant checkpoints (non-auto or every 5th checkpoint)
        if (!auto || state.checkpoints.length % 5 === 0) {
            await this.persistState(state, `Checkpoint: ${label}`);
        }
        this.logger.debug(`Created checkpoint: ${label}`);
        return checkpoint;
    }
    /**
     * Restore state from a checkpoint
     */
    async restoreFromCheckpoint(stateId, checkpointId) {
        const state = this.activeStates.get(stateId);
        if (!state) {
            return { success: false, error: `Reasoning state ${stateId} not found` };
        }
        const checkpoint = state.checkpoints.find(cp => cp.id === checkpointId);
        if (!checkpoint) {
            return { success: false, error: `Checkpoint ${checkpointId} not found` };
        }
        try {
            // Restore state from checkpoint
            if (checkpoint.state.currentStep !== undefined) {
                state.currentStep = checkpoint.state.currentStep;
            }
            if (checkpoint.state.steps) {
                state.steps = checkpoint.state.steps.map(step => ({ ...step }));
            }
            // Update active state
            this.activeStates.set(stateId, state);
            this.logger.info(`Restored state ${stateId} from checkpoint: ${checkpoint.label}`);
            return { success: true, restoredState: state };
        }
        catch (error) {
            this.logger.error('Error restoring from checkpoint:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown restore error'
            };
        }
    }
    /**
     * Remove a reasoning state from active management
     */
    async removeReasoningState(stateId, status = 'completed') {
        const state = this.activeStates.get(stateId);
        const existed = this.activeStates.has(stateId);
        this.activeStates.delete(stateId);
        if (existed && state) {
            // Update session status in persistent storage
            if (this.persistenceEnabled) {
                await this.stateStorage.updateSessionStatus(stateId, status);
                // Final persistence with completion status
                await this.persistState(state, `Session ${status}`);
            }
            this.logger.info(`Removed reasoning state ${stateId} from active management (${status})`);
        }
        return existed;
    }
    /**
     * Get all active reasoning states
     */
    getActiveStates() {
        return Array.from(this.activeStates.values());
    }
    /**
     * Load a session from persistent storage and add to active management
     */
    async loadSession(sessionId) {
        if (!this.persistenceEnabled) {
            return { success: false, error: 'Persistence not enabled' };
        }
        try {
            // Check if already active
            if (this.activeStates.has(sessionId)) {
                return {
                    success: true,
                    state: this.activeStates.get(sessionId)
                };
            }
            const loadResult = await this.stateStorage.loadSession(sessionId);
            if (!loadResult.success || !loadResult.state) {
                return {
                    success: false,
                    error: loadResult.error || 'Failed to load session'
                };
            }
            // Add to active management
            this.activeStates.set(sessionId, loadResult.state);
            // Update status to active if it was paused
            if (loadResult.metadata?.status === 'paused') {
                await this.stateStorage.updateSessionStatus(sessionId, 'active');
            }
            // Update session activity (loading counts as activity)
            await this.updateSessionActivity(sessionId);
            this.logger.info(`Loaded session ${sessionId} into active management`);
            return { success: true, state: loadResult.state };
        }
        catch (error) {
            this.logger.error(`Error loading session ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown load error'
            };
        }
    }
    /**
     * Save a session to persistent storage with backup
     */
    async saveSession(stateId, createBackup = false) {
        if (!this.persistenceEnabled) {
            return { success: false, error: 'Persistence not enabled' };
        }
        const state = this.activeStates.get(stateId);
        if (!state) {
            return { success: false, error: `Reasoning state ${stateId} not found` };
        }
        try {
            const saveResult = await this.stateStorage.saveSession(state, {
                updateMetadata: true,
                createBackup
            });
            if (saveResult.success) {
                this.logger.info(`Manually saved session ${stateId}${createBackup ? ' with backup' : ''}`);
            }
            return saveResult;
        }
        catch (error) {
            this.logger.error(`Error saving session ${stateId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown save error'
            };
        }
    }
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        if (!this.persistenceEnabled) {
            return {
                totalSessions: this.activeStates.size,
                activeSessions: this.activeStates.size,
                completedSessions: 0,
                totalSizeBytes: 0,
                oldestSession: 0,
                newestSession: 0
            };
        }
        try {
            const stats = await this.stateStorage.getStorageStats();
            return stats;
        }
        catch (error) {
            this.logger.error('Error getting storage stats:', error);
            return {
                totalSessions: this.activeStates.size,
                activeSessions: this.activeStates.size,
                completedSessions: 0,
                totalSizeBytes: 0,
                oldestSession: 0,
                newestSession: 0
            };
        }
    }
    /**
     * List all saved sessions
     */
    async listSavedSessions(options) {
        if (!this.persistenceEnabled) {
            return { success: false, error: 'Persistence not enabled' };
        }
        try {
            const sessionList = await this.stateStorage.listSessions(options);
            return sessionList;
        }
        catch (error) {
            this.logger.error('Error listing sessions:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get a specific active reasoning state
     */
    getActiveState(stateId) {
        return this.activeStates.get(stateId) || null;
    }
    /**
     * Save session state with options
     */
    async saveSessionState(stateId, options = {}) {
        return this.saveSession(stateId, options.createBackup || false);
    }
    /**
     * Load session state
     */
    async loadSessionState(sessionId) {
        if (!this.persistenceEnabled) {
            return { success: false, error: 'Persistence not enabled' };
        }
        try {
            const loadResult = await this.stateStorage.loadSession(sessionId);
            if (loadResult.success && loadResult.state) {
                // Add to active management if not already there
                if (!this.activeStates.has(sessionId)) {
                    this.activeStates.set(sessionId, loadResult.state);
                }
            }
            return {
                success: loadResult.success,
                state: loadResult.state,
                metadata: loadResult.metadata,
                error: loadResult.error
            };
        }
        catch (error) {
            this.logger.error(`Error loading session state ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown load error'
            };
        }
    }
    /**
     * Resume a session from a specific step
     */
    async resumeSession(sessionId, continueFromStep) {
        try {
            const state = this.activeStates.get(sessionId);
            if (!state) {
                return { success: false, error: `Session ${sessionId} not found in active states` };
            }
            // Set the current step if specified
            if (continueFromStep !== undefined) {
                if (continueFromStep < 0 || continueFromStep >= state.totalSteps) {
                    return {
                        success: false,
                        error: `Invalid step number: ${continueFromStep}. Must be between 0 and ${state.totalSteps - 1}`
                    };
                }
                state.currentStep = continueFromStep;
                // Reset steps from the resume point forward to pending
                for (let i = continueFromStep; i < state.steps.length; i++) {
                    if (state.steps[i].status === 'failed' || state.steps[i].status === 'completed') {
                        state.steps[i].status = 'pending';
                        state.steps[i].errors = [];
                        state.steps[i].outputs = {};
                        state.steps[i].duration = undefined;
                    }
                }
            }
            // Create checkpoint for resume
            await this.createCheckpoint(state, `Session resumed${continueFromStep !== undefined ? ` from step ${continueFromStep + 1}` : ''}`, false);
            // Update active state
            this.activeStates.set(sessionId, state);
            // Persist the resumed state
            await this.persistState(state, 'Session resumed');
            // Update session activity (resuming counts as major activity)
            await this.updateSessionActivity(sessionId);
            this.logger.info(`Session ${sessionId} resumed${continueFromStep !== undefined ? ` from step ${continueFromStep + 1}` : ''}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Error resuming session ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown resume error'
            };
        }
    }
    /**
     * Validate session health and optionally repair issues
     */
    async validateSessionHealth(sessionId, attemptRepair = false) {
        try {
            const state = this.activeStates.get(sessionId);
            if (!state) {
                return { success: false, error: `Session ${sessionId} not found in active states` };
            }
            // Get metadata from storage
            const loadResult = await this.stateStorage.loadSession(sessionId);
            const metadata = loadResult.metadata;
            // Validate session health
            const healthReport = await this.sessionValidator.validateSession(state, metadata);
            let repairResult;
            if (attemptRepair && healthReport.canAutoRepair) {
                const repair = await this.sessionValidator.repairSession(state, healthReport);
                if (repair.success && repair.repairedState) {
                    // Update the active state with repaired version
                    this.activeStates.set(sessionId, repair.repairedState);
                    // Persist the repaired state
                    await this.persistState(repair.repairedState, 'Manual repair via health validation');
                    repairResult = {
                        repairedIssues: repair.repairedIssues,
                        remainingIssues: repair.remainingIssues.length
                    };
                    this.logger.info(`Repaired session ${sessionId}: fixed ${repair.repairedIssues.length} issues, ${repair.remainingIssues.length} remaining`);
                }
            }
            return {
                success: true,
                healthReport,
                repairResult
            };
        }
        catch (error) {
            this.logger.error(`Error validating session health for ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown validation error'
            };
        }
    }
    /**
     * Attempt to recover a failed or corrupted session
     */
    async recoverSession(sessionId, errorType = 'unknown') {
        try {
            // Get current state and metadata if available
            const currentState = this.activeStates.get(sessionId);
            let metadata;
            let availableCheckpoints = [];
            if (this.persistenceEnabled) {
                try {
                    const loadResult = await this.stateStorage.loadSession(sessionId);
                    metadata = loadResult.metadata;
                    availableCheckpoints = loadResult.state?.checkpoints || [];
                }
                catch (error) {
                    this.logger.debug(`Could not load metadata for recovery of session ${sessionId}:`, error);
                }
            }
            // Attempt recovery
            const recoveryResult = await this.sessionRecovery.recoverSession(sessionId, errorType, {
                lastKnownState: currentState,
                metadata,
                availableCheckpoints
            });
            if (recoveryResult.success && recoveryResult.recoveredState) {
                // Update active state with recovered version
                this.activeStates.set(sessionId, recoveryResult.recoveredState);
                // Persist the recovered state
                if (this.persistenceEnabled) {
                    await this.persistState(recoveryResult.recoveredState, `Manual recovery: ${recoveryResult.strategy}`);
                }
                // Update session activity
                await this.updateSessionActivity(sessionId);
                this.logger.info(`Successfully recovered session ${sessionId} using strategy '${recoveryResult.strategy}' (confidence: ${(recoveryResult.confidence * 100).toFixed(1)}%)`);
            }
            return {
                success: recoveryResult.success,
                recoveryResult
            };
        }
        catch (error) {
            this.logger.error(`Error during manual recovery of session ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown recovery error'
            };
        }
    }
    /**
     * Get recovery statistics for monitoring
     */
    getRecoveryStats() {
        return this.sessionRecovery.getRecoveryStats();
    }
    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, status) {
        if (!this.persistenceEnabled) {
            return { success: false, error: 'Persistence not enabled' };
        }
        try {
            const result = await this.stateStorage.updateSessionStatus(sessionId, status);
            if (result.success) {
                this.logger.info(`Updated session ${sessionId} status to ${status}`);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Error updating session status for ${sessionId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown update error'
            };
        }
    }
    /**
     * Start background cleanup scheduler
     */
    startBackgroundCleanup() {
        if (this.cleanupInterval) {
            return; // Already running
        }
        this.cleanupInterval = setInterval(async () => {
            await this.performBackgroundCleanup();
        }, this.cleanupIntervalMs);
        this.logger.info(`Background cleanup scheduler started (interval: ${this.cleanupIntervalMs / 1000}s)`);
    }
    /**
     * Stop background cleanup scheduler
     */
    stopBackgroundCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            this.logger.info('Background cleanup scheduler stopped');
        }
    }
    /**
     * Perform background cleanup of expired sessions
     */
    async performBackgroundCleanup() {
        if (!this.persistenceEnabled) {
            return;
        }
        try {
            this.logger.debug('Starting background cleanup of expired sessions');
            const cleanupResult = await this.stateStorage.cleanupExpiredSessions();
            if (cleanupResult.success) {
                // Remove cleaned up sessions from active memory
                for (const sessionId of cleanupResult.cleanedSessions) {
                    if (this.activeStates.has(sessionId)) {
                        this.activeStates.delete(sessionId);
                        this.logger.debug(`Removed cleaned up session ${sessionId} from active memory`);
                    }
                }
                if (cleanupResult.cleanedSessions.length > 0) {
                    this.logger.info(`Background cleanup completed: cleaned up ${cleanupResult.cleanedSessions.length} expired sessions`);
                }
            }
            else {
                this.logger.warn('Background cleanup failed:', cleanupResult.error);
            }
        }
        catch (error) {
            this.logger.error('Error during background cleanup:', error);
        }
    }
    /**
     * Save all active sessions (used during shutdown)
     */
    async saveAllActiveSessions() {
        if (!this.persistenceEnabled) {
            return;
        }
        const savePromises = Array.from(this.activeStates.entries()).map(async ([sessionId, state]) => {
            try {
                await this.persistState(state, 'Shutdown save');
                this.logger.debug(`Saved session ${sessionId} during shutdown`);
            }
            catch (error) {
                this.logger.warn(`Failed to save session ${sessionId} during shutdown:`, error);
            }
        });
        await Promise.allSettled(savePromises);
        this.logger.info(`Saved ${this.activeStates.size} active sessions during shutdown`);
    }
    /**
     * Update session activity timestamp (heartbeat)
     */
    async updateSessionActivity(sessionId) {
        if (!this.persistenceEnabled) {
            return;
        }
        try {
            await this.stateStorage.updateSessionActivity(sessionId);
        }
        catch (error) {
            this.logger.debug(`Failed to update session activity for ${sessionId}:`, error);
            // Don't throw - this is not critical to the main operation
        }
    }
    // Private helper methods
    /**
     * Persist a reasoning state to storage
     */
    async persistState(state, reason) {
        if (!this.persistenceEnabled)
            return;
        try {
            const saveResult = await this.stateStorage.saveSession(state, {
                updateMetadata: true,
                createBackup: false
            });
            if (!saveResult.success) {
                this.logger.warn(`Failed to persist state ${state.id}: ${saveResult.error}`);
            }
            else {
                // Emit session saved event
                await this.eventManager.emit('session_saved', state.id, {
                    currentState: state,
                    reason
                }, { source: 'ChainManager.persistState' });
                this.logger.debug(`Persisted state ${state.id} (${reason})`);
            }
        }
        catch (error) {
            this.logger.error(`Error persisting state ${state.id}:`, error);
        }
    }
    generateStateId() {
        const uuid = randomUUID();
        const timestamp = Date.now().toString(36);
        return `reasoning-${timestamp}-${uuid.substring(0, 8)}`;
    }
    createReasoningStrategy(strategy) {
        const strategyConfigs = {
            top_down: {
                type: 'hierarchical',
                parameters: { depth: 3, breadthFirst: false }
            },
            bottom_up: {
                type: 'sequential',
                parameters: { buildUp: true, validation: true }
            },
            divide_conquer: {
                type: 'parallel',
                parameters: { independence: true, mergeRequired: true }
            },
            incremental: {
                type: 'sequential',
                parameters: { iterative: false, buildOn: true }
            },
            parallel: {
                type: 'parallel',
                parameters: { maxConcurrency: 4, syncPoints: true }
            },
            iterative: {
                type: 'adaptive',
                parameters: { cycles: 3, improvement: true }
            }
        };
        const config = strategyConfigs[strategy];
        return {
            name: strategy,
            type: config.type || 'sequential',
            parameters: config.parameters || {},
            adaptationTriggers: [],
            performanceMetrics: {
                accuracy: 0,
                efficiency: 0,
                completionRate: 0,
                averageConfidence: 0
            }
        };
    }
    createMetadata(partial) {
        return {
            sessionId: randomUUID(),
            clientType: 'sequential-thinking-server',
            version: '2.0.0',
            tags: ['problem-solving', 'cognitive-reasoning'],
            priority: 'medium',
            ...partial
        };
    }
    async validateReasoningState(state) {
        if (!state.id || !state.problem || !state.steps) {
            throw new Error('Invalid reasoning state: missing required properties');
        }
        if (state.steps.length === 0) {
            throw new Error('Reasoning state must have at least one step');
        }
        if (state.currentStep < 0 || state.currentStep > state.totalSteps) {
            throw new Error('Invalid current step index');
        }
        // Validate step dependencies
        const stepIds = new Set(state.steps.map(s => s.id));
        for (const step of state.steps) {
            for (const depId of step.dependencies) {
                if (!stepIds.has(depId)) {
                    throw new Error(`Step ${step.id} has invalid dependency: ${depId}`);
                }
            }
        }
    }
    async checkDependencies(state, step) {
        const missing = [];
        for (const depId of step.dependencies) {
            const depStep = state.steps.find(s => s.id === depId);
            if (!depStep) {
                missing.push(depId);
            }
            else if (depStep.status !== 'completed') {
                missing.push(depId);
            }
        }
        return {
            satisfied: missing.length === 0,
            missing
        };
    }
    async simulateStepExecution(step) {
        // Simulate step execution based on step characteristics
        const complexity = step.inputs?.complexity || 'medium';
        const category = step.inputs?.category || 'general';
        // Base success rate
        let successRate = 0.9;
        // Adjust based on complexity
        if (complexity === 'high')
            successRate -= 0.1;
        if (complexity === 'low')
            successRate += 0.05;
        // Adjust based on confidence
        successRate = (successRate + step.confidence) / 2;
        // Simulate execution
        const success = Math.random() < successRate;
        if (success) {
            return {
                success: true,
                outputs: {
                    executionTimestamp: Date.now(),
                    category,
                    complexity,
                    result: `Successfully completed: ${step.description}`,
                    confidence: Math.min(0.95, step.confidence + 0.05)
                }
            };
        }
        else {
            return {
                success: false,
                errors: [`Execution failed for step: ${step.description}`]
            };
        }
    }
    isSignificantStep(step, state) {
        // Create checkpoint for:
        // - Steps with no dependencies (start of new branch)
        // - Steps that many other steps depend on
        // - Every 5th step
        // - High complexity steps
        const dependentSteps = state.steps.filter(s => s.dependencies.includes(step.id)).length;
        const complexity = step.inputs?.complexity;
        return (step.dependencies.length === 0 ||
            dependentSteps >= 2 ||
            step.index % 5 === 0 ||
            complexity === 'high');
    }
    // Event Management Methods
    /**
     * Subscribe to session lifecycle events
     */
    subscribeToEvents(eventTypes, handler, options) {
        return this.eventManager.subscribe(eventTypes, handler, options);
    }
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents(subscriptionId) {
        return this.eventManager.unsubscribe(subscriptionId);
    }
    /**
     * Get session event history
     */
    getSessionEventHistory(filter) {
        return this.eventManager.getEventHistory(filter);
    }
    /**
     * Get event system metrics
     */
    getEventMetrics() {
        return this.eventManager.getMetrics();
    }
    /**
     * Emit a custom session event (for external integrations)
     */
    async emitSessionEvent(eventType, sessionId, data, source) {
        await this.eventManager.emit(eventType, sessionId, data, { source: source || 'external' });
    }
    // Multi-Client Management Methods
    /**
     * Register a client for concurrent session access
     */
    async registerClient(clientId, sessionId, clientInfo, accessLevel = 'read') {
        // Verify session exists
        const state = this.activeStates.get(sessionId);
        if (!state) {
            return {
                success: false,
                error: `Session ${sessionId} not found`
            };
        }
        const result = await this.multiClientManager.registerClient(clientId, sessionId, clientInfo, accessLevel);
        if (result.success) {
            // Emit client connected event
            await this.eventManager.emit('client_connected', sessionId, {
                clientId,
                clientInfo,
                accessLevel
            }, { source: 'ChainManager.registerClient' });
        }
        return result;
    }
    /**
     * Unregister a client from session access
     */
    async unregisterClient(clientId) {
        const result = await this.multiClientManager.unregisterClient(clientId);
        if (result.success && result.releasedLocks > 0) {
            // Emit client disconnected event
            await this.eventManager.emit('client_disconnected', 'system', {
                clientId,
                releasedLocks: result.releasedLocks
            }, { source: 'ChainManager.unregisterClient' });
        }
        return result;
    }
    /**
     * Acquire a lock on a session for safe concurrent access
     */
    async acquireSessionLock(request) {
        // Update client activity
        this.multiClientManager.updateClientActivity(request.clientId);
        // Verify session exists
        const state = this.activeStates.get(request.sessionId);
        if (!state) {
            return {
                success: false,
                error: `Session ${request.sessionId} not found`
            };
        }
        const result = await this.multiClientManager.acquireLock(request);
        if (result.success) {
            // Emit lock acquired event
            await this.eventManager.emit('lock_acquired', request.sessionId, {
                lockId: result.lockId,
                clientId: request.clientId,
                lockType: request.lockType,
                lockScope: request.lockScope
            }, { source: 'ChainManager.acquireSessionLock' });
        }
        return {
            success: result.success,
            lockId: result.lockId,
            error: result.error,
            waitTime: result.waitTime
        };
    }
    /**
     * Release a session lock
     */
    async releaseSessionLock(lockId) {
        const result = await this.multiClientManager.releaseLock(lockId);
        if (result.success) {
            // Emit lock released event
            await this.eventManager.emit('lock_released', 'system', {
                lockId,
                processedQueue: result.processedQueue
            }, { source: 'ChainManager.releaseSessionLock' });
        }
        return result;
    }
    /**
     * Get session access information including active clients and locks
     */
    getSessionAccessInfo(sessionId) {
        return this.multiClientManager.getSessionAccessInfo(sessionId);
    }
    /**
     * Get all active client sessions
     */
    getActiveClientSessions() {
        return this.multiClientManager.getActiveClients();
    }
    /**
     * Check if a client can perform an operation on a session
     */
    canClientAccessSession(clientId, sessionId, operation) {
        return this.multiClientManager.canClientAccessSession(clientId, sessionId, operation);
    }
    /**
     * Force release all locks for a session (admin operation)
     */
    async forceReleaseSessionLocks(sessionId) {
        const result = await this.multiClientManager.forceReleaseSessionLocks(sessionId);
        if (result.success && result.releasedLocks > 0) {
            // Emit force unlock event
            await this.eventManager.emit('locks_force_released', sessionId, {
                releasedLocks: result.releasedLocks
            }, { source: 'ChainManager.forceReleaseSessionLocks' });
        }
        return result;
    }
    /**
     * Enhanced executeNextStep with multi-client support
     */
    async executeNextStepWithLock(stateId, clientId, options = {}) {
        try {
            // Acquire write lock for step execution
            const lockRequest = {
                sessionId: stateId,
                clientId,
                lockType: options.requireExclusiveLock ? 'exclusive' : 'write',
                lockScope: 'step_execution',
                timeoutMs: options.lockTimeoutMs || 30000,
                reason: 'Step execution'
            };
            const lockResult = await this.acquireSessionLock(lockRequest);
            if (!lockResult.success) {
                return {
                    success: false,
                    error: `Failed to acquire lock: ${lockResult.error}`
                };
            }
            try {
                // Execute the step
                const executeResult = await this.executeNextStep(stateId);
                // Update client activity
                this.multiClientManager.updateClientActivity(clientId);
                return {
                    success: executeResult.success,
                    updatedState: executeResult.updatedState,
                    lockId: lockResult.lockId,
                    error: executeResult.error
                };
            }
            finally {
                // Always release the lock
                if (lockResult.lockId) {
                    await this.releaseSessionLock(lockResult.lockId);
                }
            }
        }
        catch (error) {
            this.logger.error('Error in executeNextStepWithLock:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Enhanced createReasoningState with multi-client support
     */
    async createReasoningStateWithClient(problem, steps, strategy, clientId, clientInfo, metadata) {
        try {
            // Create the reasoning state
            const state = await this.createReasoningState(problem, steps, strategy, metadata);
            // Register the client with write access (they created the session)
            const clientResult = await this.registerClient(clientId, state.id, clientInfo, 'write');
            if (!clientResult.success) {
                this.logger.warn(`Failed to register client ${clientId} for new session ${state.id}: ${clientResult.error}`);
            }
            return {
                success: true,
                state,
                clientSession: clientResult.clientSession,
                error: clientResult.error
            };
        }
        catch (error) {
            this.logger.error('Error in createReasoningStateWithClient:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // ========== CONFLICT DETECTION & RESOLUTION ==========
    /**
     * Update reasoning state with conflict detection and resolution
     */
    async updateStateWithConflictResolution(stateId, clientId, stateUpdate) {
        try {
            const currentState = this.activeStates.get(stateId);
            if (!currentState) {
                return {
                    success: false,
                    error: `No active session found with ID: ${stateId}`
                };
            }
            // Check for concurrent modifications from other clients
            const conflictingClients = await this.getConflictingClients(stateId, clientId);
            const conflicts = [];
            const resolutions = [];
            // Detect conflicts with each concurrent client
            for (const otherClientId of conflictingClients) {
                const otherClientUpdates = await this.getPendingClientUpdates(stateId, otherClientId);
                if (otherClientUpdates) {
                    const detectedConflicts = await this.conflictResolver.detectConflicts(stateId, clientId, stateUpdate, otherClientId, otherClientUpdates, currentState);
                    conflicts.push(...detectedConflicts);
                }
            }
            // Resolve conflicts if any were detected
            if (conflicts.length > 0) {
                this.logger.warn(`Detected ${conflicts.length} conflicts for session ${stateId}, attempting resolution`);
                const resolutionResult = await this.conflictResolver.resolveAllConflicts(stateId);
                if (resolutionResult.success && resolutionResult.resolutions.length > 0) {
                    resolutions.push(...resolutionResult.resolutions);
                    // Apply the resolved state
                    const resolvedState = resolutionResult.resolutions[0].resolvedState;
                    this.activeStates.set(stateId, resolvedState);
                    // Emit conflict resolution event
                    await this.eventManager.emit('lock_conflict', stateId, {
                        clientId,
                        reason: `Resolved ${conflicts.length} conflicts using automated resolution`,
                        processedQueue: true
                    });
                    return {
                        success: true,
                        updatedState: resolvedState,
                        conflicts,
                        resolutions
                    };
                }
                else {
                    // Conflicts couldn't be automatically resolved
                    return {
                        success: false,
                        conflicts,
                        error: `${conflicts.length} conflicts detected but could not be automatically resolved`
                    };
                }
            }
            // No conflicts - apply update directly
            const updatedState = { ...currentState, ...stateUpdate };
            this.activeStates.set(stateId, updatedState);
            // Update client activity
            this.multiClientManager.updateClientActivity(clientId);
            return {
                success: true,
                updatedState,
                conflicts: [],
                resolutions: []
            };
        }
        catch (error) {
            this.logger.error('Error in updateStateWithConflictResolution:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get active conflicts for a session
     */
    getActiveConflicts(sessionId) {
        return this.conflictResolver.getActiveConflicts(sessionId);
    }
    /**
     * Get conflict resolution statistics
     */
    getConflictStats() {
        return this.conflictResolver.getConflictStats();
    }
    /**
     * Get conflict resolution history
     */
    getConflictHistory(limit) {
        return this.conflictResolver.getResolutionHistory(limit);
    }
    /**
     * Manually resolve a specific conflict
     */
    async resolveConflict(conflictId) {
        return await this.conflictResolver.resolveConflict(conflictId);
    }
    /**
     * Force resolve all conflicts for a session
     */
    async forceResolveAllConflicts(sessionId) {
        return await this.conflictResolver.resolveAllConflicts(sessionId);
    }
    // Private conflict detection helpers
    async getConflictingClients(sessionId, excludeClientId) {
        try {
            const sessionInfo = this.multiClientManager.getSessionAccessInfo(sessionId);
            return sessionInfo.activeClients
                .filter(client => client.clientId !== excludeClientId)
                .map(client => client.clientId);
        }
        catch (error) {
            this.logger.warn('Error getting conflicting clients:', error);
            return [];
        }
    }
    async getPendingClientUpdates(sessionId, clientId) {
        // In a real implementation, this would track pending updates per client
        // For now, we'll return null to indicate no pending updates
        // This could be enhanced with a pending updates cache
        return null;
    }
}
//# sourceMappingURL=chain-manager.js.map