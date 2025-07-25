/**
 * Progressive Restoration Engine
 * 
 * Enhanced startup restoration with progressive loading, health checks,
 * prioritization, and comprehensive validation with fallback strategies.
 */

import type { ReasoningState } from '../types/index.js';
import type { SessionMetadata } from './state-storage-manager.js';
import type { SessionHealthReport } from './session-validator.js';
import type { RecoveryResult } from './session-recovery.js';
import { Logger } from '@em-cp2/shared';

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
  score: number; // Higher score = higher priority
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

export class ProgressiveRestoration {
  private logger: Logger;
  private config: RestorationConfig;
  private currentPlan?: RestorationPlan;
  private activeRestorations: Set<string>;

  constructor(
    private stateStorage: any,
    private sessionValidator: any,
    private sessionRecovery: any,
    private eventManager: any,
    config: Partial<RestorationConfig> = {}
  ) {
    this.logger = new Logger('ProgressiveRestoration');
    this.config = {
      enableProgressiveLoading: true,
      maxConcurrentRestorations: 3,
      healthScoreThreshold: 40,
      enablePrioritization: true,
      timeoutPerSessionMs: 30000,
      maxRetryAttempts: 2,
      retryDelayMs: 1000,
      enableDetailedReporting: true,
      ...config
    };
    
    this.activeRestorations = new Set();
  }

  /**
   * Execute progressive restoration of all active sessions
   */
  async restoreActiveSessions(): Promise<RestorationReport> {
    const startTime = Date.now();
    
    this.logger.info('Starting progressive session restoration');
    
    try {
      // Step 1: Create restoration plan
      const plan = await this.createRestorationPlan();
      this.currentPlan = plan;
      
      if (plan.totalSessions === 0) {
        this.logger.info('No sessions to restore');
        return this.createEmptyReport();
      }

      // Step 2: Execute restoration stages progressively
      const report = await this.executeRestorationPlan(plan);
      
      // Step 3: Generate detailed report
      const finalReport = this.finalizeReport(report, startTime);
      
      this.logger.info(`Progressive restoration completed: ${finalReport.successfulRestorations}/${finalReport.totalSessions} sessions restored in ${finalReport.totalTimeMs}ms`);
      
      return finalReport;
      
    } catch (error) {
      this.logger.error('Critical error during progressive restoration:', error);
      return this.createErrorReport(error, startTime);
    }
  }

  /**
   * Create a restoration plan with prioritization and staging
   */
  private async createRestorationPlan(): Promise<RestorationPlan> {
    // Load all sessions eligible for restoration
    const sessionList = await this.stateStorage.listSessions({
      status: ['active', 'paused'],
      sortBy: 'lastModified',
      sortOrder: 'desc'
    });

    if (!sessionList.success || !sessionList.sessions) {
      throw new Error('Failed to retrieve session list for restoration planning');
    }

    const sessions = sessionList.sessions;
    this.logger.info(`Planning restoration for ${sessions.length} sessions`);

    // Calculate priorities for each session
    const priorities = await this.calculatePriorities(sessions);
    
    // Create restoration stages based on priorities and configuration
    const stages = this.createRestorationStages(priorities);
    
    // Estimate total restoration time
    const estimatedTimeMs = this.estimateRestorationTime(stages);

    const plan: RestorationPlan = {
      totalSessions: sessions.length,
      stages,
      estimatedTimeMs,
      priorities,
      config: this.config
    };

    this.logger.info(`Created restoration plan: ${stages.length} stages, estimated ${estimatedTimeMs}ms`);
    return plan;
  }

  /**
   * Calculate restoration priorities for sessions
   */
  private async calculatePriorities(sessions: SessionMetadata[]): Promise<RestorationPriority[]> {
    const priorities: RestorationPriority[] = [];
    
    for (const session of sessions) {
      const factors = {
        lastActivity: this.calculateActivityScore(session.lastActivity),
        healthScore: 50, // Default, will be updated during quick health check
        complexity: this.calculateComplexityScore(session),
        dependencies: this.calculateDependencyScore(session),
        userPriority: this.calculateUserPriorityScore(session)
      };

      // Perform quick health assessment if possible
      try {
        const quickHealthResult = await this.performQuickHealthCheck(session.id);
        if (quickHealthResult) {
          factors.healthScore = quickHealthResult.healthScore;
        }
      } catch (error) {
        this.logger.debug(`Quick health check failed for session ${session.id}:`, error);
      }

      const totalScore = this.calculateTotalPriorityScore(factors);
      
      priorities.push({
        sessionId: session.id,
        score: totalScore,
        factors
      });
    }

    // Sort by priority score (descending)
    return priorities.sort((a, b) => b.score - a.score);
  }

