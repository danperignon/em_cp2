/**
 * Core Decomposition Engine
 * Focused implementation of problem decomposition logic
 */

import type { Problem, DecompositionStrategy, ReasoningStep, DecompositionResult } from './types.js';
import { selectStrategy } from './strategies.js';
import { Logger } from '@em-cp2/shared';

export class DecompositionEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DecompositionEngine');
  }

  /**
   * Main decomposition method - breaks down a problem into steps
   */
  async decompose(
    problemDescription: string,
    strategy?: DecompositionStrategy,
    depthLimit: number = 4
  ): Promise<DecompositionResult> {
    const startTime = Date.now();

    // Analyze the problem
    const problem = this.analyzeProblem(problemDescription);
    
    // Select strategy if not provided
    const selectedStrategy = strategy || selectStrategy(problem);
    
    // Generate reasoning steps
    const steps = await this.generateSteps(problem, selectedStrategy, depthLimit);
    
    // Build result
    const result: DecompositionResult = {
      problem,
      strategy: {
        name: selectedStrategy,
        reasoning: this.getStrategyReasoning(selectedStrategy, problem)
      },
      steps,
      metadata: {
        duration: Date.now() - startTime,
        stepCount: steps.length
      }
    };

    this.logger.info(`Decomposed problem into ${steps.length} steps using ${selectedStrategy} strategy`);
    return result;
  }

  /**
   * Analyze problem to determine type and complexity
   */
  private analyzeProblem(description: string): Problem {
    const lowerDesc = description.toLowerCase();
    
    // Simple heuristics for problem type detection
    let type: Problem['type'] = 'analytical';
    if (lowerDesc.includes('create') || lowerDesc.includes('design') || lowerDesc.includes('build')) {
      type = 'creative';
    } else if (lowerDesc.includes('setup') || lowerDesc.includes('configure') || lowerDesc.includes('install')) {
      type = 'procedural';
    } else if (lowerDesc.includes('optimize') || lowerDesc.includes('improve') || lowerDesc.includes('performance')) {
      type = 'optimization';
    }

    // Simple complexity estimation based on description length and keywords
    const complexity = description.length > 200 || 
                      lowerDesc.includes('complex') || 
                      lowerDesc.includes('multiple') ? 'high' : 
                      description.length > 100 ? 'medium' : 'low';

    return {
      description,
      type,
      complexity
    };
  }

  /**
   * Generate reasoning steps based on strategy
   */
  private async generateSteps(
    problem: Problem,
    strategy: DecompositionStrategy,
    depthLimit: number
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];
    
    // Initial understanding step
    steps.push(this.createStep(
      0,
      'Understand the problem requirements',
      'First, we need to fully understand what is being asked',
      0.95,
      []
    ));

    // Strategy-specific step generation
    switch (strategy) {
      case 'top_down':
        this.addTopDownSteps(steps, problem, depthLimit);
        break;
      case 'bottom_up':
        this.addBottomUpSteps(steps, problem, depthLimit);
        break;
      case 'divide_conquer':
        this.addDivideConquerSteps(steps, problem, depthLimit);
        break;
      case 'incremental':
        this.addIncrementalSteps(steps, problem, depthLimit);
        break;
      case 'parallel':
        this.addParallelSteps(steps, problem, depthLimit);
        break;
      case 'iterative':
        this.addIterativeSteps(steps, problem, depthLimit);
        break;
    }

    // Final validation step
    steps.push(this.createStep(
      steps.length,
      'Validate the solution',
      'Ensure all requirements have been met',
      0.9,
      [steps[steps.length - 1].id]
    ));

    return steps;
  }

  /**
   * Create a reasoning step
   */
  private createStep(
    index: number,
    description: string,
    reasoning: string,
    confidence: number,
    dependencies: string[]
  ): ReasoningStep {
    return {
      id: `step-${index}`,
      index,
      description,
      reasoning,
      confidence,
      dependencies
    };
  }

  /**
   * Get human-readable reasoning for strategy selection
   */
  private getStrategyReasoning(strategy: DecompositionStrategy, problem: Problem): string {
    const reasoningMap = {
      top_down: `Using top-down approach for this ${problem.type} problem to start with high-level goals and refine details`,
      bottom_up: `Using bottom-up approach to build from fundamental components toward the complete solution`,
      divide_conquer: `Using divide & conquer to split this ${problem.complexity} complexity problem into independent sub-problems`,
      incremental: `Using incremental approach for step-by-step implementation with continuous validation`,
      parallel: `Using parallel approach to identify tasks that can be executed simultaneously`,
      iterative: `Using iterative approach to refine the solution through multiple improvement cycles`
    };
    return reasoningMap[strategy];
  }

  // Strategy-specific step generation methods
  private addTopDownSteps(steps: ReasoningStep[], _problem: Problem, depthLimit: number): void {
    const baseId = steps[steps.length - 1].id;
    
    // Level 1: Main objectives
    steps.push(this.createStep(
      steps.length,
      'Define main objectives and success criteria',
      'Establish clear goals before diving into implementation',
      0.9,
      [baseId]
    ));

    // Level 2: Major components
    steps.push(this.createStep(
      steps.length,
      'Identify major components or modules',
      'Break down the solution into logical components',
      0.85,
      [steps[steps.length - 1].id]
    ));

    // Level 3: Implementation details
    if (depthLimit > 2) {
      steps.push(this.createStep(
        steps.length,
        'Detail implementation for each component',
        'Define specific implementation steps for components',
        0.8,
        [steps[steps.length - 1].id]
      ));
    }
  }

  private addBottomUpSteps(steps: ReasoningStep[], _problem: Problem, _depthLimit: number): void {
    const baseId = steps[steps.length - 1].id;
    
    steps.push(this.createStep(
      steps.length,
      'Identify fundamental building blocks',
      'Start with the smallest, most basic components',
      0.9,
      [baseId]
    ));

    steps.push(this.createStep(
      steps.length,
      'Implement basic components',
      'Build the foundational elements first',
      0.85,
      [steps[steps.length - 1].id]
    ));

    steps.push(this.createStep(
      steps.length,
      'Combine components into larger modules',
      'Integrate basic components to form complex functionality',
      0.8,
      [steps[steps.length - 1].id]
    ));
  }

  private addDivideConquerSteps(steps: ReasoningStep[], _problem: Problem, _depthLimit: number): void {
    const baseId = steps[steps.length - 1].id;
    
    steps.push(this.createStep(
      steps.length,
      'Identify independent sub-problems',
      'Find parts that can be solved separately',
      0.9,
      [baseId]
    ));

    steps.push(this.createStep(
      steps.length,
      'Solve each sub-problem independently',
      'Work on each part without dependencies on others',
      0.85,
      [steps[steps.length - 1].id]
    ));

    steps.push(this.createStep(
      steps.length,
      'Integrate sub-solutions',
      'Combine individual solutions into complete system',
      0.8,
      [steps[steps.length - 1].id]
    ));
  }

  private addIncrementalSteps(steps: ReasoningStep[], _problem: Problem, _depthLimit: number): void {
    const baseId = steps[steps.length - 1].id;
    
    steps.push(this.createStep(
      steps.length,
      'Create minimal working version',
      'Start with the simplest possible implementation',
      0.9,
      [baseId]
    ));

    steps.push(this.createStep(
      steps.length,
      'Add features incrementally',
      'Enhance functionality one feature at a time',
      0.85,
      [steps[steps.length - 1].id]
    ));

    steps.push(this.createStep(
      steps.length,
      'Test and validate each increment',
      'Ensure each addition maintains system stability',
      0.85,
      [steps[steps.length - 1].id]
    ));
  }

  private addParallelSteps(steps: ReasoningStep[], _problem: Problem, _depthLimit: number): void {
    const baseId = steps[steps.length - 1].id;
    
    steps.push(this.createStep(
      steps.length,
      'Identify parallelizable tasks',
      'Find tasks that can be executed simultaneously',
      0.9,
      [baseId]
    ));

    // Create parallel branches
    const parallelBase = steps[steps.length - 1].id;
    steps.push(this.createStep(
      steps.length,
      'Execute parallel workstreams',
      'Run independent tasks concurrently',
      0.85,
      [parallelBase]
    ));

    steps.push(this.createStep(
      steps.length,
      'Synchronize and merge results',
      'Combine outputs from parallel executions',
      0.8,
      [steps[steps.length - 1].id]
    ));
  }

  private addIterativeSteps(steps: ReasoningStep[], _problem: Problem, _depthLimit: number): void {
    const baseId = steps[steps.length - 1].id;
    
    steps.push(this.createStep(
      steps.length,
      'Create initial prototype',
      'Build a basic version to iterate upon',
      0.9,
      [baseId]
    ));

    steps.push(this.createStep(
      steps.length,
      'Gather feedback and identify improvements',
      'Analyze what works and what needs enhancement',
      0.85,
      [steps[steps.length - 1].id]
    ));

    steps.push(this.createStep(
      steps.length,
      'Implement improvements and repeat',
      'Apply enhancements and continue iteration cycle',
      0.85,
      [steps[steps.length - 1].id]
    ));
  }
}