/**
 * Session Validator
 * 
 * Comprehensive validation engine for reasoning sessions that provides:
 * - Deep state consistency validation
 * - Corruption detection and repair
 * - Session health scoring
 * - Dependency validation
 */

import type { 
  ReasoningState,
  ReasoningStep
} from '../types/index.js';
import type { SessionMetadata } from './state-storage-manager.js';
import { Logger } from '@em-cp2/shared';

export interface SessionHealthReport {
  sessionId: string;
  healthScore: number; // 0-100
  status: 'healthy' | 'warning' | 'critical' | 'corrupted';
  issues: ValidationIssue[];
  recommendations: string[];
  canAutoRepair: boolean;
  lastValidationTime: number;
}

export interface ValidationIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'structure' | 'dependencies' | 'data' | 'consistency' | 'performance';
  code: string;
  message: string;
  location?: string;
  canRepair: boolean;
  repairAction?: string;
}

export interface ValidationConfig {
  enableDeepValidation: boolean;
  enableDependencyCheck: boolean;
  enableDataIntegrityCheck: boolean;
  enablePerformanceCheck: boolean;
  maxHealthScore: number;
  healthThresholds: {
    healthy: number;    // 80+
    warning: number;    // 60-79
    critical: number;   // 40-59
    corrupted: number;  // <40
  };
}

