/**
 * MCP Tool Handlers for Sequential Thinking Server
 * 
 * Implements the decompose_problem tool with comprehensive validation,
 * error handling, and integration with the core reasoning engine.
 */

import type { 
  ReasoningState, 
  DecompositionStrategy 
} from '../types/index.js';
import type { SessionMetadata, SessionSearchOptions } from '../engine/state-storage-manager.js';
import { ProblemAnalyzer } from '../engine/problem-analyzer.js';
import { DecompositionEngine } from '../engine/decomposition-engine.js';
import { ChainManager } from '../engine/chain-manager.js';
import { ValidationEngine } from '../engine/validation-engine.js';
import { MemoryIntegration } from '../integrations/memory-integration.js';
import { FilesystemIntegration } from '../integrations/filesystem-integration.js';
import { Logger } from '@em-cp2/shared';

export class ToolHandlers {
  private logger: Logger;
  private problemAnalyzer: ProblemAnalyzer;
  private decompositionEngine: DecompositionEngine;
  private chainManager: ChainManager;
  private validationEngine: ValidationEngine;
  private memoryIntegration: MemoryIntegration;
  private filesystemIntegration: FilesystemIntegration;

  constructor() {
    this.logger = new Logger('ToolHandlers');
    this.problemAnalyzer = new ProblemAnalyzer();
    this.decompositionEngine = new DecompositionEngine();
    this.chainManager = new ChainManager();
    this.validationEngine = new ValidationEngine();
    this.memoryIntegration = new MemoryIntegration();
    this.filesystemIntegration = new FilesystemIntegration();
  }

  /**
   * Initialize tool handlers with persistent storage
   */
  async initialize(): Promise<void> {
    try {
      await this.chainManager.initialize();
      this.logger.info('ToolHandlers initialized with persistent state management');
    } catch (error) {
      this.logger.error('Failed to initialize ToolHandlers:', error);
      throw error;
    }
  }

