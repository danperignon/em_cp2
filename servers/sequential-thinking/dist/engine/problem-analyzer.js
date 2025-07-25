/**
 * Problem Analysis Engine
 *
 * Analyzes problem descriptions, identifies patterns, and recommends
 * optimal decomposition strategies using cognitive science principles.
 */
import { identifyProblemPatterns, selectDecompositionStrategy, estimateSolvingParameters } from '../utils/pattern-matching.js';
import { Logger } from '@em-cp2/shared';
export class ProblemAnalyzer {
    logger;
    constructor() {
        this.logger = new Logger('ProblemAnalyzer');
    }
    /**
     * Analyze a problem description and create a structured ProblemDefinition
     */
    async analyzeProblem(description, initialContext) {
        this.logger.info(`Analyzing problem: "${description.substring(0, 80)}..."`);
        // Create initial problem definition
        const problem = {
            description: description.trim(),
            context: this.extractContextFromDescription(description),
            constraints: this.extractConstraints(description),
            goalState: this.extractGoalState(description),
            complexity: this.assessComplexity(description),
            domain: this.identifyDomain(description)
        };
        // Enhance with provided context
        if (initialContext) {
            problem.context = { ...problem.context, ...initialContext };
            if (initialContext.domain)
                problem.domain = initialContext.domain;
            if (initialContext.constraints) {
                problem.constraints = [...problem.constraints, ...initialContext.constraints];
            }
        }
        this.logger.info(`Problem analysis complete: ${problem.complexity} complexity, ${problem.domain} domain, ${problem.constraints.length} constraints`);
        return problem;
    }
    /**
     * Recommend optimal decomposition strategy based on problem analysis
     */
    async recommendStrategy(problem) {
        // Identify matching patterns
        const patterns = identifyProblemPatterns(problem);
        if (patterns.length === 0) {
            this.logger.warn('No patterns matched, using default top_down strategy');
            return 'top_down';
        }
        // Select strategy based on patterns
        const strategy = selectDecompositionStrategy(problem, patterns);
        this.logger.info(`Recommended strategy: ${strategy} (based on ${patterns.length} pattern matches)`);
        return strategy;
    }
    /**
     * Get detailed analysis including patterns and parameters
     */
    async getDetailedAnalysis(problem) {
        const patterns = identifyProblemPatterns(problem);
        const strategy = selectDecompositionStrategy(problem, patterns);
        const parameters = estimateSolvingParameters(patterns);
        return {
            problem,
            matchedPatterns: patterns,
            recommendedStrategy: strategy,
            estimatedParameters: parameters,
            analysisMetadata: {
                patternCount: patterns.length,
                confidenceLevel: parameters.confidenceLevel,
                primaryPattern: patterns[0]?.name || 'None',
                analysisTimestamp: Date.now()
            }
        };
    }
    /**
     * Extract context information from problem description
     */
    extractContextFromDescription(description) {
        const context = {};
        const text = description.toLowerCase();
        // Time-related context
        if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
            context.urgency = 'high';
        }
        else if (text.includes('deadline') || text.includes('by ')) {
            context.urgency = 'medium';
        }
        else {
            context.urgency = 'low';
        }
        // Resource context
        const resourceIndicators = ['budget', 'cost', 'money', 'resource', 'team', 'people', 'tool'];
        if (resourceIndicators.some(indicator => text.includes(indicator))) {
            context.hasResourceConstraints = true;
        }
        // Technical context
        const technicalIndicators = ['code', 'system', 'technical', 'software', 'database', 'api'];
        if (technicalIndicators.some(indicator => text.includes(indicator))) {
            context.technical = true;
        }
        // Creative context
        const creativeIndicators = ['design', 'creative', 'innovative', 'brainstorm', 'idea'];
        if (creativeIndicators.some(indicator => text.includes(indicator))) {
            context.creative = true;
        }
        return context;
    }
    /**
     * Extract constraints from problem description
     */
    extractConstraints(description) {
        const constraints = [];
        const text = description.toLowerCase();
        // Time constraints
        if (text.includes('deadline') || text.includes('by ') || text.includes('within')) {
            constraints.push('time_limited');
        }
        if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) {
            constraints.push('time_critical');
        }
        // Resource constraints
        if (text.includes('budget') || text.includes('cost') || text.includes('cheap')) {
            constraints.push('budget_limited');
        }
        if (text.includes('limited') || text.includes('minimal') || text.includes('few')) {
            constraints.push('resource_limited');
        }
        // Quality constraints
        if (text.includes('high quality') || text.includes('perfect') || text.includes('excellent')) {
            constraints.push('quality_focused');
        }
        // Scope constraints
        if (text.includes('simple') || text.includes('basic') || text.includes('minimal')) {
            constraints.push('scope_limited');
        }
        if (text.includes('comprehensive') || text.includes('complete') || text.includes('full')) {
            constraints.push('scope_extensive');
        }
        // Risk constraints
        if (text.includes('safe') || text.includes('risk') || text.includes('careful')) {
            constraints.push('risk_averse');
        }
        return constraints;
    }
    /**
     * Extract goal state from problem description
     */
    extractGoalState(description) {
        const text = description.toLowerCase();
        // Look for explicit goal statements
        const goalIndicators = [
            'goal is to', 'objective is', 'aim is to', 'want to', 'need to',
            'should', 'must', 'result in', 'outcome', 'solution'
        ];
        for (const indicator of goalIndicators) {
            const index = text.indexOf(indicator);
            if (index !== -1) {
                // Extract text after the indicator
                const afterIndicator = description.substring(index + indicator.length).trim();
                const sentences = afterIndicator.split(/[.!?]/);
                if (sentences[0] && sentences[0].trim().length > 0) {
                    return sentences[0].trim();
                }
            }
        }
        // Default goal state based on problem type
        if (text.includes('fix') || text.includes('debug') || text.includes('solve')) {
            return 'Problem resolved with root cause identified and fixed';
        }
        if (text.includes('create') || text.includes('build') || text.includes('develop')) {
            return 'Solution created and successfully implemented';
        }
        if (text.includes('improve') || text.includes('optimize') || text.includes('enhance')) {
            return 'Performance improved with measurable results';
        }
        if (text.includes('analyze') || text.includes('understand') || text.includes('investigate')) {
            return 'Clear understanding achieved with actionable insights';
        }
        // Generic fallback
        return 'Problem solved with clear actionable steps and validated solution';
    }
    /**
     * Assess problem complexity based on description
     */
    assessComplexity(description) {
        const text = description.toLowerCase();
        const words = text.split(/\s+/);
        // Length-based assessment
        let complexityScore = 0;
        if (words.length > 100)
            complexityScore += 2;
        else if (words.length > 50)
            complexityScore += 1;
        // Technical complexity indicators
        const technicalTerms = [
            'algorithm', 'architecture', 'system', 'integration', 'framework',
            'database', 'api', 'protocol', 'security', 'scalability'
        ];
        complexityScore += technicalTerms.filter(term => text.includes(term)).length;
        // Multiple domain indicators
        const domains = ['technical', 'business', 'creative', 'analytical'];
        const domainCount = domains.filter(domain => text.includes(domain) || this.getDomainKeywords(domain).some(keyword => text.includes(keyword))).length;
        complexityScore += domainCount;
        // Constraint complexity
        const constraintIndicators = ['must', 'cannot', 'requirement', 'constraint', 'limitation'];
        complexityScore += constraintIndicators.filter(indicator => text.includes(indicator)).length;
        // Multi-step indicators
        const multiStepIndicators = ['first', 'then', 'next', 'finally', 'phase', 'step'];
        if (multiStepIndicators.filter(indicator => text.includes(indicator)).length >= 3) {
            complexityScore += 2;
        }
        // Map score to complexity level
        if (complexityScore >= 8)
            return 'expert';
        if (complexityScore >= 5)
            return 'complex';
        if (complexityScore >= 2)
            return 'moderate';
        return 'simple';
    }
    /**
     * Identify problem domain based on description
     */
    identifyDomain(description) {
        const text = description.toLowerCase();
        const domainKeywords = {
            technical: ['code', 'software', 'system', 'technical', 'programming', 'database', 'api', 'algorithm'],
            business: ['business', 'strategy', 'management', 'process', 'workflow', 'organization', 'team'],
            creative: ['design', 'creative', 'art', 'visual', 'brand', 'content', 'marketing'],
            academic: ['research', 'study', 'analysis', 'academic', 'scientific', 'thesis', 'paper'],
            personal: ['personal', 'life', 'habit', 'goal', 'productivity', 'health', 'learning']
        };
        let maxScore = 0;
        let identifiedDomain = 'general';
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            const score = keywords.filter(keyword => text.includes(keyword)).length;
            if (score > maxScore) {
                maxScore = score;
                identifiedDomain = domain;
            }
        }
        return identifiedDomain;
    }
    /**
     * Get domain-specific keywords for analysis
     */
    getDomainKeywords(domain) {
        const domainKeywords = {
            technical: ['code', 'software', 'system', 'technical', 'programming', 'database', 'api'],
            business: ['business', 'strategy', 'management', 'process', 'workflow', 'organization'],
            creative: ['design', 'creative', 'art', 'visual', 'brand', 'content', 'marketing'],
            analytical: ['analyze', 'data', 'research', 'study', 'evaluate', 'assess', 'measure']
        };
        return domainKeywords[domain] || [];
    }
}
//# sourceMappingURL=problem-analyzer.js.map