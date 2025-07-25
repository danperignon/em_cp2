/**
 * Step Generator
 * 
 * Generates ReasoningStep objects with comprehensive metadata,
 * confidence assessment, and dependency management.
 */

import type { ReasoningStep } from '../types/index.js';
import { Logger } from '@em-cp2/shared';
import { randomUUID } from 'crypto';

export interface StepCreateOptions {
  description: string;
  reasoning: string;
  index: number;
  dependencies?: string[];
  confidence?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status?: ReasoningStep['status'];
}

export class StepGenerator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('StepGenerator');
  }

  /**
   * Create a new reasoning step with full metadata
   */
  async createStep(options: StepCreateOptions): Promise<ReasoningStep> {
    const timestamp = Date.now();
    
    const step: ReasoningStep = {
      id: this.generateStepId(options.index),
      index: options.index,
      description: this.enhanceDescription(options.description),
      reasoning: this.enhanceReasoning(options.reasoning, options.description),
      status: options.status || 'pending',
      inputs: options.inputs || {},
      outputs: options.outputs || {},
      dependencies: options.dependencies || [],
      confidence: options.confidence || this.calculateDefaultConfidence(options),
      timestamp
    };

    // Add validation and enhancement
    await this.validateStep(step);
    this.enhanceStepMetadata(step);

    this.logger.debug(`Created step ${step.id}: "${step.description.substring(0, 50)}..."`);
    
    return step;
  }

  /**
   * Create multiple related steps with automatic dependency management
   */
  async createStepSequence(
    stepDescriptions: string[],
    baseOptions: Partial<StepCreateOptions> = {}
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];
    
    for (let i = 0; i < stepDescriptions.length; i++) {
      const dependencies = i > 0 ? [steps[i - 1].id] : [];
      
      const step = await this.createStep({
        description: stepDescriptions[i],
        reasoning: baseOptions.reasoning || 'Sequential step in problem solving chain',
        index: (baseOptions.index || 0) + i,
        dependencies,
        confidence: baseOptions.confidence || this.calculateSequenceConfidence(i, stepDescriptions.length),
        ...baseOptions
      });
      
      steps.push(step);
    }

    this.logger.info(`Created step sequence with ${steps.length} steps`);
    return steps;
  }

  /**
   * Create parallel steps that can execute concurrently
   */
  async createParallelSteps(
    stepDescriptions: string[],
    sharedDependencies: string[] = [],
    baseOptions: Partial<StepCreateOptions> = {}
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];
    
    for (let i = 0; i < stepDescriptions.length; i++) {
      const step = await this.createStep({
        description: stepDescriptions[i],
        reasoning: baseOptions.reasoning || 'Parallel step that can execute concurrently',
        index: (baseOptions.index || 0) + i,
        dependencies: sharedDependencies,
        confidence: baseOptions.confidence || 0.8, // Parallel steps often have good confidence
        ...baseOptions
      });
      
      steps.push(step);
    }

    this.logger.info(`Created ${steps.length} parallel steps`);
    return steps;
  }

  /**
   * Update an existing step with new information
   */
  async updateStep(
    step: ReasoningStep,
    updates: Partial<Pick<ReasoningStep, 'status' | 'outputs' | 'confidence' | 'errors' | 'duration'>>
  ): Promise<ReasoningStep> {
    const updatedStep: ReasoningStep = {
      ...step,
      ...updates
    };

    // Update timestamp when status changes
    if (updates.status && updates.status !== step.status) {
      if (updates.status === 'completed') {
        updatedStep.duration = Date.now() - step.timestamp;
      }
    }

    // Recalculate confidence if outputs were added
    if (updates.outputs && Object.keys(updates.outputs).length > 0) {
      updatedStep.confidence = this.recalculateConfidence(updatedStep);
    }

    this.logger.debug(`Updated step ${step.id} - status: ${updatedStep.status}, confidence: ${updatedStep.confidence}`);
    
    return updatedStep;
  }

  /**
   * Generate unique step ID
   */
  private generateStepId(index: number): string {
    const uuid = randomUUID();
    const shortId = uuid.substring(0, 8);
    return `step-${index.toString().padStart(2, '0')}-${shortId}`;
  }

  /**
   * Enhance step description with contextual information
   */
  private enhanceDescription(description: string): string {
    // Ensure description starts with action verb
    const actionVerbs = [
      'analyze', 'create', 'implement', 'design', 'test', 'validate', 
      'configure', 'setup', 'build', 'develop', 'research', 'evaluate'
    ];
    
    const firstWord = description.toLowerCase().split(' ')[0];
    if (!actionVerbs.includes(firstWord)) {
      // Add action context if missing
      if (description.toLowerCase().includes('problem')) {
        return `Analyze and ${description.toLowerCase()}`;
      } else if (description.toLowerCase().includes('solution')) {
        return `Implement ${description.toLowerCase()}`;
      } else {
        return `Execute: ${description}`;
      }
    }
    
    return description;
  }

  /**
   * Enhance reasoning with additional context
   */
  private enhanceReasoning(reasoning: string, description: string): string {
    const baseReasoning = reasoning;
    
    // Add contextual reasoning based on description patterns
    if (description.toLowerCase().includes('analyze')) {
      return `${baseReasoning}. This analysis step is crucial for understanding the problem space and informing subsequent decisions.`;
    } else if (description.toLowerCase().includes('implement') || description.toLowerCase().includes('create')) {
      return `${baseReasoning}. This implementation step translates planning into concrete actions and deliverables.`;
    } else if (description.toLowerCase().includes('test') || description.toLowerCase().includes('validate')) {
      return `${baseReasoning}. This validation step ensures quality and correctness before proceeding to dependent steps.`;
    }
    
    return baseReasoning;
  }

  /**
   * Calculate default confidence based on step characteristics
   */
  private calculateDefaultConfidence(options: StepCreateOptions): number {
    let confidence = 0.75; // Base confidence
    
    // Adjust based on description patterns
    const desc = options.description.toLowerCase();
    
    // Higher confidence for well-defined actions
    if (desc.includes('setup') || desc.includes('configure') || desc.includes('install')) {
      confidence += 0.1;
    }
    
    // Lower confidence for complex analysis or creative tasks
    if (desc.includes('analyze') || desc.includes('research') || desc.includes('design')) {
      confidence -= 0.05;
    }
    
    // Adjust based on dependencies
    if (options.dependencies && options.dependencies.length > 2) {
      confidence -= 0.05; // More dependencies = more complexity
    }
    
    // Adjust based on step position
    if (options.index === 0) {
      confidence += 0.05; // First steps often clearer
    }
    
    return Math.max(0.5, Math.min(0.95, confidence));
  }

  /**
   * Calculate confidence for steps in a sequence
   */
  private calculateSequenceConfidence(stepIndex: number, totalSteps: number): number {
    const baseConfidence = 0.8;
    const progressFactor = stepIndex / totalSteps;
    
    // Early steps in sequence tend to be more confident
    // Later steps may have more uncertainty
    return Math.max(0.6, baseConfidence - (progressFactor * 0.15));
  }

  /**
   * Recalculate confidence based on step completion
   */
  private recalculateConfidence(step: ReasoningStep): number {
    let confidence = step.confidence;
    
    // Boost confidence if step completed successfully
    if (step.status === 'completed' && Object.keys(step.outputs).length > 0) {
      confidence = Math.min(0.95, confidence + 0.1);
    }
    
    // Reduce confidence if errors occurred
    if (step.errors && step.errors.length > 0) {
      confidence = Math.max(0.3, confidence - (step.errors.length * 0.1));
    }
    
    // Adjust based on execution time (if available)
    if (step.duration) {
      const expectedDuration = 300000; // 5 minutes baseline
      if (step.duration > expectedDuration * 2) {
        confidence = Math.max(0.5, confidence - 0.1); // Took too long
      } else if (step.duration < expectedDuration * 0.5) {
        confidence = Math.min(0.9, confidence + 0.05); // Completed quickly
      }
    }
    
    return confidence;
  }

  /**
   * Validate step properties
   */
  private async validateStep(step: ReasoningStep): Promise<void> {
    // Check required properties
    if (!step.id || !step.description || !step.reasoning) {
      throw new Error('Step missing required properties');
    }
    
    // Validate confidence range
    if (step.confidence < 0 || step.confidence > 1) {
      throw new Error('Step confidence must be between 0 and 1');
    }
    
    // Validate status
    const validStatuses: ReasoningStep['status'][] = [
      'pending', 'in_progress', 'completed', 'failed', 'skipped'
    ];
    if (!validStatuses.includes(step.status)) {
      throw new Error(`Invalid step status: ${step.status}`);
    }
    
    // Validate index
    if (step.index < 0) {
      throw new Error('Step index must be non-negative');
    }
  }

  /**
   * Enhance step with additional metadata
   */
  private enhanceStepMetadata(step: ReasoningStep): void {
    // Add estimated duration based on description
    const estimatedDuration = this.estimateStepDuration(step.description);
    step.inputs = {
      ...step.inputs,
      estimatedDuration,
      complexity: this.assessStepComplexity(step.description),
      category: this.categorizeStep(step.description)
    };
  }

  /**
   * Estimate step duration in milliseconds
   */
  private estimateStepDuration(description: string): number {
    const desc = description.toLowerCase();
    
    // Base duration: 5 minutes
    let duration = 300000;
    
    // Adjust based on task type
    if (desc.includes('research') || desc.includes('analyze')) {
      duration *= 2; // Research takes longer
    } else if (desc.includes('setup') || desc.includes('configure')) {
      duration *= 0.5; // Setup is usually quick
    } else if (desc.includes('implement') || desc.includes('develop')) {
      duration *= 1.5; // Implementation takes time
    } else if (desc.includes('test') || desc.includes('validate')) {
      duration *= 0.8; // Testing is usually structured
    }
    
    return Math.round(duration);
  }

  /**
   * Assess step complexity
   */
  private assessStepComplexity(description: string): 'low' | 'medium' | 'high' {
    const desc = description.toLowerCase();
    
    // High complexity indicators
    const highComplexity = ['design', 'architect', 'integrate', 'optimize', 'analyze'];
    if (highComplexity.some(keyword => desc.includes(keyword))) {
      return 'high';
    }
    
    // Low complexity indicators
    const lowComplexity = ['setup', 'configure', 'install', 'copy', 'move'];
    if (lowComplexity.some(keyword => desc.includes(keyword))) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Categorize step by type
   */
  private categorizeStep(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('analyze') || desc.includes('research')) return 'analysis';
    if (desc.includes('design') || desc.includes('plan')) return 'planning';
    if (desc.includes('implement') || desc.includes('create') || desc.includes('build')) return 'implementation';
    if (desc.includes('test') || desc.includes('validate') || desc.includes('verify')) return 'validation';
    if (desc.includes('setup') || desc.includes('configure')) return 'setup';
    if (desc.includes('integrate') || desc.includes('combine')) return 'integration';
    
    return 'general';
  }
}