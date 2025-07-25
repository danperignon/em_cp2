/**
 * Strategy Selection Logic
 * Determines the best decomposition strategy based on problem characteristics
 */

import type { Problem, DecompositionStrategy } from './types.js';

/**
 * Select the most appropriate strategy for a given problem
 */
export function selectStrategy(problem: Problem): DecompositionStrategy {
  // Strategy selection based on problem type and complexity
  switch (problem.type) {
    case 'analytical':
      // Analytical problems benefit from top-down decomposition
      return problem.complexity === 'high' ? 'divide_conquer' : 'top_down';
    
    case 'creative':
      // Creative problems often work well bottom-up
      return 'bottom_up';
    
    case 'procedural':
      // Step-by-step processes are naturally incremental
      return 'incremental';
    
    case 'optimization':
      // Optimization benefits from iterative refinement
      return 'iterative';
    
    default:
      // Default to top-down for unknown types
      return 'top_down';
  }
}

/**
 * Get all available strategies with descriptions
 */
export function getStrategies(): Array<{
  name: DecompositionStrategy;
  description: string;
  bestFor: string[];
}> {
  return [
    {
      name: 'top_down',
      description: 'Start with high-level goals and progressively refine details',
      bestFor: ['analytical problems', 'system design', 'project planning']
    },
    {
      name: 'bottom_up',
      description: 'Build from fundamental components toward the complete solution',
      bestFor: ['creative problems', 'UI/UX design', 'feature development']
    },
    {
      name: 'divide_conquer',
      description: 'Split complex problems into independent, manageable sub-problems',
      bestFor: ['large systems', 'distributed problems', 'complex algorithms']
    },
    {
      name: 'incremental',
      description: 'Build step-by-step with continuous validation',
      bestFor: ['procedural tasks', 'setup processes', 'migrations']
    },
    {
      name: 'parallel',
      description: 'Identify and execute tasks that can run simultaneously',
      bestFor: ['multi-component systems', 'team projects', 'research tasks']
    },
    {
      name: 'iterative',
      description: 'Refine solution through multiple improvement cycles',
      bestFor: ['optimization problems', 'performance tuning', 'quality improvement']
    }
  ];
}

/**
 * Validate if a strategy is appropriate for a problem
 */
export function validateStrategyChoice(
  strategy: DecompositionStrategy,
  problem: Problem
): { valid: boolean; reasoning: string } {
  // Simple validation rules
  const validCombinations: Record<Problem['type'], DecompositionStrategy[]> = {
    analytical: ['top_down', 'divide_conquer', 'parallel'],
    creative: ['bottom_up', 'iterative', 'incremental'],
    procedural: ['incremental', 'top_down', 'parallel'],
    optimization: ['iterative', 'bottom_up', 'divide_conquer']
  };

  const isValid = validCombinations[problem.type].includes(strategy);
  
  const reasoning = isValid
    ? `${strategy} is well-suited for ${problem.type} problems`
    : `${strategy} may not be optimal for ${problem.type} problems; consider ${validCombinations[problem.type].join(' or ')}`;

  return { valid: isValid, reasoning };
}