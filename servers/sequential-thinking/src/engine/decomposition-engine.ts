/**
 * Decomposition Engine
 * 
 * Core engine that implements 6 different problem decomposition strategies
 * based on cognitive science and problem-solving research.
 */

import type { 
  ProblemDefinition,
  ReasoningStep,
  DecompositionStrategy,
  DecompositionOptions
} from '../types/index.js';
import { StepGenerator } from './step-generator.js';
import { Logger } from '@em-cp2/shared';

export class DecompositionEngine {
  private logger: Logger;
  private stepGenerator: StepGenerator;

  constructor() {
    this.logger = new Logger('DecompositionEngine');
    this.stepGenerator = new StepGenerator();
  }

  /**
   * Decompose a problem using the specified strategy
   */
  async decompose(
    problem: ProblemDefinition,
    strategy: DecompositionStrategy,
    options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    this.logger.info(`Decomposing problem using ${strategy} strategy`);

    let steps: ReasoningStep[] = [];

    switch (strategy) {
      case 'top_down':
        steps = await this.topDownDecomposition(problem, options);
        break;
      case 'bottom_up':
        steps = await this.bottomUpDecomposition(problem, options);
        break;
      case 'divide_conquer':
        steps = await this.divideConquerDecomposition(problem, options);
        break;
      case 'incremental':
        steps = await this.incrementalDecomposition(problem, options);
        break;
      case 'parallel':
        steps = await this.parallelDecomposition(problem, options);
        break;
      case 'iterative':
        steps = await this.iterativeDecomposition(problem, options);
        break;
      default:
        throw new Error(`Unknown decomposition strategy: ${strategy}`);
    }

    // Post-process steps
    steps = await this.postProcessSteps(steps, options);

    this.logger.info(`Decomposition complete: ${steps.length} steps generated`);
    return steps;
  }

  /**
   * Top-Down Decomposition: Start broad, refine details hierarchically
   */
  private async topDownDecomposition(
    problem: ProblemDefinition,
    options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Level 1: High-level goals
    const mainGoal = await this.stepGenerator.createStep({
      description: `Define main objective: ${problem.goalState}`,
      reasoning: 'Establish clear understanding of what needs to be achieved',
      index: 0,
      confidence: 0.9
    });
    steps.push(mainGoal);

    // Level 2: Major sub-goals
    const subGoals = this.identifySubGoals(problem);
    for (let i = 0; i < subGoals.length; i++) {
      const step = await this.stepGenerator.createStep({
        description: `Sub-goal ${i + 1}: ${subGoals[i]}`,
        reasoning: `Break down main objective into manageable component`,
        index: steps.length,
        dependencies: [mainGoal.id],
        confidence: 0.8
      });
      steps.push(step);
    }

    // Level 3+: Detailed tasks (recursive breakdown)  
    if (options.maxDepth > 2) {
      const detailSteps = await this.createDetailedTasks(subGoals, steps, options.maxDepth - 2);
      steps.push(...detailSteps);
    }

    return steps;
  }

  /**
   * Bottom-Up Decomposition: Build from atomic components upward
   */
  private async bottomUpDecomposition(
    problem: ProblemDefinition,
    options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Level 1: Identify atomic actions
    const atomicActions = this.identifyAtomicActions(problem);
    for (let i = 0; i < atomicActions.length; i++) {
      const step = await this.stepGenerator.createStep({
        description: `Atomic action: ${atomicActions[i]}`,
        reasoning: 'Fundamental action that cannot be broken down further',
        index: i,
        confidence: 0.85
      });
      steps.push(step);
    }

    // Level 2: Group into logical components  
    let componentSteps: ReasoningStep[] = [];
    if (options.validation) {
      componentSteps = await this.groupIntoComponents(atomicActions, steps);
      steps.push(...componentSteps);
    }

    // Level 3: Integrate components into solution
    const integrationStep = await this.stepGenerator.createStep({
      description: 'Integrate all components to achieve the goal',
      reasoning: 'Combine individual components into complete solution',
      index: steps.length,
      dependencies: componentSteps.length > 0 ? componentSteps.map(s => s.id) : steps.slice(-2).map(s => s.id),
      confidence: 0.9
    });
    steps.push(integrationStep);

    return steps;
  }

