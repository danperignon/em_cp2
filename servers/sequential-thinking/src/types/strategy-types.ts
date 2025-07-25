/**
 * Strategy adaptation and metacognitive interfaces
 */

export interface StrategyConfig {
  name: string;
  description: string;
  applicability: StrategyApplicability;
  parameters: StrategyParameters;
  adaptationRules: AdaptationRule[];
  performanceThresholds: PerformanceThresholds;
}

export interface StrategyApplicability {
  problemTypes: string[];
  complexityRange: ['low' | 'medium' | 'high', 'low' | 'medium' | 'high'];
  contextFactors: string[];
  exclusions: string[]; // When NOT to use this strategy
}

export interface StrategyParameters {
  decompositionDepth: number;
  parallelBranches: number;
  validationFrequency: 'never' | 'each_step' | 'major_steps' | 'final';
  confidenceThreshold: number;
  timeoutPerStep: number; // ms
  retryAttempts: number;
  explorationRatio: number; // 0-1, how much to explore alternatives
}

export interface AdaptationRule {
  id: string;
  condition: AdaptationCondition;
  action: AdaptationAction;
  priority: number;
  cooldown: number; // ms before this rule can trigger again
}

export interface AdaptationCondition {
  type: 'performance' | 'time' | 'error_rate' | 'confidence' | 'progress';
  operator: '<' | '>' | '==' | '<=' | '>=' | '!=';
  threshold: number;
  window: number; // number of steps to evaluate
}

export interface AdaptationAction {
  type: 'change_strategy' | 'adjust_depth' | 'increase_validation' | 'seek_help' | 'restart' | 'continue';
  parameters: Record<string, unknown>;
  rollback: boolean; // whether to rollback recent steps
}

export interface PerformanceThresholds {
  minimumAccuracy: number;
  maximumTime: number;
  minimumConfidence: number;
  maximumErrors: number;
  progressRate: number; // minimum steps/minute
}

export interface MetacognitiveState {
  currentStrategy: string;
  confidence: number;
  perceivedDifficulty: number;
  estimatedProgress: number;
  alternativeStrategies: string[];
  adaptationHistory: AdaptationEvent[];
  reflectionNotes: string[];
}

export interface AdaptationEvent {
  timestamp: number;
  trigger: string;
  fromStrategy: string;
  toStrategy: string;
  reason: string;
  impact: 'positive' | 'negative' | 'neutral';
  metrics: Record<string, number>;
}

export interface StrategyPattern {
  id: string;
  name: string;
  sequence: string[]; // sequence of strategies
  transitions: StrategyTransition[];
  successRate: number;
  averageDuration: number;
  contexts: string[]; // when this pattern is successful
}

export interface StrategyTransition {
  from: string;
  to: string;
  condition: string;
  probability: number;
  avgDelay: number; // typical time before transition
}