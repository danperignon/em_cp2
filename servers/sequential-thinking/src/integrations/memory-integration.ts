/**
 * Memory Server Integration
 * 
 * Provides cognitive knowledge base functionality by integrating with the
 * EM_CP2 Memory server for persistent reasoning pattern storage and retrieval.
 */

import type { 
  ReasoningState,
  ProblemDefinition,
  DecompositionStrategy,
  SolutionQuality 
} from '../types/index.js';
import { Logger } from '@em-cp2/shared';

export interface MemoryStorageOptions {
  namespace?: string;
  persistenceLevel?: 'session' | 'project' | 'global';
  expirationDays?: number;
}

export interface StoredReasoningPattern {
  id: string;
  problemType: string;
  strategy: DecompositionStrategy;
  successRate: number;
  averageDuration: number;
  qualityScores: SolutionQuality[];
  usageCount: number;
  lastUsed: number;
  createdAt: number;
  context: {
    domain: string;
    complexity: string;
    constraints: string[];
  };
}

export interface StoredSolution {
  id: string;
  problemFingerprint: string;
  reasoningState: ReasoningState;
  quality: SolutionQuality;
  metadata: {
    createdAt: number;
    usageCount: number;
    rating: number; // 1-5 user rating
    tags: string[];
  };
}

export class MemoryIntegration {
  private logger: Logger;
  private namespace: string;
  private isAvailable: boolean = false;

  constructor(namespace: string = 'sequential-thinking') {
    this.logger = new Logger('MemoryIntegration');
    this.namespace = namespace;
    this.initializeMemoryConnection();
  }

  /**
   * Initialize connection to Memory server
   */
  private async initializeMemoryConnection(): Promise<void> {
    try {
      // Check if Memory server is available in the EM_CP2 ecosystem
      // This would typically involve checking environment variables or configuration
      this.isAvailable = process.env.MEMORY_INTEGRATION_ENABLED !== 'false';
      
      if (this.isAvailable) {
        this.logger.info('Memory integration initialized');
      } else {
        this.logger.info('Memory integration disabled - running in standalone mode');
      }
    } catch (error) {
      this.logger.warn('Memory server not available, running in standalone mode');
      this.isAvailable = false;
    }
  }

  /**
   * Store a successful reasoning pattern for future learning
   */
  async storeReasoningPattern(
    pattern: Omit<StoredReasoningPattern, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>,
    options: MemoryStorageOptions = {}
  ): Promise<string> {
    if (!this.isAvailable) {
      this.logger.debug('Memory not available, skipping pattern storage');
      return 'memory-unavailable';
    }

    try {
      const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const storedPattern: StoredReasoningPattern = {
        ...pattern,
        id: patternId,
        createdAt: Date.now(),
        usageCount: 1,
        lastUsed: Date.now()
      };

      // Store in Memory server with structured key
      const memoryKey = `${this.namespace}/patterns/${pattern.problemType}/${patternId}`;
      
      // This would integrate with the actual Memory server API
      await this.storeInMemory(memoryKey, storedPattern, options);
      
      this.logger.info(`Stored reasoning pattern: ${patternId} for problem type: ${pattern.problemType}`);
      return patternId;
      
    } catch (error) {
      this.logger.error('Failed to store reasoning pattern:', error);
      return 'storage-failed';
    }
  }