  /**
   * Create restoration stages based on priorities and constraints
   */
  private createRestorationStages(priorities: RestorationPriority[]): RestorationStage[] {
    const stages: RestorationStage[] = [];
    
    if (!this.config.enableProgressiveLoading) {
      // Single stage restoration
      stages.push({
        name: 'bulk_restoration',
        description: 'Restore all sessions simultaneously',
        sessionIds: priorities.map(p => p.sessionId),
        status: 'pending',
        results: []
      });
      return stages;
    }

    // Create progressive stages
    const highPriority = priorities.filter(p => p.score >= 80);
    const mediumPriority = priorities.filter(p => p.score >= 50 && p.score < 80);
    const lowPriority = priorities.filter(p => p.score < 50);

    if (highPriority.length > 0) {
      stages.push({
        name: 'high_priority',
        description: 'Restore critical and high-priority sessions',
        sessionIds: highPriority.map(p => p.sessionId),
        status: 'pending',
        results: []
      });
    }

    if (mediumPriority.length > 0) {
      stages.push({
        name: 'medium_priority',
        description: 'Restore medium-priority sessions',
        sessionIds: mediumPriority.map(p => p.sessionId),
        status: 'pending',
        results: []
      });
    }

    if (lowPriority.length > 0) {
      stages.push({
        name: 'low_priority',
        description: 'Restore low-priority and background sessions',
        sessionIds: lowPriority.map(p => p.sessionId),
        status: 'pending',
        results: []
      });
    }

    return stages;
  }

  /**
   * Execute the restoration plan stage by stage
   */
  private async executeRestorationPlan(plan: RestorationPlan): Promise<RestorationReport> {
    const report: RestorationReport = {
      success: true,
      totalSessions: plan.totalSessions,
      successfulRestorations: 0,
      failedRestorations: 0,
      repairedSessions: 0,
      recoveredSessions: 0,
      totalTimeMs: 0,
      stages: plan.stages,
      healthDistribution: { healthy: 0, warning: 0, critical: 0, corrupted: 0 },
      strategies: { direct: 0, repair: 0, recovery: 0, fallback: 0 },
      errors: [],
      warnings: []
    };

    for (const stage of plan.stages) {
      await this.executeRestorationStage(stage, report);
      
      // Early termination if too many failures
      const failureRate = report.failedRestorations / (report.successfulRestorations + report.failedRestorations || 1);
      if (failureRate > 0.5 && report.failedRestorations > 5) {
        this.logger.warn(`High failure rate (${(failureRate * 100).toFixed(1)}%), stopping restoration`);
        report.success = false;
        report.errors.push('Restoration stopped due to high failure rate');
        break;
      }
    }

    return report;
  }

  /**
   * Execute a single restoration stage
   */
  private async executeRestorationStage(stage: RestorationStage, report: RestorationReport): Promise<void> {
    const stageStartTime = Date.now();
    stage.status = 'in_progress';
    stage.startTime = stageStartTime;
    
    this.logger.info(`Starting restoration stage: ${stage.name} (${stage.sessionIds.length} sessions)`);

    // Process sessions in batches to respect concurrency limits
    const batches = this.createBatches(stage.sessionIds, this.config.maxConcurrentRestorations);
    
    for (const batch of batches) {
      const batchPromises = batch.map(sessionId => this.restoreSingleSession(sessionId));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        const sessionId = batch[i];
        
        if (result.status === 'fulfilled' && result.value) {
          stage.results.push(result.value);
          this.updateReportWithResult(report, result.value);
        } else {
          const errorResult: RestorationResult = {
            sessionId,
            success: false,
            strategy: 'fallback',
            healthScore: 0,
            issues: [],
            warnings: [],
            executionTimeMs: 0,
            error: result.status === 'rejected' ? result.reason?.message : 'Unknown error'
          };
          stage.results.push(errorResult);
          this.updateReportWithResult(report, errorResult);
        }
      }
    }

    stage.endTime = Date.now();
    stage.status = stage.results.every(r => r.success) ? 'completed' : 'failed';
    
