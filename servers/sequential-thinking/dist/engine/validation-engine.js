/**
 * Validation Engine
 *
 * Provides comprehensive quality assessment for reasoning chains,
 * step validation, and solution quality metrics.
 */
import { Logger } from '@em-cp2/shared';
export class ValidationEngine {
    logger;
    constructor() {
        this.logger = new Logger('ValidationEngine');
    }
    /**
     * Assess the overall quality of a reasoning state
     */
    async assessQuality(state) {
        this.logger.info(`Assessing quality for reasoning state ${state.id}`);
        const quality = {
            completeness: await this.assessCompleteness(state),
            feasibility: await this.assessFeasibility(state),
            efficiency: await this.assessEfficiency(state),
            robustness: await this.assessRobustness(state),
            innovation: await this.assessInnovation(state),
            confidence: await this.assessConfidence(state)
        };
        this.logger.info(`Quality assessment complete - Overall: ${this.calculateOverallQuality(quality).toFixed(2)}`);
        return quality;
    }
    /**
     * Validate a complete reasoning chain
     */
    async validateReasoningChain(state) {
        this.logger.info(`Validating reasoning chain for state ${state.id}`);
        const issues = [];
        const recommendations = [];
        // Run all validation checks
        issues.push(...await this.validateLogicalConsistency(state));
        issues.push(...await this.validateFeasibility(state));
        issues.push(...await this.validateConstraintCompliance(state));
        issues.push(...await this.validateDependencies(state));
        issues.push(...await this.validateStepQuality(state));
        // Generate recommendations
        recommendations.push(...this.generateRecommendations(state, issues));
        // Assess overall quality
        const quality = await this.assessQuality(state);
        const overallScore = this.calculateOverallQuality(quality);
        // Determine if chain is valid
        const criticalIssues = issues.filter(i => i.type === 'critical').length;
        const isValid = criticalIssues === 0 && overallScore >= 0.6;
        const result = {
            isValid,
            quality,
            issues,
            recommendations,
            overallScore
        };
        this.logger.info(`Validation complete - Valid: ${isValid}, Score: ${overallScore.toFixed(2)}, Issues: ${issues.length}`);
        return result;
    }
    /**
     * Validate a single reasoning step
     */
    async validateStep(step, context) {
        const issues = [];
        const suggestions = [];
        // Check basic step properties
        if (!step.description || step.description.trim().length < 5) {
            issues.push({
                type: 'critical',
                category: 'quality',
                message: 'Step description is too short or missing',
                stepId: step.id,
                suggestion: 'Provide a clear, detailed description of what this step accomplishes'
            });
        }
        if (!step.reasoning || step.reasoning.trim().length < 10) {
            issues.push({
                type: 'warning',
                category: 'quality',
                message: 'Step reasoning is insufficient',
                stepId: step.id,
                suggestion: 'Explain why this step is necessary and how it contributes to the solution'
            });
        }
        // Check confidence level
        if (step.confidence < 0.3) {
            issues.push({
                type: 'warning',
                category: 'quality',
                message: 'Very low confidence in step execution',
                stepId: step.id,
                suggestion: 'Consider breaking this step into smaller, more manageable parts'
            });
        }
        // Check for actionability
        if (!this.isStepActionable(step)) {
            issues.push({
                type: 'warning',
                category: 'feasibility',
                message: 'Step may not be actionable or specific enough',
                stepId: step.id,
                suggestion: 'Make the step more concrete with specific actions and measurable outcomes'
            });
        }
        // Context-specific validation
        if (context) {
            issues.push(...this.validateStepInContext(step, context));
        }
        const isValid = issues.filter(i => i.type === 'critical').length === 0;
        return { isValid, issues, suggestions };
    }
    // Quality Assessment Methods
    async assessCompleteness(state) {
        let completenessScore = 0.5; // Base score
        // Check if all major aspects of the problem are addressed
        const problem = state.problem;
        const steps = state.steps;
        // Analysis phase
        const hasAnalysis = steps.some(s => s.description.toLowerCase().includes('analyz') ||
            s.description.toLowerCase().includes('understand') ||
            s.description.toLowerCase().includes('research'));
        if (hasAnalysis)
            completenessScore += 0.15;
        // Implementation phase
        const hasImplementation = steps.some(s => s.description.toLowerCase().includes('implement') ||
            s.description.toLowerCase().includes('create') ||
            s.description.toLowerCase().includes('build'));
        if (hasImplementation)
            completenessScore += 0.15;
        // Validation phase
        const hasValidation = steps.some(s => s.description.toLowerCase().includes('test') ||
            s.description.toLowerCase().includes('validat') ||
            s.description.toLowerCase().includes('verify'));
        if (hasValidation)
            completenessScore += 0.1;
        // Constraint coverage
        const constraintsCovered = problem.constraints.filter(constraint => steps.some(s => s.description.toLowerCase().includes(constraint.toLowerCase()))).length;
        const constraintCoverage = problem.constraints.length > 0 ?
            constraintsCovered / problem.constraints.length : 1;
        completenessScore += constraintCoverage * 0.1;
        return Math.min(1.0, completenessScore);
    }
    async assessFeasibility(state) {
        let feasibilityScore = 0.8; // Start optimistic
        const steps = state.steps;
        // Check for overly complex or vague steps
        const complexSteps = steps.filter(s => s.inputs?.complexity === 'high' ||
            s.confidence < 0.5).length;
        const complexityPenalty = (complexSteps / steps.length) * 0.2;
        feasibilityScore -= complexityPenalty;
        // Check for unrealistic time constraints
        if (state.problem.constraints.includes('time_critical') && steps.length > 10) {
            feasibilityScore -= 0.1;
        }
        // Check for resource constraints
        if (state.problem.constraints.includes('resource_limited') &&
            steps.some(s => s.inputs?.category === 'implementation')) {
            feasibilityScore -= 0.05;
        }
        // Check step dependencies for feasibility
        const circularDeps = this.detectCircularDependencies(steps);
        if (circularDeps.length > 0) {
            feasibilityScore -= 0.3; // Major feasibility issue
        }
        return Math.max(0.2, feasibilityScore);
    }
    async assessEfficiency(state) {
        let efficiencyScore = 0.7; // Base efficiency
        const steps = state.steps;
        // Check for redundant steps
        const redundantSteps = this.identifyRedundantSteps(steps);
        const redundancyPenalty = (redundantSteps.length / steps.length) * 0.2;
        efficiencyScore -= redundancyPenalty;
        // Check for optimal step count
        const stepCount = steps.length;
        if (stepCount > 15) {
            efficiencyScore -= 0.1; // Too many steps
        }
        else if (stepCount < 3) {
            efficiencyScore -= 0.05; // Possibly too few steps
        }
        // Check for parallel opportunities
        const parallelSteps = steps.filter(s => s.dependencies.length === 0 ||
            steps.filter(other => other.dependencies.includes(s.id)).length === 0).length;
        if (parallelSteps > 1 && state.strategy.name !== 'parallel') {
            efficiencyScore += 0.1; // Bonus for natural parallelism
        }
        // Check dependency optimization
        const avgDependencies = steps.reduce((sum, s) => sum + s.dependencies.length, 0) / steps.length;
        if (avgDependencies > 2) {
            efficiencyScore -= 0.05; // Too many dependencies might indicate inefficiency
        }
        return Math.max(0.2, Math.min(1.0, efficiencyScore));
    }
    async assessRobustness(state) {
        let robustnessScore = 0.6; // Base robustness
        const steps = state.steps;
        // Check for error handling
        const hasErrorHandling = steps.some(s => s.description.toLowerCase().includes('error') ||
            s.description.toLowerCase().includes('fallback') ||
            s.description.toLowerCase().includes('backup'));
        if (hasErrorHandling)
            robustnessScore += 0.15;
        // Check for validation steps
        const validationSteps = steps.filter(s => s.inputs?.category === 'validation' ||
            s.description.toLowerCase().includes('verify') ||
            s.description.toLowerCase().includes('check')).length;
        const validationRatio = validationSteps / steps.length;
        robustnessScore += validationRatio * 0.15;
        // Check for checkpoint/recovery mechanisms
        const hasCheckpoints = steps.some(s => s.description.toLowerCase().includes('checkpoint') ||
            s.description.toLowerCase().includes('save') ||
            s.description.toLowerCase().includes('backup'));
        if (hasCheckpoints)
            robustnessScore += 0.1;
        // Check confidence distribution
        const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
        const confidenceVariance = steps.reduce((sum, s) => sum + Math.pow(s.confidence - avgConfidence, 2), 0) / steps.length;
        if (confidenceVariance < 0.05) {
            robustnessScore += 0.1; // Consistent confidence indicates robust planning
        }
        return Math.min(1.0, robustnessScore);
    }
    async assessInnovation(state) {
        let innovationScore = 0.5; // Neutral innovation
        const steps = state.steps;
        // Check for creative approaches
        const creativeKeywords = ['design', 'innovate', 'creative', 'novel', 'alternative', 'unique'];
        const creativeSteps = steps.filter(s => creativeKeywords.some(keyword => s.description.toLowerCase().includes(keyword))).length;
        innovationScore += (creativeSteps / steps.length) * 0.3;
        // Check for unconventional strategy usage
        if (state.strategy.name === 'iterative' || state.strategy.name === 'parallel') {
            innovationScore += 0.1;
        }
        // Check for multi-approach thinking
        const approachTypes = new Set(steps.map(s => s.inputs?.category));
        if (approachTypes.size >= 4) {
            innovationScore += 0.2; // Bonus for diverse approaches
        }
        // Penalty for overly conventional approaches
        const conventionalKeywords = ['standard', 'typical', 'usual', 'normal', 'conventional'];
        const conventionalSteps = steps.filter(s => conventionalKeywords.some(keyword => s.description.toLowerCase().includes(keyword))).length;
        innovationScore -= (conventionalSteps / steps.length) * 0.1;
        return Math.max(0.1, Math.min(0.9, innovationScore));
    }
    async assessConfidence(state) {
        const steps = state.steps;
        const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
        // Weight confidence by step importance (steps with more dependents are more important)
        let weightedConfidence = 0;
        let totalWeight = 0;
        for (const step of steps) {
            const dependentCount = steps.filter(s => s.dependencies.includes(step.id)).length;
            const weight = Math.max(1, dependentCount); // At least weight of 1
            weightedConfidence += step.confidence * weight;
            totalWeight += weight;
        }
        const finalConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : avgConfidence;
        return Math.max(0.1, Math.min(0.95, finalConfidence));
    }
    // Validation Methods
    async validateLogicalConsistency(state) {
        const issues = [];
        const steps = state.steps;
        // Check for logical flow
        for (let i = 1; i < steps.length; i++) {
            const currentStep = steps[i];
            const previousSteps = steps.slice(0, i);
            // Check if step builds logically on previous steps
            if (currentStep.dependencies.length === 0 && i > 0) {
                // Step has no dependencies but isn't first - might be disconnected
                const hasLogicalConnection = this.checkLogicalConnection(currentStep, previousSteps);
                if (!hasLogicalConnection) {
                    issues.push({
                        type: 'warning',
                        category: 'logical',
                        message: 'Step appears disconnected from previous work',
                        stepId: currentStep.id,
                        suggestion: 'Consider adding dependencies or explaining how this step builds on previous work'
                    });
                }
            }
        }
        // Check for circular dependencies
        const circularDeps = this.detectCircularDependencies(steps);
        for (const cycle of circularDeps) {
            issues.push({
                type: 'critical',
                category: 'logical',
                message: `Circular dependency detected: ${cycle.join(' -> ')}`,
                suggestion: 'Remove circular dependencies by reordering steps or removing unnecessary dependencies'
            });
        }
        return issues;
    }
    async validateFeasibility(state) {
        const issues = [];
        const steps = state.steps;
        // Check for overly ambitious steps
        const highRiskSteps = steps.filter(s => s.confidence < 0.4);
        for (const step of highRiskSteps) {
            issues.push({
                type: 'warning',
                category: 'feasibility',
                message: 'Step has very low confidence',
                stepId: step.id,
                suggestion: 'Consider breaking this step into smaller, more manageable parts'
            });
        }
        // Check for time constraints
        if (state.problem.constraints.includes('time_critical')) {
            const estimatedDuration = steps.length * 300000; // 5 minutes per step
            if (estimatedDuration > 3600000) { // More than 1 hour
                issues.push({
                    type: 'warning',
                    category: 'feasibility',
                    message: 'Solution may take too long for time-critical problem',
                    suggestion: 'Consider reducing scope or using parallel execution'
                });
            }
        }
        return issues;
    }
    async validateConstraintCompliance(state) {
        const issues = [];
        const constraints = state.problem.constraints;
        const steps = state.steps;
        for (const constraint of constraints) {
            let addressed = false;
            switch (constraint) {
                case 'budget_limited':
                    addressed = steps.some(s => s.description.toLowerCase().includes('cost') ||
                        s.description.toLowerCase().includes('budget') ||
                        s.description.toLowerCase().includes('cheap'));
                    break;
                case 'quality_focused':
                    addressed = steps.some(s => s.inputs?.category === 'validation' ||
                        s.description.toLowerCase().includes('quality') ||
                        s.description.toLowerCase().includes('test'));
                    break;
                case 'risk_averse':
                    addressed = steps.some(s => s.description.toLowerCase().includes('safe') ||
                        s.description.toLowerCase().includes('backup') ||
                        s.description.toLowerCase().includes('validate'));
                    break;
            }
            if (!addressed) {
                issues.push({
                    type: 'warning',
                    category: 'constraint',
                    message: `Constraint '${constraint}' not explicitly addressed`,
                    suggestion: `Add steps that specifically address the ${constraint} constraint`
                });
            }
        }
        return issues;
    }
    async validateDependencies(state) {
        const issues = [];
        const steps = state.steps;
        const stepIds = new Set(steps.map(s => s.id));
        for (const step of steps) {
            // Check for invalid dependencies
            for (const depId of step.dependencies) {
                if (!stepIds.has(depId)) {
                    issues.push({
                        type: 'critical',
                        category: 'dependency',
                        message: 'Step references non-existent dependency',
                        stepId: step.id,
                        suggestion: 'Remove invalid dependency or create the missing step'
                    });
                }
            }
            // Check for dependency on later steps (impossible)
            const laterSteps = steps.slice(step.index + 1);
            const laterDeps = step.dependencies.filter(depId => laterSteps.some(s => s.id === depId));
            if (laterDeps.length > 0) {
                issues.push({
                    type: 'critical',
                    category: 'dependency',
                    message: 'Step depends on a later step',
                    stepId: step.id,
                    suggestion: 'Reorder steps or remove the forward dependency'
                });
            }
        }
        return issues;
    }
    async validateStepQuality(state) {
        const issues = [];
        const steps = state.steps;
        for (const step of steps) {
            const stepValidation = await this.validateStep(step, state);
            issues.push(...stepValidation.issues);
        }
        return issues;
    }
    // Helper Methods
    calculateOverallQuality(quality) {
        // Weighted average of quality dimensions
        const weights = {
            completeness: 0.25,
            feasibility: 0.25,
            efficiency: 0.15,
            robustness: 0.15,
            innovation: 0.1,
            confidence: 0.1
        };
        return (quality.completeness * weights.completeness +
            quality.feasibility * weights.feasibility +
            quality.efficiency * weights.efficiency +
            quality.robustness * weights.robustness +
            quality.innovation * weights.innovation +
            quality.confidence * weights.confidence);
    }
    isStepActionable(step) {
        const description = step.description.toLowerCase();
        // Check for action verbs
        const actionVerbs = [
            'create', 'build', 'implement', 'design', 'test', 'validate',
            'configure', 'setup', 'analyze', 'research', 'develop', 'write'
        ];
        const hasActionVerb = actionVerbs.some(verb => description.includes(verb));
        // Check for vague language
        const vagueTerms = ['consider', 'think about', 'maybe', 'possibly', 'perhaps'];
        const hasVagueTerms = vagueTerms.some(term => description.includes(term));
        return hasActionVerb && !hasVagueTerms;
    }
    validateStepInContext(step, context) {
        const issues = [];
        // Check if step aligns with problem goal
        const goalAlignment = this.checkGoalAlignment(step, context.problem);
        if (!goalAlignment) {
            issues.push({
                type: 'warning',
                category: 'quality',
                message: 'Step may not align with problem goal',
                stepId: step.id,
                suggestion: 'Ensure this step contributes to achieving the stated goal'
            });
        }
        return issues;
    }
    checkLogicalConnection(step, previousSteps) {
        // Simple heuristic: check if step mentions similar concepts to previous steps
        const stepWords = step.description.toLowerCase().split(/\s+/);
        const previousWords = previousSteps
            .map(s => s.description.toLowerCase())
            .join(' ')
            .split(/\s+/);
        const commonWords = stepWords.filter(word => word.length > 3 && previousWords.includes(word));
        return commonWords.length >= 2; // At least 2 words in common
    }
    detectCircularDependencies(steps) {
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (stepId, path) => {
            if (recursionStack.has(stepId)) {
                // Found cycle
                const cycleStart = path.indexOf(stepId);
                cycles.push(path.slice(cycleStart));
                return;
            }
            if (visited.has(stepId))
                return;
            visited.add(stepId);
            recursionStack.add(stepId);
            path.push(stepId);
            const step = steps.find(s => s.id === stepId);
            if (step) {
                for (const dep of step.dependencies) {
                    dfs(dep, [...path]);
                }
            }
            recursionStack.delete(stepId);
        };
        for (const step of steps) {
            if (!visited.has(step.id)) {
                dfs(step.id, []);
            }
        }
        return cycles;
    }
    identifyRedundantSteps(steps) {
        const redundant = [];
        // Simple similarity check based on description keywords
        for (let i = 0; i < steps.length; i++) {
            for (let j = i + 1; j < steps.length; j++) {
                const similarity = this.calculateStepSimilarity(steps[i], steps[j]);
                if (similarity > 0.8) {
                    redundant.push(steps[j]); // Mark later step as redundant
                }
            }
        }
        return redundant;
    }
    calculateStepSimilarity(step1, step2) {
        const words1 = step1.description.toLowerCase().split(/\s+/);
        const words2 = step2.description.toLowerCase().split(/\s+/);
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return intersection.length / union.length;
    }
    checkGoalAlignment(step, problem) {
        const stepWords = step.description.toLowerCase().split(/\s+/);
        const goalWords = problem.goalState.toLowerCase().split(/\s+/);
        const commonWords = stepWords.filter(word => word.length > 3 && goalWords.includes(word));
        return commonWords.length >= 1; // At least one meaningful word in common
    }
    generateRecommendations(state, issues) {
        const recommendations = [];
        // Group issues by category
        const issuesByCategory = issues.reduce((acc, issue) => {
            if (!acc[issue.category])
                acc[issue.category] = [];
            acc[issue.category].push(issue);
            return acc;
        }, {});
        // Generate category-specific recommendations
        if (issuesByCategory.logical?.length > 0) {
            recommendations.push('Review the logical flow between steps and ensure proper dependencies');
        }
        if (issuesByCategory.feasibility?.length > 0) {
            recommendations.push('Consider breaking down complex steps into smaller, more manageable parts');
        }
        if (issuesByCategory.constraint?.length > 0) {
            recommendations.push('Add explicit steps to address problem constraints');
        }
        if (issuesByCategory.dependency?.length > 0) {
            recommendations.push('Review step dependencies and execution order');
        }
        if (issues.filter(i => i.type === 'critical').length > 0) {
            recommendations.push('Address critical issues before proceeding with execution');
        }
        // General quality recommendations
        const avgConfidence = state.steps.reduce((sum, s) => sum + s.confidence, 0) / state.steps.length;
        if (avgConfidence < 0.7) {
            recommendations.push('Consider refining steps to increase overall confidence');
        }
        return recommendations;
    }
}
//# sourceMappingURL=validation-engine.js.map