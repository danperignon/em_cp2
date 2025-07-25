/**
 * Pattern matching utilities for problem recognition and strategy selection
 */
/**
 * Built-in problem patterns based on cognitive science research
 */
export const PROBLEM_PATTERNS = [
    {
        id: 'analytical_breakdown',
        name: 'Analytical Breakdown',
        description: 'Systematic analysis requiring logical decomposition',
        problemTypes: ['analytical'],
        recommendedStrategy: 'top_down',
        indicators: ['analyze', 'evaluate', 'compare', 'calculate', 'determine'],
        successRate: 0.85,
        averageSteps: 6,
        complexity: 'medium'
    },
    {
        id: 'creative_exploration',
        name: 'Creative Exploration',
        description: 'Open-ended problems requiring innovative thinking',
        problemTypes: ['creative'],
        recommendedStrategy: 'iterative',
        indicators: ['design', 'create', 'innovate', 'brainstorm', 'imagine'],
        successRate: 0.72,
        averageSteps: 8,
        complexity: 'high'
    },
    {
        id: 'procedural_execution',
        name: 'Procedural Execution',
        description: 'Step-by-step processes with clear sequence',
        problemTypes: ['procedural'],
        recommendedStrategy: 'incremental',
        indicators: ['implement', 'execute', 'follow', 'setup', 'configure'],
        successRate: 0.91,
        averageSteps: 5,
        complexity: 'low'
    },
    {
        id: 'diagnostic_investigation',
        name: 'Diagnostic Investigation',
        description: 'Troubleshooting and root cause analysis',
        problemTypes: ['diagnostic'],
        recommendedStrategy: 'divide_conquer',
        indicators: ['debug', 'troubleshoot', 'diagnose', 'fix', 'resolve'],
        successRate: 0.78,
        averageSteps: 7,
        complexity: 'medium'
    },
    {
        id: 'strategic_planning',
        name: 'Strategic Planning',
        description: 'Long-term planning and resource allocation',
        problemTypes: ['planning'],
        recommendedStrategy: 'top_down',
        indicators: ['plan', 'strategy', 'roadmap', 'schedule', 'organize'],
        successRate: 0.81,
        averageSteps: 9,
        complexity: 'high'
    },
    {
        id: 'research_synthesis',
        name: 'Research Synthesis',
        description: 'Information gathering and knowledge synthesis',
        problemTypes: ['research'],
        recommendedStrategy: 'parallel',
        indicators: ['research', 'investigate', 'gather', 'synthesize', 'explore'],
        successRate: 0.76,
        averageSteps: 8,
        complexity: 'medium'
    },
    {
        id: 'optimization_tuning',
        name: 'Optimization Tuning',
        description: 'Performance improvement and efficiency gains',
        problemTypes: ['optimization'],
        recommendedStrategy: 'iterative',
        indicators: ['optimize', 'improve', 'enhance', 'refine', 'tune'],
        successRate: 0.83,
        averageSteps: 6,
        complexity: 'medium'
    }
];
/**
 * Analyze problem description to identify matching patterns
 */
export function identifyProblemPatterns(problem) {
    const text = `${problem.description} ${problem.goalState}`.toLowerCase();
    const words = text.split(/\s+/);
    const matches = PROBLEM_PATTERNS.map(pattern => {
        // Count indicator matches
        const indicatorMatches = pattern.indicators.filter(indicator => words.some(word => word.includes(indicator) || indicator.includes(word))).length;
        // Calculate match score
        const indicatorScore = indicatorMatches / pattern.indicators.length;
        const contextScore = calculateContextScore(problem, pattern);
        const complexityScore = calculateComplexityScore(problem, pattern);
        const totalScore = (indicatorScore * 0.5) + (contextScore * 0.3) + (complexityScore * 0.2);
        return {
            pattern,
            score: totalScore,
            matches: indicatorMatches
        };
    })
        .filter(match => match.score > 0.2) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .map(match => match.pattern);
    return matches.slice(0, 3); // Return top 3 matches
}
/**
 * Calculate context-based matching score
 */
function calculateContextScore(problem, pattern) {
    let score = 0;
    // Domain matching
    if (problem.domain) {
        const domainKeywords = {
            'technical': ['analytical', 'diagnostic', 'optimization'],
            'business': ['planning', 'analytical', 'optimization'],
            'creative': ['creative', 'research'],
            'academic': ['research', 'analytical']
        };
        const relevantTypes = domainKeywords[problem.domain] || [];
        if (pattern.problemTypes.some(type => relevantTypes.includes(type))) {
            score += 0.3;
        }
    }
    // Constraint complexity
    if (problem.constraints.length > 3 && pattern.complexity === 'high') {
        score += 0.2;
    }
    else if (problem.constraints.length <= 1 && pattern.complexity === 'low') {
        score += 0.2;
    }
    return Math.min(score, 1.0);
}
/**
 * Calculate complexity-based matching score
 */
function calculateComplexityScore(problem, pattern) {
    const complexityMap = {
        'simple': 'low',
        'moderate': 'medium',
        'complex': 'high',
        'expert': 'high'
    };
    const problemComplexity = complexityMap[problem.complexity];
    return problemComplexity === pattern.complexity ? 1.0 : 0.5;
}
/**
 * Select optimal decomposition strategy based on problem analysis
 */
export function selectDecompositionStrategy(problem, patterns) {
    if (patterns.length === 0) {
        return 'top_down'; // Default fallback
    }
    // Use the highest-scoring pattern's recommendation
    const primaryPattern = patterns[0];
    let strategy = primaryPattern.recommendedStrategy;
    // Apply contextual adjustments
    if (problem.constraints.includes('time_critical')) {
        strategy = 'parallel'; // Favor parallelism for urgent problems
    }
    if (problem.complexity === 'expert' && strategy === 'incremental') {
        strategy = 'top_down'; // Expert problems need structured approach
    }
    return strategy;
}
/**
 * Estimate problem solving parameters based on pattern analysis
 */
export function estimateSolvingParameters(patterns) {
    if (patterns.length === 0) {
        return {
            estimatedSteps: 5,
            estimatedDuration: 300000, // 5 minutes
            confidenceLevel: 0.6,
            recommendedDepth: 3
        };
    }
    const avgSteps = patterns.reduce((sum, p) => sum + p.averageSteps, 0) / patterns.length;
    const avgSuccess = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    return {
        estimatedSteps: Math.ceil(avgSteps),
        estimatedDuration: avgSteps * 60000, // 1 minute per step estimate
        confidenceLevel: avgSuccess,
        recommendedDepth: patterns[0].complexity === 'high' ? 4 : 3
    };
}
//# sourceMappingURL=pattern-matching.js.map