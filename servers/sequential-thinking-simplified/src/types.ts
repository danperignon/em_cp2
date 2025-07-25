/**
 * Essential types for the Sequential Thinking server
 */

export type DecompositionStrategy = 
  | 'top_down'      // Start broad, refine details
  | 'bottom_up'     // Build from components
  | 'divide_conquer'// Split into independent parts
  | 'incremental'   // Progressive elaboration
  | 'parallel'      // Simultaneous workstreams
  | 'iterative';    // Refine through cycles

export type ProblemType = 
  | 'analytical'    // Data analysis, research
  | 'creative'      // Design, innovation
  | 'procedural'    // Step-by-step processes
  | 'optimization'; // Performance improvement

export interface Problem {
  description: string;
  type: ProblemType;
  complexity: 'low' | 'medium' | 'high';
  context?: string;
}

export interface ReasoningStep {
  id: string;
  description: string;
  reasoning: string;
  confidence: number;
  dependencies: string[];
  index: number;
}

export interface DecompositionResult {
  problem: Problem;
  strategy: {
    name: DecompositionStrategy;
    reasoning: string;
  };
  steps: ReasoningStep[];
  artifacts?: {
    overview?: string;
    steps?: string[];
  };
  metadata?: {
    duration: number;
    stepCount: number;
  };
}