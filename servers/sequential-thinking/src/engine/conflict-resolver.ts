/**
 * Conflict Resolution Engine
 * 
 * Handles simultaneous state modifications from multiple clients with
 * intelligent conflict detection, resolution strategies, and state merging.
 */

import { Logger } from '@em-cp2/shared';
import type { ReasoningState } from '../types/index.js';
import type { SessionEventManager } from './session-events.js';

export interface StateConflict {
  conflictId: string;
  sessionId: string;
  conflictType: 'concurrent_modification' | 'step_overlap' | 'state_divergence' | 'lock_violation';
  clientA: string;
  clientB: string;
  stateA: Partial<ReasoningState>;
  stateB: Partial<ReasoningState>;
  baseState: Partial<ReasoningState>;
  detectedAt: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedFields: string[];
  metadata?: Record<string, unknown>;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: 'merge' | 'client_priority' | 'timestamp_based' | 'manual_intervention' | 'rollback';
  resolvedState: ReasoningState;
  resolvedAt: number;
  resolutionConfidence: number;
  appliedChanges: Array<{
    field: string;
    action: 'keep_a' | 'keep_b' | 'merge' | 'discard';
    reason: string;
  }>;
  requiresReview: boolean;
  metadata?: Record<string, unknown>;
}

export interface ConflictDetectionOptions {
  enableFieldLevelDetection: boolean;
  enableSemanticAnalysis: boolean;
  conflictThreshold: number;
  prioritizeByTimestamp: boolean;
  prioritizeByClientType: boolean;
  allowAutomaticResolution: boolean;
  maxResolutionAttempts: number;
}

export interface ConflictResolutionStats {
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  resolutionSuccessRate: number;
  averageResolutionTime: number;
  conflictsByType: Map<string, number>;
  resolutionsByStrategy: Map<string, number>;
  lastConflictTime: number;
}

export class ConflictResolver {
  private logger: Logger;
  private eventManager: SessionEventManager;
  private options: ConflictDetectionOptions;
  private activeConflicts: Map<string, StateConflict>;
  private resolutionHistory: ConflictResolution[];
  private stats: ConflictResolutionStats;

  constructor(
    eventManager: SessionEventManager,
    options: Partial<ConflictDetectionOptions> = {}
  ) {
    this.logger = new Logger('ConflictResolver');
    this.eventManager = eventManager;
    this.options = {
      enableFieldLevelDetection: true,
      enableSemanticAnalysis: true,
      conflictThreshold: 0.3,
      prioritizeByTimestamp: true,
      prioritizeByClientType: false,
      allowAutomaticResolution: true,
      maxResolutionAttempts: 3,
      ...options
    };

    this.activeConflicts = new Map();
    this.resolutionHistory = [];
    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      pendingConflicts: 0,
      resolutionSuccessRate: 0,
      averageResolutionTime: 0,
      conflictsByType: new Map(),
      resolutionsByStrategy: new Map(),
      lastConflictTime: 0
    };

