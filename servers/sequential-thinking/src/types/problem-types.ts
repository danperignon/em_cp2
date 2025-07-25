/**
 * Problem classification and decomposition interfaces
 */

export type ProblemType = 
  | 'analytical'      // Logic, math, systematic analysis
  | 'creative'        // Innovation, design, ideation
  | 'procedural'      // Step-by-step processes
  | 'diagnostic'      // Troubleshooting, debugging
  | 'planning'        // Strategy, scheduling, resource allocation
  | 'research'        // Information gathering and synthesis
  | 'optimization';   // Efficiency, performance improvement

export type DecompositionStrategy = 
  | 'top_down'        // Start broad, refine details
  | 'bottom_up'       // Build from components
  | 'divide_conquer'  // Split into independent parts
  | 'incremental'     // Progressive elaboration
  | 'parallel'        // Simultaneous workstreams
  | 'iterative';      // Refine through cycles

export interface ProblemPattern {
  id: string;
  name: string;
  description: string;
  problemTypes: ProblemType[];
  recommendedStrategy: DecompositionStrategy;
  indicators: string[]; // Keywords/patterns that suggest this pattern
  successRate: number;
  averageSteps: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface DecompositionOptions {
  strategy: DecompositionStrategy;
  maxDepth: number;
  minSteps: number;
  maxSteps: number;
  parallelism: boolean;
  adaptiveThreshold: number; // When to switch strategies (0-1)
  validation: boolean; // Validate each step
}

export interface ProblemContext {
  domain: string;
  timeConstraints?: {
    deadline?: number; // timestamp
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  resources?: {
    available: string[];
    limitations: string[];
  };
  stakeholders?: {
    primary: string[];
    secondary: string[];
  };
  constraints: string[];
  assumptions: string[];
}

export interface SolutionQuality {
  completeness: number;    // 0-1, how complete is the solution
  feasibility: number;     // 0-1, how practical to implement
  efficiency: number;      // 0-1, resource efficiency
  robustness: number;      // 0-1, resilience to changes
  innovation: number;      // 0-1, creativity/novelty
  confidence: number;      // 0-1, confidence in correctness
}

export interface ValidationCriteria {
  logicalConsistency: boolean;
  feasibilityCheck: boolean;
  constraintCompliance: boolean;
  stakeholderAlignment: boolean;
  riskAssessment: boolean;
  performanceMetrics: string[];
}