  /**
   * Handle decompose_problem tool calls
   */
  async handleDecomposeProblem(args: {
    problem_description: string;
    decomposition_strategy?: DecompositionStrategy;
    depth_limit?: number;
  }): Promise<{
    success: boolean;
    data?: ReasoningState;
    error?: string;
    metadata?: any;
  }> {
    try {
      // Validate input parameters
      const validation = this.validateDecomposeProblemInput(args);
      if (!validation.valid) {
        return {
          success: false,
          error: `Input validation failed: ${validation.error}`
        };
      }

      this.logger.info(`Starting problem decomposition: "${args.problem_description.substring(0, 100)}..."`);

      // Step 1: Analyze the problem
      const problemDefinition = await this.problemAnalyzer.analyzeProblem(
        args.problem_description,
        {
          domain: 'general',
          constraints: [],
        }
      );

      // Step 2: Get cognitive insights from Memory integration
      const cognitiveInsights = await this.memoryIntegration.getCognitiveInsights(problemDefinition);
      
      if (cognitiveInsights.recommendedStrategy && cognitiveInsights.confidence > 0.6) {
        this.logger.info(`Memory recommends ${cognitiveInsights.recommendedStrategy} strategy with ${(cognitiveInsights.confidence * 100).toFixed(1)}% confidence (based on ${cognitiveInsights.similarProblems} similar problems)`);
      }

      // Step 3: Select decomposition strategy (consider memory insights)
      let strategy = args.decomposition_strategy;
      
      if (!strategy) {
        if (cognitiveInsights.recommendedStrategy && cognitiveInsights.confidence > 0.6) {
          strategy = cognitiveInsights.recommendedStrategy;
          this.logger.info(`Using memory-recommended strategy: ${strategy}`);
        } else {
          strategy = await this.problemAnalyzer.recommendStrategy(problemDefinition);
          this.logger.info(`Using analyzer-recommended strategy: ${strategy}`);
        }
      } else {
        this.logger.info(`Using user-specified strategy: ${strategy}`);
      }

      // Step 3: Decompose the problem
      const reasoningSteps = await this.decompositionEngine.decompose(
        problemDefinition,
        strategy,
        {
          strategy,
          maxDepth: args.depth_limit || 5,
          minSteps: 2,
          maxSteps: 15,
          parallelism: strategy === 'parallel',
          adaptiveThreshold: 0.7,
          validation: true
        }
      );

      // Step 4: Create reasoning state
      const reasoningState = await this.chainManager.createReasoningState(
        problemDefinition,
        reasoningSteps,
        strategy
      );

      // Step 5: Validate the reasoning chain
      const qualityAssessment = await this.validationEngine.assessQuality(reasoningState);
      
      this.logger.info(`Problem decomposition completed: ${reasoningSteps.length} steps generated with ${(qualityAssessment.confidence * 100).toFixed(1)}% confidence`);

      // Step 6: Store results in Memory for future learning
      if (this.memoryIntegration.isMemoryAvailable()) {
        try {
          // Store the reasoning pattern for learning
          const patternId = await this.memoryIntegration.storeReasoningPattern({
            problemType: this.classifyProblemType(args.problem_description),
            strategy,
            successRate: qualityAssessment.confidence,
            averageDuration: Date.now() - reasoningState.timestamp, // Rough estimate
            qualityScores: [qualityAssessment],
            context: {
              domain: problemDefinition.domain,
              complexity: problemDefinition.complexity,
              constraints: problemDefinition.constraints
            }
          });

          // Store the complete solution
          const solutionId = await this.memoryIntegration.storeSolution({
            problemFingerprint: this.generateProblemFingerprint(problemDefinition),
            reasoningState,
            quality: qualityAssessment
          });

          this.logger.info(`Stored reasoning pattern ${patternId} and solution ${solutionId} for future learning`);
        } catch (error) {
          this.logger.warn('Failed to store reasoning results in memory:', error);
        }
      }

      // Step 7: Generate reasoning artifacts in Filesystem
      let artifactManifest = null;
      if (this.filesystemIntegration.isFilesystemAvailable()) {
        try {
          artifactManifest = await this.filesystemIntegration.generateReasoningArtifacts(reasoningState, {
            generateMarkdown: true,
            generateJSON: true,
            includeMetadata: true
          });

          this.logger.info(`Generated ${artifactManifest.totalFiles} reasoning artifacts in workspace: ${artifactManifest.workspacePath}`);
        } catch (error) {
          this.logger.warn('Failed to generate reasoning artifacts:', error);
        }
      }

      return {
        success: true,
        data: reasoningState,
        metadata: {
          memoryInsights: cognitiveInsights,
          qualityAssessment,
          artifactManifest
        }
      };

    } catch (error) {
      this.logger.error('Error in decompose_problem handler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate input parameters for decompose_problem tool
   */
  private validateDecomposeProblemInput(args: {
    problem_description: string;
    decomposition_strategy?: DecompositionStrategy;
    depth_limit?: number;
  }): { valid: boolean; error?: string } {
    // Required parameter validation
    if (!args.problem_description) {
      return { valid: false, error: 'problem_description is required' };
    }

    if (typeof args.problem_description !== 'string') {
      return { valid: false, error: 'problem_description must be a string' };
    }

    if (args.problem_description.trim().length < 10) {
      return { valid: false, error: 'problem_description must be at least 10 characters' };
    }

    if (args.problem_description.length > 5000) {
      return { valid: false, error: 'problem_description cannot exceed 5000 characters' };
    }

    // Optional parameter validation
    if (args.decomposition_strategy) {
      const validStrategies: DecompositionStrategy[] = [
        'top_down', 'bottom_up', 'divide_conquer', 
        'incremental', 'parallel', 'iterative'
      ];
      
      if (!validStrategies.includes(args.decomposition_strategy)) {
        return { 
          valid: false, 
          error: `Invalid decomposition_strategy. Must be one of: ${validStrategies.join(', ')}` 
        };
      }
    }

    if (args.depth_limit !== undefined) {
      if (typeof args.depth_limit !== 'number') {
        return { valid: false, error: 'depth_limit must be a number' };
      }

      if (args.depth_limit < 1 || args.depth_limit > 10) {
        return { valid: false, error: 'depth_limit must be between 1 and 10' };
      }
    }

    return { valid: true };
  }

  /**
   * Classify problem type based on description
   */
  private classifyProblemType(description: string): string {
    const text = description.toLowerCase();
    
    if (text.includes('analyze') || text.includes('evaluate')) return 'analytical';
    if (text.includes('create') || text.includes('design')) return 'creative';
    if (text.includes('fix') || text.includes('debug')) return 'diagnostic';
    if (text.includes('plan') || text.includes('strategy')) return 'planning';
    if (text.includes('research') || text.includes('investigate')) return 'research';
    if (text.includes('optimize') || text.includes('improve')) return 'optimization';
    if (text.includes('implement') || text.includes('build')) return 'procedural';
    
    return 'general';
  }

  /**
   * Generate problem fingerprint for similarity matching
   */
  private generateProblemFingerprint(problem: any): string {
    const parts = [
      problem.domain || 'general',
      problem.complexity || 'moderate',
      (problem.constraints || []).sort().join(','),
      problem.description.substring(0, 50).toLowerCase().replace(/\s+/g, '-')
    ];
    
    return parts.join('::');
  }

  /**
   * Handle save_session tool calls
   */
  async handleSaveSession(args: {
    session_id: string;
    status?: SessionMetadata['status'];
    create_backup?: boolean;
  }): Promise<{
    success: boolean;
    sessionPath?: string;
    error?: string;
  }> {
    try {
      // Validate input
      if (!args.session_id || typeof args.session_id !== 'string') {
        return { success: false, error: 'session_id is required and must be a string' };
      }

      // Get the current reasoning state from ChainManager
      const activeState = this.chainManager.getActiveState(args.session_id);
      if (!activeState) {
        return { success: false, error: `No active session found with ID: ${args.session_id}` };
      }

      // Update session status if provided
      if (args.status) {
        await this.chainManager.updateSessionStatus(args.session_id, args.status);
      }

      // Save the session
      const result = await this.chainManager.saveSessionState(args.session_id, {
        updateMetadata: true,
        createBackup: args.create_backup || false
      });

      this.logger.info(`Session ${args.session_id} saved successfully`);
      return result;

    } catch (error) {
      this.logger.error(`Error in save_session handler:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle load_session tool calls
   */
  async handleLoadSession(args: {
    session_id: string;
  }): Promise<{
    success: boolean;
    state?: ReasoningState;
    metadata?: SessionMetadata;
    error?: string;
  }> {
    try {
      // Validate input
      if (!args.session_id || typeof args.session_id !== 'string') {
        return { success: false, error: 'session_id is required and must be a string' };
      }

      // Load the session
      const result = await this.chainManager.loadSessionState(args.session_id);
      
      if (result.success && result.state) {
        this.logger.info(`Session ${args.session_id} loaded successfully`);
      }

      return result;

    } catch (error) {
      this.logger.error(`Error in load_session handler:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle list_sessions tool calls
   */
  async handleListSessions(args: {
    status?: string[];
    strategy?: string[];
    date_range?: { from: number; to: number };
    limit?: number;
    sort_by?: 'createdAt' | 'lastModified' | 'strategy';
    sort_order?: 'asc' | 'desc';
  }): Promise<{
    success: boolean;
    sessions?: SessionMetadata[];
    error?: string;
  }> {
    try {
      // Build search options
      const options: SessionSearchOptions = {};
      
      if (args.status) {
        options.status = args.status as SessionMetadata['status'][];
      }
      
      if (args.strategy) {
        options.strategy = args.strategy;
      }
      
      if (args.date_range) {
        options.dateRange = args.date_range;
      }
      
      if (args.limit) {
        options.limit = args.limit;
      }
      
      if (args.sort_by) {
        options.sortBy = args.sort_by;
      }
      
      if (args.sort_order) {
        options.sortOrder = args.sort_order;
      }

      // List sessions
      const result = await this.chainManager.listSavedSessions(options);
      
      if (result.success) {
        this.logger.info(`Listed ${result.sessions?.length || 0} sessions`);
      }

      return result;

    } catch (error) {
      this.logger.error(`Error in list_sessions handler:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle resume_session tool calls
   */
  async handleResumeSession(args: {
    session_id: string;
    continue_from_step?: number;
  }): Promise<{
    success: boolean;
    state?: ReasoningState;
    error?: string;
  }> {
    try {
      // Validate input
      if (!args.session_id || typeof args.session_id !== 'string') {
        return { success: false, error: 'session_id is required and must be a string' };
      }

      // Load the session first
      const loadResult = await this.chainManager.loadSessionState(args.session_id);
      if (!loadResult.success || !loadResult.state) {
        return { success: false, error: loadResult.error || 'Failed to load session' };
      }

      // Resume the session in ChainManager
      const resumeResult = await this.chainManager.resumeSession(
        args.session_id, 
        args.continue_from_step
      );
      
      if (resumeResult.success) {
        // Update session status to active
        await this.chainManager.updateSessionStatus(args.session_id, 'active');
        this.logger.info(`Session ${args.session_id} resumed successfully`);
      }

      return {
        success: resumeResult.success,
        state: loadResult.state,
        error: resumeResult.error
      };

    } catch (error) {
      this.logger.error(`Error in resume_session handler:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle archive_session tool calls
   */
  async handleArchiveSession(args: {
    session_id: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate input
      if (!args.session_id || typeof args.session_id !== 'string') {
        return { success: false, error: 'session_id is required and must be a string' };
      }

      // Update session status to archived
      const result = await this.chainManager.updateSessionStatus(args.session_id, 'archived');
      
      if (result.success) {
        this.logger.info(`Session ${args.session_id} archived successfully`);
      }

      return result;

    } catch (error) {
      this.logger.error(`Error in archive_session handler:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle get_storage_stats tool calls
   */
  async handleGetStorageStats(): Promise<{
    success: boolean;
    stats?: {
      totalSessions: number;
      activeSessions: number;
      completedSessions: number;
      totalSizeBytes: number;
      oldestSession: number;
      newestSession: number;
    };
    error?: string;
  }> {
    try {
      const stats = await this.chainManager.getStorageStats();
      
      this.logger.info(`Retrieved storage stats: ${stats.totalSessions} total sessions`);
      
      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      this.logger.error(`Error in get_storage_stats handler:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate session health and get detailed health report
   */
  async handleValidateSessionHealth(args: {
    session_id: string;
    attempt_auto_repair?: boolean;
  }): Promise<{
    success: boolean;
    health_report?: any;
    repair_result?: any;
    error?: string;
  }> {
    try {
      if (!args.session_id) {
        return { success: false, error: 'Session ID is required' };
      }

      this.logger.info(`Validating health for session ${args.session_id}`);

      const result = await this.chainManager.validateSessionHealth(
        args.session_id,
        args.attempt_auto_repair || false
      );

      if (result.success) {
        return {
          success: true,
          health_report: result.healthReport,
          repair_result: result.repairResult
        };
      } else {
        return {
          success: false,
          error: result.error || 'Health validation failed'
        };
      }

    } catch (error) {
      this.logger.error('Error validating session health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Recover a corrupted or failed session
   */
  async handleRecoverSession(args: {
    session_id: string;
    error_type?: 'corruption' | 'missing_data' | 'dependency_failure' | 'validation_failure' | 'timeout' | 'unknown';
    max_attempts?: number;
  }): Promise<{
    success: boolean;
    recovery_result?: any;
    recovered_state?: any;
    error?: string;
  }> {
    try {
      if (!args.session_id) {
        return { success: false, error: 'Session ID is required' };
      }

      this.logger.info(`Attempting recovery for session ${args.session_id}`);

      const result = await this.chainManager.recoverSession(
        args.session_id,
        args.error_type || 'unknown'
      );

      if (result.success) {
        return {
          success: true,
          recovery_result: result.recoveryResult,
          recovered_state: result.recoveryResult?.recoveredState
        };
      } else {
        return {
          success: false,
          error: result.error || 'Session recovery failed'
        };
      }

    } catch (error) {
      this.logger.error('Error recovering session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get session event history and lifecycle events
   */
  async handleGetSessionEvents(args: {
    session_id?: string;
    event_type?: string;
    start_time?: number;
    end_time?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    events?: any[];
    total_events?: number;
    error?: string;
  }> {
    try {
      this.logger.info(`Retrieving session events with filters:`, args);

      const events = this.chainManager.getSessionEventHistory({
        sessionId: args.session_id,
        eventType: args.event_type as any,
        startTime: args.start_time,
        endTime: args.end_time,
        limit: args.limit || 100
      });

      return {
        success: true,
        events,
        total_events: events.length
      };

    } catch (error) {
      this.logger.error('Error retrieving session events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get comprehensive event system metrics
   */
  async handleGetEventMetrics(): Promise<{
    success: boolean;
    metrics?: any;
    error?: string;
  }> {
    try {
      this.logger.info('Retrieving event system metrics');

      const metrics = this.chainManager.getEventMetrics();

      return {
        success: true,
        metrics
      };

    } catch (error) {
      this.logger.error('Error retrieving event metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get restoration system status and metrics
   */
  async handleGetRestorationMetrics(): Promise<{
    success: boolean;
    restoration_metrics?: any;
    error?: string;
  }> {
    try {
      this.logger.info('Retrieving restoration system metrics');

      const metrics = this.chainManager.getRestorationMetrics();

      return {
        success: true,
        restoration_metrics: metrics
      };

    } catch (error) {
      this.logger.error('Error retrieving restoration metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Subscribe to session lifecycle events (for monitoring)
   */
  async handleSubscribeToEvents(args: {
    event_types: string[];
    priority?: number;
    subscription_id?: string;
  }): Promise<{
    success: boolean;
    subscription_id?: string;
    error?: string;
  }> {
    try {
      if (!args.event_types || args.event_types.length === 0) {
        return { success: false, error: 'At least one event type is required' };
      }

      this.logger.info(`Subscribing to events: ${args.event_types.join(', ')}`);

      // Create a basic logging handler for the events
      const handler = (event: any) => {
        this.logger.info(`Event received: ${event.type} for session ${event.sessionId}`);
      };

      const subscriptionId = this.chainManager.subscribeToEvents(
        args.event_types as any[],
        handler,
        {
          priority: args.priority || 50,
          id: args.subscription_id || `subscription-${Date.now()}`
        }
      );

      return {
        success: true,
        subscription_id: subscriptionId
      };

    } catch (error) {
      this.logger.error('Error subscribing to events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Unsubscribe from session events
   */
  async handleUnsubscribeFromEvents(args: {
    subscription_id: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!args.subscription_id) {
        return { success: false, error: 'Subscription ID is required' };
      }

      this.logger.info(`Unsubscribing from events: ${args.subscription_id}`);

      const success = this.chainManager.unsubscribeFromEvents(args.subscription_id);

      return { success };

    } catch (error) {
      this.logger.error('Error unsubscribing from events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle resolve_conflicts tool calls
   */
  async handleResolveConflicts(args: {
    session_id: string;
    conflict_id?: string;
    force_resolve_all?: boolean;
  }): Promise<{
    success: boolean;
    resolved_conflicts?: any[];
    conflict_stats?: any;
    error?: string;
  }> {
    try {
      if (!args.session_id) {
        return { success: false, error: 'session_id is required' };
      }

      if (args.conflict_id) {
        // Resolve specific conflict
        const result = await this.chainManager.resolveConflict(args.conflict_id);
        
        return {
          success: result.success,
          resolved_conflicts: result.resolution ? [result.resolution] : [],
          error: result.error
        };
      } else if (args.force_resolve_all) {
        // Force resolve all conflicts for session
        const result = await this.chainManager.forceResolveAllConflicts(args.session_id);
        
        return {
          success: result.success,
          resolved_conflicts: result.resolutions,
          conflict_stats: {
            resolvedCount: result.resolvedCount,
            failedCount: result.failedCount,
            errors: result.errors
          }
        };
      } else {
        // Get active conflicts (read-only)
        const activeConflicts = this.chainManager.getActiveConflicts(args.session_id);
        const stats = this.chainManager.getConflictStats();
        
        return {
          success: true,
          resolved_conflicts: activeConflicts,
          conflict_stats: stats
        };
      }

    } catch (error) {
      this.logger.error('Error in resolve_conflicts handler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle get_conflict_stats tool calls
   */
  async handleGetConflictStats(): Promise<{
    success: boolean;
    conflict_stats?: any;
    conflict_history?: any[];
    error?: string;
  }> {
    try {
      const stats = this.chainManager.getConflictStats();
      const history = this.chainManager.getConflictHistory(20);

      return {
        success: true,
        conflict_stats: stats,
        conflict_history: history
      };

    } catch (error) {
      this.logger.error('Error in get_conflict_stats handler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle update_state_with_conflict_resolution tool calls
   */
  async handleUpdateStateWithConflictResolution(args: {
    session_id: string;
    client_id: string;
    state_update: any;
  }): Promise<{
    success: boolean;
    updated_state?: any;
    conflicts?: any[];
    resolutions?: any[];
    error?: string;
  }> {
    try {
      if (!args.session_id || !args.client_id || !args.state_update) {
        return { success: false, error: 'session_id, client_id, and state_update are required' };
      }

      const result = await this.chainManager.updateStateWithConflictResolution(
        args.session_id,
        args.client_id,
        args.state_update
      );

      return {
        success: result.success,
        updated_state: result.updatedState,
        conflicts: result.conflicts,
        resolutions: result.resolutions,
        error: result.error
      };

    } catch (error) {
      this.logger.error('Error in update_state_with_conflict_resolution handler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get the ChainManager instance for direct access (used by MCP resources)
   */
  getChainManager(): ChainManager {
    return this.chainManager;
  }

  /**
   * Get available tools metadata for MCP server
   */
  getToolsMetadata() {
    return [
      {
        name: 'decompose_problem',
        description: 'Break down complex problems into manageable sequential steps using cognitive patterns',
        inputSchema: {
          type: 'object' as const,
          properties: {
            problem_description: { 
              type: 'string', 
              description: 'Detailed description of the problem to solve',
              minLength: 10,
              maxLength: 5000
            },
            decomposition_strategy: { 
              type: 'string', 
              enum: ['top_down', 'bottom_up', 'divide_conquer', 'incremental', 'parallel', 'iterative'],
              description: 'Strategy for breaking down the problem (auto-selected if not provided)'
            },
            depth_limit: { 
              type: 'number', 
              minimum: 1, 
              maximum: 10, 
              default: 5,
              description: 'Maximum depth for problem decomposition'
            }
          },
          required: ['problem_description']
        }
      },
      {
        name: 'save_session',
        description: 'Save current reasoning session to persistent storage',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to save'
            },
            status: {
              type: 'string',
              enum: ['active', 'paused', 'completed', 'archived', 'failed'],
              description: 'Status to set for the session'
            },
            create_backup: {
              type: 'boolean',
              description: 'Whether to create a backup before saving',
              default: false
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'load_session',
        description: 'Load a previous reasoning session from persistent storage',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to load'
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'list_sessions',
        description: 'List saved reasoning sessions with filtering and sorting options',
        inputSchema: {
          type: 'object' as const,
          properties: {
            status: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['active', 'paused', 'completed', 'archived', 'failed']
              },
              description: 'Filter by session status'
            },
            strategy: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Filter by decomposition strategy'
            },
            date_range: {
              type: 'object',
              properties: {
                from: { type: 'number', description: 'Start timestamp' },
                to: { type: 'number', description: 'End timestamp' }
              },
              description: 'Filter by date range'
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Maximum number of sessions to return'
            },
            sort_by: {
              type: 'string',
              enum: ['createdAt', 'lastModified', 'strategy'],
              description: 'Field to sort by'
            },
            sort_order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order',
              default: 'desc'
            }
          }
        }
      },
      {
        name: 'resume_session',
        description: 'Resume a paused or saved reasoning session',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to resume'
            },
            continue_from_step: {
              type: 'number',
              minimum: 0,
              description: 'Step number to continue from (optional)'
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'archive_session',
        description: 'Archive a completed reasoning session',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to archive'
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'get_storage_stats',
        description: 'Get storage statistics and usage metrics',
        inputSchema: {
          type: 'object' as const,
          properties: {}
        }
      },
      {
        name: 'validate_session_health',
        description: 'Validate session health and get detailed health report with optional auto-repair',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to validate'
            },
            attempt_auto_repair: {
              type: 'boolean',
              description: 'Whether to attempt automatic repair of detected issues',
              default: false
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'recover_session',
        description: 'Recover a corrupted or failed session using multiple recovery strategies',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to recover'
            },
            error_type: {
              type: 'string',
              enum: ['corruption', 'missing_data', 'dependency_failure', 'validation_failure', 'timeout', 'unknown'],
              description: 'Type of error that caused the session failure',
              default: 'unknown'
            },
            max_attempts: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Maximum number of recovery attempts',
              default: 3
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'get_session_events',
        description: 'Retrieve session lifecycle events and event history with filtering',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the session to get events for (optional)'
            },
            event_type: {
              type: 'string',
              enum: [
                'session_created', 'session_loaded', 'session_saved', 'session_updated',
                'session_paused', 'session_resumed', 'session_completed', 'session_failed',
                'session_timeout', 'session_cleanup', 'session_recovered',
                'health_check_passed', 'health_check_failed', 'validation_warning',
                'recovery_started', 'recovery_completed', 'recovery_failed',
                'session_restoration_started', 'session_restoration_completed', 'session_restoration_failed'
              ],
              description: 'Type of events to filter by (optional)'
            },
            start_time: {
              type: 'number',
              description: 'Start timestamp for event filtering (optional)'
            },
            end_time: {
              type: 'number',
              description: 'End timestamp for event filtering (optional)'
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 1000,
              description: 'Maximum number of events to return',
              default: 100
            }
          }
        }
      },
      {
        name: 'get_event_metrics',
        description: 'Get comprehensive event system metrics and handler performance statistics',
        inputSchema: {
          type: 'object' as const,
          properties: {}
        }
      },
      {
        name: 'get_restoration_metrics',
        description: 'Get restoration system status and progressive restoration metrics',
        inputSchema: {
          type: 'object' as const,
          properties: {}
        }
      },
      {
        name: 'subscribe_to_events',
        description: 'Subscribe to session lifecycle events for real-time monitoring',
        inputSchema: {
          type: 'object' as const,
          properties: {
            event_types: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'session_created', 'session_loaded', 'session_saved', 'session_updated',
                  'session_paused', 'session_resumed', 'session_completed', 'session_failed',
                  'session_timeout', 'session_cleanup', 'session_recovered',
                  'health_check_passed', 'health_check_failed', 'validation_warning',
                  'recovery_started', 'recovery_completed', 'recovery_failed',
                  'session_restoration_started', 'session_restoration_completed', 'session_restoration_failed'
                ]
              },
              description: 'Array of event types to subscribe to',
              minItems: 1
            },
            priority: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Handler priority (higher = executed first)',
              default: 50
            },
            subscription_id: {
              type: 'string',
              description: 'Custom subscription ID (optional)'
            }
          },
          required: ['event_types']
        }
      },
      {
        name: 'unsubscribe_from_events',
        description: 'Unsubscribe from session lifecycle events',
        inputSchema: {
          type: 'object' as const,
          properties: {
            subscription_id: {
              type: 'string',
              description: 'ID of the subscription to cancel'
            }
          },
          required: ['subscription_id']
        }
      },
      {
        name: 'resolve_conflicts',
        description: 'Resolve state conflicts between multiple clients with intelligent conflict resolution',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to resolve conflicts for'
            },
            conflict_id: {
              type: 'string',
              description: 'Specific conflict ID to resolve (optional)'
            },
            force_resolve_all: {
              type: 'boolean',
              description: 'Force resolution of all pending conflicts',
              default: false
            }
          },
          required: ['session_id']
        }
      },
      {
        name: 'get_conflict_stats',
        description: 'Get comprehensive conflict resolution statistics and performance metrics',
        inputSchema: {
          type: 'object' as const,
          properties: {}
        }
      },
      {
        name: 'update_state_with_conflict_resolution',
        description: 'Update reasoning state with automatic conflict detection and resolution',
        inputSchema: {
          type: 'object' as const,
          properties: {
            session_id: {
              type: 'string',
              description: 'ID of the reasoning session to update'
            },
            client_id: {
              type: 'string',
              description: 'ID of the client making the update'
            },
            state_update: {
              type: 'object',
              description: 'Partial reasoning state update to apply'
            }
          },
          required: ['session_id', 'client_id', 'state_update']
        }
      }
    ];
  }
}