  /**
   * Retrieve reasoning patterns for a given problem type
   */
  async getReasoningPatterns(
    problemType: string,
    domain?: string,
    complexity?: string
  ): Promise<StoredReasoningPattern[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      // Query Memory server for patterns matching criteria
      const searchKey = `${this.namespace}/patterns/${problemType}/*`;
      const patterns = await this.queryMemory<StoredReasoningPattern>(searchKey);
      
      // Filter by additional criteria
      let filteredPatterns = patterns;
      
      if (domain) {
        filteredPatterns = filteredPatterns.filter(p => p.context.domain === domain);
      }
      
      if (complexity) {
        filteredPatterns = filteredPatterns.filter(p => p.context.complexity === complexity);
      }
      
      // Sort by success rate and recency
      filteredPatterns.sort((a, b) => {
        const successDiff = b.successRate - a.successRate;
        if (Math.abs(successDiff) > 0.1) return successDiff;
        return b.lastUsed - a.lastUsed;
      });
      
      this.logger.debug(`Retrieved ${filteredPatterns.length} patterns for ${problemType}`);
      return filteredPatterns;
      
    } catch (error) {
      this.logger.error('Failed to retrieve reasoning patterns:', error);
      return [];
    }
  }

  /**
   * Store a complete solution for future reference
   */
  async storeSolution(
    solution: Omit<StoredSolution, 'id' | 'metadata'>,
    tags: string[] = [],
    rating: number = 3
  ): Promise<string> {
    if (!this.isAvailable) {
      return 'memory-unavailable';
    }

    try {
      const solutionId = `solution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const storedSolution: StoredSolution = {
        ...solution,
        id: solutionId,
        metadata: {
          createdAt: Date.now(),
          usageCount: 0,
          rating,
          tags
        }
      };

      const memoryKey = `${this.namespace}/solutions/${solution.problemFingerprint}/${solutionId}`;
      await this.storeInMemory(memoryKey, storedSolution);
      
      this.logger.info(`Stored solution: ${solutionId}`);
      return solutionId;
      
    } catch (error) {
      this.logger.error('Failed to store solution:', error);
      return 'storage-failed';
    }
  }

  /**
   * Find similar solutions based on problem fingerprint
   */
  async findSimilarSolutions(
    problemFingerprint: string,
    limit: number = 5
  ): Promise<StoredSolution[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const searchKey = `${this.namespace}/solutions/${problemFingerprint}/*`;
      const solutions = await this.queryMemory<StoredSolution>(searchKey);
      
      // Sort by quality and rating
      solutions.sort((a, b) => {
        const qualityDiff = this.calculateOverallQuality(b.quality) - this.calculateOverallQuality(a.quality);
        if (Math.abs(qualityDiff) > 0.1) return qualityDiff;
        return b.metadata.rating - a.metadata.rating;
      });
      
      return solutions.slice(0, limit);
      
    } catch (error) {
      this.logger.error('Failed to find similar solutions:', error);
      return [];
    }
  }

  /**
   * Update pattern performance metrics
   */
  async updatePatternPerformance(
    patternId: string,
    quality: SolutionQuality,
    duration: number
  ): Promise<void> {
    if (!this.isAvailable) return;

    try {
      // Retrieve existing pattern
      const pattern = await this.getPatternById(patternId);
      if (!pattern) return;

      // Update metrics
      pattern.qualityScores.push(quality);
      pattern.usageCount++;
      pattern.lastUsed = Date.now();
      
      // Recalculate success rate
      const avgQuality = pattern.qualityScores.reduce(
        (sum, q) => sum + this.calculateOverallQuality(q), 0
      ) / pattern.qualityScores.length;
      pattern.successRate = avgQuality;
      
      // Update average duration
      pattern.averageDuration = (pattern.averageDuration + duration) / 2;

      // Store updated pattern
      const memoryKey = `${this.namespace}/patterns/${pattern.problemType}/${patternId}`;
      await this.storeInMemory(memoryKey, pattern);
      
      this.logger.debug(`Updated pattern performance: ${patternId}`);
      
    } catch (error) {
      this.logger.error('Failed to update pattern performance:', error);
    }
  }

  /**
   * Get cognitive insights and recommendations
   */
  async getCognitiveInsights(problemDefinition: ProblemDefinition): Promise<{
    recommendedStrategy: DecompositionStrategy | null;
    confidence: number;
    reasoning: string;
    similarProblems: number;
  }> {
    if (!this.isAvailable) {
      return {
        recommendedStrategy: null,
        confidence: 0,
        reasoning: 'Memory integration not available',
        similarProblems: 0
      };
    }

    try {
      // Find patterns for this problem type
      const patterns = await this.getReasoningPatterns(
        this.classifyProblemType(problemDefinition),
        problemDefinition.domain,
        problemDefinition.complexity
      );

      if (patterns.length === 0) {
        return {
          recommendedStrategy: null,
          confidence: 0,
          reasoning: 'No historical patterns found for this problem type',
          similarProblems: 0
        };
      }

      // Find best performing pattern
      const bestPattern = patterns[0];
      
      return {
        recommendedStrategy: bestPattern.strategy,
        confidence: bestPattern.successRate,
        reasoning: `Based on ${patterns.length} similar problems, ${bestPattern.strategy} has ${(bestPattern.successRate * 100).toFixed(1)}% success rate`,
        similarProblems: patterns.length
      };
      
    } catch (error) {
      this.logger.error('Failed to get cognitive insights:', error);
      return {
        recommendedStrategy: null,
        confidence: 0,
        reasoning: 'Error retrieving insights',
        similarProblems: 0
      };
    }
  }

  // Private helper methods

  private async storeInMemory(key: string, _data: any, _options: MemoryStorageOptions = {}): Promise<void> {
    // This would integrate with the actual Memory server MCP interface
    // For now, we'll simulate the storage operation
    this.logger.debug(`Storing data at key: ${key}`);
  }

  private async queryMemory<T>(searchPattern: string): Promise<T[]> {
    // This would query the Memory server using MCP protocols
    // For now, return empty array
    this.logger.debug(`Querying memory with pattern: ${searchPattern}`);
    return [];
  }

  private async getPatternById(patternId: string): Promise<StoredReasoningPattern | null> {
    // This would retrieve a specific pattern by ID
    this.logger.debug(`Retrieving pattern: ${patternId}`);
    return null;
  }

  private calculateOverallQuality(quality: SolutionQuality): number {
    // Weighted average of quality dimensions
    return (
      quality.completeness * 0.25 +
      quality.feasibility * 0.25 +
      quality.efficiency * 0.15 +
      quality.robustness * 0.15 +
      quality.innovation * 0.1 +
      quality.confidence * 0.1
    );
  }


  private classifyProblemType(problem: ProblemDefinition): string {
    // Simple classification based on description keywords
    const description = problem.description.toLowerCase();
    
    if (description.includes('analyze') || description.includes('evaluate')) return 'analytical';
    if (description.includes('create') || description.includes('design')) return 'creative';
    if (description.includes('fix') || description.includes('debug')) return 'diagnostic';
    if (description.includes('plan') || description.includes('strategy')) return 'planning';
    if (description.includes('research') || description.includes('investigate')) return 'research';
    if (description.includes('optimize') || description.includes('improve')) return 'optimization';
    if (description.includes('implement') || description.includes('build')) return 'procedural';
    
    return 'general';
  }

  /**
   * Check if Memory integration is available
   */
  isMemoryAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(): Promise<{
    isAvailable: boolean;
    totalPatterns: number;
    totalSolutions: number;
    lastSync: number;
  }> {
    return {
      isAvailable: this.isAvailable,
      totalPatterns: 0, // Would query actual counts
      totalSolutions: 0,
      lastSync: Date.now()
    };
  }
}