    this.logger.info('ConflictResolver initialized with intelligent resolution strategies');
  }

  /**
   * Detect conflicts between two state modifications
   */
  async detectConflicts(
    sessionId: string,
    clientA: string,
    stateA: Partial<ReasoningState>,
    clientB: string,
    stateB: Partial<ReasoningState>,
    baseState: Partial<ReasoningState>
  ): Promise<StateConflict[]> {
    try {
      const conflicts: StateConflict[] = [];

      // Field-level conflict detection
      if (this.options.enableFieldLevelDetection) {
        const fieldConflicts = this.detectFieldConflicts(
          sessionId, clientA, stateA, clientB, stateB, baseState
        );
        conflicts.push(...fieldConflicts);
      }

      // Semantic conflict detection
      if (this.options.enableSemanticAnalysis) {
        const semanticConflicts = await this.detectSemanticConflicts(
          sessionId, clientA, stateA, clientB, stateB, baseState
        );
        conflicts.push(...semanticConflicts);
      }

      // Update statistics
      this.stats.totalConflicts += conflicts.length;
      this.stats.pendingConflicts += conflicts.length;
      this.stats.lastConflictTime = Date.now();

      // Store conflicts and emit events
      for (const conflict of conflicts) {
        this.activeConflicts.set(conflict.conflictId, conflict);
        
        const typeCount = this.stats.conflictsByType.get(conflict.conflictType) || 0;
        this.stats.conflictsByType.set(conflict.conflictType, typeCount + 1);

        await this.eventManager.emit('lock_conflict', sessionId, {
          clientId: clientA,
          lockType: 'write',
          reason: `Conflict detected with client ${clientB}: ${conflict.conflictType}`,
          lockId: conflict.conflictId
        });
      }

      if (conflicts.length > 0) {
        this.logger.warn(`Detected ${conflicts.length} conflicts in session ${sessionId} between clients ${clientA} and ${clientB}`);
      }

      return conflicts;

    } catch (error) {
      this.logger.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve a specific conflict using the most appropriate strategy
   */
  async resolveConflict(conflictId: string): Promise<{
    success: boolean;
    resolution?: ConflictResolution;
    error?: string;
  }> {
    try {
      const conflict = this.activeConflicts.get(conflictId);
      if (!conflict) {
        return {
          success: false,
          error: `Conflict ${conflictId} not found`
        };
      }

      const startTime = Date.now();
      
      // Determine resolution strategy
      const strategy = this.selectResolutionStrategy(conflict);
      
      // Apply resolution strategy
      const resolution = await this.applyResolutionStrategy(conflict, strategy);
      
      if (resolution) {
        // Calculate resolution time
        const resolutionTime = Date.now() - startTime;
        
        // Update statistics
        this.stats.resolvedConflicts++;
        this.stats.pendingConflicts--;
        this.stats.resolutionSuccessRate = this.stats.resolvedConflicts / this.stats.totalConflicts;
        
        const avgTime = this.stats.averageResolutionTime;
        const totalResolved = this.stats.resolvedConflicts;
        this.stats.averageResolutionTime = (avgTime * (totalResolved - 1) + resolutionTime) / totalResolved;
        
        const strategyCount = this.stats.resolutionsByStrategy.get(strategy) || 0;
        this.stats.resolutionsByStrategy.set(strategy, strategyCount + 1);

        // Store resolution and remove from active conflicts
        this.resolutionHistory.push(resolution);
        this.activeConflicts.delete(conflictId);

        // Emit resolution event
        await this.eventManager.emit('lock_conflict', conflict.sessionId, {
          lockId: conflictId,
          reason: `Conflict resolved using ${strategy} strategy`,
          processedQueue: true
        });

        this.logger.info(`Resolved conflict ${conflictId} using ${strategy} strategy in ${resolutionTime}ms`);

        return {
          success: true,
          resolution
        };
      } else {
        return {
          success: false,
          error: 'Failed to generate resolution'
        };
      }

    } catch (error) {
      this.logger.error(`Error resolving conflict ${conflictId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve all pending conflicts for a session
   */
  async resolveAllConflicts(sessionId: string): Promise<{
    success: boolean;
    resolvedCount: number;
    failedCount: number;
    resolutions: ConflictResolution[];
    errors: string[];
  }> {
    const sessionConflicts = Array.from(this.activeConflicts.values())
      .filter(conflict => conflict.sessionId === sessionId);

    const resolutions: ConflictResolution[] = [];
    const errors: string[] = [];
    let resolvedCount = 0;
    let failedCount = 0;

    this.logger.info(`Resolving ${sessionConflicts.length} conflicts for session ${sessionId}`);

    for (const conflict of sessionConflicts) {
      const result = await this.resolveConflict(conflict.conflictId);
      
      if (result.success && result.resolution) {
        resolutions.push(result.resolution);
        resolvedCount++;
      } else {
        errors.push(result.error || 'Unknown resolution error');
        failedCount++;
      }
    }

    return {
      success: resolvedCount > 0,
      resolvedCount,
      failedCount,
      resolutions,
      errors
    };
  }

  /**
   * Get conflict resolution statistics
   */
  getConflictStats(): ConflictResolutionStats {
    return {
      ...this.stats,
      conflictsByType: new Map(this.stats.conflictsByType),
      resolutionsByStrategy: new Map(this.stats.resolutionsByStrategy)
    };
  }

  /**
   * Get active conflicts for a session
   */
  getActiveConflicts(sessionId?: string): StateConflict[] {
    const conflicts = Array.from(this.activeConflicts.values());
    return sessionId 
      ? conflicts.filter(conflict => conflict.sessionId === sessionId)
      : conflicts;
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(limit?: number): ConflictResolution[] {
    const history = [...this.resolutionHistory]
      .sort((a, b) => b.resolvedAt - a.resolvedAt);
    
    return limit ? history.slice(0, limit) : history;
  }

  // Private methods

  private detectFieldConflicts(
    sessionId: string,
    clientA: string,
    stateA: Partial<ReasoningState>,
    clientB: string,
    stateB: Partial<ReasoningState>,
    baseState: Partial<ReasoningState>
  ): StateConflict[] {
    const conflicts: StateConflict[] = [];
    const affectedFields: string[] = [];

    // Check for direct field conflicts
    const fieldsA = Object.keys(stateA);
    const fieldsB = Object.keys(stateB);
    const commonFields = fieldsA.filter(field => fieldsB.includes(field));

    for (const field of commonFields) {
      const valueA = (stateA as any)[field];
      const valueB = (stateB as any)[field];
      const baseValue = (baseState as any)[field];

      // Detect modification conflicts
      if (!this.deepEqual(valueA, valueB)) {
        const conflictSeverity = this.assessConflictSeverity(field, valueA, valueB, baseValue);
        
        if (conflictSeverity !== 'low' || !this.options.allowAutomaticResolution) {
          affectedFields.push(field);
        }
      }
    }

    if (affectedFields.length > 0) {
      const conflict: StateConflict = {
        conflictId: this.generateConflictId(),
        sessionId,
        conflictType: 'concurrent_modification',
        clientA,
        clientB,
        stateA,
        stateB,
        baseState,
        detectedAt: Date.now(),
        severity: this.calculateOverallSeverity(affectedFields),
        affectedFields,
        metadata: {
          fieldCount: affectedFields.length,
          detectionMethod: 'field_level'
        }
      };

      conflicts.push(conflict);
    }

    return conflicts;
  }

  private async detectSemanticConflicts(
    sessionId: string,
    clientA: string,
    stateA: Partial<ReasoningState>,
    clientB: string,
    stateB: Partial<ReasoningState>,
    baseState: Partial<ReasoningState>
  ): Promise<StateConflict[]> {
    const conflicts: StateConflict[] = [];

    try {
      // Check for step execution conflicts
      const stepConflict = this.detectStepExecutionConflicts(
        sessionId, clientA, stateA, clientB, stateB, baseState
      );
      if (stepConflict) {
        conflicts.push(stepConflict);
      }

      // Check for state divergence
      const divergenceConflict = this.detectStateDivergence(
        sessionId, clientA, stateA, clientB, stateB, baseState
      );
      if (divergenceConflict) {
        conflicts.push(divergenceConflict);
      }

    } catch (error) {
      this.logger.warn('Error in semantic conflict detection:', error);
    }

    return conflicts;
  }

  private detectStepExecutionConflicts(
    sessionId: string,
    clientA: string,
    stateA: Partial<ReasoningState>,
    clientB: string,
    stateB: Partial<ReasoningState>,
    baseState: Partial<ReasoningState>
  ): StateConflict | null {
    // Check if both clients are trying to execute different steps
    const currentStepA = stateA.currentStep;
    const currentStepB = stateB.currentStep;
    const baseCurrentStep = baseState.currentStep;

    if (currentStepA !== undefined && currentStepB !== undefined && 
        currentStepA !== currentStepB && currentStepA !== baseCurrentStep && currentStepB !== baseCurrentStep) {
      
      return {
        conflictId: this.generateConflictId(),
        sessionId,
        conflictType: 'step_overlap',
        clientA,
        clientB,
        stateA,
        stateB,
        baseState,
        detectedAt: Date.now(),
        severity: 'high',
        affectedFields: ['currentStep', 'reasoningSteps'],
        metadata: {
          stepA: currentStepA,
          stepB: currentStepB,
          baseStep: baseCurrentStep,
          detectionMethod: 'step_execution'
        }
      };
    }

    return null;
  }

  private detectStateDivergence(
    sessionId: string,
    clientA: string,
    stateA: Partial<ReasoningState>,
    clientB: string,
    stateB: Partial<ReasoningState>,
    baseState: Partial<ReasoningState>
  ): StateConflict | null {
    // Calculate state similarity
    const similarityA = this.calculateStateSimilarity(stateA, baseState);
    const similarityB = this.calculateStateSimilarity(stateB, baseState);
    const crossSimilarity = this.calculateStateSimilarity(stateA, stateB);

    // If states have diverged significantly from base and from each other
    if (similarityA < this.options.conflictThreshold && 
        similarityB < this.options.conflictThreshold && 
        crossSimilarity < this.options.conflictThreshold) {
      
      return {
        conflictId: this.generateConflictId(),
        sessionId,
        conflictType: 'state_divergence',
        clientA,
        clientB,
        stateA,
        stateB,
        baseState,
        detectedAt: Date.now(),
        severity: 'medium',
        affectedFields: ['entire_state'],
        metadata: {
          similarityA,
          similarityB,
          crossSimilarity,
          threshold: this.options.conflictThreshold,
          detectionMethod: 'state_divergence'
        }
      };
    }

    return null;
  }

  private selectResolutionStrategy(conflict: StateConflict): ConflictResolution['strategy'] {
    // Priority-based strategy selection
    switch (conflict.severity) {
      case 'critical':
        return 'manual_intervention';
      
      case 'high':
        if (conflict.conflictType === 'step_overlap') {
          return this.options.prioritizeByTimestamp ? 'timestamp_based' : 'client_priority';
        }
        return 'manual_intervention';
      
      case 'medium':
        if (this.options.allowAutomaticResolution) {
          return conflict.conflictType === 'state_divergence' ? 'merge' : 'timestamp_based';
        }
        return 'manual_intervention';
      
      case 'low':
        return this.options.allowAutomaticResolution ? 'merge' : 'timestamp_based';
      
      default:
        return 'timestamp_based';
    }
  }

  private async applyResolutionStrategy(
    conflict: StateConflict,
    strategy: ConflictResolution['strategy']
  ): Promise<ConflictResolution | null> {
    const baseResolution: Partial<ConflictResolution> = {
      conflictId: conflict.conflictId,
      strategy,
      resolvedAt: Date.now(),
      appliedChanges: [],
      requiresReview: false,
      metadata: {}
    };

    try {
      switch (strategy) {
        case 'merge':
          return await this.applyMergeStrategy(conflict, baseResolution);
        
        case 'timestamp_based':
          return await this.applyTimestampStrategy(conflict, baseResolution);
        
        case 'client_priority':
          return await this.applyClientPriorityStrategy(conflict, baseResolution);
        
        case 'rollback':
          return await this.applyRollbackStrategy(conflict, baseResolution);
        
        case 'manual_intervention':
          return await this.flagForManualIntervention(conflict, baseResolution);
        
        default:
          this.logger.warn(`Unknown resolution strategy: ${strategy}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Error applying ${strategy} strategy:`, error);
      return null;
    }
  }

  private async applyMergeStrategy(
    conflict: StateConflict,
    baseResolution: Partial<ConflictResolution>
  ): Promise<ConflictResolution> {
    // Intelligent field merging
    const mergedState = { ...conflict.baseState };
    const appliedChanges: ConflictResolution['appliedChanges'] = [];

    for (const field of conflict.affectedFields) {
      const valueA = (conflict.stateA as any)[field];
      const valueB = (conflict.stateB as any)[field];
      const baseValue = (conflict.baseState as any)[field];

      // Merge logic based on field type and content
      if (Array.isArray(valueA) && Array.isArray(valueB)) {
        // Merge arrays by combining unique elements
        (mergedState as any)[field] = [...new Set([...valueA, ...valueB])];
        appliedChanges.push({
          field,
          action: 'merge',
          reason: 'Combined array elements from both clients'
        });
      } else if (typeof valueA === 'object' && typeof valueB === 'object') {
        // Deep merge objects
        (mergedState as any)[field] = { ...valueA, ...valueB };
        appliedChanges.push({
          field,
          action: 'merge',
          reason: 'Deep merged object properties'
        });
      } else {
        // For primitive conflicts, prefer the most recent change
        const useA = this.shouldPreferClientA(conflict, field);
        (mergedState as any)[field] = useA ? valueA : valueB;
        appliedChanges.push({
          field,
          action: useA ? 'keep_a' : 'keep_b',
          reason: useA ? 'Client A had more recent timestamp' : 'Client B had more recent timestamp'
        });
      }
    }

    return {
      ...baseResolution,
      resolvedState: mergedState as ReasoningState,
      resolutionConfidence: 0.8,
      appliedChanges,
      requiresReview: conflict.severity === 'high'
    } as ConflictResolution;
  }

  private async applyTimestampStrategy(
    conflict: StateConflict,
    baseResolution: Partial<ConflictResolution>
  ): Promise<ConflictResolution> {
    // Use the state from the client with the most recent timestamp
    const timestampA = (conflict.stateA as any).timestamp || conflict.stateA.lastModified || 0;
    const timestampB = (conflict.stateB as any).timestamp || conflict.stateB.lastModified || 0;
    
    const useStateA = timestampA > timestampB;
    const selectedState = useStateA ? conflict.stateA : conflict.stateB;
    const selectedClient = useStateA ? conflict.clientA : conflict.clientB;

    const appliedChanges: ConflictResolution['appliedChanges'] = conflict.affectedFields.map(field => ({
      field,
      action: useStateA ? 'keep_a' : 'keep_b',
      reason: `Selected ${selectedClient} due to more recent timestamp (${useStateA ? timestampA : timestampB})`
    }));

    return {
      ...baseResolution,
      resolvedState: { ...conflict.baseState, ...selectedState } as ReasoningState,
      resolutionConfidence: 0.9,
      appliedChanges,
      requiresReview: false
    } as ConflictResolution;
  }

  private async applyClientPriorityStrategy(
    conflict: StateConflict,
    baseResolution: Partial<ConflictResolution>
  ): Promise<ConflictResolution> {
    // Prioritize based on client type (admin > write > read)
    const priorityA = this.getClientPriority(conflict.clientA);
    const priorityB = this.getClientPriority(conflict.clientB);
    
    const useStateA = priorityA >= priorityB;
    const selectedState = useStateA ? conflict.stateA : conflict.stateB;
    const selectedClient = useStateA ? conflict.clientA : conflict.clientB;

    const appliedChanges: ConflictResolution['appliedChanges'] = conflict.affectedFields.map(field => ({
      field,
      action: useStateA ? 'keep_a' : 'keep_b',
      reason: `Selected ${selectedClient} due to higher client priority`
    }));

    return {
      ...baseResolution,
      resolvedState: { ...conflict.baseState, ...selectedState } as ReasoningState,
      resolutionConfidence: 0.7,
      appliedChanges,
      requiresReview: true
    } as ConflictResolution;
  }

  private async applyRollbackStrategy(
    conflict: StateConflict,
    baseResolution: Partial<ConflictResolution>
  ): Promise<ConflictResolution> {
    // Rollback to base state
    const appliedChanges: ConflictResolution['appliedChanges'] = conflict.affectedFields.map(field => ({
      field,
      action: 'discard',
      reason: 'Rolled back to base state due to irreconcilable conflict'
    }));

    return {
      ...baseResolution,
      resolvedState: conflict.baseState as ReasoningState,
      resolutionConfidence: 1.0,
      appliedChanges,
      requiresReview: true,
      metadata: {
        rollbackReason: 'Irreconcilable conflict between clients',
        affectedClients: [conflict.clientA, conflict.clientB]
      }
    } as ConflictResolution;
  }

  private async flagForManualIntervention(
    conflict: StateConflict,
    baseResolution: Partial<ConflictResolution>
  ): Promise<ConflictResolution> {
    // Flag for manual review without automatic resolution
    return {
      ...baseResolution,
      resolvedState: conflict.baseState as ReasoningState,
      resolutionConfidence: 0.0,
      appliedChanges: [],
      requiresReview: true,
      metadata: {
        interventionReason: 'Critical conflict requires manual resolution',
        conflictSeverity: conflict.severity,
        recommendedAction: 'Review conflict details and manually merge states'
      }
    } as ConflictResolution;
  }

  // Utility methods

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private assessConflictSeverity(
    field: string,
    _valueA: any,
    _valueB: any,
    _baseValue: any
  ): StateConflict['severity'] {
    // Critical fields that require manual intervention
    const criticalFields = ['currentStepIndex', 'status', 'totalSteps'];
    if (criticalFields.includes(field)) {
      return 'critical';
    }

    // High-impact fields
    const highImpactFields = ['reasoningSteps', 'problemDefinition', 'strategy'];
    if (highImpactFields.includes(field)) {
      return 'high';
    }

    // Medium-impact fields
    const mediumImpactFields = ['metadata', 'qualityMetrics'];
    if (mediumImpactFields.includes(field)) {
      return 'medium';
    }

    return 'low';
  }

  private calculateOverallSeverity(affectedFields: string[]): StateConflict['severity'] {
    const severities = affectedFields.map(field => 
      this.assessConflictSeverity(field, null, null, null)
    );

    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private calculateStateSimilarity(stateA: Partial<ReasoningState>, stateB: Partial<ReasoningState>): number {
    // Simple similarity calculation based on common fields
    const fieldsA = Object.keys(stateA);
    const fieldsB = Object.keys(stateB);
    const commonFields = fieldsA.filter(field => fieldsB.includes(field));
    
    if (commonFields.length === 0) return 0;

    let matchingFields = 0;
    for (const field of commonFields) {
      if (this.deepEqual((stateA as any)[field], (stateB as any)[field])) {
        matchingFields++;
      }
    }

    return matchingFields / commonFields.length;
  }

  private shouldPreferClientA(conflict: StateConflict, field: string): boolean {
    // Simple heuristic: prefer based on timestamp
    const timestampA = (conflict.stateA as any).timestamp || conflict.stateA.lastModified || 0;
    const timestampB = (conflict.stateB as any).timestamp || conflict.stateB.lastModified || 0;
    return timestampA >= timestampB;
  }

  private getClientPriority(clientId: string): number {
    // Simple priority system - in real implementation, this would query client access levels
    if (clientId.includes('admin')) return 3;
    if (clientId.includes('write')) return 2;
    return 1;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}