  /**
   * Divide & Conquer: Split into independent subproblems
   */
  private async divideConquerDecomposition(
    problem: ProblemDefinition,
    _options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Step 1: Analyze problem for independent parts
    const analysisStep = await this.stepGenerator.createStep({
      description: 'Analyze problem to identify independent subproblems',
      reasoning: 'Find parts that can be solved separately without interdependencies',
      index: 0,
      confidence: 0.8
    });
    steps.push(analysisStep);

    // Step 2: Identify subproblems
    const subproblems = this.identifySubproblems(problem);
    const subproblemSteps: ReasoningStep[] = [];

    for (let i = 0; i < subproblems.length; i++) {
      const step = await this.stepGenerator.createStep({
        description: `Solve subproblem ${i + 1}: ${subproblems[i]}`,
        reasoning: 'Independent subproblem that can be solved in isolation',
        index: steps.length,
        dependencies: [analysisStep.id],
        confidence: 0.85
      });
      subproblemSteps.push(step);
      steps.push(step);
    }

    // Step 3: Combine solutions
    const combineStep = await this.stepGenerator.createStep({
      description: 'Combine solutions from all subproblems',
      reasoning: 'Integrate independent solutions into complete solution',
      index: steps.length,
      dependencies: subproblemSteps.map(s => s.id),
      confidence: 0.9
    });
    steps.push(combineStep);

    return steps;
  }

  /**
   * Incremental Decomposition: Progressive step-by-step elaboration
   */
  private async incrementalDecomposition(
    _problem: ProblemDefinition,
    options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Create sequential steps that build on each other
    const baseStep = await this.stepGenerator.createStep({
      description: 'Establish foundation and initial setup',
      reasoning: 'Create the basic framework for the solution',
      index: 0,
      confidence: 0.9
    });
    steps.push(baseStep);

    // Generate incremental steps
    const incrementalSteps = this.generateIncrementalSteps(_problem, options.maxSteps - 2);
    let previousStep = baseStep;

    for (let i = 0; i < incrementalSteps.length; i++) {
      const step = await this.stepGenerator.createStep({
        description: incrementalSteps[i],
        reasoning: `Build incrementally on previous step to add functionality`,
        index: steps.length,
        dependencies: [previousStep.id],
        confidence: 0.8
      });
      steps.push(step);
      previousStep = step;
    }

    // Final validation step
    const validationStep = await this.stepGenerator.createStep({
      description: 'Validate complete solution meets all requirements',
      reasoning: 'Ensure the incrementally built solution satisfies the goal state',
      index: steps.length,
      dependencies: [previousStep.id],
      confidence: 0.85
    });
    steps.push(validationStep);

    return steps;
  }

  /**
   * Parallel Decomposition: Identify concurrent workstreams
   */
  private async parallelDecomposition(
    problem: ProblemDefinition,
    _options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Step 1: Planning phase
    const planningStep = await this.stepGenerator.createStep({
      description: 'Plan parallel workstreams and identify dependencies',
      reasoning: 'Organize work to maximize parallelism while respecting dependencies',
      index: 0,
      confidence: 0.85
    });
    steps.push(planningStep);

    // Step 2: Identify parallel workstreams
    const workstreams = this.identifyParallelWorkstreams(problem);
    const workstreamSteps: ReasoningStep[] = [];

    for (let i = 0; i < workstreams.length; i++) {
      const step = await this.stepGenerator.createStep({
        description: `Parallel workstream ${i + 1}: ${workstreams[i]}`,
        reasoning: 'Independent workstream that can execute concurrently',
        index: steps.length,
        dependencies: [planningStep.id],
        confidence: 0.8
      });
      workstreamSteps.push(step);
      steps.push(step);
    }

    // Step 3: Synchronization points
    const syncPoints = this.identifySynchronizationPoints(workstreams);
    for (const syncPoint of syncPoints) {
      const step = await this.stepGenerator.createStep({
        description: `Synchronization: ${syncPoint}`,
        reasoning: 'Coordinate between parallel workstreams',
        index: steps.length,
        dependencies: workstreamSteps.map(s => s.id),
        confidence: 0.9
      });
      steps.push(step);
    }

    return steps;
  }