    const stageTime = stage.endTime - stageStartTime;
    this.logger.info(`Completed restoration stage: ${stage.name} in ${stageTime}ms (${stage.results.filter(r => r.success).length}/${stage.results.length} successful)`);
  }

  /**
   * Restore a single session with comprehensive error handling
   */
  private async restoreSingleSession(sessionId: string): Promise<RestorationResult> {
    const startTime = Date.now();
    this.activeRestorations.add(sessionId);
    
    try {
      // Emit restoration started event
      await this.eventManager.emit('session_restoration_started', sessionId, {
        restorationStrategy: 'progressive'
      }, { source: 'ProgressiveRestoration.restoreSingleSession' });

      // Step 1: Load session from storage
      const loadResult = await this.stateStorage.loadSession(sessionId);
      
      if (!loadResult.success || !loadResult.state) {
        throw new Error(`Failed to load session: ${loadResult.error}`);
      }

      // Step 2: Validate session health
      const healthReport = await this.sessionValidator.validateSession(
        loadResult.state,
        loadResult.metadata
      );

      let finalState = loadResult.state;
      let strategy: RestorationResult['strategy'] = 'direct';
      const issues: string[] = [];
      const warnings: string[] = [];

      // Step 3: Attempt repair if needed
      if (healthReport.healthScore < 80 && healthReport.canAutoRepair) {
        strategy = 'repair';
        const repairResult = await this.sessionValidator.repairSession(loadResult.state, healthReport);
        
        if (repairResult.success && repairResult.repairedState) {
          finalState = repairResult.repairedState;
          issues.push(...repairResult.repairedIssues);
          warnings.push(`Auto-repaired ${repairResult.repairedIssues.length} issues`);
        } else {
          warnings.push('Auto-repair failed, attempting recovery');
        }
      }

      // Step 4: Attempt recovery if session is corrupted
      if (healthReport.healthScore < this.config.healthScoreThreshold) {
        strategy = 'recovery';
        const recoveryResult = await this.sessionRecovery.recoverSession(
          sessionId,
          'corruption',
          {
            lastKnownState: loadResult.state,
            metadata: loadResult.metadata,
            healthReport,
            availableCheckpoints: loadResult.state?.checkpoints || []
          }
        );

        if (recoveryResult.success && recoveryResult.recoveredState) {
          finalState = recoveryResult.recoveredState;
          issues.push(...recoveryResult.issues);
          warnings.push(`Recovered using strategy: ${recoveryResult.strategy}`);
        } else {
          throw new Error(`Session recovery failed: ${recoveryResult.error}`);
        }
      }

      // Step 5: Final validation
      const finalHealthReport = await this.sessionValidator.validateSession(finalState);
      
      if (finalHealthReport.healthScore < this.config.healthScoreThreshold) {
        throw new Error(`Session health too low after restoration (${finalHealthReport.healthScore}/100)`);
      }

      const result: RestorationResult = {
        sessionId,
        success: true,
        strategy,
        healthScore: finalHealthReport.healthScore,
        restoredState: finalState,
        healthReport: finalHealthReport,
        issues,
        warnings,
        executionTimeMs: Date.now() - startTime
      };

      // Emit restoration completed event
      await this.eventManager.emit('session_restoration_completed', sessionId, {
        restorationResult: result,
        finalState
      }, { source: 'ProgressiveRestoration.restoreSingleSession' });

      return result;

    } catch (error) {
      const result: RestorationResult = {
        sessionId,
        success: false,
        strategy: 'fallback',
        healthScore: 0,
        issues: [],
        warnings: [],
        executionTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown restoration error'
      };

      // Emit restoration failed event
      await this.eventManager.emit('session_restoration_failed', sessionId, {
        restorationResult: result,
        error: result.error
      }, { source: 'ProgressiveRestoration.restoreSingleSession' });

      return result;
      
    } finally {
      this.activeRestorations.delete(sessionId);
    }
  }

  // Utility methods

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private calculateActivityScore(lastActivity: number): number {
    const now = Date.now();
    const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
    
    // Higher score for more recent activity
    if (hoursSinceActivity < 1) return 100;
    if (hoursSinceActivity < 6) return 80;
    if (hoursSinceActivity < 24) return 60;
    if (hoursSinceActivity < 168) return 40; // 1 week
    return 20;
  }

  private calculateComplexityScore(session: SessionMetadata): number {
    // Estimate complexity based on available metadata
    const stepCount = session.totalSteps || 1;
    if (stepCount > 20) return 80; // High complexity
    if (stepCount > 10) return 60; // Medium complexity
    return 40; // Low complexity
  }

  private calculateDependencyScore(_session: SessionMetadata): number {
    // Higher score for sessions with fewer dependencies (easier to restore)
    return 50; // Default score - would be enhanced with actual dependency analysis
  }

  private calculateUserPriorityScore(_session: SessionMetadata): number {
    // Default priority score - would be enhanced with actual priority analysis from metadata
    return 50;
  }

  private calculateTotalPriorityScore(factors: RestorationPriority['factors']): number {
    const weights = {
      lastActivity: 0.3,
      healthScore: 0.25,
      complexity: 0.15,
      dependencies: 0.15,
      userPriority: 0.15
    };

    return Math.round(
      factors.lastActivity * weights.lastActivity +
      factors.healthScore * weights.healthScore +
      factors.complexity * weights.complexity +
      factors.dependencies * weights.dependencies +
      factors.userPriority * weights.userPriority
    );
  }

  private estimateRestorationTime(stages: RestorationStage[]): number {
    // Rough estimation based on session count and stages
    const totalSessions = stages.reduce((sum, stage) => sum + stage.sessionIds.length, 0);
    const baseTimePerSession = 500; // 500ms per session
    const stageOverhead = stages.length * 100; // 100ms per stage
    return totalSessions * baseTimePerSession + stageOverhead;
  }

  private async performQuickHealthCheck(sessionId: string): Promise<{ healthScore: number } | null> {
    try {
      // Quick metadata-only health check
      const loadResult = await this.stateStorage.loadSession(sessionId);
      if (loadResult.success && loadResult.state) {
        // Basic health indicators
        const hasSteps = loadResult.state.steps && loadResult.state.steps.length > 0;
        const hasValidCurrentStep = loadResult.state.currentStep >= 0 && loadResult.state.currentStep <= loadResult.state.totalSteps;
        const hasValidTimestamp = loadResult.state.timestamp && loadResult.state.timestamp > 0;
        
        let score = 50; // Base score
        if (hasSteps) score += 20;
        if (hasValidCurrentStep) score += 20;
        if (hasValidTimestamp) score += 10;
        
        return { healthScore: Math.min(100, score) };
      }
    } catch (error) {
      // Quick check failed, return null
    }
    return null;
  }

  private updateReportWithResult(report: RestorationReport, result: RestorationResult): void {
    if (result.success) {
      report.successfulRestorations++;
      report.strategies[result.strategy]++;
      
      if (result.strategy === 'repair') report.repairedSessions++;
      if (result.strategy === 'recovery') report.recoveredSessions++;
      
      // Update health distribution
      if (result.healthScore >= 80) report.healthDistribution.healthy++;
      else if (result.healthScore >= 60) report.healthDistribution.warning++;
      else if (result.healthScore >= 40) report.healthDistribution.critical++;
      else report.healthDistribution.corrupted++;
      
    } else {
      report.failedRestorations++;
      if (result.error) report.errors.push(`${result.sessionId}: ${result.error}`);
    }
    
    report.warnings.push(...result.warnings);
  }

  private createEmptyReport(): RestorationReport {
    return {
      success: true,
      totalSessions: 0,
      successfulRestorations: 0,
      failedRestorations: 0,
      repairedSessions: 0,
      recoveredSessions: 0,
      totalTimeMs: 0,
      stages: [],
      healthDistribution: { healthy: 0, warning: 0, critical: 0, corrupted: 0 },
      strategies: { direct: 0, repair: 0, recovery: 0, fallback: 0 },
      errors: [],
      warnings: []
    };
  }

  private createErrorReport(error: any, startTime: number): RestorationReport {
    return {
      success: false,
      totalSessions: 0,
      successfulRestorations: 0,
      failedRestorations: 0,
      repairedSessions: 0,
      recoveredSessions: 0,
      totalTimeMs: Date.now() - startTime,
      stages: [],
      healthDistribution: { healthy: 0, warning: 0, critical: 0, corrupted: 0 },
      strategies: { direct: 0, repair: 0, recovery: 0, fallback: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown critical error'],
      warnings: []
    };
  }

  private finalizeReport(report: RestorationReport, startTime: number): RestorationReport {
    report.totalTimeMs = Date.now() - startTime;
    return report;
  }

  /**
   * Get current restoration status
   */
  getRestorationStatus(): {
    activeRestorations: number;
    currentPlan?: RestorationPlan;
  } {
    return {
      activeRestorations: this.activeRestorations.size,
      currentPlan: this.currentPlan
    };
  }
}