export class SessionValidator {
  private logger: Logger;
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.logger = new Logger('SessionValidator');
    this.config = {
      enableDeepValidation: true,
      enableDependencyCheck: true,
      enableDataIntegrityCheck: true,
      enablePerformanceCheck: true,
      maxHealthScore: 100,
      healthThresholds: {
        healthy: 80,
        warning: 60,
        critical: 40,
        corrupted: 0
      },
      ...config
    };
  }

  /**
   * Validate a complete reasoning session and generate health report
   */
  async validateSession(
    state: ReasoningState,
    metadata?: SessionMetadata
  ): Promise<SessionHealthReport> {
    const startTime = Date.now();
    const issues: ValidationIssue[] = [];

    try {
      this.logger.debug(`Starting validation for session ${state.id}`);

      // 1. Basic structure validation
      const structureIssues = this.validateStructure(state);
      issues.push(...structureIssues);

      // 2. Data integrity validation
      if (this.config.enableDataIntegrityCheck) {
        const dataIssues = this.validateDataIntegrity(state);
        issues.push(...dataIssues);
      }

      // 3. Dependency validation
      if (this.config.enableDependencyCheck) {
        const dependencyIssues = this.validateDependencies(state);
        issues.push(...dependencyIssues);
      }

      // 4. Consistency validation
      const consistencyIssues = this.validateConsistency(state, metadata);
      issues.push(...consistencyIssues);

      // 5. Performance validation
      if (this.config.enablePerformanceCheck) {
        const performanceIssues = this.validatePerformance(state);
        issues.push(...performanceIssues);
      }

      // 6. Deep validation (optional but comprehensive)
      if (this.config.enableDeepValidation) {
        const deepIssues = this.validateDeepStructure(state);
        issues.push(...deepIssues);
      }

      // Calculate health score and status
      const healthScore = this.calculateHealthScore(issues);
      const status = this.determineHealthStatus(healthScore);
      const recommendations = this.generateRecommendations(issues, healthScore);
      const canAutoRepair = issues.some(issue => issue.canRepair);

      const report: SessionHealthReport = {
        sessionId: state.id,
        healthScore,
        status,
        issues,
        recommendations,
        canAutoRepair,
        lastValidationTime: Date.now()
      };

      const duration = Date.now() - startTime;
      this.logger.info(`Session validation completed for ${state.id}: ${healthScore}/100 (${status}) - ${issues.length} issues found in ${duration}ms`);

      return report;

    } catch (error) {
      this.logger.error(`Error during session validation for ${state.id}:`, error);
      
      // Return a critical error report
      return {
        sessionId: state.id,
        healthScore: 0,
        status: 'corrupted',
        issues: [{
          severity: 'critical',
          category: 'structure',
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          canRepair: false
        }],
        recommendations: ['Session requires manual inspection and potential restoration from backup'],
        canAutoRepair: false,
        lastValidationTime: Date.now()
      };
    }
  }

  /**
   * Attempt to auto-repair issues found in validation
   */
  async repairSession(
    state: ReasoningState, 
    healthReport: SessionHealthReport
  ): Promise<{
    success: boolean;
    repairedState?: ReasoningState;
    repairedIssues: string[];
    remainingIssues: ValidationIssue[];
    error?: string;
  }> {
    try {
      const repairableIssues = healthReport.issues.filter(issue => issue.canRepair);
      
      if (repairableIssues.length === 0) {
        return {
          success: false,
          repairedIssues: [],
          remainingIssues: healthReport.issues,
          error: 'No repairable issues found'
        };
      }

      let repairedState = JSON.parse(JSON.stringify(state)); // Deep copy
      const repairedIssues: string[] = [];
      const remainingIssues: ValidationIssue[] = [];

      for (const issue of healthReport.issues) {
        if (issue.canRepair) {
          const repairResult = await this.repairIssue(repairedState, issue);
          if (repairResult.success) {
            repairedIssues.push(issue.code);
            if (repairResult.repairedState) {
              repairedState = repairResult.repairedState;
            }
          } else {
            remainingIssues.push(issue);
          }
        } else {
          remainingIssues.push(issue);
        }
      }

      this.logger.info(`Repair completed for session ${state.id}: ${repairedIssues.length} issues fixed, ${remainingIssues.length} remaining`);

      return {
        success: repairedIssues.length > 0,
        repairedState: repairedIssues.length > 0 ? repairedState : undefined,
        repairedIssues,
        remainingIssues
      };

    } catch (error) {
      this.logger.error(`Error during session repair for ${state.id}:`, error);
      return {
        success: false,
        repairedIssues: [],
        remainingIssues: healthReport.issues,
        error: error instanceof Error ? error.message : 'Unknown repair error'
      };
    }
  }

  // Validation methods

  private validateStructure(state: ReasoningState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check required fields
    if (!state.id) {
      issues.push({
        severity: 'critical',
        category: 'structure',
        code: 'MISSING_SESSION_ID',
        message: 'Session ID is missing',
        canRepair: true,
        repairAction: 'Generate new session ID'
      });
    }

    if (!state.problem) {
      issues.push({
        severity: 'critical',
        category: 'structure', 
        code: 'MISSING_PROBLEM_DEFINITION',
        message: 'Problem definition is missing',
        canRepair: false
      });
    }

    if (!state.steps || !Array.isArray(state.steps)) {
      issues.push({
        severity: 'critical',
        category: 'structure',
        code: 'MISSING_OR_INVALID_STEPS',
        message: 'Steps array is missing or invalid',
        canRepair: false
      });
    }

    if (!state.strategy) {
      issues.push({
        severity: 'error',
        category: 'structure',
        code: 'MISSING_STRATEGY',
        message: 'Strategy information is missing',
        canRepair: true,
        repairAction: 'Set default strategy'
      });
    }

    // Check numeric fields
    if (typeof state.currentStep !== 'number' || state.currentStep < 0) {
      issues.push({
        severity: 'error',
        category: 'structure',
        code: 'INVALID_CURRENT_STEP',
        message: 'Current step index is invalid',
        canRepair: true,
        repairAction: 'Reset current step to valid index'
      });
    }

    if (typeof state.totalSteps !== 'number' || state.totalSteps <= 0) {
      issues.push({
        severity: 'error',
        category: 'structure',
        code: 'INVALID_TOTAL_STEPS',
        message: 'Total steps count is invalid',
        canRepair: true,
        repairAction: 'Recalculate total steps from steps array'
      });
    }

    return issues;
  }

  private validateDataIntegrity(state: ReasoningState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate steps array integrity
    if (state.steps && Array.isArray(state.steps)) {
      for (let i = 0; i < state.steps.length; i++) {
        const step = state.steps[i];
        
        if (!step.id) {
          issues.push({
            severity: 'error',
            category: 'data',
            code: 'MISSING_STEP_ID',
            message: `Step ${i + 1} is missing an ID`,
            location: `steps[${i}]`,
            canRepair: true,
            repairAction: 'Generate unique step ID'
          });
        }

        if (!step.description || step.description.trim().length === 0) {
          issues.push({
            severity: 'warning',
            category: 'data',
            code: 'EMPTY_STEP_DESCRIPTION',
            message: `Step ${i + 1} has empty description`,
            location: `steps[${i}].description`,
            canRepair: true,
            repairAction: 'Generate default description'
          });
        }

        if (typeof step.confidence !== 'number' || step.confidence < 0 || step.confidence > 1) {
          issues.push({
            severity: 'warning',
            category: 'data',
            code: 'INVALID_STEP_CONFIDENCE',
            message: `Step ${i + 1} has invalid confidence value`,
            location: `steps[${i}].confidence`,
            canRepair: true,
            repairAction: 'Set default confidence value'
          });
        }

        if (step.index !== i) {
          issues.push({
            severity: 'warning',
            category: 'data',
            code: 'STEP_INDEX_MISMATCH',
            message: `Step ${i + 1} has incorrect index value`,
            location: `steps[${i}].index`,
            canRepair: true,
            repairAction: 'Correct step index'
          });
        }
      }
    }

    // Validate checkpoints
    if (state.checkpoints && Array.isArray(state.checkpoints)) {
      for (let i = 0; i < state.checkpoints.length; i++) {
        const checkpoint = state.checkpoints[i];
        
        if (!checkpoint.id) {
          issues.push({
            severity: 'warning',
            category: 'data',
            code: 'MISSING_CHECKPOINT_ID',
            message: `Checkpoint ${i + 1} is missing an ID`,
            location: `checkpoints[${i}]`,
            canRepair: true,
            repairAction: 'Generate unique checkpoint ID'
          });
        }

        if (typeof checkpoint.timestamp !== 'number') {
          issues.push({
            severity: 'warning',
            category: 'data',
            code: 'INVALID_CHECKPOINT_TIMESTAMP',
            message: `Checkpoint ${i + 1} has invalid timestamp`,
            location: `checkpoints[${i}].timestamp`,
            canRepair: true,
            repairAction: 'Set current timestamp'
          });
        }
      }
    }

    return issues;
  }

  private validateDependencies(state: ReasoningState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!state.steps || !Array.isArray(state.steps)) {
      return issues; // Can't validate dependencies without steps
    }

    const stepIds = new Set(state.steps.map(s => s.id).filter(Boolean));

    for (let i = 0; i < state.steps.length; i++) {
      const step = state.steps[i];
      
      if (step.dependencies && Array.isArray(step.dependencies)) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            issues.push({
              severity: 'error',
              category: 'dependencies',
              code: 'INVALID_DEPENDENCY',
              message: `Step ${i + 1} has invalid dependency: ${depId}`,
              location: `steps[${i}].dependencies`,
              canRepair: true,
              repairAction: 'Remove invalid dependency'
            });
          }

          // Check for circular dependencies
          if (this.hasCircularDependency(state.steps, step.id, depId)) {
            issues.push({
              severity: 'critical',
              category: 'dependencies',
              code: 'CIRCULAR_DEPENDENCY',
              message: `Circular dependency detected between steps`,
              location: `steps[${i}].dependencies`,
              canRepair: true,
              repairAction: 'Remove circular dependency'
            });
          }
        }
      }
    }

    return issues;
  }

  private validateConsistency(state: ReasoningState, metadata?: SessionMetadata): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check step count consistency
    if (state.steps && state.totalSteps !== state.steps.length) {
      issues.push({
        severity: 'warning',
        category: 'consistency',
        code: 'STEP_COUNT_MISMATCH',
        message: `Total steps (${state.totalSteps}) doesn't match steps array length (${state.steps.length})`,
        canRepair: true,
        repairAction: 'Update total steps count'
      });
    }

    // Check current step bounds
    if (state.currentStep > state.totalSteps) {
      issues.push({
        severity: 'error',
        category: 'consistency',
        code: 'CURRENT_STEP_OUT_OF_BOUNDS',
        message: `Current step (${state.currentStep}) exceeds total steps (${state.totalSteps})`,
        canRepair: true,
        repairAction: 'Reset current step to valid range'
      });
    }

    // Check metadata consistency
    if (metadata) {
      if (metadata.id !== state.id) {
        issues.push({
          severity: 'warning',
          category: 'consistency',
          code: 'METADATA_ID_MISMATCH',
          message: 'Session ID mismatch between state and metadata',
          canRepair: true,
          repairAction: 'Update metadata ID'
        });
      }

      if (metadata.totalSteps !== state.totalSteps) {
        issues.push({
          severity: 'info',
          category: 'consistency', 
          code: 'METADATA_STEPS_MISMATCH',
          message: 'Total steps mismatch between state and metadata',
          canRepair: true,
          repairAction: 'Update metadata step count'
        });
      }
    }

    return issues;
  }

  private validatePerformance(state: ReasoningState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for excessive steps
    if (state.steps && state.steps.length > 50) {
      issues.push({
        severity: 'warning',
        category: 'performance',
        code: 'EXCESSIVE_STEPS',
        message: `Session has ${state.steps.length} steps, which may impact performance`,
        canRepair: false
      });
    }

    // Check for excessive checkpoints
    if (state.checkpoints && state.checkpoints.length > 20) {
      issues.push({
        severity: 'info',
        category: 'performance',
        code: 'EXCESSIVE_CHECKPOINTS',
        message: `Session has ${state.checkpoints.length} checkpoints, consider cleanup`,
        canRepair: true,
        repairAction: 'Remove old checkpoints'
      });
    }

    // Check for large step data
    if (state.steps) {
      for (let i = 0; i < state.steps.length; i++) {
        const step = state.steps[i];
        const stepDataSize = JSON.stringify(step).length;
        
        if (stepDataSize > 10000) { // 10KB threshold
          issues.push({
            severity: 'warning',
            category: 'performance',
            code: 'LARGE_STEP_DATA',
            message: `Step ${i + 1} has large data size (${Math.round(stepDataSize / 1024)}KB)`,
            location: `steps[${i}]`,
            canRepair: false
          });
        }
      }
    }

    return issues;
  }

  private validateDeepStructure(state: ReasoningState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Deep validation of problem definition
    if (state.problem) {
      if (!state.problem.description || state.problem.description.trim().length < 10) {
        issues.push({
          severity: 'warning',
          category: 'structure',
          code: 'INSUFFICIENT_PROBLEM_DESCRIPTION',
          message: 'Problem description is too short or missing',
          location: 'problem.description',
          canRepair: false
        });
      }

      if (!state.problem.domain) {
        issues.push({
          severity: 'info',
          category: 'structure',
          code: 'MISSING_PROBLEM_DOMAIN',
          message: 'Problem domain is not specified',
          location: 'problem.domain',
          canRepair: true,
          repairAction: 'Set default domain'
        });
      }
    }

    // Deep validation of strategy
    if (state.strategy) {
      if (!state.strategy.type) {
        issues.push({
          severity: 'warning',
          category: 'structure',
          code: 'MISSING_STRATEGY_TYPE',
          message: 'Strategy type is not specified',
          location: 'strategy.type',
          canRepair: true,
          repairAction: 'Set default strategy type'
        });
      }
    }

    return issues;
  }

  // Helper methods

  private hasCircularDependency(steps: ReasoningStep[], stepId: string, depId: string, visited: Set<string> = new Set()): boolean {
    if (visited.has(depId)) {
      return depId === stepId;
    }

    visited.add(depId);
    
    const depStep = steps.find(s => s.id === depId);
    if (!depStep || !depStep.dependencies) {
      return false;
    }

    for (const nextDep of depStep.dependencies) {
      if (this.hasCircularDependency(steps, stepId, nextDep, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private calculateHealthScore(issues: ValidationIssue[]): number {
    let score = this.config.maxHealthScore;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    }

    return Math.max(0, Math.min(this.config.maxHealthScore, score));
  }

  private determineHealthStatus(healthScore: number): SessionHealthReport['status'] {
    if (healthScore >= this.config.healthThresholds.healthy) {
      return 'healthy';
    } else if (healthScore >= this.config.healthThresholds.warning) {
      return 'warning';
    } else if (healthScore >= this.config.healthThresholds.critical) {
      return 'critical';
    } else {
      return 'corrupted';
    }
  }

  private generateRecommendations(issues: ValidationIssue[], healthScore: number): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const errorIssues = issues.filter(i => i.severity === 'error');
    const repairableIssues = issues.filter(i => i.canRepair);

    if (criticalIssues.length > 0) {
      recommendations.push('Address critical issues immediately to prevent session corruption');
    }

    if (errorIssues.length > 0) {
      recommendations.push('Fix error-level issues to improve session reliability');
    }

    if (repairableIssues.length > 0) {
      recommendations.push(`${repairableIssues.length} issues can be automatically repaired`);
    }

    if (healthScore < this.config.healthThresholds.critical) {
      recommendations.push('Consider restoring from a recent backup due to poor session health');
    } else if (healthScore < this.config.healthThresholds.warning) {
      recommendations.push('Monitor session closely and consider manual intervention');
    }

    const performanceIssues = issues.filter(i => i.category === 'performance');
    if (performanceIssues.length > 0) {
      recommendations.push('Optimize session structure to improve performance');
    }

    return recommendations;
  }

  private async repairIssue(
    state: ReasoningState, 
    issue: ValidationIssue
  ): Promise<{
    success: boolean;
    repairedState?: ReasoningState;
    error?: string;
  }> {
    try {
      switch (issue.code) {
        case 'MISSING_SESSION_ID':
          state.id = `repaired-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          return { success: true, repairedState: state };

        case 'MISSING_STRATEGY':
          state.strategy = {
            name: 'top_down',
            type: 'hierarchical',
            parameters: {},
            adaptationTriggers: [],
            performanceMetrics: {
              accuracy: 0,
              efficiency: 0,
              completionRate: 0,
              averageConfidence: 0
            }
          };
          return { success: true, repairedState: state };

        case 'INVALID_CURRENT_STEP':
          state.currentStep = Math.max(0, Math.min(state.currentStep, state.totalSteps));
          return { success: true, repairedState: state };

        case 'INVALID_TOTAL_STEPS':
          state.totalSteps = state.steps ? state.steps.length : 0;
          return { success: true, repairedState: state };

        case 'STEP_COUNT_MISMATCH':
          state.totalSteps = state.steps ? state.steps.length : 0;
          return { success: true, repairedState: state };

        case 'MISSING_STEP_ID':
          const stepIndex = parseInt(issue.location?.match(/\[(\d+)\]/)?.[1] || '0');
          if (state.steps && state.steps[stepIndex]) {
            state.steps[stepIndex].id = `step-${stepIndex}-${Date.now()}`;
          }
          return { success: true, repairedState: state };

        case 'STEP_INDEX_MISMATCH':
          if (state.steps) {
            state.steps.forEach((step, index) => {
              step.index = index;
            });
          }
          return { success: true, repairedState: state };

        case 'INVALID_STEP_CONFIDENCE':
          const stepIdx = parseInt(issue.location?.match(/\[(\d+)\]/)?.[1] || '0');
          if (state.steps && state.steps[stepIdx]) {
            state.steps[stepIdx].confidence = 0.5; // Default confidence
          }
          return { success: true, repairedState: state };

        case 'INVALID_DEPENDENCY':
          const depStepIdx = parseInt(issue.location?.match(/\[(\d+)\]/)?.[1] || '0');
          if (state.steps && state.steps[depStepIdx] && state.steps[depStepIdx].dependencies) {
            // Remove invalid dependencies
            const invalidDep = issue.message.match(/dependency: (.+)$/)?.[1];
            if (invalidDep) {
              state.steps[depStepIdx].dependencies = state.steps[depStepIdx].dependencies.filter(
                dep => dep !== invalidDep
              );
            }
          }
          return { success: true, repairedState: state };

        default:
          return { success: false, error: `No repair handler for issue: ${issue.code}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown repair error' 
      };
    }
  }
}