  /**
   * Iterative Decomposition: Refine solution through improvement cycles
   */
  private async iterativeDecomposition(
    _problem: ProblemDefinition,
    options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];

    // Initial prototype
    const prototypeStep = await this.stepGenerator.createStep({
      description: 'Create initial prototype or basic solution',
      reasoning: 'Start with simple version to validate approach',
      index: 0,
      confidence: 0.7
    });
    steps.push(prototypeStep);

    // Iterative cycles
    const iterations = Math.min(3, Math.floor(options.maxSteps / 3));
    let previousStep = prototypeStep;

    for (let i = 1; i <= iterations; i++) {
      // Evaluate current iteration
      const evaluateStep = await this.stepGenerator.createStep({
        description: `Iteration ${i}: Evaluate current solution`,
        reasoning: 'Assess current solution and identify improvement opportunities',
        index: steps.length,
        dependencies: [previousStep.id],
        confidence: 0.8
      });
      steps.push(evaluateStep);

      // Improve based on evaluation
      const improveStep = await this.stepGenerator.createStep({
        description: `Iteration ${i}: Implement improvements`,
        reasoning: 'Apply identified improvements to enhance the solution',
        index: steps.length,
        dependencies: [evaluateStep.id],
        confidence: 0.85
      });
      steps.push(improveStep);

      previousStep = improveStep;
    }

    // Final validation
    const finalStep = await this.stepGenerator.createStep({
      description: 'Final validation and optimization',
      reasoning: 'Ensure final solution meets all requirements',
      index: steps.length,
      dependencies: [previousStep.id],
      confidence: 0.9
    });
    steps.push(finalStep);

    return steps;
  }

  // Helper methods for decomposition strategies

  private identifySubGoals(problem: ProblemDefinition): string[] {
    const subGoals: string[] = [];
    const description = problem.description.toLowerCase();

    // Generic sub-goals based on problem type
    if (description.includes('build') || description.includes('create')) {
      subGoals.push('Design the solution architecture');
      subGoals.push('Implement core functionality');
      subGoals.push('Test and validate the solution');
    } else if (description.includes('fix') || description.includes('debug')) {
      subGoals.push('Identify the root cause');
      subGoals.push('Develop a fix strategy');
      subGoals.push('Implement and test the fix');
    } else if (description.includes('analyze') || description.includes('understand')) {
      subGoals.push('Gather relevant information');
      subGoals.push('Analyze and interpret data');
      subGoals.push('Draw conclusions and recommendations');
    } else {
      // Generic breakdown
      subGoals.push('Understand the requirements');
      subGoals.push('Plan the approach');
      subGoals.push('Execute the solution');
      subGoals.push('Validate the results');
    }

    return subGoals.slice(0, Math.min(4, subGoals.length));
  }

  private identifyAtomicActions(_problem: ProblemDefinition): string[] {
    // Basic atomic actions that most problems require
    return [
      'Collect necessary information',
      'Set up working environment',
      'Identify required resources',
      'Create basic structure',
      'Implement core logic',
      'Perform testing',
      'Document the solution'
    ];
  }

  private identifySubproblems(problem: ProblemDefinition): string[] {
    const description = problem.description.toLowerCase();
    const subproblems: string[] = [];

    // Look for natural divisions in the problem
    if (description.includes('and')) {
      // Split on "and" to find multiple requirements
      const parts = problem.description.split(/\s+and\s+/i);
      parts.forEach((part, index) => {
        if (index > 0 && part.trim().length > 10) {
          subproblems.push(part.trim());
        }
      });
    }

    // Add common subproblems if none identified
    if (subproblems.length === 0) {
      subproblems.push('Data processing component');
      subproblems.push('User interface component');
      subproblems.push('Integration component');
    }

    return subproblems.slice(0, 3); // Max 3 subproblems
  }

  private generateIncrementalSteps(_problem: ProblemDefinition, maxSteps: number): string[] {
    const baseActions = [
      'Implement basic functionality',
      'Add error handling',
      'Enhance user experience',
      'Optimize performance',
      'Add advanced features',
      'Implement security measures',
      'Add monitoring and logging'
    ];

    return baseActions.slice(0, Math.min(maxSteps, baseActions.length));
  }

  private identifyParallelWorkstreams(_problem: ProblemDefinition): string[] {
    return [
      'Frontend development workstream',
      'Backend development workstream',
      'Database design workstream',
      'Testing and quality assurance workstream'
    ];
  }

  private identifySynchronizationPoints(_workstreams: string[]): string[] {
    return [
      'Integration checkpoint',
      'End-to-end testing synchronization'
    ];
  }

  private async createDetailedTasks(
    subGoals: string[],
    existingSteps: ReasoningStep[],
    remainingDepth: number
  ): Promise<ReasoningStep[]> {
    if (remainingDepth <= 0) return [];

    const detailSteps: ReasoningStep[] = [];
    const subGoalSteps = existingSteps.slice(-subGoals.length);

    for (let i = 0; i < subGoalSteps.length; i++) {
      const tasks = [`Detailed task 1 for: ${subGoals[i]}`, `Detailed task 2 for: ${subGoals[i]}`];
      
      for (const task of tasks) {
        const step = await this.stepGenerator.createStep({
          description: task,
          reasoning: 'Detailed implementation task',
          index: existingSteps.length + detailSteps.length,
          dependencies: [subGoalSteps[i].id],
          confidence: 0.75
        });
        detailSteps.push(step);
      }
    }

    return detailSteps;
  }

  private async groupIntoComponents(
    _atomicActions: string[],
    atomicSteps: ReasoningStep[]
  ): Promise<ReasoningStep[]> {
    const componentSteps: ReasoningStep[] = [];
    
    // Group atomic actions into logical components
    const setupComponent = await this.stepGenerator.createStep({
      description: 'Setup and preparation component',
      reasoning: 'Group setup-related atomic actions',
      index: atomicSteps.length,
      dependencies: atomicSteps.slice(0, 3).map(s => s.id),
      confidence: 0.8
    });
    componentSteps.push(setupComponent);

    const implementationComponent = await this.stepGenerator.createStep({
      description: 'Core implementation component',
      reasoning: 'Group implementation-related atomic actions',
      index: atomicSteps.length + 1,
      dependencies: atomicSteps.slice(3, 5).map(s => s.id),
      confidence: 0.8
    });
    componentSteps.push(implementationComponent);

    return componentSteps;
  }

  private async postProcessSteps(
    steps: ReasoningStep[],
    options: DecompositionOptions
  ): Promise<ReasoningStep[]> {
    // Ensure step indices are correct
    steps.forEach((step, index) => {
      step.index = index;
    });

    // Validate dependencies exist
    const stepIds = new Set(steps.map(s => s.id));
    steps.forEach(step => {
      step.dependencies = step.dependencies.filter(dep => stepIds.has(dep));
    });

    // Trim to max steps if needed
    if (steps.length > options.maxSteps) {
      steps = steps.slice(0, options.maxSteps);
    }

    // Ensure minimum steps
    while (steps.length < options.minSteps) {
      const additionalStep = await this.stepGenerator.createStep({
        description: `Additional step ${steps.length + 1}`,
        reasoning: 'Added to meet minimum step requirement',
        index: steps.length,
        confidence: 0.7
      });
      steps.push(additionalStep);
    }

    return steps;
  }
}